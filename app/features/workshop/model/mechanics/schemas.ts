import type { ActiveEffect } from '~active-effects/model';

import { z } from 'zod';

import {
  COUNTER_LEGACY_RECOVERY,
  COUNTER_MIN_REST_AMOUNT,
  COUNTER_REST_MODE,
  MECHANICS_CODES,
} from './constants';

/*
 * Механика записи в двух видах:
 * - форма — всё на месте (объекты есть, списки пустые, числа `null`), чтобы
 *   поля редактора привязывались без проверок на отсутствие;
 * - ответ сервера — модель `mechanics` бэкенда (порт core-api), где почти всё
 *   необязательно. Схемы разбора терпимы: битое поле становится пустым, а не
 *   роняет всю механику, и записи, сохранённые до появления механики, получают
 *   пустую форму.
 */

/** Необязательное целое поле формы. */
const formNumber = z.number().int().nullable();

/** Необязательный выбор из списка кодов. */
const formCode = z.string().nullish();

/** Коды, выбранные из списка. */
const formCodes = z.array(z.string());

/** Ссылка на запись справочника: url и название на момент сохранения. */
export const entityRefFormSchema = z.object({
  url: z.string(),
  name: z.string(),
});

export type EntityRefForm = z.infer<typeof entityRefFormSchema>;

const entityRefsFormSchema = z.array(entityRefFormSchema);

/** Выдаваемое заклинание. */
export const grantedSpellFormSchema = entityRefFormSchema.extend({
  requiredLevel: formNumber,
  spellcastingAbility: formCode,
  alwaysPrepared: z.boolean(),
  limitedBySlots: z.boolean(),
});

export type GrantedSpellForm = z.infer<typeof grantedSpellFormSchema>;

/** Повышение характеристик. */
export const abilityBonusFormSchema = z.object({
  abilities: formCodes,
  bonus: formNumber,
  upto: formNumber,
  count: formNumber,
  fromChoiceKey: z.string(),
});

export type AbilityBonusForm = z.infer<typeof abilityBonusFormSchema>;

/** Вариант выбора: значение (код, url или ключ) и подпись. */
export const choiceOptionFormSchema = z.object({
  value: z.string(),
  name: z.string(),
});

export type ChoiceOptionForm = z.infer<typeof choiceOptionFormSchema>;

/** Ступень количества выбора. */
export const choiceScalingFormSchema = z.object({
  level: formNumber,
  count: formNumber,
});

export type ChoiceScalingForm = z.infer<typeof choiceScalingFormSchema>;

/** Ограничение выбора заклинания или заговора. */
export const spellFilterFormSchema = z.object({
  level: formNumber,
  maxLevel: formNumber,
  schools: formCodes,
  classes: entityRefsFormSchema,
  classesFromChoiceKey: z.string(),
  castingTime: formCode,
});

export type SpellFilterForm = z.infer<typeof spellFilterFormSchema>;

/**
 * Выбор игрока. Основной вид и полный набор видов бэкенда в форме — один
 * список: первый вид основной.
 */
export const choiceFormSchema = z.object({
  key: z.string(),
  types: formCodes,
  label: z.string(),
  count: formNumber,
  requiredLevel: formNumber,
  countEqualsProficiencyBonus: z.boolean(),
  options: z.array(choiceOptionFormSchema),
  spellFilter: spellFilterFormSchema,
  onlyIfNotProficient: z.boolean(),
  onlyIfProficient: z.boolean(),
  grants: formCode,
  expertiseIfProficient: z.boolean(),
  rechooseOnLongRest: z.boolean(),
  scaling: z.array(choiceScalingFormSchema),
  showInTable: z.boolean(),
  shortName: z.string(),
  alwaysPrepared: z.boolean(),
});

export type ChoiceForm = z.infer<typeof choiceFormSchema>;

/** Что возвращает отдых. */
export const restRuleFormSchema = z.object({
  mode: z.string(),
  amount: formNumber,
});

export type RestRuleForm = z.infer<typeof restRuleFormSchema>;

/** Ступень максимума ресурса. */
export const counterScalingFormSchema = z.object({
  level: formNumber,
  max: formNumber,
});

export type CounterScalingForm = z.infer<typeof counterScalingFormSchema>;

/**
 * Ресурс со счётчиком. Легаси-откат `recovery` форма переводит в правила
 * короткого и продолжительного отдыха.
 */
export const counterFormSchema = z.object({
  key: z.string(),
  name: z.string(),
  shortName: z.string(),
  max: z.string(),
  scaling: z.array(counterScalingFormSchema),
  min: formNumber,
  showInTable: z.boolean(),
  shortRest: restRuleFormSchema,
  longRest: restRuleFormSchema,
  startsEmpty: z.boolean(),
});

