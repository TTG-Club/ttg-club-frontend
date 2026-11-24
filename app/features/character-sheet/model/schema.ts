import { range } from 'es-toolkit';
import { z } from 'zod';

import { MAX_EXHAUSTION_LEVEL } from '~active-effects/model';
import { classDetailSchema, spellDamageSchema } from '~character/model';
import { weaponDetailSchema } from '~inventory/model';

import {
  ABILITY_KEYS,
  ABILITY_SCORE,
  ARMOR_CATEGORIES,
  ARMOR_DEX_LIMIT_MAX,
  CHARACTER_LEVEL,
  CUSTOM_BONUS_KINDS,
  DEATH_SAVES_MAX,
  DEFAULT_ARMOR_CLASS_ABILITIES,
  FEATURE_ORIGINS,
  LEGACY_PROFICIENCY_SEPARATOR,
  OWN_SENSE_KEYS,
  RESOURCE_RESETS,
  SHEET_AVATAR_URL_PREFIX,
  SHEET_SCHEMA_VERSION,
  SHEET_SIZE_KEYS,
  SKILL_KEYS,
  SOURCE_KINDS,
  SPEED_KEYS,
  SPEED_UNITS,
  SPELL_LEVEL,
  SPELL_SLOT_LEVELS,
  WEAPON_PROFICIENCY_NO,
  WEAPON_PROFICIENCY_OVERRIDES,
} from './constants';
import { catalogEffectsSchema, catalogMechanicsSchema } from './mechanics';

/*
 * Документ листа. Каждое поле с запасным значением (`catch`): лист, сохранённый
 * старой версией формата или испорченный вручную, открывается с пустыми
 * значениями на месте непонятных полей, а не падает целиком.
 */

export const abilityKeySchema = z.enum(ABILITY_KEYS);

export const skillKeySchema = z.enum(SKILL_KEYS);

const integerSchema = z.number().int();

/** Неотрицательное целое; мусор — 0. */
const countSchema = integerSchema.min(0).catch(0);

/** Строка; мусор — пустая строка. */
const textSchema = z.string().catch('');

/** Абзацы старого текста: блоки разделены пустой строкой. */
const PARAGRAPH_SEPARATOR = /\n\s*\n/;

/**
 * Текст в разметке core-api — массив блоков. Старые листы хранили простую
 * строку: она читается абзацами, по блоку на абзац.
 */
const markupTextSchema = z
  .union([z.string(), z.array(z.string())])
  .catch([])
  .transform((value) =>
    (typeof value === 'string' ? value.split(PARAGRAPH_SEPARATOR) : value)
      .map((block) => block.trim())
      .filter(Boolean),
  );

/** Ссылка на запись справочника; `url` нет у своих записей. */
export const catalogRefSchema = z.object({
  name: z.string(),
  url: z.string().nullable().catch(null),
});

export type CatalogRef = z.infer<typeof catalogRefSchema>;

export const sheetClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  archetypeName: z.string().nullable().catch(null),
  archetypeUrl: z.string().nullable().catch(null),
  level: integerSchema
    .min(CHARACTER_LEVEL.min)
    .max(CHARACTER_LEVEL.max)
    .catch(CHARACTER_LEVEL.min),
  hitDie: integerSchema.min(1).catch(8),
  /**
   * Прирост максимума хитов за каждый уровень класса: индекс — уровень минус
   * один. По нему снятие уровня возвращает ровно свой прирост; у листов до
   * мастера повышения список пуст, и снятие хитов не трогает.
   */
  hitPointGains: z.array(integerSchema).catch([]),
  /** Своя заклинательная характеристика класса; null — по справочнику. */
  spellcastingAbility: abilityKeySchema.nullable().catch(null),
});

export type SheetClass = z.infer<typeof sheetClassSchema>;

const abilityScoreSchema = integerSchema
  .min(ABILITY_SCORE.min)
  .max(ABILITY_SCORE.max)
  .catch(ABILITY_SCORE.default);

export const abilityScoresSchema = z.object({
  STRENGTH: abilityScoreSchema,
  DEXTERITY: abilityScoreSchema,
  CONSTITUTION: abilityScoreSchema,
  INTELLIGENCE: abilityScoreSchema,
  WISDOM: abilityScoreSchema,
  CHARISMA: abilityScoreSchema,
});

export type AbilityScores = z.infer<typeof abilityScoresSchema>;

