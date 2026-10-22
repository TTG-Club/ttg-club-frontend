import type { CreatureLink } from '~bestiary/model';

import type { TrackerParticipant, TrackerSlot } from './schema';
import type { CreatureOption, ParticipantType } from './types';

import {
  INITIATIVE_BESTIARY_ROUTE,
  INITIATIVE_ROUTE,
  PARTICIPANT_TYPE_META,
  TRACKER_KEY_HEADER,
} from './constants';
import { trackerErrorSchema, trackerSlotSchema } from './schema';

/**
 * Адрес страницы трекера.
 * @param id - идентификатор трекера
 */
export function getTrackerRoute(id: string): string {
  return `${INITIATIVE_ROUTE}/${id}`;
}

/**
 * Адрес статблока существа.
 * @param creatureUrl - слаг существа
 */
export function getCreatureRoute(creatureUrl: string): string {
  return `${INITIATIVE_BESTIARY_ROUTE}/${creatureUrl}`;
}

/**
 * Заголовки запроса к трекеру: гость передаёт ключ доступа, пользователя
 * бэкенд узнаёт по cookie.
 * @param accessKey - ключ трекера гостя
 */
export function getTrackerHeaders(accessKey?: string): Record<string, string> {
  return accessKey ? { [TRACKER_KEY_HEADER]: accessKey } : {};
}

/**
 * Текст ошибки для уведомления: бэкенд присылает его по-русски.
 * @param title - что не получилось
 * @param error - пойманная ошибка `$fetch`
 */
export function getTrackerErrorMessage(title: string, error: unknown): string {
  const parsed = trackerErrorSchema.safeParse(error);

  return parsed.success ? `${title}. ${parsed.data.data.message}` : title;
}

/**
 * Читает трекер гостя из localStorage; битое значение — слота нет.
 * @param raw - строка из хранилища
 */
export function parseTrackerSlot(raw: string): TrackerSlot | null {
  try {
    const parsed = trackerSlotSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Сколько участников заданного типа.
 * @param participants - участники
 * @param type - тип участника
 */
export function countParticipants(
  participants: ReadonlyArray<TrackerParticipant>,
  type: ParticipantType,
): number {
  return participants.filter((participant) => participant.type === type).length;
}

/**
 * Прокинута ли участнику инициатива.
 * @param participant - участник
 */
export function isParticipantRolled(participant: TrackerParticipant): boolean {
  return typeof participant.initiativeTotal === 'number';
}

/**
 * Подпись типа участника: от бэкенда или своя.
 * @param participant - участник
 */
export function getParticipantTypeLabel(
  participant: TrackerParticipant,
): string {
  return participant.typeName || PARTICIPANT_TYPE_META[participant.type].label;
}

/**
 * Бросок с преимуществом или помехой из двух к20.
 * @param first - первая кость
 * @param second - вторая кость
 * @param isAdvantage - преимущество: больший, иначе меньший
 */
export function pickPairRoll(
  first: number,
  second: number,
  isAdvantage: boolean,
): number {
  return isAdvantage ? Math.max(first, second) : Math.min(first, second);
}

/**
 * Существа бестиария как варианты выбора.
 * @param creatures - существа из поиска
 */
export function toCreatureOptions(
  creatures: ReadonlyArray<CreatureLink>,
): Array<CreatureOption> {
  return creatures.map((creature) => ({
    value: creature.url,
    label: creature.name.rus,
    challengeRating: creature.challengeRating,
  }));
}

/**
 * Имя трекера для запроса: пустое — бэкенд подставит своё.
 * @param name - введённое имя
 */
export function getTrackerNameBody(name: string): { name?: string } {
  const trimmed = name.trim();

  return trimmed ? { name: trimmed } : {};
}

/**
 * Ход назван «текущим», только пока идёт бой и участник жив.
 * @param participant - участник
 * @param currentId - чей сейчас ход
 */
export function isParticipantCurrent(
  participant: TrackerParticipant,
  currentId: string | null | undefined,
): boolean {
  return !participant.dead && participant.id === currentId;
}
