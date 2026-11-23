import type {
  ActiveEffect,
  EffectAura,
  EffectChange,
  EffectDamagePart,
  EffectFormContext,
  EffectFormLayout,
  EffectSave,
} from '~active-effects/model';

import {
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  EFFECT_ORIGIN,
  resolveEffectFormLayout,
} from '~active-effects/model';

/**
 * Сложность спасброска эффектов в тестах. Отличается от Сл нового спасброска
 * (`DEFAULT_EFFECT_SAVE_DC`): иначе проверка не отличила бы настроенную Сл от
 * подставленной по умолчанию.
 */
export const SAVE_DC = 14;

/** Сл, набранная автором вручную: отличается и от `SAVE_DC`, и от умолчания. */
export const TYPED_SAVE_DC = 15;

/** Радиус ауры в тестах. */
export const AURA_RADIUS = 10;

/** Id нового эффекта в тестах. */
export const NEW_EFFECT_ID = 'effect_new';

/** Название нового эффекта в тестах. */
export const NEW_EFFECT_NAME = 'Новый';

/** Спасбросок Телосложения с половиной урона при успехе. */
export const CONSTITUTION_SAVE: EffectSave = {
  ability: 'constitution',
  dc: SAVE_DC,
  onSuccess: 'half',
};

/** Яд 2к6. */
export const POISON_DAMAGE: EffectDamagePart[] = [
  { formula: '2d6', type: 'poison' },
];

/** Модификатор скорости ходьбы. */
export const WALK_SPEED_CHANGE: EffectChange = {
  key: 'movement.walk',
  mode: 'add',
  value: '10',
  priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
};

/** Аура союзникам. */
export const ALLIES_AURA: EffectAura = {
  radius: AURA_RADIUS,
  target: 'allies',
  applyToSelf: true,
  visible: true,
};

/** Аура на всех существ. */
export const ALL_CREATURES_AURA: EffectAura = {
  radius: AURA_RADIUS,
  target: 'all',
  applyToSelf: false,
  visible: true,
};

/**
 * Эффект в форме редактора.
 *
 * @param overrides поля, отличные от умолчания.
 * @returns эффект.
 */
export function createEffect(
  overrides: Partial<ActiveEffect> = {},
): ActiveEffect {
  return {
    id: 'effect_test',
    name: 'Тест',
    description: '',
    disabled: false,
    origin: EFFECT_ORIGIN.manual,
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    ...overrides,
  };
}

/**
 * Сырой эффект, как его отдаёт сервер: поля могут быть битыми.
 *
 * @param overrides поля, отличные от умолчания, — в том числе негодные.
 * @returns объект эффекта.
 */
export function createRawEffect(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ...createEffect(), ...overrides };
}

/**
 * Раскладка формы для эффекта.
 *
 * @param context место формы.
 * @param overrides поля эффекта.
 * @returns раскладка.
 */
export function resolveLayoutFor(
  context: EffectFormContext,
  overrides: Partial<ActiveEffect> = {},
): EffectFormLayout {
  return resolveEffectFormLayout(context, createEffect(overrides));
}

/**
 * Эффект как данные: без ключей со значением `undefined`.
 *
 * @param effect эффект.
 * @returns JSON.
 */
export function serializeEffect(effect: ActiveEffect): string {
  return JSON.stringify(effect);
}

/**
 * Убирает ключи со значением `undefined` — так значение увидит сервер после
 * `JSON.stringify` запроса.
 *
 * @param value значение из формы.
 * @returns то же значение без неопределённых ключей.
 */
export function stripUndefinedKeys(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
