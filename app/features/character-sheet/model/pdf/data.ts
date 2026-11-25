import type { ContentDescription } from '~content/model';

import type { InventoryGroupKey } from '../inventory';
import type {
  SheetItem,
  SheetProficiencyGroup,
  SheetSpell,
  SkillProficiency,
} from '../schema';
import type { AbilityKey, FeatureOrigin, SkillKey } from '../types';
import type { PdfCatalog, PdfSheet, PdfSheetSource } from './types';

import { uniqBy } from 'es-toolkit';

import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  FEATURE_ORIGIN_LABELS,
  HIT_DIE_LABEL_PREFIX,
  INVENTORY_GROUPS,
  RESOURCE_RESET_LABELS,
  SHEET_BODY_LABELS,
  SHEET_TEXT,
  SKILL_INFO,
  SKILL_KEYS,
  SOURCE_KIND_LABELS,
  SPEED_KEYS,
  SPEED_LABELS,
  SPELL_GROUP_TEXT,
} from '../constants';
import { createFormulaContext, getResourceMax } from '../counters';
import {
  FEATURE_LIST_SOURCE_KINDS,
  getFeatureOriginOrder,
  getSourceFeatureOrigin,
} from '../features';
import { getInventoryGroupKey, sortItemsByName } from '../inventory';
import { getClassFeatureEntries, getClassProgression } from '../levelUp';
import {
  getProficiencyNames,
  normalizeProficiencyName,
} from '../proficiencies';
import { formatDistance } from '../settings';
import { getSkillAbility } from '../skills';
import { getSpellOrigin, isCantrip } from '../spells';
import { getSheetStats } from '../stats';
import {
  formatModifier,
  getAbilityModifier,
  getCharacterPactMagic,
  getClassesLabel,
  getHitDiceTotals,
  getNextLevelExperience,
  getSkillProficiency,
  getSpellSlotsMax,
  getWeaponAttack,
  toAbilityKey,
} from '../utils';
import { PDF_LABELS, PDF_NOTE_SEPARATOR, PDF_SPELL_LABELS } from './constants';

/** Навык в панели характеристик: название, владение и итоговый бонус. */
export interface PdfSkillRow {
  name: string;
  proficiency: SkillProficiency;
  bonus: number;
}

/** Характеристика со спасброском и навыками. */
export interface PdfAbilityRow {
  key: AbilityKey;
  label: string;
  score: number;
  modifier: string;
  savingThrow: { bonus: number; isProficient: boolean };
  skills: PdfSkillRow[];
}

/** Строка «подпись — значение». */
export interface PdfLabeledValue {
  label: string;
  value: string;
}

/** Особенность в списке первой страницы и в справочнике. */
export interface PdfFeatureRow {
  name: string;

  /** Источник: «Воин, 3 ур.», «Раса», «Черта». */
  source: string;

  origin: FeatureOrigin;

  /** Выбор игрока внутри особенности. */
  choice: string;

  /** Описание; null — у особенности его нет (раса и предыстория — ссылкой). */
  description: ContentDescription | null;
}

/** Ресурс с текущим остатком и восстановлением. */
export interface PdfResourceRow {
  name: string;
  value: string;
  reset: string;
}

/** Ряд ячеек заклинаний одного круга. */
export interface PdfSpellSlotRow {
  label: string;
  max: number;
  used: number;
  reset: string;
}

/** Группа заклинаний одного круга. */
export interface PdfSpellGroup {
  label: string;
  spells: Array<{ spell: SheetSpell; isPrepared: boolean }>;
}

/** Группа снаряжения с предметами по алфавиту. */
export interface PdfInventoryGroup {
  key: InventoryGroupKey;
  title: string;
  items: SheetItem[];
}

/** Заклинательство персонажа: характеристика, Сл и бонус атаки. */
export interface PdfSpellcasting {
  ability: AbilityKey;
  saveDc: number;
  attack: number;
}

/**
 * Лист для страниц PDF: итоги листа теми же функциями, что и на сайте, и
 * заклинательные данные классов по дозагруженным карточкам.
 *
 * @param source имя и документ листа.
 * @param catalog дозагруженные записи справочника.
 * @returns лист для страниц.
 */
