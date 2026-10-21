import axios from 'axios';

import { httpClient } from '@/shared/api';
import { SOURCE_PLATFORM } from '@/shared/const/platform';
import { getCommentsBaseUrl } from '@/shared/utils/getApiUrl';

import {
  COMMENTS_API_PATH,
  COMMENTS_PAGE_SIZE,
  COMMENTS_ROOT_SORT,
  COMMENTS_UNKNOWN_ERROR_MESSAGE,
} from './constants';
import {
  normalizeCommentContent,
  parseComment,
  parseCommentRateLimit,
  parseCommentReplies,
  parseCommentsCount,
  parseCreateCommentRequest,
  parseLatestComment,
  parsePublicComment,
  parsePublicCommentsPage,
} from './schemas';

import type {
  CommentEntry,
  CommentRateLimitInfo,
  CommentsPage,
  CreateCommentRequest,
  PublicComment,
} from './types';

/**
 * Данные формы отправки. Платформа-источник у всего фронта одна и подставляется
 * здесь, на границе с сервисом, — вызывающему коду про неё знать незачем.
 */
type CommentDraft = Omit<CreateCommentRequest, 'sourcePlatform'>;

/** Тело ошибки сервиса комментариев: RFC 7807 ProblemDetail. */
type CommentErrorPayload = {
  detail?: unknown;
  message?: unknown;
};

/**
 * Достаёт HTTP-статус из ошибки axios.
 *
 * @param error Пойманная ошибка.
 */
export function getCommentFetchStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

/**
 * Возвращает человекочитаемое сообщение об ошибке сервиса комментариев.
 * Сервис отвечает RFC 7807 ProblemDetail — готовый русский текст лежит
 * в поле `detail` (поля `message` в теле нет).
 *
 * @param error Пойманная ошибка.
 */
export function getCommentErrorMessage(error: unknown): string {
  if (axios.isAxiosError<CommentErrorPayload>(error)) {
    const { detail, message } = error.response?.data ?? {};

    if (typeof detail === 'string' && detail) {
      return detail;
    }

    if (typeof message === 'string' && message) {
      return message;
    }

    return error.message || COMMENTS_UNKNOWN_ERROR_MESSAGE;
  }

  return COMMENTS_UNKNOWN_ERROR_MESSAGE;
}

/**
 * Достаёт параметры антиспам-лимита из отказа 429: секунды до следующей
 * попытки (из тела ответа, при отсутствии — из заголовка `Retry-After`)
 * и флаг трёхчасовой блокировки.
 *
 * @param error Пойманная ошибка.
 */
export function getCommentRateLimit(error: unknown): CommentRateLimitInfo {
  if (!axios.isAxiosError(error)) {
    return { retryAfterSeconds: null, blocked: false };
  }

  const fromBody = parseCommentRateLimit(error.response?.data);

  if (fromBody.retryAfterSeconds !== null) {
    return fromBody;
  }

  const headerValue = error.response?.headers['retry-after'];
  const headerSeconds = headerValue ? Number(headerValue) : Number.NaN;

  return {
    ...fromBody,
    retryAfterSeconds: Number.isFinite(headerSeconds) ? headerSeconds : null,
  };
}

/**
 * Страница корневых комментариев страницы, свежие сверху.
 * Кроме опубликованных сервис отдаёт надгробия — удалённые комментарии,
 * у которых остались живые ответы; ответы приходят отдельным запросом
 * `fetchCommentReplies`.
 *
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела (ключ обсуждения).
 * @param page Номер страницы (с нуля).
 * @param size Размер страницы (по умолчанию — обычная лента).
 */
export async function fetchRootComments(
  section: string,
  url: string,
  page: number,
  size: number = COMMENTS_PAGE_SIZE,
): Promise<CommentsPage<PublicComment>> {
  const { data } = await httpClient.get<unknown>({
    url: COMMENTS_API_PATH,
    baseUrl: getCommentsBaseUrl(),
    payload: {
      sourcePlatform: SOURCE_PLATFORM,
      section,
      url,
      page,
      size,
      sort: COMMENTS_ROOT_SORT,
    },
  });

  return parsePublicCommentsPage(data);
}

/**
 * Число опубликованных комментариев страницы (вместе с ответами), поэтому
 * значение не совпадает с числом корней из пагинации.
 *
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела.
 */
export async function fetchCommentsCount(
  section: string,
  url: string,
): Promise<number> {
  const { data } = await httpClient.get<unknown>({
    url: `${COMMENTS_API_PATH}/count`,
    baseUrl: getCommentsBaseUrl(),
    payload: { sourcePlatform: SOURCE_PLATFORM, section, url },
  });

  return parseCommentsCount(data);
}

/**
 * Самый свежий опубликованный комментарий страницы, включая ответы —
 * для свёрнутого превью блока. Требует эндпоинта `/latest` (новые сборки
 * сервиса); вызывающий код при ошибке откатывается к последнему корню.
 *
 * @param section Раздел сайта в сервисе комментариев.
 * @param url URL страницы внутри раздела.
 * @returns Комментарий либо `null`, если у страницы нет комментариев.
 */
