import type {
  CommentBase,
  CommentEntry,
  CommentRateLimitInfo,
  CommentsPage,
  CreateCommentRequest,
  PublicComment,
} from './types';

import { consola } from 'consola';
import { z } from 'zod';

import {
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_STATUSES,
  COMMENT_URL_MAX_LENGTH,
} from './constants';

/** Наименьшая длина массива-даты Jackson: год, месяц и день. */
const JACKSON_DATE_MIN_LENGTH = 3;

/**
 * Приводит дату сервиса к ISO-строке. Jackson отдаёт дату строкой, числом
 * миллисекунд или массивом `[год, месяц, день, час, минута, секунда]`.
 * Непригодное значение становится пустой строкой, и дата скрывается.
 * @param value - дата из ответа сервиса
 */
export function normalizeCommentDate(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  const parts = z.array(z.number()).safeParse(value);

  if (parts.success && parts.data.length >= JACKSON_DATE_MIN_LENGTH) {
    const [year = 0, month = 1, day = 1, hour = 0, minute = 0, second = 0] =
      parts.data;

    if (!year) {
      return '';
    }

    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    ).toISOString();
  }

  if (value != null) {
    consola.warn('[comments] Неизвестный формат даты:', value);
  }

  return '';
}

const commentDateSchema = z.unknown().transform(normalizeCommentDate);

/**
 * Статус комментария. Незнакомый считается опубликованным: спрятать живой
 * комментарий хуже, чем показать его без точной пометки.
 */
const commentStatusSchema = z.enum(COMMENT_STATUSES).catch('PUBLISHED');

/**
 * Комментарий из ответа сервиса. У полей есть запасные значения, чтобы одно
 * битое поле не роняло ленту; без `id` комментарий бесполезен. Автор и текст
 * бывают пустыми у надгробия.
 */
const commentSchema = z.object({
  id: z.string().min(1),
  sourcePlatform: z.string().nullish().catch(null),
  section: z.string().nullish().catch(null),
  url: z.string().nullish().catch(null),
  parentId: z.string().nullish().catch(null),
  authorId: z.string().nullish().catch(null),
  authorName: z.string().nullish().catch(null),
  content: z.string().nullish().catch(null),
  status: commentStatusSchema,
  replyCount: z.coerce.number().catch(0),
  totalReplyCount: z.coerce.number().nullish().catch(null),
  parentAuthorName: z.string().nullish().catch(null),
  dislikeCount: z.coerce.number().nullish().catch(null),
  createdAt: commentDateSchema,
  editedAt: commentDateSchema.nullable().catch(null),
});

type ParsedComment = z.infer<typeof commentSchema>;

/**
 * Разбирает массив комментариев поштучно: одна битая запись не должна
 * превращать ленту в «комментариев нет».
 * @param input - массив из ответа сервиса
 */
function parseCommentList(input: unknown): Array<ParsedComment> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item: unknown) => {
    const parsed = commentSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[comments] Комментарий не прошёл разбор:', item);

      return [];
    }

    return [parsed.data];
  });
}

const commentsPageSchema = z.object({
  content: z.unknown().transform(parseCommentList),
  totalElements: z.coerce.number().catch(0),
  last: z.boolean().catch(true),
});

/**
 * Текст комментария: сервер его не проверяет (пустая строка даёт 500),
 * поэтому обрезаем и проверяем на фронте.
 */
const commentContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(COMMENT_CONTENT_MAX_LENGTH);

const createCommentRequestSchema = z.object({
  sourcePlatform: z.string().min(1),
  section: z.string().trim().min(1).max(COMMENT_SECTION_MAX_LENGTH),
  url: z.string().trim().min(1).max(COMMENT_URL_MAX_LENGTH),
  content: commentContentSchema,
});

const commentRateLimitSchema = z
  .object({
    retryAfterSeconds: z.coerce.number().nullish().catch(null),
    blocked: z.boolean().catch(false),
  })
  .catch({ retryAfterSeconds: null, blocked: false });

/**
 * Поля, общие для комментария и надгробия.
 * @param parsed - разобранный комментарий
 */