export function createPdfSheet(
  source: PdfSheetSource,
  catalog: PdfCatalog,
): PdfSheet {
  const { document } = source;

  return {
    name: source.name,
    document,
    stats: getSheetStats(document),
    catalog,
    progressions: document.classes.map((sheetClass) =>
      getClassProgression(
        sheetClass,
        sheetClass.url ? catalog.classes.get(sheetClass.url) : undefined,
        sheetClass.archetypeUrl
          ? catalog.classes.get(sheetClass.archetypeUrl)
          : undefined,
      ),
    ),
  };
}

/**
 * Подзаголовок листа: раса, классы с уровнями и предыстория.
 *
 * @param sheet лист.
 * @returns строка подзаголовка.
 */
export function getPdfSubtitle(sheet: PdfSheet): string {
  const { document } = sheet;

  return [
    document.race?.name ?? SHEET_BODY_LABELS.noRace,
    document.classes.length
      ? getClassesLabel(document.classes)
      : SHEET_TEXT.noClass,
    document.background?.name ?? SHEET_BODY_LABELS.noBackground,
  ].join(PDF_NOTE_SEPARATOR);
}

/**
 * Опыт до следующего уровня; null — уровень последний.
 *
 * @param sheet лист.
 * @returns опыт следующего уровня.
 */
export function getPdfNextLevelExperience(sheet: PdfSheet): number | null {
  return getNextLevelExperience(sheet.stats.level);
}

/**
 * Характеристики с итоговыми значениями, спасброском и навыками — свои навыки
 * идут под своей характеристикой вслед за навыками правил.
 *
 * @param sheet лист.
 * @returns строки характеристик в порядке правил.
 */
export function getPdfAbilityRows(sheet: PdfSheet): PdfAbilityRow[] {
  const { document, stats } = sheet;

  return ABILITY_KEYS.map((key) => {
    const score = stats.abilities[key];

    const skills: PdfSkillRow[] = [
      ...SKILL_KEYS.filter(
        (skill: SkillKey) => getSkillAbility(document, skill) === key,
      ).map((skill) => ({
        name: SKILL_INFO[skill].names[0],
        proficiency: getSkillProficiency(document, skill),
        bonus: stats.skills[skill],
      })),
      ...document.customSkills
        .filter((skill) => skill.ability === key)
        .map((skill) => ({
          name: skill.name,
          proficiency: skill.proficiency,
          bonus: stats.customSkills[skill.id] ?? 0,
        })),
    ];

    return {
      key,
      label: ABILITY_LABELS[key].name,
      score,
      modifier: formatModifier(getAbilityModifier(score)),
      savingThrow: {
        bonus: stats.savingThrows[key].bonus,
        isProficient: document.savingThrows.includes(key),
      },
      skills,
    };
  });
}

/**
 * Владения группами: выданные источниками и свои, без повторов по названию.
 *
 * @param sheet лист.
 * @returns группы с подписью и названиями владений.
 */
export function getPdfProficiencyGroups(
  sheet: PdfSheet,
): Array<{ label: string; values: string[] }> {
  const groups: ReadonlyArray<{ key: SheetProficiencyGroup; label: string }> = [
    { key: 'armor', label: PDF_LABELS.armorProficiency },
    { key: 'weapons', label: PDF_LABELS.weaponProficiency },
    { key: 'tools', label: PDF_LABELS.toolProficiency },
    { key: 'languages', label: PDF_LABELS.languageProficiency },
  ];

  return groups.map((group) => ({
    label: group.label,
    values: uniqBy(getProficiencyNames(sheet.document, group.key), (name) =>
      normalizeProficiencyName(name),
    ),
  }));
}

/**
 * Скорость ходьбы с единицами листа: значение крупно, единицы — припиской.
 *
 * @param sheet лист.
 * @returns подпись скорости.
 */
export function getPdfWalkSpeed(sheet: PdfSheet): string {
  return formatDistance(sheet.stats.speeds.walk, sheet.document.speedUnit);
}

/**
 * Чувства и передвижение: пассивная Внимательность, особые чувства,
 * телепатия и скорости, кроме нулевых.
 *
 * @param sheet лист.
 * @returns строки панели.
 */
export function getPdfSenseRows(sheet: PdfSheet): PdfLabeledValue[] {
  const { stats, document } = sheet;
  const unit = document.speedUnit;

  return [
    {
      label: PDF_LABELS.passivePerception,
      value: String(stats.passivePerception),
    },
    ...stats.senses.map((sense) => ({
      label: sense.label,
      value: formatDistance(sense.range, unit),
    })),
    ...(stats.telepathy > 0
      ? [
          {
            label: PDF_LABELS.telepathy,
            value: formatDistance(stats.telepathy, unit),
          },
        ]
      : []),
    ...SPEED_KEYS.filter((key) => stats.speeds[key] > 0).map((key) => ({
      label: SPEED_LABELS[key],
      value: formatDistance(stats.speeds[key], unit),
    })),
  ];
}

