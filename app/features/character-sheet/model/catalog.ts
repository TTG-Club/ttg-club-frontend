import type {
  AbilityBonuses,
  CatalogRef,
  SheetClass,
  SheetItem,
  SheetSpell,
} from './schema';
import type {
  AbilityKey,
  CatalogOption,
  CatalogSearchSource,
  SkillKey,
} from './types';

import { z } from 'zod';

import {
  backgroundDetailSchema,
  backgroundLinkSchema,
  BACKGROUNDS_SECTION,
  raceDetailSchema,
  raceLinkSchema,
  RACES_SECTION,
  spellLinkSchema,
  SPELLS_SECTION,
} from '~character/model';
import {
  armorLinkSchema,
  ARMORS_SECTION,
  itemLinkSchema,
  ITEMS_SECTION,
  MAGIC_ITEMS_SECTION,
  magicItemLinkSchema,
  weaponLinkSchema,
  WEAPONS_SECTION,
} from '~inventory/model';

import { fetchCatalogEntry } from './api';
import {
  FINESSE_PROPERTY_URL_SUFFIX,
  RANGED_WEAPON_TYPE_MARKER,
} from './constants';
import {
  sheetArmorDetailSchema,
  sheetClassDetailSchema,
  sheetSpellDetailSchema,
  sheetWeaponDetailSchema,
  sheetWeightDetailSchema,
} from './schema';
import {
  createSheetElementId,
  findSkillByName,
  getRaceAbilityBonuses,
  parseHitDie,
  parseSavingThrows,
  toAbilityKey,
} from './utils';

/** Разделитель частей подписи записи справочника. */
const CAPTION_SEPARATOR = ' · ';

/** Подпись круга заклинания в поиске. */
function SPELL_LEVEL_CAPTION(level: number): string {
  return level ? `${level} круг` : 'Заговор';
}

/**
 * Подпись записи: части через точку, пустые пропускаются.
 * @param parts - части подписи
 */
function joinCaption(parts: ReadonlyArray<string | null | undefined>): string {
  return parts.filter(Boolean).join(CAPTION_SEPARATOR);
}

/* --- Разделы для поиска ------------------------------------------------- */

export const RACE_SEARCH: CatalogSearchSource<typeof raceLinkSchema> = {
  listUrl: RACES_SECTION.listUrl,
  schema: raceLinkSchema,
  toOptions: (race) => [
    {
      name: race.name.rus,
      url: race.url,
      caption: joinCaption([race.source?.shortName]),
    },
    ...(race.subraces ?? []).map((subrace) => ({
      name: subrace.name.rus,
      url: subrace.url,
      caption: joinCaption([race.name.rus, subrace.source?.shortName]),
    })),
  ],
};

export const BACKGROUND_SEARCH: CatalogSearchSource<
  typeof backgroundLinkSchema
> = {
  listUrl: BACKGROUNDS_SECTION.listUrl,
  schema: backgroundLinkSchema,
  toOptions: (background) => [
    {
      name: background.name.rus,
      url: background.url,
      caption: joinCaption([background.source?.shortName]),
    },
  ],
};

export const SPELL_SEARCH: CatalogSearchSource<typeof spellLinkSchema> = {
  listUrl: SPELLS_SECTION.listUrl,
  schema: spellLinkSchema,
  toOptions: (spell) => [
    {
      name: spell.name.rus,
      url: spell.url,
      caption: joinCaption([
        SPELL_LEVEL_CAPTION(spell.level),
        spell.school,
        spell.source?.shortName,
      ]),
    },
  ],
};

export const WEAPON_SEARCH: CatalogSearchSource<typeof weaponLinkSchema> = {
  listUrl: WEAPONS_SECTION.listUrl,
  schema: weaponLinkSchema,
  toOptions: (weapon) => [
    {
      name: weapon.name.rus,
      url: weapon.url,
      caption: joinCaption([
        weapon.type.name,
        weapon.damage ? `${weapon.damage.dice} ${weapon.damage.type}` : null,
      ]),
    },
  ],
};

