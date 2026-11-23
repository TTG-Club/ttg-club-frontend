import type { z } from 'zod';

import type { ActiveEffect } from '~active-effects/model';
import type { ContentDescription } from '~content/model';

import type {
  ABILITY_IMPROVEMENT_MODES,
  ABILITY_KEYS,
  CHOICE_KINDS,
  CURRENCY_KEYS,
  EXTRA_SPEED_KEYS,
  HIT_POINTS_GAIN_MODES,
  OWN_SENSE_KEYS,
  SHEET_MAIN_TAB,
  SHEET_SAVE_STATUS_TEXT,
  SHEET_SIZE_KEYS,
  SHEET_TABS,
  SKILL_KEYS,
} from './constants';
import type { CatalogMechanics, EntityRef } from './mechanics';
import type {
  AbilityScores,
  ProficiencyGrant,
  SheetSource,
  SkillProficiencies,
  SkillProficiency,
} from './schema';

export type AbilityKey = (typeof ABILITY_KEYS)[number];

export type SkillKey = (typeof SKILL_KEYS)[number];

export type SheetSize = (typeof SHEET_SIZE_KEYS)[number];

export type OwnSenseKey = (typeof OWN_SENSE_KEYS)[number];

export type CurrencyKey = (typeof CURRENCY_KEYS)[number];

export type SheetTab =
  (typeof SHEET_TABS)[number]['value'] | (typeof SHEET_MAIN_TAB)['value'];

/** Состояние автосохранения листа. */
export type SheetSaveStatus = keyof typeof SHEET_SAVE_STATUS_TEXT;

/** Состояние загрузки листа. */
export type SheetLoadStatus =
  'idle' | 'pending' | 'ready' | 'notFound' | 'error';

/** Строка навыка в листе. */
export interface SkillRow {
  key: SkillKey;
  name: string;
  abilityShort: string;
  proficiency: SkillProficiency;
  bonus: number;
}

/** Атака оружием, посчитанная по листу. */
export interface WeaponAttack {
  id: string;
  name: string;
  url: string | null;
  attackBonus: number;
  /** Урон с модификатором: «1к8 + 3». */
  damage: string;
  damageType: string;
}

/** Кости хитов одного размера. */
export interface HitDiceTotal {
  die: number;
  total: number;
  used: number;
}

/** Ячейки магии договора: сколько и какого круга. */
export interface PactMagic {
  slots: number;
  level: number;
}

/**
 * Заклинательные данные класса на его уровне. `maxSlotLevel` — наибольший
 * круг ячеек класса на 20 уровне: по нему класс вносит свою долю в уровень
 * заклинателя мультикласса.
 */
export interface ClassProgression {
  classId: string;
  level: number;
  spellSlots: number[];
  maxSlotLevel: number;
  pact: PactMagic | null;
}

/** Значение колонки таблицы класса на уровне персонажа. */
export interface ClassTableValue {
  name: string;
  value: string;
}

/** Умение класса или подкласса, полученное к текущему уровню. */
export interface ClassFeatureEntry {
  id: string;
  name: string;
  level: number;
  className: string;
  isArchetype: boolean;
  description: ContentDescription | null;
}

/** Запись справочника в поиске: название, адрес и подпись. */
export interface CatalogOption {
  name: string;
  url: string;
  caption: string;
}

/** Раздел справочника для поиска: ручка списка, схема записи и подпись. */
export interface CatalogSearchSource<Schema extends z.ZodType = z.ZodType> {
  listUrl: string;
  schema: Schema;
  /** Записи для списка: у расы — она сама и её разновидности. */
  toOptions: (entry: z.infer<Schema>) => Array<CatalogOption>;
  /** Фильтр запроса раздела, например уровни заклинаний. */
  filter?: Record<string, Array<string | number>>;
}

/* --- Механика ----------------------------------------------------------- */

export type ChoiceKind = (typeof CHOICE_KINDS)[number];

export type HitPointsGainMode = (typeof HIT_POINTS_GAIN_MODES)[number];

export type AbilityImprovementMode = (typeof ABILITY_IMPROVEMENT_MODES)[number];

export type ExtraSpeedKey = (typeof EXTRA_SPEED_KEYS)[number];

export type SpeedKey = 'walk' | ExtraSpeedKey;

/** Владения, выданные одним источником, — без пометки источника. */
export type GrantedProficiencies = Omit<ProficiencyGrant, 'sourceId'>;

/** Вариант выбора из записи справочника: значение и подпись. */
export interface ChoiceListedOption {
  value: string;
  label: string;
}

/** Ограничение пула заклинаний выбора. */
export interface SpellChoiceFilter {
  /** Точный круг; 0 — заговор, null — не задан. */
  level: number | null;
  /** Наибольший круг; null — не задан. */
  maxLevel: number | null;
  /** Классы, из списков которых идёт выбор. */
  classes: Array<EntityRef>;
  /** Ключ выбора, ответ на который называет класс списка. */
  classesFromChoiceKey: string | null;
}

/**
 * Выбор источника, приведённый к виду листа: что выбирают, сколько и из
 * чего. Количество уже посчитано на уровень источника.
 */
