import type { PARTICIPANT_TYPES, TRACKER_STATUSES } from './constants';
import type { TrackerParticipant } from './schema';

export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export type ParticipantType = (typeof PARTICIPANT_TYPES)[number];

/** Добавление игрока. */
export interface AddPlayerRequest {
  type: 'PLAYER';
  name: string;
  initiativeBonus: number;
}

/** Добавление существ из бестиария пачкой. */
export interface AddCreatureRequest {
  type: 'CREATURE';
  creatureUrl: string;
  count: number;
  name?: string;
}

export type AddParticipantRequest = AddPlayerRequest | AddCreatureRequest;

/** Правка участника: применяются только заполненные поля. */
export interface UpdateParticipantRequest {
  name?: string;
  initiativeBonus?: number;
  initiativeRoll?: number;
  dead?: boolean;
}

/** Существо для выбора: слаг, название и опасность. */
export interface CreatureOption {
  value: string;
  label: string;
  challengeRating: string;
}

/** Что трекеру нужно из статблока существа. */
export interface CreatureSummary {
  image?: string;
  armorClass?: number;
  challengeRating: string;
  /** Средние хиты из статблока; `0` — неизвестны. */
  maxHitPoints: number;
  /** Формула хитов вроде «8к8 + 16»; нет кубиков — `undefined`. */
  hitFormula?: string;
}

/** Окраска остатка хитов. */
export type HitPointsTone = 'error' | 'warning';

/** Токен участника на ленте ходов. */
export interface TurnReelToken {
  kind: 'token';
  key: string;
  column: number;
  participant: TrackerParticipant;
  isCurrent: boolean;
}

/** Граница раундов на ленте ходов. */
export interface TurnReelDivider {
  kind: 'divider';
  key: string;
  column: number;
  round: number;
}

export type TurnReelCell = TurnReelToken | TurnReelDivider;
