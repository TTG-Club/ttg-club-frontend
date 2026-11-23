/**
 * Готовые меню редактора активных эффектов: «Готовые» флаги и «Готовые»
 * модификаторы. Зеркало `effectFlagMenu.ts` и `effectModifierMenu.ts` из VTTG.
 *
 * Своих списков ключей здесь НЕ заводится: разделы выводятся по приставке
 * ключа из тех же справочников, что питают библиотеки полей формы
 * (`EFFECT_FLAG_LABELS`, `EFFECT_TARGET_KEY_SUGGESTIONS`,
 * `EFFECT_CONDITION_EXPR_SUGGESTIONS`). Второй список рано или поздно разошёлся
 * бы с первым, и меню предлагало бы то, чего движок не знает.
 */

import type { EffectChangeMode } from './types';

import {
  EFFECT_CARRIER_ARMOR_CONDITION_PREFIX,
  EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_DAMAGE_DEFENSE_KINDS,
  EFFECT_DAMAGE_TYPE_OPTIONS,
  EFFECT_FLAG_LABELS,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TARGET_TYPE_CONDITION_PREFIX,
  SAVE_VS_CONDITION_FLAG_KEYS,
} from './constants';

/** Пункт меню флагов. */
export interface EffectFlagMenuItem {
  /** Ключ флага. */
  key: string;
  /**
   * Подпись пункта. У защит от урона — короткая (один тип урона): вид защиты
   * уже назван подписью вложенного раздела.
   */
  label: string;
}

/** Раздел меню флагов со своими пунктами и (у защит) вложенными разделами. */
export interface EffectFlagMenuGroup {
  label: string;
  items: EffectFlagMenuItem[];
  /** Вложенные разделы — второй уровень меню. */
  groups?: EffectFlagMenuGroup[];
}

/** Раздел меню флагов и его подпись; порядок — от частого к редкому. */
const EFFECT_FLAG_GROUPS = [
  { key: 'attack', label: 'Свои атаки' },
  { key: 'attacksAgainst', label: 'Атаки по носителю' },
  { key: 'abilityCheck', label: 'Проверки характеристик' },
  { key: 'saves', label: 'Спасброски' },
  { key: 'saveVsCondition', label: 'Спасброски против состояний' },
  { key: 'saveAutoFail', label: 'Автопровалы спасбросков' },
  { key: 'skills', label: 'Навыки' },
  { key: 'damageDefense', label: 'Защиты от урона' },
  { key: 'other', label: 'Прочее' },
] as const;

/** Множество типов урона, к которым применимы защиты. */
const DEFENSIBLE_DAMAGE_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(
    EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType) => [
      damageType.value,
      damageType.label,
    ]),
  );

/**
 * Вид защиты от урона, заданный приставкой ключа флага.
 *
 * @param flagKey ключ флага.
 * @returns вид защиты либо `undefined` — флаг не про защиту от урона.
 */
function getDamageDefenseKind(flagKey: string): string | undefined {
  return EFFECT_DAMAGE_DEFENSE_KINDS.find((kind) =>
    flagKey.startsWith(`${kind.value}.`),
  )?.value;
}

/**
 * Раздел, к которому относится флаг. Определяется приставкой ключа — так новый
 * флаг попадает в меню сам.
 *
 * Порядок проверок важен: автопровал спасброска начинается с той же приставки
 * `save.`, что и обычные спасброски, и должен отобраться раньше.
 *
 * @param flagKey ключ флага.
 * @returns ключ раздела меню.
 */
function getFlagGroupKey(flagKey: string): string {
  if (flagKey.startsWith('save.autoFail.')) {
    return 'saveAutoFail';
  }

  // Раньше общей ветки спасбросков: приставка `save.` у них та же, а тридцать
  // позиций в одном разделе с остальными не читаются.
  if (SAVE_VS_CONDITION_FLAG_KEYS.has(flagKey)) {
    return 'saveVsCondition';
  }

  if (flagKey.startsWith('save.')) {
    return 'saves';
  }

  if (flagKey.startsWith('attacksAgainst.')) {
    return 'attacksAgainst';
  }

  if (flagKey.startsWith('attack.')) {
    return 'attack';
  }

  if (flagKey.startsWith('abilityCheck.')) {
    return 'abilityCheck';
  }

  if (flagKey.startsWith('skill.')) {
    return 'skills';
  }

  return getDamageDefenseKind(flagKey) ?? 'other';
}

/**
 * Подпись пункта: у защиты от урона — только тип урона, вид защиты назван
 * подписью вложенного раздела.
 *
 * @param flagKey ключ флага.
 * @param fullLabel подпись из справочника флагов.
 * @returns подпись пункта меню.
 */