/** Бонусы расы, прибавленные к характеристикам: снимаются при смене расы. */
const abilityBonusesSchema = z
  .partialRecord(abilityKeySchema, integerSchema)
  .catch({});

export type AbilityBonuses = z.infer<typeof abilityBonusesSchema>;

export const skillProficiencySchema = z.enum([
  'none',
  'half',
  'proficient',
  'expertise',
]);

export type SkillProficiency = z.infer<typeof skillProficiencySchema>;

const skillProficienciesSchema = z
  .partialRecord(skillKeySchema, skillProficiencySchema)
  .catch({});

export type SkillProficiencies = z.infer<typeof skillProficienciesSchema>;

const healthSchema = z.object({
  max: countSchema,
  current: countSchema,
  temporary: countSchema,
});

export type SheetHealth = z.infer<typeof healthSchema>;

const deathSavesSchema = z.object({
  successes: integerSchema.min(0).max(DEATH_SAVES_MAX).catch(0),
  failures: integerSchema.min(0).max(DEATH_SAVES_MAX).catch(0),
});

export type DeathSaves = z.infer<typeof deathSavesSchema>;

/** Потраченные кости хитов по размеру кости: `{ "10": 2 }`. */
const hitDiceUsedSchema = z.record(z.string(), countSchema).catch({});

/**
 * Дополнительные кости хитов не от уровней класса (черта, предмет, дар):
 * тратятся и возвращаются вместе с костями того же размера.
 */
export const extraHitDieSchema = z.object({
  id: z.string(),
  name: textSchema,
  die: integerSchema.min(1).catch(8),
  count: integerSchema.min(1).catch(1),
});

export type ExtraHitDie = z.infer<typeof extraHitDieSchema>;

/**
 * Старый лист хранил владения группы одной строкой: она делится на записи
 * по запятым, точкам с запятой и переносам строк.
 * @param value - сохранённое значение
 */
