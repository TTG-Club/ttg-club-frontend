import { z } from 'zod';

import { normalizeLoadedActiveEffects } from '~active-effects/model';
import { entryNameSchema } from '~section/model';

/*
 * Механика записей справочника для листа — блоки `mechanics` и
 * `activeEffects`, которые бэкенд старого сайта отдаёт в карточках классов,
 * архетипов, рас, предысторий, черт, особенностей классов и магических
 * предметов. Поля и названия те же, что у модели core-api, перечисления —
 * старого сайта (оружие `WAR_MELE`, огонь `FAIR`).
 *
 * Каждое поле разбирается терпимо: незнакомое значение превращается в `null`
 * или пустой список, а не роняет всю карточку. У большей части справочника
 * механики пока нет вовсе (`mechanics: null`) — лист тогда берёт прежние
 * текстовые поля.
 */

/** Список строк; мусор — пустой список. */
const stringListSchema = z.array(z.string()).nullish().catch(null);

/** Целое число; мусор — null. */
const nullableNumberSchema = z.number().nullish().catch(null);

/** Флаг; мусор — null. */
const nullableBooleanSchema = z.boolean().nullish().catch(null);

/** Строка; мусор — null. */
const nullableStringSchema = z.string().nullish().catch(null);

/** Ссылка на запись справочника со снимком названия. */
export const entityRefSchema = z.object({
  url: z.string().catch(''),
  name: z.string().catch(''),
});

export type EntityRef = z.infer<typeof entityRefSchema>;

const entityRefListSchema = z.array(entityRefSchema).nullish().catch(null);

/** Владения, которые запись выдаёт без выбора. */
export const mechanicsProficienciesSchema = z
  .object({
    weaponCategories: stringListSchema,
    weapons: entityRefListSchema,
    armorCategories: stringListSchema,
    savingThrows: stringListSchema,
    skills: stringListSchema,
    tools: entityRefListSchema,
    languages: stringListSchema,
  })
  .nullish()
  .catch(null);

export type MechanicsProficiencies = z.infer<
  typeof mechanicsProficienciesSchema
>;

/** Ограничение выбора заклинания. */
export const mechanicsSpellFilterSchema = z
  .object({
    level: nullableNumberSchema,
    maxLevel: nullableNumberSchema,
    schools: stringListSchema,
    classes: entityRefListSchema,
    classesFromChoiceKey: nullableStringSchema,
  })
  .nullish()
  .catch(null);

export type MechanicsSpellFilter = z.infer<typeof mechanicsSpellFilterSchema>;

/** Выбор, который запись предлагает игроку. */
export const mechanicsChoiceSchema = z.object({
  key: z.string().catch(''),
  type: nullableStringSchema,
  types: stringListSchema,
  label: nullableStringSchema,
  count: nullableNumberSchema,
  requiredLevel: nullableNumberSchema,
  countEqualsProficiencyBonus: nullableBooleanSchema,
  options: z
    .array(
      z.object({
        value: z.string().catch(''),
        name: nullableStringSchema,
      }),
    )
    .nullish()
    .catch(null),
  spellFilter: mechanicsSpellFilterSchema,
  onlyIfNotProficient: nullableBooleanSchema,
  onlyIfProficient: nullableBooleanSchema,
  grants: nullableStringSchema,
  expertiseIfProficient: nullableBooleanSchema,
  scaling: z
    .array(z.object({ level: z.number(), count: z.number() }))
    .nullish()
    .catch(null),
  alwaysPrepared: nullableBooleanSchema,
});

export type MechanicsChoice = z.infer<typeof mechanicsChoiceSchema>;

/** Правило восстановления ресурса на отдыхе. */
const counterRestRuleSchema = z
  .object({
    mode: nullableStringSchema,
    amount: nullableNumberSchema,
  })
  .nullish()
  .catch(null);

/** Ресурс со счётчиком: максимум формулой или ступенями. */
export const mechanicsCounterSchema = z.object({
  key: z.string().catch(''),
  name: z.string().catch(''),
  shortName: nullableStringSchema,
  max: nullableStringSchema,
  scaling: z
    .array(z.object({ level: z.number(), max: z.number() }))
    .nullish()
    .catch(null),
  min: nullableNumberSchema,
  recovery: nullableStringSchema,
  shortRest: counterRestRuleSchema,
  longRest: counterRestRuleSchema,
  startsEmpty: nullableBooleanSchema,
});