export type CounterForm = z.infer<typeof counterFormSchema>;

/** Чувство с дистанцией. */
export const senseFormSchema = z.object({
  type: formCode,
  range: formNumber,
});

export type SenseForm = z.infer<typeof senseFormSchema>;

/** Защита от типа урона, который выбирает игрок. */
export const defenseChoiceFormSchema = z.object({
  choiceKey: z.string(),
  kind: formCode,
});

export type DefenseChoiceForm = z.infer<typeof defenseChoiceFormSchema>;

/** Постоянные модификаторы листа. */
export const modifiersFormSchema = z.object({
  hitPoints: z.object({
    flat: formNumber,
    perAcquisitionLevel: formNumber,
    perLevelAfterAcquisition: formNumber,
  }),
  speed: z.object({
    walkBonus: formNumber,
    fly: formNumber,
    climb: formNumber,
    swim: formNumber,
    flyEqualsWalk: z.boolean(),
    climbEqualsWalk: z.boolean(),
    swimEqualsWalk: z.boolean(),
  }),
  armorClassBonus: formNumber,
  senses: z.array(senseFormSchema),
  telepathyRange: formNumber,
  damage: z.object({
    resistances: formCodes,
    immunities: formCodes,
    vulnerabilities: formCodes,
    defenseChoices: z.array(defenseChoiceFormSchema),
  }),
  conditionImmunities: formCodes,
  creatureType: formCode,
  initiativeProficiencyBonus: z.boolean(),
  initiativeBonus: formNumber,
});

export type ModifiersForm = z.infer<typeof modifiersFormSchema>;

/** Владения без выбора. */
export const proficienciesFormSchema = z.object({
  weaponCategories: formCodes,
  weapons: entityRefsFormSchema,
  armorCategories: formCodes,
  savingThrows: formCodes,
  skills: formCodes,
  tools: entityRefsFormSchema,
  languages: formCodes,
});

export type ProficienciesForm = z.infer<typeof proficienciesFormSchema>;

/** Список заклинаний класса, выдаваемый целиком. */
export const classSpellListFormSchema = z.object({
  requiredLevel: formNumber,
  classes: entityRefsFormSchema,
  level: formNumber,
  maxLevel: formNumber,
  maxLevelFromSlots: z.boolean(),
  spellcastingAbility: formCode,
  alwaysPrepared: z.boolean(),
});

export type ClassSpellListForm = z.infer<typeof classSpellListFormSchema>;

/** Заклинания без выбора. */
export const spellGrantFormSchema = z.object({
  spells: z.array(grantedSpellFormSchema),
  classLists: z.array(classSpellListFormSchema),
  spellcastingAbility: formCode,
  alwaysPrepared: z.boolean(),
});

export type SpellGrantForm = z.infer<typeof spellGrantFormSchema>;

/** Группа расширения списка заклинаний. */
export const spellListGroupFormSchema = z.object({
  requiredLevel: formNumber,
  count: z.string(),
  spells: entityRefsFormSchema,
});

export type SpellListGroupForm = z.infer<typeof spellListGroupFormSchema>;

/**
 * Расширение списка заклинаний. Прежняя форма бэкенда — заклинания без групп —
 * в форме становится одной группой.
 */
export const spellListFormSchema = z.object({
  groups: z.array(spellListGroupFormSchema),
  requiresSpellcasting: z.boolean(),
});

export type SpellListForm = z.infer<typeof spellListFormSchema>;

/**
 * Механика в форме: все блоки трёх моделей бэкенда. Вид записи решает, какие
 * из них редактор показывает и отправляет.
 */
export const mechanicsFormSchema = z.object({
  abilityBonuses: z.array(abilityBonusFormSchema),
  proficiencies: proficienciesFormSchema,
  choices: z.array(choiceFormSchema),
  modifiers: modifiersFormSchema,
  counters: z.array(counterFormSchema),
  spells: spellGrantFormSchema,
  spellList: spellListFormSchema,
  feats: entityRefsFormSchema,
});

export type MechanicsForm = z.infer<typeof mechanicsFormSchema>;

/**
 * Активные эффекты в форме: их разбирает и нормализует модель эффектов, здесь
 * достаточно убедиться, что это объекты.
 */
export const activeEffectsFormSchema = z.array(
  z.custom<ActiveEffect>(
    (value) => typeof value === 'object' && value !== null,
  ),
);