function splitLegacyProficiencies(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .split(LEGACY_PROFICIENCY_SEPARATOR)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Список названий владений; старая строка делится на записи. */
const proficiencyNamesSchema = z.preprocess(
  splitLegacyProficiencies,
  lenientList(z.string().trim().min(1)),
);

/** Своё владение инструментом: название и запись справочника, если есть. */
export const sheetToolProficiencySchema = z.preprocess(
  (value) => (typeof value === 'string' ? { name: value } : value),
  z.object({
    name: z.string().trim().min(1),
    url: z.string().nullable().catch(null),
  }),
);

export type SheetToolProficiency = z.infer<typeof sheetToolProficiencySchema>;

const proficienciesSchema = z.object({
  armor: proficiencyNamesSchema,
  weapons: proficiencyNamesSchema,
  tools: z.preprocess(
    splitLegacyProficiencies,
    lenientList(sheetToolProficiencySchema),
  ),
  languages: proficiencyNamesSchema,
});

export type SheetProficiencies = z.infer<typeof proficienciesSchema>;

/** Группа владений листа: доспехи, оружие, инструменты или языки. */
export type SheetProficiencyGroup = keyof SheetProficiencies;

const currencySchema = z.object({
  cp: countSchema,
  sp: countSchema,
  ep: countSchema,
  gp: countSchema,
  pp: countSchema,
});

export type SheetCurrency = z.infer<typeof currencySchema>;

/** Своя валюта: жетоны гильдии, трофеи, местные деньги. */
export const customCurrencySchema = z.object({
  id: z.string(),
  name: textSchema,
  short: textSchema,
  amount: countSchema,
});

export type CustomCurrency = z.infer<typeof customCurrencySchema>;

/** Грузоподъёмность: размер для расчёта, своё значение, бонус и вариант «Нагрузка». */
const carryingSchema = z.object({
  /** Размер для расчёта; null — как у персонажа. */
  size: z.enum(SHEET_SIZE_KEYS).nullable().catch(null),
  /** Своё значение, фунты; null — по Силе и размеру. */
  custom: integerSchema.min(0).nullable().catch(null),
  bonus: integerSchema.catch(0),
  /** Вариант правил «Нагрузка» (PHB): ступени нагрузки снижают скорость. */
  encumbrance: z.boolean().catch(false),
});

export type SheetCarrying = z.infer<typeof carryingSchema>;

/** Предел настройки: правило «три», от характеристики или своё число. */
const attunementSchema = z.object({
  /** Своё число; null — по правилу или характеристике. */
  custom: integerSchema.min(0).nullable().catch(null),
  /** Предел равен модификатору характеристики; null — правило «три». */
  ability: abilityKeySchema.nullable().catch(null),
  bonus: integerSchema.catch(0),
});

export type SheetAttunement = z.infer<typeof attunementSchema>;

export const armorCategorySchema = z.enum(ARMOR_CATEGORIES);

export type ArmorCategory = z.infer<typeof armorCategorySchema>;

/**
 * Старое оружие хранило флаг `isProficient`: снятый флаг становится ручным
 * «не владею», остальное считается по владениям листа.
 * @param value - сохранённое оружие
 */
function migrateWeaponProficiency(value: unknown): unknown {
  if (
    !value
    || typeof value !== 'object'
    || !('isProficient' in value)
    || 'proficiency' in value
  ) {
    return value;
  }

  const { isProficient, ...rest } = value;

  return {
    ...rest,
    proficiency: isProficient === false ? WEAPON_PROFICIENCY_NO : null,
  };
}

export const sheetWeaponSchema = z.object({
  /** Кость урона в записи справочника: «1к8». */
  damage: textSchema,
  damageType: textSchema,
  isRanged: z.boolean().catch(false),
  isFinesse: z.boolean().catch(false),
  /**
   * Владение оружием вручную: `yes`/`no` — своё решение, null — по владениям
   * листа (группа «Простое/Воинское оружие» или само оружие в списке).
   */
  proficiency: z.preprocess(
    (value) => value ?? null,
    z.enum(WEAPON_PROFICIENCY_OVERRIDES).nullable().catch(null),
  ),
  /** Магический бонус к атаке и урону. */
  bonus: integerSchema.catch(0),
  /** Воинское оружие; иначе простое. */
  isMartial: z.boolean().catch(false),
  /** Свойство «Тяжёлое»: Маленькие существа атакуют с помехой. */
  isHeavy: z.boolean().catch(false),
  /** Кость урона при хвате двумя руками (свойство «Универсальное»): «1к10». */
  versatileDamage: textSchema,
  /** Дополнительный урон магического оружия: «1к6». */
  extraDamage: textSchema,
  extraDamageType: textSchema,
});

export type SheetWeapon = z.infer<typeof sheetWeaponSchema>;

export const sheetArmorSchema = z.object({
  category: armorCategorySchema,
  baseArmorClass: integerSchema.min(0).catch(0),
  strengthRequirement: integerSchema.min(0).nullable().catch(null),
  stealthDisadvantage: z.boolean().catch(false),
  /** Магический бонус к КД. */
  bonus: integerSchema.catch(0),
});

export type SheetArmor = z.infer<typeof sheetArmorSchema>;

/** Заряды магического предмета и их восстановление. */
export const sheetChargesSchema = z.object({
  max: countSchema,
  used: countSchema,
  /** Формула восстановления: «1к6+4» или «все». */
  recharge: textSchema,
  /** Когда заряды восстанавливаются (MagicItemRechargeEvent); '' — вручную. */
  rechargeEvent: textSchema,
});

export type SheetCharges = z.infer<typeof sheetChargesSchema>;

export const sheetItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  quantity: countSchema,
  /** Вес одной штуки в фунтах. */
  weight: z.number().min(0).catch(0),
  isEquipped: z.boolean().catch(false),
  notes: textSchema,
  weapon: z
    .preprocess(migrateWeaponProficiency, sheetWeaponSchema.nullable())
    .catch(null),
  armor: sheetArmorSchema.nullable().catch(null),
  /** Предмет требует настройки, чтобы его механика работала. */
  requiresAttunement: z.boolean().catch(false),
  isAttuned: z.boolean().catch(false),
  /** Заряды магического предмета; null — зарядов нет. */
  charges: sheetChargesSchema.nullable().catch(null),
  /** Активные эффекты предмета — снимок записи справочника. */
  activeEffects: catalogEffectsSchema,
  /** Пассивное свойство без расчётов: «Вы можете дышать под водой». */
  passive: textSchema,
  /** Стоимость текстом, как в справочнике: «15 зм». */
  cost: textSchema,
  /** Описание своего предмета. */
  description: textSchema,
  /** Предмет включают и выключают (сапоги, плащ): механика работает включённым. */
  activatable: z.boolean().catch(false),
  isActive: z.boolean().catch(false),
  /** Универсальное оружие держат двумя руками: урон по второй кости. */
  useTwoHands: z.boolean().catch(false),
});

