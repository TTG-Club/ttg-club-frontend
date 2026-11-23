import type { ClassMechanicsDetail } from './mechanics';
import type {
  CatalogRef,
  SheetClassDetail,
  SheetItem,
  SheetSource,
  SheetSpell,
  SourceKind,
} from './schema';
import type { CatalogOption, CatalogSearchSource } from './types';

import {
  featLinkSchema,
  FEATS_SECTION,
  optionLinkSchema,
  OPTIONS_SECTION,
} from '~character/model';

import { fetchCatalogRaw } from './api';
import { createSheetSpell, loadCatalogItem } from './catalog';
import { RECHARGE_EVENTS } from './constants';
import {
  catalogMechanicsSchema,
  classMechanicsDetailSchema,
  featMechanicsDetailSchema,
  magicItemMechanicsDetailSchema,
  raceMechanicsDetailSchema,
} from './mechanics';
import { sheetClassDetailSchema, sheetSpellDetailSchema } from './schema';
import { createSource } from './sources';
import { findSkillByName, getRaceAbilityBonuses } from './utils';

/*
 * Загрузка записей справочника вместе с механикой: одна карточка читается
 * схемой раздела и схемой механики по отдельности, чтобы битая механика не
 * роняла остальное. Где механики нет, она собирается из прежних текстовых
 * полей — лист ведёт себя как до механики.
 */

/** Разделитель подписи записи в поиске. */
const CAPTION_SEPARATOR = ' · ';

/** Сегментов в адресе разновидности расы: `/races/elf/high`. */
const SUBRACE_URL_SEGMENTS = 3;

export const FEAT_SEARCH: CatalogSearchSource<typeof featLinkSchema> = {
  listUrl: FEATS_SECTION.listUrl,
  schema: featLinkSchema,
  toOptions: (feat) => [
    {
      name: feat.name.rus,
      url: feat.url,
      caption: [feat.requirements, feat.source?.shortName]
        .filter(Boolean)
        .join(CAPTION_SEPARATOR),
    },
  ],
};

export const OPTION_SEARCH: CatalogSearchSource<typeof optionLinkSchema> = {
  listUrl: OPTIONS_SECTION.listUrl,
  schema: optionLinkSchema,
  toOptions: (option) => [
    {
      name: option.name.rus,
      url: option.url,
      caption: option.source?.shortName ?? '',
    },
  ],
};

/** Карточка класса или архетипа: раздел и механика. */
export interface ClassDetails {
  detail: SheetClassDetail;
  mechanics: ClassMechanicsDetail;
}

/**
 * Карточка класса или архетипа вместе с механикой.
 * @param url - адрес класса или архетипа
 */
export async function loadClassDetails(url: string): Promise<ClassDetails> {
  const raw = await fetchCatalogRaw(url);

  const mechanics = classMechanicsDetailSchema.safeParse(raw);

  return {
    detail: sheetClassDetailSchema.parse(raw),
    mechanics: mechanics.success
      ? mechanics.data
      : { id: null, mechanics: null, activeEffects: [], traits: null },
  };
}

/** Что лист берёт из расы. */
export interface RaceSources {
  race: CatalogRef;
  speed: number | null;
  darkvision: number | null;
  /** Источник расы и источники её особенностей с механикой. */
  sources: Array<SheetSource>;
}

/**
 * Раса или разновидность с механикой. Без повышений в механике они
 * собираются из `abilities` с ключами, без чувств и скоростей — из полей
 * карточки.
 * @param option - выбранная запись
 * @param characterLevel - уровень персонажа
 */
export async function loadRaceSources(
  option: CatalogOption,
  characterLevel: number,
): Promise<RaceSources> {
  const detail = raceMechanicsDetailSchema.parse(
    await fetchCatalogRaw(option.url),
  );

  const own = detail.mechanics;
  const fixed = getRaceAbilityBonuses(detail.abilities ?? []);

  const mechanics = catalogMechanicsSchema.parse({
    ...own,
    abilityBonuses: own?.abilityBonuses?.length
      ? own.abilityBonuses
      : Object.entries(fixed).map(([ability, bonus]) => ({
          abilities: [ability],
          bonus,
        })),
    modifiers: own?.modifiers ?? {
      senses: detail.darkvision
        ? [{ type: 'DARKVISION', range: detail.darkvision }]
        : null,
      speed:
        detail.fly || detail.climb || detail.swim
          ? { fly: detail.fly, climb: detail.climb, swim: detail.swim }
          : null,
    },
  });

  const kind: SourceKind =
    option.url.split('/').filter(Boolean).length >= SUBRACE_URL_SEGMENTS
      ? 'subrace'
      : 'race';

  const race = createSource({
    kind,
    name: detail.name.rus,
    url: option.url,
    characterLevel,
    mechanics,
    activeEffects: detail.activeEffects,
  });

  const features = [...detail.features, ...detail.skills]
    .filter((feature) => feature.mechanics || feature.activeEffects.length)
    .map((feature) =>
      createSource({
        kind: 'raceFeature',
        name: feature.name,
        url: option.url,
        parentId: race.id,
        characterLevel,
        mechanics: feature.mechanics,
        activeEffects: feature.activeEffects,
      }),
    );

  return {
    race: { name: detail.name.rus, url: option.url },
    speed: detail.speed?.[0]?.value ?? null,
    darkvision: detail.darkvision ?? null,
    sources: [race, ...features],
  };
}