export interface SheetChoice {
  /** Ключ выбора внутри источника: по нему лежат ответы. */
  key: string;
  kind: ChoiceKind;
  label: string;
  count: number;
  /** Перечисленные варианты; пусто — все значения своего вида. */
  options: Array<ChoiceListedOption>;
  /** Уровень, с которого выбор открывается; null — сразу. */
  requiredLevel: number | null;
  /** Только то, чем персонаж ещё не владеет. */
  onlyIfNotProficient: boolean;
  /** Только то, чем персонаж уже владеет. */
  onlyIfProficient: boolean;
  /** Владение навыком превращает выбор в компетентность. */
  expertiseIfProficient: boolean;
  spellFilter: SpellChoiceFilter | null;
  /** Выбранные заклинания всегда подготовлены. */
  alwaysPrepared: boolean;
  /** Повышение характеристик: прибавка и предел. */
  abilityBonus: { bonus: number; upto: number } | null;
}

/** Вариант выбора, готовый к показу: с пометкой того, что уже есть. */
export interface SheetChoiceOption {
  value: string;
  label: string;
  /** Пометка: «владеет», «знает». */
  hint?: string;
  /** Подстрочник: круг заклинания, источник. */
  caption?: string;
  /** Взять нельзя: уже есть или не подходит. */
  disabled?: boolean;
}

/** Что нужно знать о персонаже, чтобы пометить варианты выбора. */
export interface ChoiceContext {
  /** Навыки и их владение без учёта самого источника. */
  skills: SkillProficiencies;
  savingThrows: ReadonlyArray<AbilityKey>;
  languages: ReadonlyArray<string>;
  tools: ReadonlyArray<string>;
  spellNames: ReadonlyArray<string>;
  /** Ответы соседних выборов источника: взятое ими не предлагается. */
  takenValues: ReadonlyArray<string>;
}

/** Невыполненный выбор источника: для пометки «нужно выбрать». */
export interface PendingChoice {
  source: SheetSource;
  choice: SheetChoice;
  missing: number;
}

/** Значения листа, по которым считаются формулы максимума и эффектов. */
export interface FormulaContext {
  proficiencyBonus: number;
  level: number;
  abilityModifiers: Readonly<Record<AbilityKey, number>>;
  /** Уровни классов листа по идентификатору класса. */
  classLevels: Readonly<Record<string, number>>;
}

/** Состояние доспеха: категория надетой брони и наличие щита. */
export interface SheetArmorState {
  category: 'light' | 'medium' | 'heavy' | undefined;
  hasShield: boolean;
}

/** Носитель эффектов: свои, умения, снаряжение, истощение. */
export interface EffectCarrier {
  kind: 'own' | 'source' | 'item' | 'exhaustion';
  name: string;
  effects: ReadonlyArray<ActiveEffect>;
  /** Класс, по уровню которого считается `@classLevel`; null — общий уровень. */
  classId: string | null;
}

/** Защиты персонажа подписями. */
export interface SheetDefences {
  resistances: Array<string>;
  immunities: Array<string>;
  vulnerabilities: Array<string>;
  conditionImmunities: Array<string>;
}

/** Чувство персонажа с дальностью. */
export interface SheetSense {
  key: string;
  label: string;
  range: number;
}

/** Итоги листа с учётом механики, эффектов и истощения. */
export interface SheetStats {
  level: number;
  proficiencyBonus: number;
  /** Характеристики с прибавками эффектов. */
  abilities: AbilityScores;
  armorClass: number;
  /** Название эффекта, задавшего КД тела («Защита без доспехов»). */
  armorClassSource: string | null;
  initiative: number;
  savingThrows: Record<AbilityKey, { bonus: number; isAutoFail: boolean }>;
  skills: Record<SkillKey, number>;
  /** Итоги своих навыков по их идентификатору. */
  customSkills: Record<string, number>;
  passivePerception: number;
  speeds: Record<SpeedKey, number>;
  senses: Array<SheetSense>;
  telepathy: number;
  defences: SheetDefences;
  hitPointsMax: number;
  spellSaveDc: number | null;
  spellAttack: number | null;
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  flags: ReadonlySet<string>;
}

/** Вид броска для подбора преимущества и помехи. */
export interface SheetRollContext {
  kind: 'abilityCheck' | 'skill' | 'savingThrow' | 'attack' | 'initiative';
  /** Ключ характеристики в словаре эффектов (`strength`). */
  ability?: string;
  /** Ключ навыка в словаре эффектов (`stealth`). */
  skill?: string;
  attackType?: 'melee' | 'ranged' | 'spell';
}

/** Режим броска по флагам: обычный, с преимуществом или помехой. */
export type SheetRollMode = 'normal' | 'advantage' | 'disadvantage';

/** Класс листа для предела подготовленных заклинаний. */
export interface PreparedLimitClass {
  url: string | null;
  level: number;
  /** Значение колонки «Известные заклинания»; null — колонки нет. */
  knownSpells: number | null;
}

/** Предел подготовленных или известных заклинаний. */
export interface PreparedLimit {
  /** null — у персонажа нет классов, готовящих или знающих заклинания. */
  value: number | null;
  /** Подготовлено сейчас без «всегда подготовленных». */
  prepared: number;
  /** Предел считается по известным заклинаниям, а не по подготовке. */
  isKnown: boolean;
}

/** Умение уровня класса для мастера повышения. */
export interface LevelUpFeature {
  id: string;
  name: string;
  level: number;
  isArchetype: boolean;
  isAbilityImprovement: boolean;
  mechanics: CatalogMechanics;
  activeEffects: Array<ActiveEffect>;
}
