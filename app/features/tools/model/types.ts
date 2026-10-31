import type {
  ABILITIES,
  ABILITY_METHODS,
  ABILITY_SPLITS,
  NAME_COMPONENTS,
  NAME_GENERATION_TYPES,
  NAME_SEXES,
  TAVERN_HABITATS,
  TAVERN_PATH,
  TAVERN_SERVICE_LEVELS,
  TAVERN_TYPES,
  TOOL_RESULT_GRID_CLASS,
  TREASURY_COINS,
  TREASURY_KINDS,
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

/** Вид сетки результатов: плотная для коротких карточек или для карточек с текстом. */
export type ToolResultGridView = keyof typeof TOOL_RESULT_GRID_CLASS;

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

/** Запрос торговца. */
export interface TraderRequest {
  magicLevel: number;
  persuasion: number;
  unique: boolean;
}

export type TreasuryKind = (typeof TREASURY_KINDS)[number]['key'];

/** Запрос сокровищницы: показатель опасности и виды добычи. */
export type TreasuryRequest = Record<TreasuryKind, boolean> & {
  cr: number;
  unique: boolean;
};

/** Одинаковые предметы одной строкой: сколько их и общая цена. */
export interface LootGroup<T> {
  item: T;
  count: number;
  price?: number;
}

/** Как показывать добычу. */
export interface LootView {
  isGrouped: boolean;
  /** Цена группы — максимальная, а не средняя. */
  isMaxPrice: boolean;
}

/** Монета сокровищницы для вывода. */
export interface TreasuryCoin {
  key: (typeof TREASURY_COINS)[number]['key'];
  value: number;
  /** Количество с разрядами и сокращение, «1 200 мм». */
  label: string;
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

export type TavernType = (typeof TAVERN_TYPES)[number]['value'];

export type TavernHabitat = (typeof TAVERN_HABITATS)[number]['value'];

export type TavernServiceLevel =
  (typeof TAVERN_SERVICE_LEVELS)[number]['value'];

export type TavernField = keyof typeof TAVERN_PATH;

/** Настройки таверны; пустое поле выбирается случайно. */
export interface TavernSettings {
  type: TavernType;
  habitat: TavernHabitat;
  serviceLevel: TavernServiceLevel;
}

/** Настройки и заполненность зала: от неё зависят слухи, событие, столики. */
export interface TavernBase extends TavernSettings {
  visitors: number;
}

/** Сгенерированная таверна: HTML каждой части из бэкенда. */
export type Tavern = TavernBase & Record<TavernField, string>;

/** Запрос одной части таверны. */
export interface TavernRequest {
  path: string;
  query: Record<string, string | number>;
}
