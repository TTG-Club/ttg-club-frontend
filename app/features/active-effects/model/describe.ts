/**
 * Авто-описание активного эффекта и его частей.
 *
 * Части (модификатор, флаг, урон, длительность, Сл, состояние) собирают и
 * живую сводку формы (`scenario.ts`), и описание эффекта в карточках листа
 * (`describeActiveEffect`). Фразы те же, что у системы, — сводка на сайте и в
 * VTTG читается одинаково.
 *
 * Зеркало: dnd5-test-migrate/src/engine/activeEffectDescribe.ts
 */

import type { EffectFormLayout, InertEffectField } from './layout';
import type {
  ActiveEffect,
  EffectChange,
  EffectDamagePart,
  EffectDuration,
  EffectHealKind,
  EffectSave,
} from './types';

import { upperFirst } from 'es-toolkit';

import {
  DEFAULT_EFFECT_TURN_ANCHOR,
  DEFAULT_EFFECT_TURN_TIMING,
  EFFECT_ABILITY_OPTIONS,
  EFFECT_APPLIER_DC_SHORT_LABELS,
  EFFECT_APPLY_SAVE_SUCCESS_LABELS,
  EFFECT_AREA_TRIGGER_LABELS,
  EFFECT_ATTACK_TRIGGER_LABELS,
  EFFECT_AURA_TARGET_SCENARIO_LABELS,
  EFFECT_CHANGE_MODE_LABELS,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_NAMES,
  EFFECT_CREATURE_CATEGORY_OPTIONS,
  EFFECT_DAMAGE_TYPE_SHORT_LABELS,
  EFFECT_DELIVERY_HINTS,
  EFFECT_FLAG_LABELS,
  EFFECT_HEAL_KIND_LABELS,
  EFFECT_INERT_FIELD_NAMES,
  EFFECT_INERT_FIELDS_LABELS,
  EFFECT_INERT_FIELDS_SEPARATOR,
  EFFECT_INERT_FIELDS_TERMINATOR,
  EFFECT_MODIFIERS_STEP_LABELS,
  EFFECT_PHRASE_PARTS,
  EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS,
  EFFECT_SAVE_TIMING_LABELS,
  EFFECT_SPELL_ZONE_DELIVERY_HINT,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_USE_DELIVERY_HINTS,
  isEffectConditionKey,
  isEffectDamageType,
  splitConditionParts,
} from './constants';
import { APPLIER_SAVE_DC } from './layout';
import { getPlural } from './utils';

/**
 * Собирает карту «значение → подпись» из списка опций.
 *
 * @param options список опций справочника.
 * @returns карта подписей.
 */
function toLabelMap(
  options: ReadonlyArray<{ value: string; label: string }>,
): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]));
}

/** Подпись ключа модификатора (`armorClass` → «Класс доспеха (AC)»). */
const TARGET_LABELS = toLabelMap(EFFECT_TARGET_KEY_SUGGESTIONS);

/** Подпись кода-условия (`roll.hasAdvantage === true` → «Бросок: …»). */
const CONDITION_LABELS = toLabelMap(EFFECT_CONDITION_EXPR_SUGGESTIONS);

/** Подпись характеристики спасброска. */
const ABILITY_LABELS = toLabelMap(EFFECT_ABILITY_OPTIONS);

/** Подпись типа существа (`humanoid` → «Гуманоид»). */
const CREATURE_TYPE_LABELS = toLabelMap(EFFECT_CREATURE_CATEGORY_OPTIONS);

/** Короткие подписи @-токенов в формулах значений модификаторов. */
const VALUE_TOKEN_LABELS: Record<string, string> = {
  '@mod.spell': 'мод. закл. характеристики',
  '@mod.str': 'мод. Силы',
  '@mod.dex': 'мод. Ловкости',
  '@mod.con': 'мод. Телосложения',
  '@mod.int': 'мод. Интеллекта',
  '@mod.wis': 'мод. Мудрости',
  '@mod.cha': 'мод. Харизмы',
  '@prof': 'бонус мастерства',
  '@level': 'уровень',
  '@classLevel': 'уровень в классе',
  '@speed.walk': 'скорость ходьбы',
  '@speed.fly': 'скорость полёта',
  '@speed.swim': 'скорость плавания',
  '@speed.climb': 'скорость лазания',
  '@speed.burrow': 'скорость копания',
};