export type MechanicsCounter = z.infer<typeof mechanicsCounterSchema>;

/** Повышение характеристик: фиксированное либо на выбор из списка. */
export const mechanicsAbilityBonusSchema = z.object({
  abilities: stringListSchema,
  bonus: nullableNumberSchema,
  upto: nullableNumberSchema,
  count: nullableNumberSchema,
  fromChoiceKey: nullableStringSchema,
});

export type MechanicsAbilityBonus = z.infer<typeof mechanicsAbilityBonusSchema>;

/** Защиты от урона, выданные записью. */
const damageAffinitySchema = z
  .object({
    resistances: stringListSchema,
    immunities: stringListSchema,
    vulnerabilities: stringListSchema,
    defenseChoices: z
      .array(
        z.object({
          choiceKey: z.string().catch(''),
          kind: z.string().catch(''),
        }),
      )
      .nullish()
      .catch(null),
    resistanceFromChoiceKey: nullableStringSchema,
  })
  .nullish()
  .catch(null);

/** Постоянные модификаторы листа. */
export const mechanicsModifiersSchema = z
  .object({
    hitPoints: z
      .object({
        flat: nullableNumberSchema,
        perAcquisitionLevel: nullableNumberSchema,
        perLevelAfterAcquisition: nullableNumberSchema,
      })
      .nullish()
      .catch(null),
    speed: z
      .object({
        walkBonus: nullableNumberSchema,
        fly: nullableNumberSchema,
        climb: nullableNumberSchema,
        swim: nullableNumberSchema,
        flyEqualsWalk: nullableBooleanSchema,
        climbEqualsWalk: nullableBooleanSchema,
        swimEqualsWalk: nullableBooleanSchema,
      })
      .nullish()
      .catch(null),
    armorClassBonus: nullableNumberSchema,
    senses: z
      .array(
        z.object({
          type: z.string().catch(''),
          range: z.number().catch(0),
        }),
      )
      .nullish()
      .catch(null),
    telepathyRange: nullableNumberSchema,
    damage: damageAffinitySchema,
    conditionImmunities: stringListSchema,
    initiativeProficiencyBonus: nullableBooleanSchema,
    initiativeBonus: nullableNumberSchema,
  })
  .nullish()
  .catch(null);

export type MechanicsModifiers = z.infer<typeof mechanicsModifiersSchema>;

/** Заклинание, выданное без выбора. */
const grantedSpellRefSchema = entityRefSchema.extend({
  requiredLevel: nullableNumberSchema,
  spellcastingAbility: nullableStringSchema,
  alwaysPrepared: nullableBooleanSchema,
});

/** Заклинания, которые запись выдаёт без выбора. */
const mechanicsSpellGrantSchema = z
  .object({
    spells: z.array(grantedSpellRefSchema).nullish().catch(null),
    spellcastingAbility: nullableStringSchema,
    alwaysPrepared: nullableBooleanSchema,
  })
  .nullish()
  .catch(null);

/** Расширение списка заклинаний класса. */
const mechanicsSpellListSchema = z
  .object({
    groups: z
      .array(
        z.object({
          requiredLevel: nullableNumberSchema,
          count: nullableStringSchema,
          spells: entityRefListSchema,
        }),
      )
      .nullish()
      .catch(null),
    spells: entityRefListSchema,
    requiresSpellcasting: nullableBooleanSchema,
  })
  .nullish()
  .catch(null);

/**
 * Механика записи: общее надмножество механики класса, расы и черты. Поля,
 * которых у вида записи нет, приходят пустыми.
 */
export const catalogMechanicsSchema = z
  .object({
    modifiers: mechanicsModifiersSchema,
    proficiencies: mechanicsProficienciesSchema,
    choices: z.array(mechanicsChoiceSchema).nullish().catch(null),
    spells: mechanicsSpellGrantSchema,
    spellList: mechanicsSpellListSchema,
    counters: z.array(mechanicsCounterSchema).nullish().catch(null),
    feats: entityRefListSchema,
    abilityBonuses: z.array(mechanicsAbilityBonusSchema).nullish().catch(null),
  })
  .nullish()
  .catch(null);

export type CatalogMechanics = z.infer<typeof catalogMechanicsSchema>;

/** Активные эффекты записи: битые элементы отбрасываются по одному. */
export const catalogEffectsSchema = z
  .array(z.unknown())
  .catch([])
  .transform((value) => normalizeLoadedActiveEffects(value));