function getFlagItemLabel(flagKey: string, fullLabel: string): string {
  const kind = getDamageDefenseKind(flagKey);

  if (!kind) {
    return fullLabel;
  }

  return (
    DEFENSIBLE_DAMAGE_TYPE_LABELS[flagKey.slice(kind.length + 1)] ?? fullLabel
  );
}

/**
 * Собирает меню флагов разделами: у защит от урона второй уровень по виду
 * защиты — сорок с лишним пунктов одним списком на экран не помещаются.
 *
 * @returns разделы меню флагов.
 */
function buildFlagMenu(): EffectFlagMenuGroup[] {
  const itemsByGroup = new Map<string, EffectFlagMenuItem[]>();

  for (const [flagKey, flagLabel] of Object.entries(EFFECT_FLAG_LABELS)) {
    const groupKey = getFlagGroupKey(flagKey);
    const items = itemsByGroup.get(groupKey) ?? [];

    items.push({ key: flagKey, label: getFlagItemLabel(flagKey, flagLabel) });
    itemsByGroup.set(groupKey, items);
  }

  return EFFECT_FLAG_GROUPS.map((group): EffectFlagMenuGroup | undefined => {
    if (group.key !== 'damageDefense') {
      const items = itemsByGroup.get(group.key) ?? [];

      return items.length > 0 ? { label: group.label, items } : undefined;
    }

    const nested = EFFECT_DAMAGE_DEFENSE_KINDS.map(
      (kind): EffectFlagMenuGroup => ({
        label: kind.label,
        items: itemsByGroup.get(kind.value) ?? [],
      }),
    ).filter((nestedGroup) => nestedGroup.items.length > 0);

    return nested.length > 0
      ? { label: group.label, items: [], groups: nested }
      : undefined;
  }).filter((group): group is EffectFlagMenuGroup => group !== undefined);
}

/** Меню флагов разделами. Считается один раз: список флагов статичен. */
export const EFFECT_FLAG_MENU: ReadonlyArray<EffectFlagMenuGroup> =
  buildFlagMenu();

/** Готовая строка модификатора: что подставится в новую строку формы. */
export interface EffectModifierPreset {
  /**
   * Ключ изменения. Пусто — пункт задаёт только условие: что менять, автор
   * называет сам (разделы «Условие: …»).
   */
  key: string;
  label: string;
  mode: EffectChangeMode;
  /** Значение строки; не задано — форма подставит своё по умолчанию. */
  value?: string;
  /** Условие строки; задано — остальные поля пункт оставляет пустыми. */
  condition?: string;
}

/** Раздел меню модификаторов. */
export interface EffectModifierMenuGroup {
  label: string;
  items: EffectModifierPreset[];
}

/** Разделы меню модификаторов; порядок — от частого к редкому. */
const EFFECT_MODIFIER_GROUPS = [
  { key: 'core', label: 'Основное' },
  { key: 'senses', label: 'Чувства' },
  { key: 'movement', label: 'Скорости' },
  { key: 'abilities', label: 'Характеристики' },
  { key: 'saves', label: 'Спасброски' },
  { key: 'skills', label: 'Навыки' },
  { key: 'attack', label: 'Атака' },
  { key: 'damage', label: 'Урон' },
  { key: 'carrierType', label: 'Условие: тип носителя' },
  { key: 'carrierArmor', label: 'Условие: доспех носителя' },
  { key: 'targetType', label: 'Условие: тип цели' },
] as const;

/**
 * Раздел, к которому относится ключ изменения. Определяется приставкой — так
 * новый ключ попадает в меню сам.
 *
 * @param changeKey ключ изменения эффекта.
 * @returns ключ раздела меню.
 */
function getModifierGroupKey(changeKey: string): string {
  if (changeKey.startsWith('ability.')) {
    return 'abilities';
  }

  if (changeKey.startsWith('save.')) {
    return 'saves';
  }

  if (changeKey.startsWith('skill.')) {
    return 'skills';
  }

  if (changeKey.startsWith('attack.')) {
    return 'attack';
  }

  if (changeKey.startsWith('damage.')) {
    return 'damage';
  }

  if (changeKey.startsWith('movement.')) {
    return 'movement';
  }

  if (changeKey.startsWith('sense.')) {
    return 'senses';
  }

  return 'core';
}

/**
 * Режим по умолчанию для ключа: чувства и новые виды движения не складываются —
 * два источника слепого зрения дают не сумму, а большую дальность («Повысить
 * до»). Прибавка к скорости ходьбы остаётся прибавкой.
 *
 * @param changeKey ключ изменения эффекта.
 * @returns режим применения.
 */