export type SheetItem = z.infer<typeof sheetItemSchema>;

export const sheetSpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().catch(null),
  level: integerSchema.min(SPELL_LEVEL.min).max(SPELL_LEVEL.max).catch(0),
  school: textSchema,
  isPrepared: z.boolean().catch(false),
  isRitual: z.boolean().catch(false),
  isConcentration: z.boolean().catch(false),
  notes: textSchema,
  /** Источник механики, который выдал заклинание; null — своё. */
  sourceId: z.string().nullable().catch(null),
  /** Заклинание всегда подготовлено и не занимает места в пределе. */
  alwaysPrepared: z.boolean().catch(false),
  /** Своя заклинательная характеристика; null — как у класса. */
  spellcastingAbility: abilityKeySchema.nullable().catch(null),
  /* Характеристики и описание своего заклинания; у справочного пусто. */
  castingTime: textSchema,
  range: textSchema,
  components: textSchema,
  duration: textSchema,
  description: textSchema,
  /** Урон своего заклинания; у справочного урон берётся из справочника. */
  damage: spellDamageSchema.nullable().catch(null),
});

export type SheetSpell = z.infer<typeof sheetSpellSchema>;

export const sheetFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Название источника: раса, класс, предыстория или черта. */
  source: textSchema,
  /** Вид источника для бейджа и отбора. */
  origin: z.enum(FEATURE_ORIGINS).catch('custom'),
  /** Что выбрано в особенности: «Боевой стиль: защита». */
  choice: textSchema,
  description: markupTextSchema,
});

export type SheetFeature = z.infer<typeof sheetFeatureSchema>;

export const resourceResetSchema = z.enum(RESOURCE_RESETS);

export type ResourceReset = z.infer<typeof resourceResetSchema>;

export const sheetResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  max: countSchema,
  used: countSchema,
  reset: resourceResetSchema.catch('LONG'),
  /** Источник механики, который выдал ресурс; null — свой. */
  sourceId: z.string().nullable().catch(null),
  /** Ключ счётчика внутри источника. */
  counterKey: z.string().nullable().catch(null),
  /** Формула максимума (`@prof`, `@mod.cha`); null — максимум числом. */
  formula: z.string().nullable().catch(null),
  /** Ступени максимума по уровням. */
  scaling: z.array(z.object({ level: z.number(), max: z.number() })).catch([]),
  /** Нижняя граница максимума по формуле. */
  minimum: countSchema,
  /** Класс листа, по уровню которого считается `@classLevel`. */
  classId: z.string().nullable().catch(null),
});

export type SheetResource = z.infer<typeof sheetResourceSchema>;

export const sheetNoteSchema = z.object({
  id: z.string(),
  title: textSchema,
  text: markupTextSchema,
});

export type SheetNote = z.infer<typeof sheetNoteSchema>;

const personalitySchema = z.object({
  traits: markupTextSchema,
  ideals: markupTextSchema,
  bonds: markupTextSchema,
  flaws: markupTextSchema,
  /** Описание внешности и характера. */
  appearance: markupTextSchema,
  backstory: markupTextSchema,
  /* Краткие приметы. */
  age: textSchema,
  height: textSchema,
  weight: textSchema,
  eyes: textSchema,
  hair: textSchema,
  skin: textSchema,
});

export type SheetPersonality = z.infer<typeof personalitySchema>;

/** Список, из которого выброшены испорченные элементы. */
function lenientList<Element extends z.ZodType>(
  element: Element,
): z.ZodType<Array<z.infer<Element>>> {
  return z
    .array(z.unknown())
    .catch([])
    .transform((values) =>
      values.flatMap((value) => {
        const parsed = element.safeParse(value);

        return parsed.success ? [parsed.data] : [];
      }),
    );
}

export const sourceKindSchema = z.enum(SOURCE_KINDS);

/** Дополнительный бонус навыка: своё число или величина, которую лист считает сам. */
export const customBonusSchema = z.object({
  id: z.string(),
  kind: z.enum(CUSTOM_BONUS_KINDS).catch('flat'),
  ability: abilityKeySchema.catch('STRENGTH'),
  /** Класс листа для бонуса «уровень класса»; пусто — класс не выбран. */
  classId: z.string().catch(''),
  value: integerSchema.catch(0),
  label: textSchema,
});

