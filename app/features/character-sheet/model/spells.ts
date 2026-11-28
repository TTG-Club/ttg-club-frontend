import type { SpellDamageData, SpellDetail } from '~character/model';
import type { ContentDescription } from '~content/model';

import type { SheetDocument, SheetSource, SheetSpell } from './schema';
import type {
  AbilityKey,
  PactMagic,
  PreparedBreakdown,
  PreparedKind,
  PreparedLimitClass,
  SpellDamageTile,
  SpellOrigin,
  SpellSlotOption,
  SpellTabFilter,
} from './types';

import { getNodesText, markupToContent, parseContent } from '~content/model';

import {
  CANTRIP_SCALING_LEVELS,
  DAMAGE_TYPE_INFO,
  INNATE_SPELL_SOURCE_KINDS,
  PREPARED_CASTER_PROGRESSION,
  SPELL_CAST_TEXT,
} from './constants';
import { formatDice, parseDice } from './inventory';
import { getClassSlug } from './levelUp';
import { formatModifier, getDamageFormula } from './utils';

/*
 * Предел подготовленных заклинаний по правилам 2014: у жреца, друида и
 * волшебника — модификатор базовой характеристики плюс уровень класса, у
 * паладина — плюс половина уровня (вниз), у изобретателя — половина вверх;
 * не меньше одного. Классы с известными заклинаниями (бард, колдун,
 * чародей, следопыт) ограничены колонкой «Известные заклинания» таблицы
 * класса, заговоры — колонкой «Известные заговоры». Своё число игрока
 * заменяет расчёт, бонус добавляется сверху.
 */

/** Класс листа для предела вместе с модификатором его характеристики. */
export interface PreparedClassInput extends PreparedLimitClass {
  abilityModifier: number;
}

/**
 * Часть предела от уровня класса по виду подготовки.
 * @param progression - вид подготовки класса
 * @param level - уровень класса
 */
function getPreparedLevelPart(
  progression: 'full' | 'half' | 'halfUp',
  level: number,
): number {
  if (progression === 'full') {
    return level;
  }

  return progression === 'half' ? Math.floor(level / 2) : Math.ceil(level / 2);
}

/**
 * Заговор ли заклинание.
 * @param spell - заклинание
 */
export function isCantrip(spell: Pick<SheetSpell, 'level'>): boolean {
  return spell.level === 0;
}

/**
 * Откуда заклинание: книга игрока, умение класса или вид, черта и
 * предыстория.
 * @param spell - заклинание
 * @param sources - источники механики листа
 */
export function getSpellOrigin(
  spell: Pick<SheetSpell, 'sourceId'>,
  sources: ReadonlyArray<Pick<SheetSource, 'id' | 'kind'>>,
): SpellOrigin {
  if (!spell.sourceId) {
    return 'book';
  }

  const source = sources.find((candidate) => candidate.id === spell.sourceId);

  if (!source) {
    return 'book';
  }

  return INNATE_SPELL_SOURCE_KINDS.includes(source.kind) ? 'innate' : 'class';
}

/**
 * Занимает ли заклинание место в пределе: книга — всегда, выдача класса —
 * если её не отметили «подготовлено всегда», вид и черты — никогда.
 * @param spell - заклинание
 * @param origin - происхождение
 */
export function takesPreparationSpace(
  spell: Pick<SheetSpell, 'alwaysPrepared'>,
  origin: SpellOrigin,
): boolean {
  if (origin === 'innate') {
    return false;
  }

  return !spell.alwaysPrepared;
}

/**
 * Предел по таблицам классов.
 * @param kind - заклинания или заговоры
 * @param classes - классы листа
 */
function getClassPreparedValue(
  kind: PreparedKind,
  classes: ReadonlyArray<PreparedClassInput>,
): { value: number | null; isKnown: boolean } {
  if (kind === 'cantrips') {
    const known = classes.flatMap((sheetClass) =>
      sheetClass.knownCantrips === null ? [] : [sheetClass.knownCantrips],
    );

    return {
      value: known.length ? known.reduce((sum, value) => sum + value, 0) : null,
      isKnown: true,
    };
  }

  let preparedTotal: number | null = null;
  let knownTotal: number | null = null;

  for (const sheetClass of classes) {
    const progression =
      PREPARED_CASTER_PROGRESSION[getClassSlug(sheetClass.url)];

    if (progression) {
      preparedTotal =
        (preparedTotal ?? 0)
        + Math.max(
          1,
          sheetClass.abilityModifier
            + getPreparedLevelPart(progression, sheetClass.level),
        );
    } else if (sheetClass.knownSpells !== null) {
      knownTotal = (knownTotal ?? 0) + sheetClass.knownSpells;
    }
  }

  if (preparedTotal !== null) {
    return { value: preparedTotal + (knownTotal ?? 0), isKnown: false };
  }

  return { value: knownTotal, isKnown: knownTotal !== null };
}