function getDefaultModeOfKey(changeKey: string): EffectChangeMode {
  if (changeKey.startsWith('sense.')) {
    return 'upgrade';
  }

  if (changeKey.startsWith('movement.') && changeKey !== 'movement.walk') {
    return 'upgrade';
  }

  return 'add';
}

/**
 * Значение по умолчанию раздела: только там, где единица выглядела бы ошибкой —
 * чувство «1 фут» или скорость полёта «1 фут».
 *
 * @param groupKey ключ раздела меню.
 * @returns значение по умолчанию либо `undefined`.
 */
function getDefaultValueOfGroup(groupKey: string): string | undefined {
  if (groupKey === 'senses') {
    return '60';
  }

  if (groupKey === 'movement') {
    return '10';
  }

  return undefined;
}

/**
 * Комбинации, где важен не только ключ, но и значение: одним ключом их не
 * выразить. Своего раздела у них нет — каждая встаёт в конец раздела своего
 * ключа.
 */
const EFFECT_MODIFIER_READY_PRESETS: EffectModifierPreset[] = [
  {
    key: 'initiative',
    label: 'Инициатива: + бонус мастерства',
    mode: 'add',
    value: '@prof',
  },
  {
    key: 'hitPoints.max',
    label: 'Максимум хитов: за каждый уровень персонажа',
    mode: 'add',
    value: '@level',
  },
  {
    key: 'hitPoints.max',
    label: 'Максимум хитов: за каждый уровень класса',
    mode: 'add',
    value: '@classLevel',
  },
  {
    key: 'movement.fly',
    label: 'Полёт: равен скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.climb',
    label: 'Лазание: равно скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.swim',
    label: 'Плавание: равно скорости ходьбы',
    mode: 'upgrade',
    value: '@speed.walk',
  },
  {
    key: 'movement.fly',
    label: 'Полёт: равен скорости плавания',
    mode: 'upgrade',
    value: '@speed.swim',
  },
];

/**
 * Пункты-условия по типу существа: выбор заполняет ТОЛЬКО поле условия, ключ и
 * значение остаются пустыми — что именно ограничивает условие, автор называет
 * сам.
 *
 * @param prefix приставка условия семейства (носитель или цель).
 * @returns готовые строки-условия.
 */
function buildConditionPresets(prefix: string): EffectModifierPreset[] {
  return EFFECT_CONDITION_EXPR_SUGGESTIONS.filter((suggestion) =>
    suggestion.value.startsWith(prefix),
  ).map((suggestion) => ({
    key: '',
    label: suggestion.label,
    mode: 'add' as const,
    condition: suggestion.value,
  }));
}

/**
 * Собирает меню модификаторов: сперва простые ключи раздела, следом готовые
 * комбинации того же раздела.
 *
 * @returns разделы меню модификаторов.
 */
function buildModifierMenu(): EffectModifierMenuGroup[] {
  const itemsByGroup = new Map<string, EffectModifierPreset[]>();

  for (const suggestion of EFFECT_TARGET_KEY_SUGGESTIONS) {
    const groupKey = getModifierGroupKey(suggestion.value);
    const items = itemsByGroup.get(groupKey) ?? [];

    items.push({
      key: suggestion.value,
      label: suggestion.label,
      mode: getDefaultModeOfKey(suggestion.value),
      value: getDefaultValueOfGroup(groupKey),
    });

    itemsByGroup.set(groupKey, items);
  }

  for (const preset of EFFECT_MODIFIER_READY_PRESETS) {
    const groupKey = getModifierGroupKey(preset.key);
    const items = itemsByGroup.get(groupKey) ?? [];

    items.push(preset);
    itemsByGroup.set(groupKey, items);
  }

  itemsByGroup.set(
    'carrierType',
    buildConditionPresets(EFFECT_CARRIER_TYPE_CONDITION_PREFIX),
  );

  itemsByGroup.set(
    'carrierArmor',
    buildConditionPresets(EFFECT_CARRIER_ARMOR_CONDITION_PREFIX),
  );

  itemsByGroup.set(
    'targetType',
    buildConditionPresets(EFFECT_TARGET_TYPE_CONDITION_PREFIX),
  );

  return EFFECT_MODIFIER_GROUPS.map((group) => ({
    label: group.label,
    items: itemsByGroup.get(group.key) ?? [],
  })).filter((group) => group.items.length > 0);
}

/** Меню модификаторов разделами. Считается один раз: списки ключей статичны. */
export const EFFECT_MODIFIER_MENU: ReadonlyArray<EffectModifierMenuGroup> =
  buildModifierMenu();