export type CustomBonus = z.infer<typeof customBonusSchema>;

/** Свой навык, которого нет в правилах. */
export const customSkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ability: abilityKeySchema.catch('INTELLIGENCE'),
  proficiency: skillProficiencySchema.catch('none'),
  bonuses: lenientList(customBonusSchema),
});

export type CustomSkill = z.infer<typeof customSkillSchema>;

export type SourceKind = z.infer<typeof sourceKindSchema>;

/**
 * Источник механики на листе: класс, подкласс, умение, раса, предыстория,
 * черта. Хранит снимок механики и эффектов записи справочника, ответы игрока
 * на её выборы и применённые прибавки к характеристикам — по нему лист
 * считает защиты, скорости и эффекты без запроса к справочнику, а снятие
 * источника забирает ровно его выдачи.
 */
export const sheetSourceSchema = z.object({
  id: z.string(),
  kind: sourceKindSchema,
  name: z.string(),
  url: z.string().nullable().catch(null),
  /** Источник, выбор которого дал этот (черта умения, вариант умения). */
  parentId: z.string().nullable().catch(null),
  /** Ключ выбора родителя, ответом на который источник появился. */
  choiceKey: z.string().nullable().catch(null),
  /** Класс листа, которому принадлежит источник. */
  classId: z.string().nullable().catch(null),
  /** Уровень класса, на котором источник получен; null — не по уровню. */
  level: integerSchema.min(0).nullable().catch(null),
  /** Уровень персонажа в момент получения: от него считаются хиты черты. */
  characterLevel: integerSchema.min(0).nullable().catch(null),
  mechanics: catalogMechanicsSchema,
  activeEffects: catalogEffectsSchema,
  /** Эффекты источника, выключенные игроком. */
  disabledEffects: lenientList(z.string()),
  /** Ответы на выборы по ключу выбора. */
  choiceAnswers: z.record(z.string(), z.array(z.string())).catch({}),
  /** Прибавки к характеристикам, которые источник применил к листу. */
  abilityIncreases: abilityBonusesSchema,
});

export type SheetSource = z.infer<typeof sheetSourceSchema>;

/**
 * Запись журнала выдач: что именно выдал один источник. Снятие источника
 * забирает ровно своё и не трогает выданного другими или отмеченного вручную.
 */
export const proficiencyGrantSchema = z.object({
  sourceId: z.string(),
  skills: lenientList(skillKeySchema),
  expertise: lenientList(skillKeySchema),
  savingThrows: lenientList(abilityKeySchema),
  armor: lenientList(z.string()),
  weapons: lenientList(z.string()),
  tools: lenientList(z.string()),
  languages: lenientList(z.string()),
});

export type ProficiencyGrant = z.infer<typeof proficiencyGrantSchema>;

/** Скорости, кроме ходьбы, заданные игроком вручную. */
const extraSpeedsSchema = z.object({
  fly: countSchema,
  climb: countSchema,
  swim: countSchema,
  burrow: countSchema,
});

export type ExtraSpeeds = z.infer<typeof extraSpeedsSchema>;

