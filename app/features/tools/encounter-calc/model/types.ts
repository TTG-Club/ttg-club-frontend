/** Строка группы: несколько персонажей одного уровня. */
export interface EncounterPartyRow {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** Уровень персонажей строки, от 1 до 20. */
  level: number;

  /** Сколько персонажей этого уровня в группе. */
  count: number;
}

/**
 * Существо столкновения: из бестиария или свой монстр мастера (без ссылки на
 * бестиарий, только название и уровень опасности).
 */
export interface EncounterCreature {
  /** Локальный идентификатор строки (ключ списка). */
  id: string;

  /** Адрес существа в бестиарии (`/bestiary/goblin`); нет — свой монстр. */
  url?: string;

  /** Русское название существа. */
  name: string;

  /** Тип существа строкой («гуманоид»); пусто — неизвестен. */
  type: string;

  /** Уровень опасности строкой («1/4», «5»). */
  challengeRating: string;

  /** Опыт за одно существо. */
  experience: number;

  /** Сколько таких существ в столкновении. */
  count: number;
}

/** Существо бестиария, которое можно добавить в столкновение. */
export interface EncounterCreatureOption {
  /** Адрес существа в бестиарии (`/bestiary/goblin`). */
  url: string;

  label: string;

  /** Тип существа строкой («гуманоид»). */
  type: string;

  challengeRating: string;

  /** Опыт за существо по уровню опасности. */
  experience: number;
}

/** Что мастер ввёл о своём монстре. */
export interface CustomCreatureDraft {
  /** Название; пусто — название по умолчанию. */
  name: string;

  /** Уровень опасности строкой («1/4», «5»). */
  challengeRating: string;

  /** Сколько таких монстров добавить. */
  count: number;
}

/** Пункт выбора уровня опасности или среды обитания. */
export interface EncounterSelectItem {
  value: string;
  label: string;
}

/** Состояние калькулятора, которое переживает перезагрузку страницы. */
export interface EncounterState {
  party: Array<EncounterPartyRow>;
  creatures: Array<EncounterCreature>;
}

/** Пороги опыта персонажа или группы по сложностям (DMG 2014). */
export interface EncounterThresholds {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
}

/** Сложность, у которой есть порог опыта. */
export type ThresholdDifficulty = keyof EncounterThresholds;

/**
 * Сложность столкновения по скорректированному опыту:
 * - `none` — группы или существ нет, считать нечего;
 * - `trivial` — опыт не дотягивает до порога лёгкой сложности;
 * - `easy` / `medium` / `hard` / `deadly` — достигнут соответствующий порог.
 */
export type EncounterDifficulty = 'none' | 'trivial' | ThresholdDifficulty;

/** Итог расчёта столкновения. */
export interface EncounterResult {
  /** Пороги опыта всей группы. */
  thresholds: EncounterThresholds;

  /** Суммарный опыт существ — столько получит группа за победу. */
  totalExperience: number;

  /** Опыт с множителем за число существ — по нему считается сложность. */
  adjustedExperience: number;

  /** Множитель за число существ с поправкой на размер группы. */
  multiplier: number;

  /** Число существ в столкновении. */
  creatureCount: number;

  /** Число персонажей в группе. */
  characterCount: number;

  /** Опыт на одного персонажа (с округлением вниз). */
  experiencePerCharacter: number;

  /** Бюджет опыта группы на день приключений. */
  dailyBudget: number;

  difficulty: EncounterDifficulty;
}

/** Отрезок шкалы сложности: от одного порога до следующего. */
export interface EncounterBudgetSegment {
  /** Сложность внутри отрезка — пока опыт не дошёл до его правого края. */
  difficulty: Exclude<EncounterDifficulty, 'none' | 'deadly'>;

  /** Порог на правом краю отрезка. */
  threshold: ThresholdDifficulty;

  /** Доля всей шкалы, которую занимает отрезок, от 0 до 1. */
  width: number;

  /** Насколько отрезок заполнен опытом, от 0 до 1. */
  fill: number;
}

/** Сложность, до которой добирает генератор. */
export type GenerationDifficulty = ThresholdDifficulty;

/** Диапазон скорректированного опыта столкновения, включительно. */
export interface GenerationWindow {
  min: number;
  max: number;
}

/**
 * Всё, что генератор знает о столкновении: куда надо попасть и что уже
 * добавлено. Множитель зависит от общего числа существ, поэтому опыт и число
 * уже добавленных существ учитываются при каждом шаге.
 */
export interface GenerationContext {
  /** Целевой диапазон скорректированного опыта всего столкновения. */
  window: GenerationWindow;

  /** Суммарный опыт уже добавленных существ. */
  baseExperience: number;

  /** Сколько существ уже в столкновении. */
  baseCount: number;

  /** Число персонажей группы — от него зависит множитель. */
  characterCount: number;

  /** Сколько существ генератор может добавить. */
  creatureLimit: number;
}

/** Одно существо в результате генерации и сколько его добавить. */
export interface GeneratedCreature {
  candidate: EncounterCreatureOption;
  count: number;
}

/** Источник случайных чисел в диапазоне [0, 1) — подменяется в тестах. */
export type RandomSource = () => number;

/** Кандидат в свиту и его вес при случайном выборе. */
export interface RetinueOption {
  candidate: EncounterCreatureOption;
  weight: number;
}

/** Промежуточный итог одной попытки генерации. */
export interface GenerationAttempt {
  picks: Array<GeneratedCreature>;

  /** Скорректированный опыт всего столкновения вместе с добавленными. */
  adjusted: number;

  /** Свита подобрана по типу главаря, а не наугад. */
  isThemed: boolean;
}

/** Пачка одинаковых существ для переноса в трекер инициативы. */
export interface EncounterTransferBatch {
  /** Адрес существа в бестиарии. */
  creatureUrl: string;

  /** Сколько таких существ перенести. */
  count: number;
}

/** Трекер инициативы, в который можно перенести существ. */
export interface EncounterTransferTracker {
  id: string;
  name: string;

  /** Идёт ли в трекере бой: новым существам бэкенд сразу бросит инициативу. */
  isActive: boolean;
}

/** Существо из строки таблицы случайных столкновений, ещё без броска. */
export interface TableCreatureGroup {
  /** Часть адреса после `/bestiary/`, как она записана в таблице. */
  slug: string;

  /** Количество: формула кубиков («2d4+1») или число. */
  quantity: string;
}

/** Существо из таблицы с выброшенным количеством. */
export interface RolledTableCreature {
  slug: string;
  count: number;
}

/** Последний бросок по таблице случайных столкновений. */
export interface EncounterTableRoll {
  /** Ключ для перерисовки карточки при новом броске. */
  id: number;
  tableName?: string;
  sourceName?: string;

  /** Описание из таблицы: HTML с кубиками и ссылками на существ. */
  description: string;

  /** Сколько существ выпало (до ограничения количества в строке). */
  addedCount: number;
}

/** Уровни таблицы случайных столкновений (диапазон уровней группы). */
export interface EncounterTableTier {
  value: number;
  label: string;
}