/**
 * Подписи условия по цели в формуле урона: токен `@target.full` или
 * `@target.notFull`.
 */
const DAMAGE_TARGET_LABELS: Record<string, string> = {
  full: 'по цели с полным HP',
  notFull: 'по раненой цели',
};

/**
 * Токен лечения: `@heal` (хиты) или `@heal.temp` (временные хиты). Хвост
 * запрещён: `@heal.spell` лечением не считается. Правило то же, что у системы
 * (`HEAL_TOKEN_REGEX`), — и для описания, и для переноса легаси-типа урона.
 */
const HEAL_TOKEN_PATTERN = /@heal(\.temp)?(?![\w.])/i;

/** Формы единиц длительности для плюрализации. */
const DURATION_FORMS: Record<string, [string, string, string]> = {
  rounds: ['раунд', 'раунда', 'раундов'],
  minutes: ['минуту', 'минуты', 'минут'],
  hours: ['час', 'часа', 'часов'],
  days: ['день', 'дня', 'дней'],
};

/**
 * Проверяет, что строка — «голое» число с необязательным знаком.
 *
 * @param value строка значения.
 * @returns `true`, если это число.
 */
function isNumeric(value: string): boolean {
  return /^[+-]?\d+(?:\.\d+)?$/.test(value.trim());
}

/**
 * Русское название состояния по ключу.
 *
 * @param conditionKey ключ состояния.
 * @returns название; незнакомый ключ отдаётся как есть.
 */
export function describeConditionName(conditionKey: string): string {
  const conditionName = isEffectConditionKey(conditionKey)
    ? EFFECT_CONDITION_NAMES[conditionKey]
    : undefined;

  return conditionName ?? conditionKey;
}

/**
 * Подпись типа существа (`humanoid` → «Гуманоид»).
 *
 * @param creatureType ключ типа существа.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeCreatureType(creatureType: string): string {
  return CREATURE_TYPE_LABELS.get(creatureType) ?? creatureType;
}

/**
 * Подпись характеристики (`strength` → «Сила»).
 *
 * @param ability ключ характеристики.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeAbilityName(ability: string): string {
  return ABILITY_LABELS.get(ability) ?? ability;
}

/**
 * Краткая подпись типа урона для фраз: `poison` → «ядом».
 *
 * @param damageType ключ типа урона.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeDamageTypeShort(damageType: string): string {
  return isEffectDamageType(damageType)
    ? EFFECT_DAMAGE_TYPE_SHORT_LABELS[damageType]
    : damageType;
}

/**
 * Подпись ключа модификатора (`armorClass` → «Класс доспеха (AC)»).
 *
 * @param key ключ строки модификатора.
 * @returns подпись; незнакомый ключ отдаётся как есть.
 */
export function describeEffectChangeKey(key: string): string {
  return TARGET_LABELS.get(key) ?? key;
}

/**
 * Подпись флага эффекта (`attack.disadvantage` → «Помеха на все атаки»).
 *
 * @param flag ключ флага.
 * @returns подпись; незнакомый флаг отдаётся как есть.
 */
export function describeEffectFlag(flag: string): string {
  return EFFECT_FLAG_LABELS[flag] ?? flag;
}

/**
 * Подпись Сл спасброска: `0` у эффектов заклинаний и действий — «Сл
 * заклинателя».
 *
 * @param dc сложность из эффекта.
 * @returns подпись сложности.
 */
export function formatEffectSaveDc(dc: number): string {
  return dc === APPLIER_SAVE_DC
    ? EFFECT_APPLIER_DC_SHORT_LABELS.spell
    : `Сл ${dc}`;
}