export const ARMOR_SEARCH: CatalogSearchSource<typeof armorLinkSchema> = {
  listUrl: ARMORS_SECTION.listUrl,
  schema: armorLinkSchema,
  toOptions: (armor) => [
    {
      name: armor.name.rus,
      url: armor.url,
      caption: joinCaption([armor.type.name, armor.armorClass]),
    },
  ],
};

export const ITEM_SEARCH: CatalogSearchSource<typeof itemLinkSchema> = {
  listUrl: ITEMS_SECTION.listUrl,
  schema: itemLinkSchema,
  toOptions: (item) => [
    {
      name: item.name.rus,
      url: item.url,
      caption: joinCaption(
        (item.categoryGroups ?? []).map((group) => group.name),
      ),
    },
  ],
};

export const MAGIC_ITEM_SEARCH: CatalogSearchSource<
  typeof magicItemLinkSchema
> = {
  listUrl: MAGIC_ITEMS_SECTION.listUrl,
  schema: magicItemLinkSchema,
  toOptions: (item) => [
    {
      name: item.name.rus,
      url: item.url,
      caption: joinCaption([item.rarity.name, item.source?.shortName]),
    },
  ],
};

/** Разделы снаряжения, из которых можно добавить предмет. */
export const ITEM_SEARCH_KINDS = [
  { value: 'weapon', label: 'Оружие', icon: 'tabler:sword' },
  { value: 'armor', label: 'Доспехи', icon: 'tabler:shield' },
  { value: 'item', label: 'Снаряжение', icon: 'tabler:backpack' },
  { value: 'magic', label: 'Магические предметы', icon: 'tabler:wand' },
] as const;

export type ItemSearchKind = (typeof ITEM_SEARCH_KINDS)[number]['value'];

/** Раздел поиска по виду предмета. */
export const ITEM_SEARCH_BY_KIND: Record<ItemSearchKind, CatalogSearchSource> =
  {
    weapon: WEAPON_SEARCH,
    armor: ARMOR_SEARCH,
    item: ITEM_SEARCH,
    magic: MAGIC_ITEM_SEARCH,
  };

/* --- Перенос записей справочника в лист --------------------------------- */

/** Раса с бонусами к характеристикам по ключам, как их отдаёт API. */
const sheetRaceDetailSchema = raceDetailSchema.extend({
  abilities: z
    .array(
      z.object({
        key: z.string().nullish(),
        value: z.number().nullish(),
      }),
    )
    .nullish(),
});

/** Что лист берёт из расы. */
export interface RaceSelection {
  race: CatalogRef;
  bonuses: AbilityBonuses;
  speed: number | null;
  darkvision: number | null;
}

/**
 * Раса для листа: бонусы характеристик, скорость и тёмное зрение.
 * @param option - выбранная запись
 */
export async function loadRaceSelection(
  option: CatalogOption,
): Promise<RaceSelection> {
  const detail = await fetchCatalogEntry(option.url, sheetRaceDetailSchema);

  return {
    race: { name: detail.name.rus, url: option.url },
    bonuses: getRaceAbilityBonuses(detail.abilities ?? []),
    speed: detail.speed?.[0]?.value ?? null,
    darkvision: detail.darkvision ?? null,
  };
}

/** Что лист берёт из предыстории. */
export interface BackgroundSelection {
  background: CatalogRef;
  skills: Array<SkillKey>;
  languages: Array<string>;
}

/**
 * Предыстория для листа: навыки и языки.
 * @param option - выбранная запись
 */
export async function loadBackgroundSelection(
  option: CatalogOption,
): Promise<BackgroundSelection> {
  const detail = await fetchCatalogEntry(option.url, backgroundDetailSchema);

  return {
    background: { name: detail.name.rus, url: option.url },
    skills: (detail.skills ?? []).flatMap((name) => {
      const key = findSkillByName(name);

      return key ? [key] : [];
    }),
    languages: detail.languages ?? [],
  };
}

/** Что лист берёт из класса при добавлении. */
export interface ClassSelection {
  sheetClass: SheetClass;
  savingThrows: Array<AbilityKey>;
  spellAbility: AbilityKey | null;
  skillChoices: Array<SkillKey>;
  skillChoiceCount: number;
}