/** Механика магического предмета в форме. */
export const magicItemMechanicsFormSchema = z.object({
  activation: formCode,
  activeEffects: activeEffectsFormSchema,
  resource: z.object({
    maxCharges: formNumber,
    recharge: z.string(),
    rechargeEvent: formCode,
    cost: formNumber,
  }),
  passive: z.string(),
});

export type MagicItemMechanicsForm = z.infer<
  typeof magicItemMechanicsFormSchema
>;

/** Поля механики и эффектов в схеме формы записи. */
export const mechanicsFieldsFormSchema = {
  mechanics: mechanicsFormSchema,
  activeEffects: activeEffectsFormSchema,
};

/* ---------- Разбор ответа сервера ---------- */

/**
 * Объект ли это: отсутствующий или битый блок разбирается как пустой.
 * @param value - значение из ответа
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Значение блока как объект: всё остальное — пустой объект.
 * @param value - значение из ответа
 */
function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

const loadNumber = z
  .number()
  .int()
  .nullish()
  .catch(null)
  .transform((value) => value ?? null);

const loadText = z
  .string()
  .nullish()
  .catch(null)
  .transform((value) => value ?? '');

const loadFlag = z
  .boolean()
  .nullish()
  .catch(null)
  .transform((value) => value === true);

/**
 * Код из известного набора; неизвестное значение — пусто.
 * @param codes - допустимые коды
 */
function loadCode(codes: ReadonlySet<string>) {
  return z
    .unknown()
    .optional()
    .transform((value) =>
      typeof value === 'string' && codes.has(value) ? value : undefined,
    );
}

/**
 * Список кодов из известного набора: неизвестные и повторы выбрасываются.
 * @param codes - допустимые коды
 */
function loadCodes(codes: ReadonlySet<string>) {
  return z
    .unknown()
    .optional()
    .transform((value) => {
      if (!Array.isArray(value)) {
        return [];
      }

      const known = value.filter(
        (code): code is string => typeof code === 'string' && codes.has(code),
      );

      return [...new Set(known)];
    });
}

/**
 * Список объектов: каждый разбирается отдельно, битый выбрасывается, не
 * задевая соседей.
 * @param schema - схема элемента
 */
function loadList<Schema extends z.ZodType>(schema: Schema) {
  return z
    .unknown()
    .optional()
    .transform((value) => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value.flatMap((item) => {
        if (!isRecord(item)) {
          return [];
        }

        const parsed = schema.safeParse(item);

        return parsed.success ? [parsed.data] : [];
      });
    });
}

/**
 * Вложенный блок: отсутствующий разбирается как пустой объект, и все поля
 * получают значения формы по умолчанию.
 * @param shape - поля блока
 */
function loadBlock<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.preprocess(toRecord, z.object(shape));
}

const entityRefLoadSchema = z.object({
  url: z.string().min(1),
  name: loadText,
});

const entityRefsLoadSchema = loadList(entityRefLoadSchema);

const grantedSpellLoadSchema = entityRefLoadSchema.extend({
  requiredLevel: loadNumber,
  spellcastingAbility: loadCode(MECHANICS_CODES.ability),
  alwaysPrepared: loadFlag,
  limitedBySlots: loadFlag,
});

/** Повышение характеристик из ответа сервера или новое. */
export const abilityBonusLoadSchema = loadBlock({
  abilities: loadCodes(MECHANICS_CODES.ability),
  bonus: loadNumber,
  upto: loadNumber,
  count: loadNumber,
  fromChoiceKey: loadText,
});

/** Вариант выбора из ответа сервера. */
const choiceOptionLoadSchema = z.object({
  value: z.string().min(1),
  name: loadText,
});

const choiceScalingLoadSchema = z.object({
  level: loadNumber,
  count: loadNumber,
});

const spellFilterLoadSchema = loadBlock({
  level: loadNumber,
  maxLevel: loadNumber,
  schools: loadCodes(MECHANICS_CODES.magicSchool),
  classes: entityRefsLoadSchema,
  classesFromChoiceKey: loadText,
  castingTime: loadCode(MECHANICS_CODES.castingUnit),
});

