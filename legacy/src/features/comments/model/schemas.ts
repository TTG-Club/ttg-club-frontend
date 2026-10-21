import { SOURCE_PLATFORMS } from '@/shared/const/platform';
import { z } from '@/shared/utils/zod';

import {
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_URL_MAX_LENGTH,
} from './constants';

import type {
  CommentBase,
  CommentEntry,
  CommentRateLimitInfo,
  CommentsPage,
  CreateCommentRequest,
  PublicComment,
} from './types';

/**
 * Приводит дату сервиса к ISO-строке. Jackson может сериализовать дату
 * ISO-строкой, epoch-числом (миллисекунды) или массивом
 * `[год, месяц 1-12, день, час, минута, секунда, наносекунды?]`.
 * Непригодное значение превращается в пустую строку (дата скрывается),
 * а его форма пишется в консоль — чтобы формат бэка не терялся молча.
 *
 * @param value Сырое значение даты из ответа сервиса.
 */
function normalizeCommentDate(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((element) => typeof element === 'number')
  ) {
    const [year = 0, month = 1, day = 1, hour = 0, minute = 0, second = 0] =
      value;

    if (!year) {
      return '';
    }

    // Наносекунды (7-й элемент) отбрасываются; дата трактуется как UTC.
    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    ).toISOString();
  }

  if (value !== null && value !== undefined) {
    console.warn('[comments] Неизвестный формат даты от сервиса:', value);
  }

  return '';
}

/** Дата сервиса в любом формате Jackson, нормализованная к ISO-строке. */
const commentDateSchema = z.unknown().transform(normalizeCommentDate);

/**
 * Схема комментария. Поля снабжены `catch`-дефолтами, чтобы битое поле не
 * роняло всю ленту. Исключение — `id`: без него комментарий бесполезен.
 *
 * Автор, текст и счётчик жалоб допускают `null`: так сервис отдаёт надгробие
 * удалённого комментария, который держит видимой ветку своих ответов.
 */
const commentSchema = z.object({
  id: z.string().min(1),
  // Принадлежность треду: на экране может жить несколько блоков сразу
  // (страница и боковая панель), по этим полям отсекаются чужие deep-link'и.
  sourcePlatform: z.enum(SOURCE_PLATFORMS).nullish().catch(null),
  section: z.string().nullish().catch(null),
  url: z.string().nullish().catch(null),
  parentId: z.string().nullish().catch(null),
  authorId: z.string().nullish().catch(null),
  authorName: z.string().nullish().catch(null),
  content: z.string().nullish().catch(null),
  status: z
    .enum([
      'PUBLISHED',
      'DELETED',
      'PENDING_MODERATION',
      'REJECTED',
      'SPAM',
      'HIDDEN_BY_BAN',
    ])
    .catch('PUBLISHED'),
  replyCount: z.coerce.number().catch(0),
  // Опциональные поля новых сборок сервиса — отсутствие не ломает разбор.
  totalReplyCount: z.coerce.number().nullish().catch(null),
  parentAuthorName: z.string().nullish().catch(null),
  dislikeCount: z.coerce.number().nullish().catch(null),
  createdAt: commentDateSchema,
  editedAt: commentDateSchema.nullable().catch(null),
});

type ParsedComment = z.infer<typeof commentSchema>;

/**
 * Разбирает массив комментариев, отсеивая битые записи поштучно и сообщая о
 * каждой в консоль. Важно именно поэлементно: `catch` на самом массиве отдал
 * бы пустую выдачу целиком из-за одного комментария без `id` — на экране это
 * выглядит как «комментариев нет» при непустом счётчике.
 *
 * @param input Сырой массив из ответа сервиса.
 */
function parseCommentList(input: unknown): ParsedComment[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = commentSchema.safeParse(item);

    if (!parsed.success) {
      console.warn('[comments] Комментарий не прошёл разбор:', item);

      return [];
    }

    return [parsed.data];
  });
}

/** Схема страницы Spring-пагинации корневых комментариев. */
const commentsPageSchema = z.object({
  content: z.unknown().transform(parseCommentList),
  totalElements: z.coerce.number().catch(0),
  last: z.boolean().catch(true),
});

const commentsCountSchema = z.coerce.number().catch(0);

/**
 * Текст комментария: сервер ввод не валидирует (пустая строка даёт 500,
 * пробельная — пустой «пузырь»), поэтому нормализуем и проверяем на фронте.
 */
const commentContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(COMMENT_CONTENT_MAX_LENGTH);