export const sheetDocumentSchema = z.object({
  schemaVersion: z.literal(SHEET_SCHEMA_VERSION).catch(SHEET_SCHEMA_VERSION),
  /**
   * Портрет персонажа — адрес файла листа в хранилище сайта; null — портрета
   * нет. Чужие адреса отбрасываются: картинку с другого сайта лист не грузит.
   */
  avatarUrl: z
    .string()
    .startsWith(SHEET_AVATAR_URL_PREFIX)
    .nullable()
    .catch(null),
  race: catalogRefSchema.nullable().catch(null),
  raceAbilityBonuses: abilityBonusesSchema,
  background: catalogRefSchema.nullable().catch(null),
  alignment: textSchema,
  classes: lenientList(sheetClassSchema),
  experience: countSchema,
  inspiration: z.boolean().catch(false),
  abilities: abilityScoresSchema.catch({
    STRENGTH: ABILITY_SCORE.default,
    DEXTERITY: ABILITY_SCORE.default,
    CONSTITUTION: ABILITY_SCORE.default,
    INTELLIGENCE: ABILITY_SCORE.default,
    WISDOM: ABILITY_SCORE.default,
    CHARISMA: ABILITY_SCORE.default,
  }),
  savingThrows: lenientList(abilityKeySchema),
  skills: skillProficienciesSchema,
  /** Своё значение КД; null — КД считается по снаряжению. */
  armorClassOverride: integerSchema.min(0).nullable().catch(null),
  armorClassBonus: integerSchema.catch(0),
  initiativeBonus: integerSchema.catch(0),
  speed: countSchema,
  darkvision: countSchema,
  health: healthSchema.catch({ max: 0, current: 0, temporary: 0 }),
  hitDiceUsed: hitDiceUsedSchema,
  extraHitDice: lenientList(extraHitDieSchema),
  deathSaves: deathSavesSchema.catch({ successes: 0, failures: 0 }),
  proficiencies: proficienciesSchema.catch({
    armor: [],
    weapons: [],
    tools: [],
    languages: [],
  }),
  currency: currencySchema.catch({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
  customCurrencies: lenientList(customCurrencySchema),
  carrying: carryingSchema.catch({
    size: null,
    custom: null,
    bonus: 0,
    encumbrance: false,
  }),
  attunement: attunementSchema.catch({ custom: null, ability: null, bonus: 0 }),
  inventory: lenientList(sheetItemSchema),
  spellcastingAbility: abilityKeySchema.nullable().catch(null),
  /** Потраченные ячейки 1–9 кругов. */
  spellSlotsUsed: z
    .array(countSchema)
    .catch([])
    .transform((values) =>
      range(SPELL_SLOT_LEVELS).map((index) => values[index] ?? 0),
    ),
  pactSlotsUsed: countSchema,
  spells: lenientList(sheetSpellSchema),
  features: lenientList(sheetFeatureSchema),
  resources: lenientList(sheetResourceSchema),
  personality: personalitySchema.catch({
    traits: [],
    ideals: [],
    bonds: [],
    flaws: [],
    appearance: [],
    backstory: [],
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
  }),
  notes: lenientList(sheetNoteSchema),
  /* Поля механики: у листов до неё их нет, и они открываются пустыми. */
  sources: lenientList(sheetSourceSchema),
  proficiencyGrants: lenientList(proficiencyGrantSchema),
  /** Свои эффекты и наложенные состояния. */
  activeEffects: catalogEffectsSchema,
  exhaustion: integerSchema.min(0).max(MAX_EXHAUSTION_LEVEL).catch(0),
  speeds: extraSpeedsSchema.catch({ fly: 0, climb: 0, swim: 0, burrow: 0 }),
  /** Свой предел подготовленных заклинаний; null — по классам. */
  preparedLimitOverride: integerSchema.min(0).nullable().catch(null),
  /** Бонус к пределу подготовленных заклинаний. */
  preparedBonus: integerSchema.catch(0),
  /** Свой предел заговоров; null — по таблице класса. */
  cantripsLimitOverride: integerSchema.min(0).nullable().catch(null),
  /** Бонус к пределу заговоров. */
  cantripsBonus: integerSchema.catch(0),
  /** Размер персонажа; null — не задан. */
  size: z.enum(SHEET_SIZE_KEYS).nullable().catch(null),
  /** Свои дистанции чувств, кроме тёмного зрения (у него своё поле), фт. */
  ownSenses: z.partialRecord(z.enum(OWN_SENSE_KEYS), countSchema).catch({}),
  /** Характеристики навыков, подменённые игроком. */
  skillAbilities: z.partialRecord(skillKeySchema, abilityKeySchema).catch({}),
  /** Дополнительные бонусы навыков правил. */
  skillBonuses: z
    .partialRecord(skillKeySchema, lenientList(customBonusSchema))
    .catch({}),
  customSkills: lenientList(customSkillSchema),
  groupSkillsByAbility: z.boolean().catch(false),
  /** Свои бонусы к значениям характеристик. */
  abilityBonuses: z
    .partialRecord(abilityKeySchema, lenientList(customBonusSchema))
    .catch({}),
  /** Характеристики спасбросков, подменённые игроком. */
  savingThrowAbilities: z
    .partialRecord(abilityKeySchema, abilityKeySchema)
    .catch({}),
  /** Свои бонусы отдельных спасбросков. */
  savingThrowBonuses: z
    .partialRecord(abilityKeySchema, lenientList(customBonusSchema))
    .catch({}),
  /** Свои бонусы ко всем спасброскам сразу (плащ защиты, аура). */
  savingThrowCommonBonuses: lenientList(customBonusSchema),
  /**
   * Характеристики в КД: Ловкость — по правилу доспеха, остальные целиком.
   * У листов до настройки — одна Ловкость, как и считалось раньше.
   */
  armorClassAbilities: z
    .array(abilityKeySchema)
    .catch([...DEFAULT_ARMOR_CLASS_ABILITIES]),
  /** Свой предел Ловкости в КД; null — по правилу доспеха. */
  armorClassDexLimit: integerSchema
    .min(0)
    .max(ARMOR_DEX_LIMIT_MAX)
    .nullable()
    .catch(null),
  /** Свои бонусы к скоростям по видам передвижения, фт. */
  speedBonuses: z
    .partialRecord(z.enum(SPEED_KEYS), lenientList(customBonusSchema))
    .catch({}),
  /** Единицы, в которых лист показывает скорости и чувства. */
  speedUnit: z.enum(SPEED_UNITS).catch('feet'),
  /** Полёт с парением. */
  speedHover: z.boolean().catch(false),
  /** Базовая характеристика атаки обычным оружием; null — Сила. */
  weaponAttackAbility: abilityKeySchema.nullable().catch(null),
  /** Своя основа бонуса мастерства; null — по уровню. */
  proficiencyBase: integerSchema.nullable().catch(null),
  /** Свои бонусы к бонусу мастерства. */
  proficiencyBonuses: lenientList(customBonusSchema),
  /** Характеристика инициативы; null — Ловкость. */
  initiativeAbility: abilityKeySchema.nullable().catch(null),
  /** Своя основа инициативы вместо модификатора; null — модификатор. */
  initiativeBase: integerSchema.nullable().catch(null),
  /** Свои бонусы инициативы. */
  initiativeBonuses: lenientList(customBonusSchema),
});

export type SheetDocument = z.infer<typeof sheetDocumentSchema>;

/* --- Ответы API листов -------------------------------------------------- */

export const characterSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z
    .unknown()
    .transform((value) => sheetDocumentSchema.parse(value ?? {})),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CharacterSheet = z.infer<typeof characterSheetSchema>;

export const characterSheetListSchema = z.object({
  items: z.array(characterSheetSchema),
  used: z.number(),
  limit: z.number(),
});

export type CharacterSheetList = z.infer<typeof characterSheetListSchema>;

/* --- Справочники -------------------------------------------------------- */

/** Колонка таблицы класса: значение по уровням (0 — нет, -1 — без ограничений). */
const classTableColumnSchema = z.object({
  name: z.string(),
  levels: z.array(z.number()),
});

export type ClassTableColumn = z.infer<typeof classTableColumnSchema>;

/**
 * Класс для листа: к записи раздела добавлены поля механики, которые раздел
 * не показывает. У архетипа их нет — они берутся из основного класса.
 */
export const sheetClassDetailSchema = classDetailSchema.extend({
  spellAbility: abilityKeySchema.nullish(),
  availableSkillsRaw: z.array(z.string()).nullish(),
  enabledArhitypeLevel: z.number().nullish(),
  tableColumns: z.array(classTableColumnSchema).nullish(),
});

export type SheetClassDetail = z.infer<typeof sheetClassDetailSchema>;

/** Оружие для листа: к записи раздела добавлены тип и кость урона. */
export const sheetWeaponDetailSchema = weaponDetailSchema.extend({
  typeRaw: z.string().nullish(),
});

export type SheetWeaponDetail = z.infer<typeof sheetWeaponDetailSchema>;

/** Доспех для листа: базовый КД и категория числами, а не подписью. */
export const sheetArmorDetailSchema = z.object({
  armorClassRaw: z.number().nullish(),
  typeRaw: armorCategorySchema.nullish(),
  weight: z.number().nullish(),
  disadvantage: z.boolean().nullish(),
  requirement: z.number().nullish(),
  price: z.union([z.string(), z.number()]).nullish(),
});

export type SheetArmorDetail = z.infer<typeof sheetArmorDetailSchema>;

/** Вес предмета снаряжения или магического предмета. */
export const sheetWeightDetailSchema = z.object({
  weight: z.number().nullish(),
  // Цена снаряжения приходит текстом («5 зм»), но схема API её не обещает
  price: z.union([z.string(), z.number()]).nullish(),
});

/** Заклинание для листа: ритуал и концентрация есть уже в списке. */
export const sheetSpellDetailSchema = z.object({
  level: z.number(),
  school: z.string().nullish(),
  ritual: z.boolean().nullish(),
  concentration: z.boolean().nullish(),
});
