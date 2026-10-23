import type {
  CommentDraft,
  CommentEntry,
  CommentsPage,
  CommentsTarget,
  PublicComment,
} from './types';

import { AUTH_REFRESH_PATH } from '~/shared/consts';

import {
  COMMENTS_API_PATH,
  COMMENTS_HTTP_STATUS,
  COMMENTS_PAGE_SIZE,
  COMMENTS_ROOT_SORT,
  COMMENTS_SOURCE_PLATFORM,
} from './constants';
import {
  normalizeCommentContent,
  parseComment,
  parseCommentReplies,
  parseCommentsCount,
  parseCommentsPage,
  parseCreateCommentRequest,
  parseLatestComment,
  parsePublicComment,
} from './schemas';
import { getCommentErrorStatus } from './utils';

/**
 * Повторяет чтение один раз после 401. Обсуждение открыто гостям, но
 * истёкший токен из cookie сервис отбивает до проверки прав: сессию
 * продлеваем, а если не вышло, бэкенд сбрасывает cookie и повтор уходит
 * анонимно.
 * @param read - чтение, которое повторяется как есть
 */
export async function readWithoutStaleToken<T>(
  read: () => Promise<T>,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (getCommentErrorStatus(error) !== COMMENTS_HTTP_STATUS.unauthorized) {
      throw error;
    }

    await $fetch(AUTH_REFRESH_PATH, { method: 'POST' }).catch(() => undefined);

    return await read();
  }
}

/**
 * Страница корневых комментариев, свежие сверху. Кроме опубликованных
 * приходят надгробия удалённых с живыми ответами.
 * @param target - тред страницы
 * @param page - номер страницы с нуля
 * @param size - размер страницы
 */
export async function fetchRootComments(
  target: CommentsTarget,
  page: number,
  size: number = COMMENTS_PAGE_SIZE,
): Promise<CommentsPage> {
  const response: unknown = await $fetch(COMMENTS_API_PATH, {
    query: {
      sourcePlatform: COMMENTS_SOURCE_PLATFORM,
      section: target.section,
      url: target.url,
      page,
      size,
      sort: COMMENTS_ROOT_SORT,
    },
    retry: 0,
  });

  return parseCommentsPage(response);
}

/**
 * Число опубликованных комментариев страницы вместе с ответами.
 * @param target - тред страницы
 */
export async function fetchCommentsCount(
  target: CommentsTarget,
): Promise<number> {
  const response: unknown = await $fetch(`${COMMENTS_API_PATH}/count`, {
    query: { sourcePlatform: COMMENTS_SOURCE_PLATFORM, ...target },
    retry: 0,
  });

  return parseCommentsCount(response);
}

/**
 * Самый свежий комментарий страницы, включая ответы, для свёрнутого превью.
 * @param target - тред страницы
 * @returns комментарий либо `null`, если обсуждения нет
 */
export async function fetchLatestComment(
  target: CommentsTarget,
): Promise<PublicComment | null> {
  const response: unknown = await $fetch(`${COMMENTS_API_PATH}/latest`, {
    query: { sourcePlatform: COMMENTS_SOURCE_PLATFORM, ...target },
    retry: 0,
  });

  return parseLatestComment(response);
}

/**
 * Комментарий по идентификатору: нужен для перехода по ссылке на ответ.
 * Удалённый с живыми ответами приходит надгробием, без них — 404.
 * @param commentId - идентификатор комментария
 */
export async function fetchCommentById(
  commentId: string,
): Promise<PublicComment> {
  const response: unknown = await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    retry: 0,
  });

  return parsePublicComment(response);
}

/**
 * Прямые ответы на комментарий: сервис отдаёт один уровень.
 * @param parentId - идентификатор родителя
 */
export async function fetchCommentReplies(
  parentId: string,
): Promise<Array<PublicComment>> {
  const response: unknown = await $fetch(
    `${COMMENTS_API_PATH}/${parentId}/replies`,
    { retry: 0 },
  );

  return parseCommentReplies(response);
}

/**
 * Создаёт корневой комментарий.
 * @param draft - тред и текст
 */
export async function createRootComment(
  draft: CommentDraft,
): Promise<CommentEntry> {
  const response: unknown = await $fetch(COMMENTS_API_PATH, {
    method: 'POST',
    body: parseCreateCommentRequest({
      ...draft,
      sourcePlatform: COMMENTS_SOURCE_PLATFORM,
    }),
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Создаёт ответ на комментарий.
 * @param parentId - идентификатор родителя
 * @param draft - тред и текст
 */
export async function createCommentReply(
  parentId: string,
  draft: CommentDraft,
): Promise<CommentEntry> {
  const response: unknown = await $fetch(
    `${COMMENTS_API_PATH}/${parentId}/replies`,
    {
      method: 'POST',
      body: parseCreateCommentRequest({
        ...draft,
        sourcePlatform: COMMENTS_SOURCE_PLATFORM,
      }),
      retry: 0,
    },
  );

  return parseComment(response);
}

/**
 * Меняет текст своего комментария; 409 — комментарий уже удалён.
 * @param commentId - идентификатор комментария
 * @param content - новый текст
 */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<CommentEntry> {
  const response: unknown = await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    method: 'PATCH',
    body: { content: normalizeCommentContent(content) },
    retry: 0,
  });

  return parseComment(response);
}

/**
 * Мягко удаляет комментарий. С живыми ответами он остаётся надгробием, без
 * них пропадает из выдачи.
 * @param commentId - идентификатор комментария
 */
export async function deleteComment(commentId: string): Promise<void> {
  await $fetch(`${COMMENTS_API_PATH}/${commentId}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Возвращает удалённый комментарий в опубликованные (модератор).
 * @param commentId - идентификатор комментария
 */
export async function restoreComment(commentId: string): Promise<CommentEntry> {
  const response: unknown = await $fetch(
    `${COMMENTS_API_PATH}/${commentId}/restore`,
    { method: 'POST', retry: 0 },
  );

  return parseComment(response);
}

/**
 * Жалоба на комментарий; повторная даёт 409.
 * @param commentId - идентификатор комментария
 */
export async function reportComment(commentId: string): Promise<CommentEntry> {
  const response: unknown = await $fetch(
    `${COMMENTS_API_PATH}/${commentId}/dislike`,
    { method: 'POST', retry: 0 },
  );

  return parseComment(response);
}