/**
 * Разбор предела подготовленных заклинаний или известных заговоров.
 * @param document - лист персонажа
 * @param kind - заклинания или заговоры
 * @param classes - классы листа с колонками таблиц и модификаторами
 */
export function getPreparedBreakdown(
  document: SheetDocument,
  kind: PreparedKind,
  classes: ReadonlyArray<PreparedClassInput>,
): PreparedBreakdown {
  const custom =
    kind === 'cantrips'
      ? document.cantripsLimitOverride
      : document.preparedLimitOverride;

  const bonus =
    kind === 'cantrips' ? document.cantripsBonus : document.preparedBonus;

  const classPart = getClassPreparedValue(kind, classes);
  const base = custom ?? classPart.value;
  const isKnown = custom === null && classPart.isKnown;

  const counted = document.spells.filter(
    (spell) =>
      isCantrip(spell) === (kind === 'cantrips')
      && takesPreparationSpace(spell, getSpellOrigin(spell, document.sources)),
  );

  return {
    kind,
    classValue: classPart.value,
    custom,
    bonus,
    value: base === null ? null : Math.max(0, base + bonus),
    count:
      isKnown || kind === 'cantrips'
        ? counted.length
        : counted.filter((spell) => spell.isPrepared).length,
    isKnown,
  };
}

/**
 * Подпись предела: «3 / 5», без предела — только счёт.
 * @param breakdown - разбор предела
 */
export function formatPreparedValue(breakdown: PreparedBreakdown): string {
  return breakdown.value === null
    ? String(breakdown.count)
    : `${breakdown.count} / ${breakdown.value}`;
}

/**
 * Множитель костей заговора на уровне персонажа: ×2, ×3, ×4 на 5, 11, 17.
 * @param characterLevel - уровень персонажа
 */
export function getCantripMultiplier(characterLevel: number): number {
  return (
    1 + CANTRIP_SCALING_LEVELS.filter((level) => level <= characterLevel).length
  );
}

/**
 * Кости броска текстом с учётом роста и повышения круга. Кости повышения
 * той же грани складываются с основными: «8к6» + 2 × «1к6» = «10к6».
 * @param dice - кости броска
 * @param multiplier - множитель количества костей
 * @param extra - дополнительные кости (повышение круга)
 * @param extraTimes - сколько раз добавить дополнительные кости
 */
function getDiceText(
  dice: string,
  multiplier: number,
  extra: string,
  extraTimes: number,
): string {
  const base = parseDice(dice);
  const added = extraTimes > 0 ? parseDice(extra) : null;

  if (!base) {
    return added ? formatDice(added.count * extraTimes, added.faces) : '';
  }

  const count = base.count * multiplier;

  if (!added) {
    return formatDice(count, base.faces);
  }

  if (added.faces === base.faces) {
    return formatDice(count + added.count * extraTimes, base.faces);
  }

  return `${formatDice(count, base.faces)}+${formatDice(added.count * extraTimes, added.faces)}`;
}

/** Условия броска урона заклинания. */
export interface SpellDamageContext {
  abilityModifier: number;
  characterLevel: number;
  spellLevel: number;
  /** Круг ячейки; меньше круга заклинания — без повышения. */
  slotLevel: number;
}

/**
 * Плитки бросков урона и лечения заклинания: заговор растёт с уровнем
 * персонажа, заклинание круга — с кругом ячейки (кости добавляются к
 * первому броску).
 * @param damage - урон заклинания
 * @param context - модификатор, уровень и круги
 */
export function getSpellDamageTiles(
  damage: SpellDamageData | null | undefined,
  context: SpellDamageContext,
): Array<SpellDamageTile> {
  if (!damage) {
    return [];
  }

  const multiplier =
    damage.cantripScaling && context.spellLevel === 0
      ? getCantripMultiplier(context.characterLevel)
      : 1;

  const upcastTimes =
    context.spellLevel > 0
      ? Math.max(0, context.slotLevel - context.spellLevel)
      : 0;

  return damage.rolls.flatMap((roll, index) => {
    const isFirst = index === 0;

    const dice = getDiceText(
      roll.dice ?? '',
      multiplier,
      isFirst ? (damage.upcastDice ?? '') : '',
      isFirst ? upcastTimes : 0,
    );

    const bonus =
      roll.bonus + (roll.abilityModifier ? context.abilityModifier : 0);

    if (!dice && !bonus) {
      return [];
    }

    let formula = String(bonus);

    if (dice) {
      formula = bonus ? `${dice}${formatModifier(bonus)}` : dice;
    }

    return [
      {
        key: String(index),
        formula: getDamageFormula(formula),
        typeLabel: roll.types
          .map((type) => DAMAGE_TYPE_INFO[type]?.label ?? type)
          .join(' / '),
        conditionLabel: roll.condition ?? '',
        isHealing: roll.healing,
      },
    ];
  });
}

/** Ячейки персонажа на круге: сколько всего и сколько потрачено. */
export interface SpellSlotRowState {
  level: number;
  max: number;
  used: number;
}

