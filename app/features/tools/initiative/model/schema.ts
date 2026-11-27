import { z } from 'zod';

import { creatureLinkSchema } from '~bestiary/model';

import {
  INITIATIVE_TEXT,
  PARTICIPANT_TYPES,
  SHEET_PLAYER_SOURCES,
  TRACKER_STATUSES,
} from './constants';

/**
 * Привязка игрока к листу персонажа: по ней хиты из боя пишутся обратно в
 * лист. Свой лист пишется по `sheetId`, чужой — по `savedId` сохранённой
 * записи.
 */
export const participantSheetLinkSchema = z.object({
  sheetId: z.string(),
  source: z.enum(SHEET_PLAYER_SOURCES),
  shareToken: z.string().nullish(),
  savedId: z.string().nullish(),
});

/** Участник трекера; бросок появляется, когда инициатива прокинута. */
export const participantSchema = z.object({
  id: z.string(),
  type: z.enum(PARTICIPANT_TYPES),
  typeName: z.string().nullish(),
  name: z.string(),
  /** Повержен: остаётся на месте, но ход его пропускает. */
  dead: z.boolean().nullish(),
  initiativeBonus: z.number(),
  initiativeRoll: z.number().nullish(),
  initiativeTotal: z.number().nullish(),
  creatureUrl: z.string().nullish(),
  /** Привязка к листу персонажа; битая не роняет трекер, а просто теряется. */
  sheetLink: participantSheetLinkSchema.nullish().catch(null),
});

/** Полное состояние трекера: ответ на `GET /{id}` и на любое изменение. */
export const trackerSchema = z.object({
  id: z.string(),
  name: z.string().catch(INITIATIVE_TEXT.defaultName),
  status: z.enum(TRACKER_STATUSES),
  statusName: z.string(),
  round: z.number(),
  currentParticipantId: z.string().nullish(),
  /** Приходит один раз — в ответе на создание трекера гостем. */
  accessKey: z.string().nullish(),
  participants: z.array(participantSchema),
});

/** Трекер в списке пользователя. */
export const trackerListItemSchema = z.object({
  id: z.string(),
  name: z.string().catch(INITIATIVE_TEXT.defaultName),
  status: z.enum(TRACKER_STATUSES),
  statusName: z.string(),
  round: z.number(),
  deleted: z.boolean().nullish(),
  updatedAt: z.string().nullish(),
});

export const trackerListSchema = z.array(trackerListItemSchema);

/** Трекер гостя в localStorage: чужое или битое значение не принимаем. */
export const trackerSlotSchema = z.object({
  trackerId: z.string().min(1),
  accessKey: z.string().min(1),
});

/** Значения участников по трекерам: `{ [trackerId]: { [participantId]: N } }`. */
export const participantValuesSchema = z.record(
  z.string(),
  z.record(z.string(), z.number()),
);

/** Существа из поиска бестиария. */
export const creatureOptionsSchema = z.array(creatureLinkSchema);

/** Тело ошибки бэкенда: текст на русском в `message`. */
export const trackerErrorSchema = z.object({
  data: z.object({ message: z.string().min(1) }),
});

export type TrackerParticipant = z.infer<typeof participantSchema>;
export type ParticipantSheetLink = z.infer<typeof participantSheetLinkSchema>;
export type Tracker = z.infer<typeof trackerSchema>;
export type TrackerListItem = z.infer<typeof trackerListItemSchema>;
export type TrackerSlot = z.infer<typeof trackerSlotSchema>;

export type ParticipantValues = z.infer<typeof participantValuesSchema>;
