import type { z } from 'zod';

import type { ContentDescription } from '~content/model';

import type {
  ABILITY_KEYS,
  CURRENCY_KEYS,
  SHEET_SAVE_STATUS_TEXT,
  SHEET_TABS,
  SKILL_KEYS,
} from './constants';
import type { SkillProficiency } from './schema';

export type AbilityKey = (typeof ABILITY_KEYS)[number];

export type SkillKey = (typeof SKILL_KEYS)[number];

export type CurrencyKey = (typeof CURRENCY_KEYS)[number];

export type SheetTab = (typeof SHEET_TABS)[number]['value'];

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