/**
 * Подпись спасброска против урона каждый ход: «спасбросок (Телосложение,
 * Сл 13), при успехе без урона».
 *
 * @param save спасбросок против урона.
 * @returns подпись.
 */
function describeRecurringDamageSave(save: EffectSave): string {
  return `${EFFECT_PHRASE_PARTS.savePrefix}(${ABILITY_LABELS.get(save.ability) ?? save.ability}, ${formatEffectSaveDc(save.dc)}), ${EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS[save.onSuccess]}`;
}

/**
 * Заменяет @-токены формулы на короткие русские подписи.
 *
 * @param value формула или значение модификатора.
 * @returns строка без сырых токенов.
 */
function prettifyFormula(value: string): string {
  return value.replace(
    /@[a-z.]+/gi,
    (token) => VALUE_TOKEN_LABELS[token] ?? token,
  );
}

/**
 * Форматирует значение одного модификатора в духе «+5 фт» или «×2».
 *
 * Режим подписывается своим словом, а не сводится к прибавке: «заменить 60» и
 * «+60» дают разный итог.
 *
 * @param change изменение эффекта.
 * @returns подпись значения.
 */
function describeChangeValue(change: EffectChange): string {
  const unit = change.key.startsWith('movement.')
    ? EFFECT_PHRASE_PARTS.feetSuffix
    : '';

  if (change.mode === 'add') {
    if (isNumeric(change.value)) {
      const numeric = Number(change.value);
      const sign = numeric < 0 ? '−' : '+';

      return `${sign}${Math.abs(numeric)}${unit}`;
    }

    return `+${prettifyFormula(change.value)}${unit}`;
  }

  if (change.mode === 'multiply') {
    return `×${change.value}`;
  }

  const modeLabel = EFFECT_CHANGE_MODE_LABELS[change.mode].toLowerCase();

  return `${modeLabel} ${prettifyFormula(change.value)}${unit}`;
}

/**
 * Подпись условия, в том числе составного: части, соединённые `&&`, читаются
 * как «… и …». Незнакомая часть отдаётся кодом — лучше показать автору
 * непонятную строку, чем скрыть от него условие целиком.
 *
 * @param condition условие изменения.
 * @returns человекочитаемая подпись.
 */
export function describeEffectChangeCondition(condition: string): string {
  return splitConditionParts(condition)
    .map((part) => CONDITION_LABELS.get(part) ?? part)
    .join(EFFECT_PHRASE_PARTS.andJoiner);
}

/**
 * Описывает один модификатор: «Класс доспеха (AC) +2 (только: …)».
 *
 * @param change изменение эффекта.
 * @returns строка описания.
 */
export function describeEffectChange(change: EffectChange): string {
  const base = `${describeEffectChangeKey(change.key)} ${describeChangeValue(change)}`;
  const condition = change.condition?.trim();

  if (!condition) {
    return base;
  }

  return `${base} (только: ${describeEffectChangeCondition(condition)})`;
}

/**
 * Вид лечения по первому токену `@heal` или `@heal.temp`.
 *
 * @param formula формула части.
 * @returns вид лечения либо `null`, если токена нет.
 */
function detectFormulaHealKind(formula: string): EffectHealKind | null {
  const match = HEAL_TOKEN_PATTERN.exec(formula);

  if (!match) {
    return null;
  }

  return match[1] ? 'temp' : 'hp';
}

/**
 * Лечит ли часть: в формуле есть токен `@heal` или `@heal.temp`. Зеркало
 * `damagePartIsHealing` системы.
 *
 * @param part часть урона или лечения.
 * @returns `true`, если часть лечит хиты или даёт временные хиты.
 */
export function isHealingDamagePart(
  part: Pick<EffectDamagePart, 'formula'>,
): boolean {
  return HEAL_TOKEN_PATTERN.test(part.formula);
}

/**
 * Вырезает токены лечения из формулы.
 *
 * @param formula формула части.
 * @returns формула без `@heal` и `@heal.temp`.
 */