/** Выбор из ответа сервера или новый (по ключу). */
export const choiceLoadSchema = loadBlock({
  key: loadText,
  type: loadCode(MECHANICS_CODES.choiceType),
  types: loadCodes(MECHANICS_CODES.choiceType),
  label: loadText,
  count: loadNumber,
  requiredLevel: loadNumber,
  countEqualsProficiencyBonus: loadFlag,
  options: loadList(choiceOptionLoadSchema),
  spellFilter: spellFilterLoadSchema,
  onlyIfNotProficient: loadFlag,
  onlyIfProficient: loadFlag,
  grants: loadCode(MECHANICS_CODES.choiceGrant),
  expertiseIfProficient: loadFlag,
  rechooseOnLongRest: loadFlag,
  scaling: loadList(choiceScalingLoadSchema),
  showInTable: loadFlag,
  shortName: loadText,
  alwaysPrepared: loadFlag,
}).transform(({ type, types, ...choice }): ChoiceForm => {
  // Основной вид идёт первым, за ним остальные виды набора без повтора
  const merged = type ? [type, ...types] : types;

  return { ...choice, types: [...new Set(merged)] };
});

const restRuleLoadSchema = z
  .object({
    mode: loadCode(MECHANICS_CODES.restMode),
    amount: loadNumber,
  })
  .nullish()
  .catch(null);

const counterScalingLoadSchema = z.object({
  level: loadNumber,
  max: loadNumber,
});

/**
 * Правило отдыха формы.
 * @param mode - режим
 * @param amount - число зарядов: только у режима `AMOUNT`
 */
function toRestRule(mode: string, amount: number | null = null): RestRuleForm {
  return { mode, amount: mode === COUNTER_REST_MODE.amount ? amount : null };
}

/**
 * Правила отдыха по легаси-откату, как их выводит бэкенд: без правил ресурс
 * восстанавливается продолжительным отдыхом.
 * @param recovery - легаси-откат
 */
function getLegacyRestRules(
  recovery: string | undefined,
): Pick<CounterForm, 'shortRest' | 'longRest'> {
  const longRest = toRestRule(COUNTER_REST_MODE.all);

  if (recovery === COUNTER_LEGACY_RECOVERY.shortRest) {
    return { shortRest: toRestRule(COUNTER_REST_MODE.all), longRest };
  }

  if (recovery === COUNTER_LEGACY_RECOVERY.shortRestOne) {
    return {
      shortRest: toRestRule(COUNTER_REST_MODE.amount, COUNTER_MIN_REST_AMOUNT),
      longRest,
    };
  }

  return { shortRest: toRestRule(COUNTER_REST_MODE.none), longRest };
}

/** Ресурс из ответа сервера или новый (по ключу). */
export const counterLoadSchema = loadBlock({
  key: loadText,
  name: loadText,
  shortName: loadText,
  max: z
    .union([z.string(), z.number()])
    .nullish()
    .catch(null)
    .transform((value) =>
      value === null || value === undefined ? '' : String(value),
    ),
  scaling: loadList(counterScalingLoadSchema),
  min: loadNumber,
  showInTable: loadFlag,
  recovery: loadCode(MECHANICS_CODES.legacyRecovery),
  shortRest: restRuleLoadSchema,
  longRest: restRuleLoadSchema,
  startsEmpty: loadFlag,
}).transform(({ recovery, shortRest, longRest, ...counter }): CounterForm => {
  if (!shortRest && !longRest) {
    return { ...counter, ...getLegacyRestRules(recovery) };
  }

  return {
    ...counter,
    shortRest: toRestRule(
      shortRest?.mode ?? COUNTER_REST_MODE.none,
      shortRest?.amount,
    ),
    longRest: toRestRule(
      longRest?.mode ?? COUNTER_REST_MODE.none,
      longRest?.amount,
    ),
  };
});

const senseLoadSchema = z.object({
  type: loadCode(MECHANICS_CODES.sense),
  range: loadNumber,
});

const defenseChoiceLoadSchema = z.object({
  choiceKey: z.string().min(1),
  kind: loadCode(MECHANICS_CODES.defenseKind),
});

const damageLoadSchema = loadBlock({
  resistances: loadCodes(MECHANICS_CODES.damageType),
  immunities: loadCodes(MECHANICS_CODES.damageType),
  vulnerabilities: loadCodes(MECHANICS_CODES.damageType),
  defenseChoices: loadList(defenseChoiceLoadSchema),
  resistanceFromChoiceKey: loadText,
}).transform(
  ({ resistanceFromChoiceKey, ...damage }): ModifiersForm['damage'] => {
    // Легаси-сопротивление от выбора становится строкой защит от выбора
    const isLegacyListed = damage.defenseChoices.some(
      (defense) => defense.choiceKey === resistanceFromChoiceKey,
    );

    if (!resistanceFromChoiceKey || isLegacyListed) {
      return damage;
    }

    return {
      ...damage,
      defenseChoices: [
        ...damage.defenseChoices,
        { choiceKey: resistanceFromChoiceKey, kind: 'RESISTANCE' },
      ],
    };
  },
);