export async function fetchLatestComment(
  section: string,
  url: string,
): Promise<PublicComment | null> {
  const { data } = await httpClient.get<unknown>({
    url: `${COMMENTS_API_PATH}/latest`,
    baseUrl: getCommentsBaseUrl(),
    payload: { sourcePlatform: SOURCE_PLATFORM, section, url },
  });

  return parseLatestComment(data);
}

/**
 * Один комментарий по идентификатору. Удалённый с живыми ответами приходит
 * надгробием, удалённый без них — 404 (как и несуществующий).
 * Используется для перехода по прямой ссылке: по `parentId` фронт
 * поднимается по цепочке предков до корня.
 *
 * @param commentId Идентификатор комментария.
 */
export async function fetchCommentById(
  commentId: string,
): Promise<PublicComment> {
  const { data } = await httpClient.get<unknown>({
    url: `${COMMENTS_API_PATH}/${commentId}`,
    baseUrl: getCommentsBaseUrl(),
  });

  return parsePublicComment(data);
}

/**
 * Прямые ответы на комментарий — сервис отдаёт только один уровень,
 * глубже нужно спускаться отдельными запросами. Среди ответов могут быть
 * надгробия удалённых комментариев со своими живыми ветками.
 *
 * @param parentId Идентификатор родительского комментария.
 */
export async function fetchCommentReplies(
  parentId: string,
): Promise<PublicComment[]> {
  const { data } = await httpClient.get<unknown>({
    url: `${COMMENTS_API_PATH}/${parentId}/replies`,
    baseUrl: getCommentsBaseUrl(),
  });

  return parseCommentReplies(data);
}

/**
 * Создаёт корневой комментарий от текущего пользователя.
 *
 * @param request Раздел, URL страницы и текст.
 */
export async function createRootComment(
  request: CommentDraft,
): Promise<CommentEntry> {
  const { data } = await httpClient.post<unknown>({
    url: COMMENTS_API_PATH,
    baseUrl: getCommentsBaseUrl(),
    payload: parseCreateCommentRequest({
      ...request,
      sourcePlatform: SOURCE_PLATFORM,
    }),
  });

  return parseComment(data);
}

/**
 * Создаёт ответ на опубликованный комментарий.
 *
 * @param parentId Идентификатор родительского комментария.
 * @param request Раздел, URL страницы и текст.
 */
export async function createCommentReply(
  parentId: string,
  request: CommentDraft,
): Promise<CommentEntry> {
  const { data } = await httpClient.post<unknown>({
    url: `${COMMENTS_API_PATH}/${parentId}/replies`,
    baseUrl: getCommentsBaseUrl(),
    payload: parseCreateCommentRequest({
      ...request,
      sourcePlatform: SOURCE_PLATFORM,
    }),
  });

  return parseComment(data);
}

/**
 * Изменяет текст своего комментария (409 — комментарий уже удалён).
 *
 * @param commentId Идентификатор комментария.
 * @param content Новый текст.
 */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<CommentEntry> {
  const { data } = await httpClient.patch<unknown>({
    url: `${COMMENTS_API_PATH}/${commentId}`,
    baseUrl: getCommentsBaseUrl(),
    payload: { content: normalizeCommentContent(content) },
  });

  return parseComment(data);
}

/**
 * Мягко удаляет свой комментарий. Ветка ответов при этом не прячется:
 * комментарий с живыми ответами остаётся в выдаче надгробием и исчезает
 * сам, когда удалят последний ответ под ним. Комментарий без ответов
 * пропадает из выдачи сразу.
 *
 * @param commentId Идентификатор комментария.
 */
export async function deleteComment(commentId: string): Promise<void> {
  await httpClient.delete({
    url: `${COMMENTS_API_PATH}/${commentId}`,
    baseUrl: getCommentsBaseUrl(),
  });
}

/**
 * Возвращает мягко удалённый комментарий в опубликованные (модератор, админ).
 * Восстанавливается только сам узел: ответы под ним остались опубликованными
 * и снова становятся видны вместе с ним. Комментарий в любом другом статусе —
 * 409; скрытие баном снимается разблокировкой автора в auth-service.
 *
 * @param commentId Идентификатор комментария.
 */
export async function restoreComment(commentId: string): Promise<CommentEntry> {
  const { data } = await httpClient.post<unknown>({
    url: `${COMMENTS_API_PATH}/${commentId}/restore`,
    baseUrl: getCommentsBaseUrl(),
  });

  return parseComment(data);
}

/**
 * Отправляет жалобу на комментарий. Сервис принимает одну жалобу на
 * пользователя: повторная (или жалоба на удалённый комментарий) даёт 409.
 *
 * @param commentId Идентификатор комментария.
 */
export async function reportComment(commentId: string): Promise<CommentEntry> {
  const { data } = await httpClient.post<unknown>({
    url: `${COMMENTS_API_PATH}/${commentId}/dislike`,
    baseUrl: getCommentsBaseUrl(),
  });

  return parseComment(data);
}