/** Схема тела создания комментария с лимитами сервиса на `section` и `url`. */
const createCommentRequestSchema = z.object({
  // Перечисление, а не строка: опечатка иначе завела бы обсуждение с ключом,
  // к которому больше никто не обратится, и заметить это можно было бы только
  // по опустевшей ленте.
  sourcePlatform: z.enum(SOURCE_PLATFORMS),
  section: z.string().trim().min(1).max(COMMENT_SECTION_MAX_LENGTH),
  url: z.string().trim().min(1).max(COMMENT_URL_MAX_LENGTH),
  content: commentContentSchema,
});

/**
 * Поля, общие для комментария и надгробия.
 *
 * @param parsed Разобранный ответ сервиса.
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
 * Приводит разобранный zod-объект к комментарию с содержимым. Пустые автор,
 * текст и счётчик жалоб подставляются здесь, на границе с сервисом: в этих
 * ответах их не бывает, и дальше по коду поля уже гарантированно есть.
 *
 * @param parsed Разобранный ответ сервиса.
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
 * Приводит разобранный zod-объект к элементу публичной выдачи. Удалённый
 * комментарий без текста — надгробие: сервис не раскрывает ни автора, ни
 * содержимое, и дальше такой узел рисуется заглушкой. Всё остальное (в том
 * числе битая запись с текстом, но без статуса) разбирается как обычный
 * комментарий.
 *
 * Пустая строка приравнена к отсутствию текста: сборка сервиса, которая
 * затирает содержимое вместо `null`, иначе доехала бы до ленты карточкой без
 * автора и текста, но с рабочими кнопками ответа и жалобы (сервис отбил бы их
 * 409). Ниже по коду надгробие узнаётся уже строго по `content === null`.
 *
 * @param parsed Разобранный ответ сервиса.
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
 * Валидирует один комментарий из ответа сервиса на действие (создание,
 * правка, жалоба, восстановление) — в них содержимое есть всегда.
 *
 * @param input Сырой ответ сервера.
 */
export function parseComment(input: unknown): CommentEntry {
  return toCommentEntry(commentSchema.parse(input));
}

/**
 * Валидирует один комментарий публичной выдачи — им может оказаться
 * надгробие удалённого.
 *
 * @param input Сырой ответ сервера.
 */
export function parsePublicComment(input: unknown): PublicComment {
  return toPublicComment(commentSchema.parse(input));
}

/**
 * Валидирует ответ `/latest`: комментарий либо `null`, если у страницы
 * ещё нет комментариев (сервис может ответить пустым телом или 204).
 *
 * @param input Сырой ответ сервера.
 */
export function parseLatestComment(input: unknown): PublicComment | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  return toPublicComment(commentSchema.parse(input));
}

/**
 * Валидирует страницу комментариев публичной ленты — среди них бывают
 * надгробия удалённых.
 *
 * @param input Сырой ответ сервера.
 */
export function parsePublicCommentsPage(
  input: unknown,
): CommentsPage<PublicComment> {
  const parsed = commentsPageSchema.parse(input);

  return {
    items: parsed.content.map(toPublicComment),
    totalElements: parsed.totalElements,
    last: parsed.last,
  };
}

/**
 * Валидирует список прямых ответов и сортирует их от старых к новым,
 * чтобы ветка читалась хронологически. Среди ответов бывают надгробия.
 *
 * @param input Сырой ответ сервера.
 */
export function parseCommentReplies(input: unknown): PublicComment[] {
  return parseCommentList(input)
    .map(toPublicComment)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

/**
 * Валидирует счётчик комментариев страницы (учитывает и ответы).
 *
 * @param input Сырой ответ сервера.
 */
export function parseCommentsCount(input: unknown): number {
  return commentsCountSchema.parse(input);
}

/** Схема тела отказа 429 антиспам-лимита (RFC 7807 и поля лимита). */
const commentRateLimitSchema = z
  .object({
    retryAfterSeconds: z.coerce.number().nullish().catch(null),
    blocked: z.boolean().catch(false),
  })
  .catch({ retryAfterSeconds: null, blocked: false });

/**
 * Валидирует параметры антиспам-лимита из тела отказа 429 — битое или
 * чужое тело превращается в «параметры неизвестны».
 *
 * @param input Сырое тело ответа.
 */
export function parseCommentRateLimit(input: unknown): CommentRateLimitInfo {
  const parsed = commentRateLimitSchema.parse(input);

  return {
    retryAfterSeconds: parsed.retryAfterSeconds ?? null,
    blocked: parsed.blocked,
  };
}

/**
 * Нормализует (обрезает пробелы) и валидирует текст комментария перед
 * отправкой.
 *
 * @param content Текст из формы.
 */
export function normalizeCommentContent(content: string): string {
  return commentContentSchema.parse(content);
}

/**
 * Нормализует и валидирует тело создания комментария перед отправкой.
 *
 * @param request Данные формы.
 */
export function parseCreateCommentRequest(
  request: CreateCommentRequest,
): CreateCommentRequest {
  return createCommentRequestSchema.parse(request);
}