/**
 * Кости хитов: остаток и всего по размерам кости.
 *
 * @param sheet лист.
 * @returns подпись костей; пусто — костей нет.
 */
export function getPdfHitDice(sheet: PdfSheet): string {
  return getHitDiceTotals(sheet.document)
    .map(
      (entry) =>
        `${HIT_DIE_LABEL_PREFIX}${entry.die} ${entry.total - entry.used}/${entry.total}`,
    )
    .join(', ');
}

/**
 * Атаки оружием с характеристиками и прибавками эффектов — как в снаряжении
 * листа. Оружия, которого не осталось (количество ноль), в списке нет.
 *
 * @param sheet лист.
 * @returns строки таблицы: название, бонус атаки и урон.
 */
export function getPdfWeaponRows(sheet: PdfSheet): string[][] {
  const { document, stats } = sheet;
  const effective = { ...document, abilities: stats.abilities };

  return sortItemsByName(
    document.inventory.filter((item) => item.weapon && item.quantity > 0),
  ).flatMap((item) => {
    const attack = getWeaponAttack(effective, item, stats.proficiencyBonus);

    if (!attack) {
      return [];
    }

    const effectBonus = item.weapon?.isRanged
      ? stats.rangedAttackBonus
      : stats.meleeAttackBonus;

    const damage = [
      [attack.damage, attack.damageType].filter(Boolean).join(' '),
      [attack.extraDamage, attack.extraDamageType].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(' + ');

    return [
      [item.name, formatModifier(attack.attackBonus + effectBonus), damage],
    ];
  });
}

/**
 * Заклинательство для первой страницы: характеристика первого
 * класса-заклинателя (своя или по карточке класса), без классов — общая
 * характеристика листа; null — персонаж не заклинатель.
 *
 * @param sheet лист.
 * @returns характеристика, Сл и бонус атаки.
 */
export function getPdfSpellcasting(sheet: PdfSheet): PdfSpellcasting | null {
  const { document, catalog, stats } = sheet;

  const classAbility = document.classes
    .map((sheetClass) => {
      const base = sheetClass.url
        ? catalog.classes.get(sheetClass.url)
        : undefined;

      const archetype = sheetClass.archetypeUrl
        ? catalog.classes.get(sheetClass.archetypeUrl)
        : undefined;

      return (
        sheetClass.spellcastingAbility
        ?? toAbilityKey(archetype?.spellAbility ?? base?.spellAbility ?? null)
      );
    })
    .find((ability): ability is AbilityKey => ability !== null);

  const ability = classAbility ?? document.spellcastingAbility;

  if (!ability) {
    return null;
  }

  return { ability, ...stats.spellcastingByAbility[ability] };
}

/**
 * Ресурсы листа: остаток из максимума по формуле и правило отдыха.
 *
 * @param sheet лист.
 * @returns строки ресурсов.
 */
export function getPdfResourceRows(sheet: PdfSheet): PdfResourceRow[] {
  const { document, stats } = sheet;

  const context = {
    ...createFormulaContext(document, stats.abilities),
    proficiencyBonus: stats.proficiencyBonus,
  };

  return document.resources.map((resource) => {
    const max = getResourceMax(resource, context);

    return {
      name: resource.name,
      value: `${Math.max(0, max - resource.used)}/${max}`,
      reset: RESOURCE_RESET_LABELS[resource.reset],
    };
  });
}

/**
 * Особенности, как в списке листа: источники (раса, предыстория, черты),
 * умения классов по карточкам и свои особенности — по группам источников,
 * внутри группы в порядке появления.
 *
 * @param sheet лист.
 * @returns особенности по порядку листа.
 */
export function getPdfFeatureRows(sheet: PdfSheet): PdfFeatureRow[] {
  const { document, catalog } = sheet;

  const sourceRows: PdfFeatureRow[] = document.sources
    .filter(
      (source) =>
        FEATURE_LIST_SOURCE_KINDS.has(source.kind) && !source.parentId,
    )
    .map((source) => ({
      name: source.name,
      source: SOURCE_KIND_LABELS[source.kind],
      origin: getSourceFeatureOrigin(source.kind),
      choice: '',
      description: null,
    }));

  const classRows: PdfFeatureRow[] = document.classes
    .flatMap((sheetClass) =>
      getClassFeatureEntries(
        sheetClass,
        sheetClass.url ? catalog.classes.get(sheetClass.url) : undefined,
        sheetClass.archetypeUrl
          ? catalog.classes.get(sheetClass.archetypeUrl)
          : undefined,
      ),
    )
    .sort((left, right) => left.level - right.level)
    .map((feature) => ({
      name: feature.name,
      source: `${feature.className}, ${feature.level} ${SHEET_TEXT.levelShort}`,
      origin: 'class',
      choice: '',
      description: feature.description,
    }));

  const customRows: PdfFeatureRow[] = document.features.map((feature) => ({
    name: feature.name,
    source: feature.source || FEATURE_ORIGIN_LABELS[feature.origin].label,
    origin: feature.origin,
    choice: feature.choice,
    description: feature.description,
  }));

  return [...sourceRows, ...classRows, ...customRows]
    .map((row, index) => ({ row, index }))
    .sort(
      (left, right) =>
        getFeatureOriginOrder(left.row.origin)
          - getFeatureOriginOrder(right.row.origin) || left.index - right.index,
    )
    .map(({ row }) => row);
}

/**
 * Ячейки заклинаний: обычные по кругам и ячейки договора отдельным рядом.
 *
 * @param sheet лист.
 * @returns ряды ячеек; пусто — ячеек нет.
 */
export function getPdfSpellSlotRows(sheet: PdfSheet): PdfSpellSlotRow[] {
  const { document, progressions } = sheet;

  const rows: PdfSpellSlotRow[] = getSpellSlotsMax(progressions).flatMap(
    (max, index) =>
      max
        ? [
            {
              label: PDF_SPELL_LABELS.level(index + 1),
              max,
              used: Math.min(document.spellSlotsUsed[index] ?? 0, max),
              reset: RESOURCE_RESET_LABELS.LONG,
            },
          ]
        : [],
  );

  const pact = getCharacterPactMagic(progressions);

  if (pact) {
    rows.push({
      label: PDF_SPELL_LABELS.level(pact.level),
      max: pact.slots,
      used: Math.min(document.pactSlotsUsed, pact.slots),
      // Ячейки договора — отдельный ряд: подпись круга в узкий столбец
      // помещается только без пометки, поэтому пометка идёт к отдыху.
      reset: `${PDF_LABELS.pactSlots}${PDF_NOTE_SEPARATOR}${RESOURCE_RESET_LABELS.SHORT}`,
    });
  }

  return rows;
}

/**
 * Подготовлено ли заклинание: отмечено, подготовлено всегда или это
 * выданный заговор — как на листе.
 *
 * @param sheet лист.
 * @param spell заклинание.
 * @returns true — кружок подготовки закрашен.
 */
function isPdfSpellPrepared(sheet: PdfSheet, spell: SheetSpell): boolean {
  return (
    spell.isPrepared
    || spell.alwaysPrepared
    || (isCantrip(spell)
      && getSpellOrigin(spell, sheet.document.sources) !== 'book')
  );
}

/**
 * Заклинания по кругам: заговоры, затем круги по возрастанию, внутри — по
 * алфавиту.
 *
 * @param sheet лист.
 * @returns группы кругов; пустые круги опущены.
 */
export function getPdfSpellGroups(sheet: PdfSheet): PdfSpellGroup[] {
  const levels = [
    ...new Set(sheet.document.spells.map((spell) => spell.level)),
  ].sort((left, right) => left - right);

  return levels.map((level) => ({
    label: level ? PDF_SPELL_LABELS.level(level) : SPELL_GROUP_TEXT.cantrips,
    spells: sortItemsByName(
      sheet.document.spells.filter((spell) => spell.level === level),
    ).map((spell) => ({ spell, isPrepared: isPdfSpellPrepared(sheet, spell) })),
  }));
}

/**
 * Снаряжение группами, как на вкладке листа; пустые группы опущены.
 *
 * @param sheet лист.
 * @returns группы с предметами по алфавиту.
 */
export function getPdfInventoryGroups(sheet: PdfSheet): PdfInventoryGroup[] {
  return INVENTORY_GROUPS.map((group) => ({
    key: group.key,
    title: group.title,
    items: sortItemsByName(
      sheet.document.inventory.filter(
        (item) => getInventoryGroupKey(item) === group.key,
      ),
    ),
  })).filter((group) => group.items.length);
}