/**
 * Класс для листа: кость хитов, спасброски, заклинательная характеристика и
 * навыки на выбор.
 * @param url - адрес класса
 * @param level - уровень в классе
 */
export async function loadClassSelection(
  url: string,
  level: number,
): Promise<ClassSelection> {
  const detail = await fetchCatalogEntry(url, sheetClassDetailSchema);

  const skillChoices = (detail.traits?.availableSkills ?? []).flatMap(
    (name) => {
      const key = findSkillByName(name);

      return key ? [key] : [];
    },
  );

  return {
    sheetClass: {
      id: createSheetElementId(),
      name: detail.name.rus,
      url,
      archetypeName: null,
      archetypeUrl: null,
      level,
      hitDie: detail.traits?.diceHp ?? parseHitDie(detail.dice) ?? 8,
    },
    savingThrows: parseSavingThrows(detail.traits?.savingThrows),
    spellAbility: toAbilityKey(detail.spellAbility),
    skillChoices,
    skillChoiceCount: detail.traits?.skillAvailableCount ?? 0,
  };
}

/**
 * Пустой предмет снаряжения.
 * @param name - название
 * @param url - адрес записи справочника; у своего предмета нет
 */
export function createSheetItem(name: string, url: string | null): SheetItem {
  return {
    id: createSheetElementId(),
    name,
    url,
    quantity: 1,
    weight: 0,
    isEquipped: false,
    notes: '',
    weapon: null,
    armor: null,
  };
}

/**
 * Предмет снаряжения из справочника: у оружия — урон и свойства, у доспеха —
 * КД и категория.
 * @param kind - раздел справочника
 * @param option - выбранная запись
 */
export async function loadCatalogItem(
  kind: ItemSearchKind,
  option: CatalogOption,
): Promise<SheetItem> {
  const item = createSheetItem(option.name, option.url);

  if (kind === 'weapon') {
    const detail = await fetchCatalogEntry(option.url, sheetWeaponDetailSchema);

    return {
      ...item,
      weight: detail.weight ?? 0,
      weapon: {
        damage: detail.damage?.dice ?? '',
        damageType: detail.damage?.type ?? '',
        isRanged: Boolean(detail.typeRaw?.includes(RANGED_WEAPON_TYPE_MARKER)),
        isFinesse: (detail.properties ?? []).some((property) =>
          property.url?.toLowerCase().endsWith(FINESSE_PROPERTY_URL_SUFFIX),
        ),
        isProficient: true,
        bonus: 0,
      },
    };
  }

  if (kind === 'armor') {
    const detail = await fetchCatalogEntry(option.url, sheetArmorDetailSchema);

    return {
      ...item,
      weight: detail.weight ?? 0,
      armor: detail.typeRaw
        ? {
            category: detail.typeRaw,
            baseArmorClass: detail.armorClassRaw ?? 0,
            strengthRequirement: detail.requirement ?? null,
            stealthDisadvantage: Boolean(detail.disadvantage),
            bonus: 0,
          }
        : null,
    };
  }

  const detail = await fetchCatalogEntry(option.url, sheetWeightDetailSchema);

  return { ...item, weight: detail.weight ?? 0 };
}

/**
 * Пустое заклинание.
 * @param name - название
 * @param url - адрес записи справочника; у своего заклинания нет
 */
export function createSheetSpell(name: string, url: string | null): SheetSpell {
  return {
    id: createSheetElementId(),
    name,
    url,
    level: 0,
    school: '',
    isPrepared: false,
    isRitual: false,
    isConcentration: false,
    notes: '',
  };
}

/**
 * Заклинание из справочника: круг, школа, ритуал и концентрация.
 * @param option - выбранная запись
 */
export async function loadCatalogSpell(
  option: CatalogOption,
): Promise<SheetSpell> {
  const detail = await fetchCatalogEntry(option.url, sheetSpellDetailSchema);

  return {
    ...createSheetSpell(option.name, option.url),
    level: detail.level,
    school: detail.school ?? '',
    isRitual: Boolean(detail.ritual),
    isConcentration: Boolean(detail.concentration),
  };
}