/** Заряды магического предмета. */
const magicItemResourceSchema = z
  .object({
    maxCharges: nullableNumberSchema,
    recharge: nullableStringSchema,
    rechargeEvent: nullableStringSchema,
    cost: nullableNumberSchema,
  })
  .nullish()
  .catch(null);

/** Механика магического предмета: эффекты живут внутри неё. */
export const magicItemMechanicsSchema = z
  .object({
    activation: nullableStringSchema,
    activeEffects: catalogEffectsSchema,
    resource: magicItemResourceSchema,
    passive: nullableStringSchema,
  })
  .nullish()
  .catch(null);

export type MagicItemMechanics = z.infer<typeof magicItemMechanicsSchema>;

/* --- Карточки справочника с механикой ---------------------------------- */

/** Общие поля носителя механики: блок механики и эффекты. */
const mechanicsCarrierShape = {
  mechanics: catalogMechanicsSchema,
  activeEffects: catalogEffectsSchema,
};

/** Умение класса или архетипа в карточке класса. */
export const mechanicsClassFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  optional: z.boolean().nullish(),
  archetypeFeature: z.boolean().nullish(),
  archetypeRoot: z.boolean().nullish(),
  ...mechanicsCarrierShape,
});

export type MechanicsClassFeature = z.infer<typeof mechanicsClassFeatureSchema>;

/**
 * Механика карточки класса или архетипа: верхний блок, умения и архетип в
 * `traits`. Разбирается отдельно от схемы раздела, чтобы битая механика не
 * роняла таблицу класса.
 */
export const classMechanicsDetailSchema = z.object({
  id: z.number().nullish().catch(null),
  ...mechanicsCarrierShape,
  traits: z
    .object({
      features: z
        .array(z.unknown())
        .nullish()
        .catch(null)
        .transform((values) =>
          (values ?? []).flatMap((value) => {
            const parsed = mechanicsClassFeatureSchema.safeParse(value);

            return parsed.success ? [parsed.data] : [];
          }),
        ),
      archetype: mechanicsClassFeatureSchema.nullish().catch(null),
    })
    .nullish()
    .catch(null),
});

export type ClassMechanicsDetail = z.infer<typeof classMechanicsDetailSchema>;

/** Особенность расы с механикой. */
const raceFeatureMechanicsSchema = z.object({
  name: z.string().catch(''),
  ...mechanicsCarrierShape,
});

/** Особенности расы списком: битые элементы отбрасываются. */
const raceFeatureListSchema = z
  .array(z.unknown())
  .nullish()
  .catch(null)
  .transform((values) =>
    (values ?? []).flatMap((value) => {
      const parsed = raceFeatureMechanicsSchema.safeParse(value);

      return parsed.success ? [parsed.data] : [];
    }),
  );

/** Механика карточки расы или разновидности. */
export const raceMechanicsDetailSchema = z.object({
  name: entryNameSchema,
  ...mechanicsCarrierShape,
  abilities: z
    .array(
      z.object({
        key: z.string().nullish(),
        value: z.number().nullish(),
      }),
    )
    .nullish()
    .catch(null),
  speed: z
    .array(z.object({ name: z.string().nullish(), value: z.number() }))
    .nullish()
    .catch(null),
  darkvision: nullableNumberSchema,
  fly: nullableNumberSchema,
  climb: nullableNumberSchema,
  swim: nullableNumberSchema,
  features: raceFeatureListSchema,
  skills: raceFeatureListSchema,
});

export type RaceMechanicsDetail = z.infer<typeof raceMechanicsDetailSchema>;

/** Механика карточки предыстории, черты или особенности класса. */
export const featMechanicsDetailSchema = z.object({
  name: entryNameSchema,
  ...mechanicsCarrierShape,
  skills: stringListSchema,
  languages: stringListSchema,
});

export type FeatMechanicsDetail = z.infer<typeof featMechanicsDetailSchema>;

/** Механика карточки магического предмета: заряды, эффекты и настройка. */
export const magicItemMechanicsDetailSchema = z.object({
  customization: nullableBooleanSchema,
  detailCustamization: stringListSchema,
  charge: nullableNumberSchema,
  bonus: nullableNumberSchema,
  mechanics: magicItemMechanicsSchema,
});

export type MagicItemMechanicsDetail = z.infer<
  typeof magicItemMechanicsDetailSchema
>;
