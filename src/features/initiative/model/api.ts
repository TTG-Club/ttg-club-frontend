import axios from 'axios';

import { httpClient } from '@/shared/api';

import {
  INITIATIVE_API_PATH,
  TRACKER_KEY_HEADER,
  UNKNOWN_ERROR_MESSAGE,
} from './constants';
import { parseTrackerDetailed, parseTrackerList } from './schemas';

import type {
  AddParticipantRequest,
  TrackerDetailed,
  TrackerListItem,
  UpdateParticipantRequest,
} from './types';

/** Версия API трекера (проксируется на core-api через `/api/v2`). */
const API_VERSION = 'v2' as const;

/**
 * Заголовки запроса к конкретному трекеру.
 * Для анонимного владельца добавляется `X-Tracker-Key`; авторизованному
 * пользователю Bearer-токен подставляет серверный прокси из куки.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
function trackerHeaders(accessKey?: string): Record<string, string> {
  return accessKey ? { [TRACKER_KEY_HEADER]: accessKey } : {};
}

/**
 * Достаёт HTTP-статус из ошибки axios.
 * @param error Пойманная ошибка.
 */
export function getFetchStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

/**
 * Возвращает человекочитаемое сообщение об ошибке.
 * Бэк присылает русский текст в `message` — показываем его как есть.
 * @param error Пойманная ошибка.
 */
export function getTrackerErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      UNKNOWN_ERROR_MESSAGE
    );
  }

  return UNKNOWN_ERROR_MESSAGE;
}

/**
 * Создать трекер. Тело опционально: `{ name }`.
 * У анонимного пользователя в ответе единственный раз придёт `accessKey`.
 * @param name Имя трекера (по умолчанию — дефолт бэка).
 */
export async function createTracker(name?: string): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: INITIATIVE_API_PATH,
    version: API_VERSION,
    payload: name ? { name } : {},
  });

  return parseTrackerDetailed(data);
}

/**
 * Список трекеров текущего (авторизованного) пользователя.
 * @param includeDeleted Включать ли удалённые (история).
 */
export async function fetchTrackerList(
  includeDeleted = false,
): Promise<Array<TrackerListItem>> {
  const { data } = await httpClient.get<unknown>({
    url: INITIATIVE_API_PATH,
    version: API_VERSION,
    payload: { includeDeleted },
  });

  return parseTrackerList(data);
}

/**
 * Получить трекер с участниками в порядке хода.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function fetchTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.get<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Переименовать трекер.
 * @param id Идентификатор трекера.
 * @param name Новое имя.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function renameTracker(
  id: string,
  name: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.put<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}`,
    version: API_VERSION,
    payload: { name },
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Удалить трекер. У владельца — мягко (остаётся в истории),
 * у анонима — насовсем. Ответ пустой 200.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function deleteTracker(
  id: string,
  accessKey?: string,
): Promise<void> {
  await httpClient.delete<void>({
    url: `${INITIATIVE_API_PATH}/${id}`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });
}

/**
 * Добавить участников (игрока по одному или существ пачкой).
 * @param id Идентификатор трекера.
 * @param body Тело запроса добавления.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function addParticipants(
  id: string,
  body: AddParticipantRequest,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/participants`,
    version: API_VERSION,
    payload: body,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Изменить участника — применяются только заполненные поля.
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param body Поля для изменения.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function updateParticipant(
  id: string,
  participantId: string,
  body: UpdateParticipantRequest,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.put<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/participants/${participantId}`,
    version: API_VERSION,
    payload: body,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Убрать участника. Если сейчас его ход — бэк сам передаёт ход следующему.
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function removeParticipant(
  id: string,
  participantId: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.delete<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/participants/${participantId}`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Прокинуть инициативу конкретному участнику (доступно и в подготовке, и в бою —
 * перебросить одного, не трогая остальных).
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function rollParticipant(
  id: string,
  participantId: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/participants/${participantId}/roll`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Прокинуть инициативу всем и начать бой (раунд 1).
 * Повторный вызов = полный ре-ролл заново.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function rollInitiative(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/roll`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Начать бой, НЕ перебрасывая уже брошенное (для ручной раздачи по одному).
 * Участники без броска уходят в конец в порядке добавления.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function startTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/start`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Передать ход следующему участнику; после последнего — новый раунд.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function nextTurn(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/turn/next`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Вернуть ход предыдущему участнику (откат случайного «Следующего хода»);
 * с первого участника раунда — назад к предыдущему раунду.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function previousTurn(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/turn/prev`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}

/**
 * Завершить бой: броски очищаются, состав сохраняется, статус снова PREPARING.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function resetTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const { data } = await httpClient.post<unknown>({
    url: `${INITIATIVE_API_PATH}/${id}/reset`,
    version: API_VERSION,
    headers: trackerHeaders(accessKey),
  });

  return parseTrackerDetailed(data);
}