/** Что лист берёт из предыстории. */
export interface BackgroundSources {
  background: CatalogRef;
  languages: Array<string>;
  source: SheetSource;
}

/**
 * Предыстория с механикой. Без навыков в механике они берутся по названиям
 * из карточки.
 * @param option - выбранная запись
 * @param characterLevel - уровень персонажа
 */
export async function loadBackgroundSources(
  option: CatalogOption,
  characterLevel: number,
): Promise<BackgroundSources> {
  const detail = featMechanicsDetailSchema.parse(
    await fetchCatalogRaw(option.url),
  );

  const own = detail.mechanics;
  const hasSkills = Boolean(own?.proficiencies?.skills?.length);

  const mechanics = hasSkills
    ? own
    : catalogMechanicsSchema.parse({
        ...own,
        proficiencies: {
          ...own?.proficiencies,
          skills: (detail.skills ?? []).flatMap((name) => {
            const key = findSkillByName(name);

            return key ? [key] : [];
          }),
        },
      });

  return {
    background: { name: detail.name.rus, url: option.url },
    languages: own?.proficiencies?.languages?.length
      ? []
      : (detail.languages ?? []),
    source: createSource({
      kind: 'background',
      name: detail.name.rus,
      url: option.url,
      characterLevel,
      mechanics,
      activeEffects: detail.activeEffects,
    }),
  };
}

/** Где источник черты или особенности появился на листе. */
export interface FeatSourcePlacement {
  parentId?: string | null;
  choiceKey?: string | null;
  classId?: string | null;
  level?: number | null;
  characterLevel: number;
}

/**
 * Черта или особенность класса (воззвание, манёвр, боевой стиль) с
 * механикой.
 * @param kind - вид источника
 * @param url - адрес записи
 * @param placement - откуда источник появился
 */
export async function loadFeatSource(
  kind: 'feat' | 'option',
  url: string,
  placement: FeatSourcePlacement,
): Promise<SheetSource> {
  const detail = featMechanicsDetailSchema.parse(await fetchCatalogRaw(url));

  return createSource({
    kind,
    name: detail.name.rus,
    url,
    ...placement,
    mechanics: detail.mechanics,
    activeEffects: detail.activeEffects,
  });
}

/**
 * Заклинание по адресу: круг, школа, ритуал и концентрация.
 * @param url - адрес заклинания
 * @param name - название из ссылки
 */
export async function loadSpellByUrl(
  url: string,
  name: string,
): Promise<SheetSpell> {
  const raw = await fetchCatalogRaw(url);
  const detail = sheetSpellDetailSchema.parse(raw);
  const named = featMechanicsDetailSchema.pick({ name: true }).safeParse(raw);

  return {
    ...createSheetSpell(named.success ? named.data.name.rus : name, url),
    level: detail.level,
    school: detail.school ?? '',
    isRitual: Boolean(detail.ritual),
    isConcentration: Boolean(detail.concentration),
  };
}

/**
 * Магический предмет с механикой: настройка, заряды и эффекты.
 * @param option - выбранная запись
 */
export async function loadMagicItem(option: CatalogOption): Promise<SheetItem> {
  const [item, raw] = await Promise.all([
    loadCatalogItem('magic', option),
    fetchCatalogRaw(option.url),
  ]);

  const parsed = magicItemMechanicsDetailSchema.safeParse(raw);

  if (!parsed.success) {
    return item;
  }

  const { customization, charge, mechanics } = parsed.data;
  const maxCharges = mechanics?.resource?.maxCharges ?? charge ?? 0;

  return {
    ...item,
    requiresAttunement: Boolean(customization),
    activeEffects: mechanics?.activeEffects ?? [],
    passive: mechanics?.passive ?? '',
    charges: maxCharges
      ? {
          max: maxCharges,
          used: 0,
          recharge: mechanics?.resource?.recharge ?? '',
          rechargeEvent:
            mechanics?.resource?.rechargeEvent ?? RECHARGE_EVENTS.dawn,
        }
      : null,
  };
}