function stripHealTokens(formula: string): string {
  if (!HEAL_TOKEN_PATTERN.test(formula)) {
    return formula;
  }

  return formula
    .replace(new RegExp(HEAL_TOKEN_PATTERN, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Описывает части урона: «2к8 ядом + 1к6 огненный», «10 лечения». Разбирает
 * токены типа урона (`@dmg.poison`), лечения (`@heal`) и условия по цели
 * (`@target.full`) и чистит их из показываемой формулы, чтобы в описании не
 * торчали сырые токены.
 *
 * @param parts части урона эффекта.
 * @returns строка описания частей; пустая, если формул нет.
 */
export function describeEffectDamageParts(
  parts: ReadonlyArray<EffectDamagePart>,
): string {
  return parts
    .filter((part) => part.formula.trim())
    .map((part) => {
      const formula = part.formula.trim();
      const damageToken = /@dmg\.([a-z]+)/i.exec(formula);
      const typeKey = part.type ?? damageToken?.[1];

      const typeLabel = typeKey ? ` ${describeDamageTypeShort(typeKey)}` : '';
      const healKind = detectFormulaHealKind(formula);

      const healLabel = healKind ? ` ${EFFECT_HEAL_KIND_LABELS[healKind]}` : '';

      const targetToken = /@target\.(\w+)/.exec(formula);

      const targetLabel = targetToken?.[1]
        ? ` (${DAMAGE_TARGET_LABELS[targetToken[1]] ?? targetToken[1]})`
        : '';

      const cleanFormula = prettifyFormula(
        stripHealTokens(formula)
          .replace(/@dmg\.[a-z]+/gi, '')
          .replace(/@target\.\w+/gi, '')
          .trim(),
      );

      return `${cleanFormula}${typeLabel}${healLabel}${targetLabel}`;
    })
    .join(' + ');
}

/**
 * Описывает длительность: «на 1 раунд», «постоянно», «до конца следующего хода».
 *
 * @param duration длительность эффекта.
 * @returns подпись либо `null`, если сказать нечего («особое», пустое число).
 */
export function describeEffectDuration(
  duration: EffectDuration,
): string | null {
  if (duration.type === 'permanent') {
    return 'постоянно';
  }

  if (duration.type === 'turn') {
    const when =
      (duration.turnTiming ?? DEFAULT_EFFECT_TURN_TIMING) === 'end'
        ? 'конца'
        : 'начала';

    const whose =
      (duration.turnAnchor ?? DEFAULT_EFFECT_TURN_ANCHOR) === 'source'
        ? 'источника'
        : 'носителя';

    return `до ${when} следующего хода ${whose}`;
  }

  const forms = DURATION_FORMS[duration.type];
  const value = duration.value ?? 0;

  if (!forms || value <= 0) {
    return null;
  }

  return `на ${value} ${getPlural(value, forms)}`;
}

/**
 * Собирает человекочитаемое описание эффекта из его настроек.
 *
 * @param effect активный эффект.
 * @returns описание; пустая строка — описывать нечего.
 */
export function describeActiveEffect(effect: ActiveEffect): string {
  const clauses: string[] = [];

  for (const change of effect.changes) {
    if (change.value.trim()) {
      clauses.push(describeEffectChange(change));
    }
  }

  for (const flag of effect.flags) {
    clauses.push(describeEffectFlag(flag));
  }

  if (effect.conditionKey) {
    clauses.push(
      `${EFFECT_MODIFIERS_STEP_LABELS.conditionPrefix}${describeConditionName(effect.conditionKey)}`,
    );
  }

  if (effect.applySave) {
    const ability = ABILITY_LABELS.get(effect.applySave.ability) ?? '';

    const onSuccess =
      EFFECT_APPLY_SAVE_SUCCESS_LABELS[effect.applySave.onSuccess];

    clauses.push(
      `${EFFECT_PHRASE_PARTS.savePrefix}(${ability}, ${formatEffectSaveDc(effect.applySave.dc)}), ${onSuccess}`,
    );
  }

  if (effect.damageParts?.length) {
    const damage = describeEffectDamageParts(effect.damageParts);

    if (damage) {
      clauses.push(`урон при наложении: ${damage}`);
    }
  }

  if (effect.recurringDamage?.damageParts.length) {
    const damage = describeEffectDamageParts(
      effect.recurringDamage.damageParts,
    );

    const timing = EFFECT_SAVE_TIMING_LABELS[effect.recurringDamage.timing];

    if (damage) {
      const save = effect.recurringDamage.save
        ? `${EFFECT_PHRASE_PARTS.clauseJoiner}${describeRecurringDamageSave(effect.recurringDamage.save)}`
        : '';

      clauses.push(`урон каждый ход (${timing}): ${damage}${save}`);
    }
  }

  if (effect.recurringSave) {
    const ability = ABILITY_LABELS.get(effect.recurringSave.ability) ?? '';

    const timing = EFFECT_SAVE_TIMING_LABELS[effect.recurringSave.timing];

    clauses.push(
      `повторный спасбросок (${ability}, ${formatEffectSaveDc(effect.recurringSave.dc)}) ${timing} снимает эффект`,
    );
  }

  if (effect.aura) {
    clauses.push(
      `аура ${effect.aura.radius}${EFFECT_PHRASE_PARTS.feetSuffix} (${EFFECT_AURA_TARGET_SCENARIO_LABELS[effect.aura.target]})`,
    );
  }

  if (effect.areaTrigger && effect.areaTrigger !== 'stay') {
    clauses.push(EFFECT_AREA_TRIGGER_LABELS[effect.areaTrigger].toLowerCase());
  }

  if (effect.conditionImmunities?.length) {
    const names = effect.conditionImmunities
      .map(describeConditionName)
      .join(EFFECT_PHRASE_PARTS.listJoiner);

    clauses.push(`${EFFECT_PHRASE_PARTS.immunitiesPrefix}${names}`);
  }

  if (effect.applyOnSuccessOnly) {
    clauses.push('только при успешном спасброске');
  }

  if (effect.consumeOn) {
    clauses.push(EFFECT_ATTACK_TRIGGER_LABELS[effect.consumeOn].toLowerCase());
  }

  // Длительность идёт последней и только если есть что описывать: сама по себе
  // она ничего не рассказывает про эффект.
  const duration = describeEffectDuration(effect.duration);

  if (duration && clauses.length > 0) {
    clauses.push(duration);
  }

  if (clauses.length === 0) {
    return '';
  }

  const text = upperFirst(clauses.join(EFFECT_PHRASE_PARTS.clauseJoiner));

  return text.endsWith('.') ? text : `${text}.`;
}

/**
 * Текст плашки неработающих настроек: пояснение и перечень названий через
 * запятую с точкой в конце.
 *
 * @param fields неработающие поля эффекта.
 * @returns текст плашки.
 */
export function describeInertEffectFields(
  fields: readonly InertEffectField[],
): string {
  const names = fields
    .map((field) => EFFECT_INERT_FIELD_NAMES[field])
    .join(EFFECT_INERT_FIELDS_SEPARATOR);

  return `${EFFECT_INERT_FIELDS_LABELS.description}${names}${EFFECT_INERT_FIELDS_TERMINATOR}`;
}

/**
 * Пояснение под выбором доставки. У зоны заклинания своё: она остаётся на
 * месте шаблона после применения, а не действует на существ в зоне мастера.
 *
 * @param layout доставка и место формы.
 * @returns пояснение.
 */
export function resolveEffectDeliveryHint(
  layout: Pick<EffectFormLayout, 'delivery' | 'context' | 'useActivated'>,
): string {
  if (
    layout.useActivated
    && (layout.delivery === 'carrier' || layout.delivery === 'target')
  ) {
    return EFFECT_USE_DELIVERY_HINTS[layout.delivery];
  }

  return layout.delivery === 'zone' && layout.context === 'spell'
    ? EFFECT_SPELL_ZONE_DELIVERY_HINT
    : EFFECT_DELIVERY_HINTS[layout.delivery];
}
