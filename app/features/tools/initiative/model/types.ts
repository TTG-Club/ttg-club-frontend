import type { PARTICIPANT_TYPES, TRACKER_STATUSES } from './constants';

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