/**
 * Ячейки, которыми можно сотворить заклинание: обычные и договора не ниже
 * его круга и с остатком.
 * @param spellLevel - круг заклинания
 * @param slotRows - обычные ячейки
 * @param pact - магия договора
 * @param pactUsed - потрачено ячеек договора
 */
export function getSpellSlotOptions(
  spellLevel: number,
  slotRows: ReadonlyArray<SpellSlotRowState>,
  pact: PactMagic | null,
  pactUsed: number,
): Array<SpellSlotOption> {
  if (spellLevel === 0) {
    return [];
  }

  const regular: Array<SpellSlotOption> = slotRows
    .filter((row) => row.level >= spellLevel && row.used < row.max)
    .map((row) => ({
      value: `slot:${row.level}`,
      kind: 'slot',
      level: row.level,
      left: row.max - row.used,
      label: SPELL_CAST_TEXT.slotOption(row.level, row.max - row.used),
    }));

  if (!pact || pact.level < spellLevel || pactUsed >= pact.slots) {
    return regular;
  }

  return [
    ...regular,
    {
      value: 'pact',
      kind: 'pact',
      level: pact.level,
      left: pact.slots - pactUsed,
      label: SPELL_CAST_TEXT.pactOption(pact.level, pact.slots - pactUsed),
    },
  ];
}

/**
 * Тратит ячейку: обычную своего круга или ячейку договора.
 * @param document - лист персонажа
 * @param option - выбранная ячейка
 */
export function spendSpellSlot(
  document: SheetDocument,
  option: Pick<SpellSlotOption, 'kind' | 'level'>,
): SheetDocument {
  if (option.kind === 'pact') {
    return { ...document, pactSlotsUsed: document.pactSlotsUsed + 1 };
  }

  return {
    ...document,
    spellSlotsUsed: document.spellSlotsUsed.map((used, index) =>
      index === option.level - 1 ? used + 1 : used,
    ),
  };
}

/**
 * Подходит ли заклинание под отбор вкладки.
 * @param spell - заклинание
 * @param filter - отбор
 * @param isPrepared - заклинание подготовлено (с учётом «всегда»)
 */
export function matchesSpellFilter(
  spell: Pick<SheetSpell, 'level'>,
  filter: SpellTabFilter,
  isPrepared: boolean,
): boolean {
  if (filter.preparedOnly && !isPrepared) {
    return false;
  }

  return !filter.levels.length || filter.levels.includes(spell.level);
}

/**
 * Круги, которые показывает вкладка: круги заклинаний и круги ячеек.
 * @param spells - заклинания листа
 * @param slotLevels - круги, на которых есть ячейки
 */
export function getSpellListLevels(
  spells: ReadonlyArray<Pick<SheetSpell, 'level'>>,
  slotLevels: ReadonlyArray<number>,
): Array<number> {
  return [
    ...new Set([...spells.map((spell) => spell.level), ...slotLevels]),
  ].sort((left, right) => left - right);
}

/**
 * Описание справочника простым текстом: абзацы через пустую строку.
 * @param description - разметка или HTML старой базы
 */
export function getDescriptionText(
  description: ContentDescription | null | undefined,
): string {
  if (!description) {
    return '';
  }

  if (typeof description === 'string') {
    return getNodesText(parseContent(description)).trim();
  }

  return description
    .map((block) => getNodesText(markupToContent([block])).trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Компоненты из карточки справочника текстом: «В, С, М (щепотка серы)».
 * @param components - компоненты карточки
 */
export function getComponentsText(
  components: SpellDetail['components'],
): string {
  if (!components) {
    return '';
  }

  const material =
    typeof components.m === 'string' ? `М (${components.m})` : 'М';

  return [
    components.v ? 'В' : '',
    components.s ? 'С' : '',
    components.m ? material : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Своя копия заклинания справочника: характеристики, описание и урон
 * переезжают в лист, копия правится целиком.
 * @param spell - заклинание листа
 * @param detail - карточка справочника
 * @param id - идентификатор копии
 */
export function copySpellAsCustom(
  spell: SheetSpell,
  detail: SpellDetail,
  id: string,
): SheetSpell {
  return {
    ...spell,
    id,
    url: null,
    sourceId: null,
    alwaysPrepared: false,
    castingTime: detail.time ?? '',
    range: detail.range ?? '',
    components: getComponentsText(detail.components),
    duration: detail.duration ?? '',
    description: getDescriptionText(detail.description),
    damage: detail.damage ?? null,
  };
}

/**
 * Модификатор заклинания: своя характеристика либо характеристика класса.
 * @param spell - заклинание
 * @param fallback - характеристика класса
 * @param modifiers - модификаторы характеристик
 */
export function getSpellAbilityModifier(
  spell: Pick<SheetSpell, 'spellcastingAbility'>,
  fallback: AbilityKey | null,
  modifiers: Readonly<Record<AbilityKey, number>>,
): number {
  const ability = spell.spellcastingAbility ?? fallback;

  return ability ? modifiers[ability] : 0;
}