const modifiersLoadSchema = loadBlock({
  hitPoints: loadBlock({
    flat: loadNumber,
    perAcquisitionLevel: loadNumber,
    perLevelAfterAcquisition: loadNumber,
  }),
  speed: loadBlock({
    walkBonus: loadNumber,
    fly: loadNumber,
    climb: loadNumber,
    swim: loadNumber,
    flyEqualsWalk: loadFlag,
    climbEqualsWalk: loadFlag,
    swimEqualsWalk: loadFlag,
  }),
  armorClassBonus: loadNumber,
  senses: loadList(senseLoadSchema),
  telepathyRange: loadNumber,
  damage: damageLoadSchema,
  conditionImmunities: loadCodes(MECHANICS_CODES.condition),
  creatureType: loadCode(MECHANICS_CODES.creatureType),
  initiativeProficiencyBonus: loadFlag,
  initiativeBonus: loadNumber,
});

const proficienciesLoadSchema = loadBlock({
  weaponCategories: loadCodes(MECHANICS_CODES.weaponCategory),
  weapons: entityRefsLoadSchema,
  armorCategories: loadCodes(MECHANICS_CODES.armorCategory),
  savingThrows: loadCodes(MECHANICS_CODES.ability),
  skills: loadCodes(MECHANICS_CODES.skill),
  tools: entityRefsLoadSchema,
  languages: loadCodes(MECHANICS_CODES.language),
});

/** Список класса целиком из ответа сервера или новый. */
export const classSpellListLoadSchema = loadBlock({
  requiredLevel: loadNumber,
  classes: entityRefsLoadSchema,
  level: loadNumber,
  maxLevel: loadNumber,
  maxLevelFromSlots: loadFlag,
  spellcastingAbility: loadCode(MECHANICS_CODES.ability),
  alwaysPrepared: loadFlag,
});

const spellGrantLoadSchema = loadBlock({
  spells: loadList(grantedSpellLoadSchema),
  classLists: loadList(classSpellListLoadSchema),
  spellcastingAbility: loadCode(MECHANICS_CODES.ability),
  alwaysPrepared: loadFlag,
});

/** Группа расширения списка из ответа сервера или новая. */
export const spellListGroupLoadSchema = loadBlock({
  requiredLevel: loadNumber,
  count: loadText,
  spells: entityRefsLoadSchema,
});

const spellListLoadSchema = loadBlock({
  groups: loadList(spellListGroupLoadSchema),
  spells: entityRefsLoadSchema,
  requiresSpellcasting: loadFlag,
}).transform(({ groups, spells, requiresSpellcasting }): SpellListForm => {
  // Прежняя форма — заклинания без групп — читается одной группой, как её
  // разворачивает бэкенд
  if (groups.length || !spells.length) {
    return { groups, requiresSpellcasting };
  }

  return {
    groups: [{ requiredLevel: null, count: '', spells }],
    requiresSpellcasting,
  };
});

const mechanicsLoadSchema = loadBlock({
  abilityBonuses: loadList(abilityBonusLoadSchema),
  proficiencies: proficienciesLoadSchema,
  choices: loadList(choiceLoadSchema),
  modifiers: modifiersLoadSchema,
  counters: loadList(counterLoadSchema),
  spells: spellGrantLoadSchema,
  spellList: spellListLoadSchema,
  feats: entityRefsLoadSchema,
});

/**
 * Механика из ответа сервера для формы. Отсутствующая или битая — пустая
 * форма: так открываются записи, сохранённые до появления механики.
 * @param input - значение поля `mechanics` из ответа
 */
export function parseMechanicsForm(input: unknown): MechanicsForm {
  return mechanicsLoadSchema.parse(input);
}

const magicItemMechanicsLoadSchema = loadBlock({
  activation: loadCode(MECHANICS_CODES.magicItemActivation),
  activeEffects: z.unknown().optional(),
  resource: loadBlock({
    maxCharges: loadNumber,
    recharge: loadText,
    rechargeEvent: loadCode(MECHANICS_CODES.rechargeEvent),
    cost: loadNumber,
  }),
  passive: loadText,
});

/**
 * Механика магического предмета из ответа сервера, без эффектов: их
 * разбирает модель эффектов.
 * @param input - значение поля `mechanics` из ответа
 */
export function parseMagicItemMechanicsBase(
  input: unknown,
): Omit<MagicItemMechanicsForm, 'activeEffects'> & { activeEffects?: unknown } {
  return magicItemMechanicsLoadSchema.parse(input);
}
