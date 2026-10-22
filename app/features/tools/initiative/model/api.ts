import type { Tracker, TrackerListItem } from './schema';

import { INITIATIVE_API_URL } from './constants';
import { trackerListSchema, trackerSchema } from './schema';
import { getTrackerHeaders, getTrackerNameBody } from './utils';

type TrackerMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Запрос к трекеру: путь после `/{id}`, метод, тело и ключ гостя. */
interface TrackerRequestOptions {
  path?: string;
  method?: TrackerMethod;
  body?: object;
  accessKey?: string;
}

/**
 * Запрос к трекеру; любой ответ — его полное состояние.
 * @param id - идентификатор трекера
 * @param options - путь действия, метод, тело и ключ гостя
 */
export async function requestTracker(
  id: string,
  options: TrackerRequestOptions = {},
): Promise<Tracker> {
  const { path = '', method = 'GET', body, accessKey } = options;

  return trackerSchema.parse(
    await $fetch(`${INITIATIVE_API_URL}/${id}${path}`, {
      method,
      body,
      headers: getTrackerHeaders(accessKey),
    }),
  );
}

/**
 * Создаёт трекер. Гостю в ответе один раз приходит ключ доступа.
 * @param name - имя трекера; пустое — бэкенд подставит своё
 */
export async function createTracker(name = ''): Promise<Tracker> {
  return trackerSchema.parse(
    await $fetch(INITIATIVE_API_URL, {
      method: 'POST',
      body: getTrackerNameBody(name),
    }),
  );
}

/** Трекеры пользователя вместе с удалёнными, для истории. */
export async function fetchTrackerList(): Promise<Array<TrackerListItem>> {
  return trackerListSchema.parse(
    await $fetch(INITIATIVE_API_URL, { query: { includeDeleted: true } }),
  );
}

/**
 * Удаляет трекер: у пользователя он уходит в историю, у гостя — насовсем.
 * @param id - идентификатор трекера
 * @param accessKey - ключ трекера гостя
 */
export async function deleteTracker(
  id: string,
  accessKey?: string,
): Promise<void> {
  await $fetch(`${INITIATIVE_API_URL}/${id}`, {
    method: 'DELETE',
    headers: getTrackerHeaders(accessKey),
  });
}
