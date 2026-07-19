/** Статус трекера: подготовка энкаунтера или активный бой. */
export type TrackerStatus = 'PREPARING' | 'ACTIVE';

/** Тип участника боя. */
export type ParticipantType = 'PLAYER' | 'CREATURE';

/**
 * Участник трекера. Приходит от бэка уже в порядке хода.
 * Поля броска отсутствуют, пока инициатива не прокинута.
 */
export interface TrackerParticipant {
  id: string;
  type: ParticipantType;
  typeName: string;
  name: string;
  /** Повержен: остаётся в списке на своей позиции, но пропускается в очереди хода. */
  dead: boolean;
  initiativeBonus: number;
  initiativeRoll?: number;
  initiativeTotal?: number;
  creatureUrl?: string;
}

/**
 * Полное состояние трекера — единый ответ на `GET /{id}` и все мутации.
 * После любого действия фронт перерисовывается из этого объекта.
 */
export interface TrackerDetailed {
  id: string;
  name: string;
  status: TrackerStatus;
  statusName: string;
  round: number;
  currentParticipantId?: string;
  /** Приходит ЕДИНСТВЕННЫЙ раз — в ответе на создание анонимного трекера. */
  accessKey?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<TrackerParticipant>;
}

/** Короткий объект трекера в списке `GET /`. */
export interface TrackerListItem {
  id: string;
  name: string;
  status: TrackerStatus;
  statusName: string;
  round: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Тело запроса создания/переименования трекера. */
export interface TrackerNameRequest {
  name: string;
}

/** Добавление игрока (по одному). */
export interface AddPlayerRequest {
  type: 'PLAYER';
  name: string;
  initiativeBonus?: number;
}

/** Добавление существ из бестиария (пачкой). */
export interface AddCreatureRequest {
  type: 'CREATURE';
  creatureUrl: string;
  count?: number;
  name?: string;
}

/** Тело запроса добавления участников. */
export type AddParticipantRequest = AddPlayerRequest | AddCreatureRequest;

/** Правка участника — применяются только заполненные поля. */
export interface UpdateParticipantRequest {
  name?: string;
  initiativeBonus?: number;
  initiativeRoll?: number;
  dead?: boolean;
}

/** Слот единственного анонимного трекера в localStorage. */
export interface AnonTrackerSlot {
  trackerId: string;
  accessKey: string;
}

/** Плоская опция существа для автокомплита (из бестиария). */
export interface CreatureOption {
  url: string;
  label: string;
  challengeRating: string;
}

/**
 * Сводка существа из детального ответа бестиария для строки трекера:
 * картинка аватара, строка КД статблока (например, `15 (кожаный доспех)`),
 * показатель опасности (CR), максимум хитов (`0` — неизвестен) и формула
 * броска хитов (например, `8к8 + 16`; пустая строка — формулы нет).
 */
export interface CreatureSummary {
  image: string;
  armorClass: string;
  challengeRating: string;
  maxHitPoints: number;
  hitFormula: string;
}
