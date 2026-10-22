import type {
  ABILITIES,
  ABILITY_METHODS,
  ABILITY_SPLITS,
  NAME_COMPONENTS,
  NAME_GENERATION_TYPES,
  NAME_SEXES,
} from './constants';

/** Запрос безумия: без вида бэкенд выбирает его сам. */
export interface MadnessRequest {
  count: number;
  type?: string;
}

/** Запрос дикой магии по выбранным книгам. */
export interface WildMagicRequest {
  count: number;
  sources: Array<string>;
}

/** Запрос столкновения: пустое поле бэкенд выбирает сам. */
export interface EncounterRequest {
  level?: number;
  environment?: string;
}

/** Результат генератора с ключом для списка. */
export interface ToolResult<T> {
  id: number;
  value: T;
}

export type NameGenerationType =
  (typeof NAME_GENERATION_TYPES)[number]['value'];

export type NameComponent = (typeof NAME_COMPONENTS)[number]['value'];

export type NameSex = (typeof NAME_SEXES)[number]['value'];

/** Запрос имён: без рас бэкенд берёт любую расу с именами. */
export interface NamesRequest {
  type: NameGenerationType;
  components: Array<NameComponent>;
  count: number;
  raceIds: Array<number> | null;
  sexes: Array<NameSex>;
}

/** Строка списка рас: раса, подраса или заголовок группы без имён. */
export interface NameRaceItem {
  label: string;
  value?: number;
  type?: 'label';
  class?: string;
}

export type AbilityKey = (typeof ABILITIES)[number]['key'];

export type AbilityMethod = (typeof ABILITY_METHODS)[number]['value'];

export type AbilitySplit = (typeof ABILITY_SPLITS)[number]['value'];

/** Значения характеристик; без значения — характеристика не назначена. */
export type AbilityScores = Partial<Record<AbilityKey, number>>;

/** Значение «покупки» в списке: подпись со стоимостью и доступность. */
export interface PointBuyItem {
  label: string;
  value: number;
  disabled: boolean;
}

/** Строка итоговой таблицы. */
export interface AbilityRow {
  key: AbilityKey;
  name: string;
  short: string;
  base?: number;
  bonus?: number;
  total?: number;
  modifier?: string;
}
