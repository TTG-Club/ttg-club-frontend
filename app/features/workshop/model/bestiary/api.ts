import type { SavedEntry } from '../types';

import { parseSavedEntry } from '../schemas';
import { BESTIARY_API_PATH } from './constants';

/**
 * Существо по сегменту адреса: бэкенд ищет его по английскому названию.
 * @param slug - сегмент адреса записи
 */
export async function fetchWorkshopCreature(slug: string): Promise<unknown> {
  return await $fetch<unknown>(`${BESTIARY_API_PATH}/${slug}`);
}

/**
 * Создаёт существо или сохраняет правку: у существ своя ручка, без
 * истории изменений.
 * @param payload - тело запроса с `id` при правке
 * @param entryId - идентификатор существа при правке
 */
export async function saveWorkshopCreature(
  payload: Record<string, unknown>,
  entryId: number | undefined,
): Promise<SavedEntry> {
  return parseSavedEntry(
    await $fetch<unknown>(BESTIARY_API_PATH, {
      method: entryId === undefined ? 'POST' : 'PUT',
      body: payload,
    }),
  );
}