function toCommentBase(parsed: ParsedComment): CommentBase {
  return {
    id: parsed.id,
    sourcePlatform: parsed.sourcePlatform ?? null,
    section: parsed.section ?? null,
    url: parsed.url ?? null,
    parentId: parsed.parentId ?? null,
    status: parsed.status,
    replyCount: parsed.replyCount,
    totalReplyCount: parsed.totalReplyCount ?? null,
    parentAuthorName: parsed.parentAuthorName ?? null,
    createdAt: parsed.createdAt,
  };
}

/**
 * Комментарий с содержимым: в ответах на действия автор и текст есть всегда.
 * @param parsed - разобранный комментарий
 */
function toCommentEntry(parsed: ParsedComment): CommentEntry {
  return {
    ...toCommentBase(parsed),
    authorId: parsed.authorId ?? '',
    authorName: parsed.authorName ?? '',
    content: parsed.content ?? '',
    dislikeCount: parsed.dislikeCount ?? 0,
    editedAt: parsed.editedAt ?? null,
  };
}

/**
 * Элемент публичной выдачи. Удалённый комментарий без текста становится
 * надгробием; пустая строка приравнена к отсутствию текста.
 * @param parsed - разобранный комментарий
 */
function toPublicComment(parsed: ParsedComment): PublicComment {
  if (parsed.status === 'DELETED' && !parsed.content?.trim()) {
    return {
      ...toCommentBase(parsed),
      status: 'DELETED',
      authorId: null,
      authorName: null,
      content: null,
      dislikeCount: null,
      editedAt: null,
    };
  }

  return toCommentEntry(parsed);
}

/**
 * Комментарий из ответа на создание, правку, жалобу или восстановление.
 * @param input - ответ сервиса
 */
export function parseComment(input: unknown): CommentEntry {
  return toCommentEntry(commentSchema.parse(input));
}

/**
 * Комментарий публичной выдачи, им может оказаться надгробие.
 * @param input - ответ сервиса
 */
export function parsePublicComment(input: unknown): PublicComment {
  return toPublicComment(commentSchema.parse(input));
}

/**
 * Ответ `/latest`: комментарий либо `null`, если обсуждения ещё нет.
 * @param input - ответ сервиса
 */
export function parseLatestComment(input: unknown): PublicComment | null {
  if (input == null || input === '') {
    return null;
  }

  return parsePublicComment(input);
}

/**
 * Страница корневых комментариев.
 * @param input - ответ сервиса
 */
export function parseCommentsPage(input: unknown): CommentsPage {
  const parsed = commentsPageSchema.parse(input);

  return {
    items: parsed.content.map(toPublicComment),
    totalElements: parsed.totalElements,
    last: parsed.last,
  };
}

/**
 * Прямые ответы, от старых к новым, чтобы ветка читалась по порядку.
 * @param input - ответ сервиса
 */
export function parseCommentReplies(input: unknown): Array<PublicComment> {
  return parseCommentList(input)
    .map(toPublicComment)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

/**
 * Число опубликованных комментариев страницы вместе с ответами.
 * @param input - ответ сервиса
 */
export function parseCommentsCount(input: unknown): number {
  return z.coerce.number().catch(0).parse(input);
}

/**
 * Параметры антиспам-лимита из тела отказа 429.
 * @param input - тело ответа
 */
export function parseCommentRateLimit(input: unknown): CommentRateLimitInfo {
  const parsed = commentRateLimitSchema.parse(input);

  return {
    retryAfterSeconds: parsed.retryAfterSeconds ?? null,
    blocked: parsed.blocked,
  };
}

/**
 * Обрезает и проверяет текст комментария перед отправкой.
 * @param content - текст из формы
 */
export function normalizeCommentContent(content: string): string {
  return commentContentSchema.parse(content);
}

/**
 * Проверяет тело создания комментария перед отправкой.
 * @param request - данные формы
 */
export function parseCreateCommentRequest(
  request: CreateCommentRequest,
): CreateCommentRequest {
  return createCommentRequestSchema.parse(request);
}
