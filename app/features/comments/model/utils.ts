import type {
  CommentEntry,
  CommentNode,
  CommentRateLimitInfo,
  CommentsTarget,
  CommentTombstone,
  PublicComment,
} from './types';

import { z } from 'zod';

import {
  COMMENT_ANCHOR_PREFIX,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_URL_MAX_LENGTH,
  COMMENTS_ENABLED_SECTIONS,
  COMMENTS_SOURCE_PLATFORM,
  COMMENTS_TEXT,
} from './constants';
import { parseCommentRateLimit } from './schemas';

/** Ошибка `$fetch`: статус, тело и заголовки ответа. */
const fetchErrorSchema = z.object({
  statusCode: z.number().optional(),
  data: z.unknown(),
  response: z.object({ headers: z.instanceof(Headers) }).optional(),
});

/** Тело ошибки сервиса: RFC 7807, текст лежит в `detail`. */
const problemDetailSchema = z.object({
  detail: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
});

/** Тело JWT с идентификатором пользователя. */
const tokenPayloadSchema = z.object({ sub: z.string() });

/** Словоформы для числа: одна, несколько и много. */
interface PluralForms {
  one: string;
  few: string;
  many: string;
}

/** Префиксы разделов от длинного к короткому: `/items/magic` раньше `/items`. */
const SECTION_PREFIXES = Object.keys(COMMENTS_ENABLED_SECTIONS).sort(
  (first, second) => second.length - first.length,
);

/**
 * Якорь комментария для ссылок вида `#comment-<id>`.
 * @param commentId - идентификатор комментария
 */
export function getCommentAnchorId(commentId: string): string {
  return `${COMMENT_ANCHOR_PREFIX}${commentId}`;
}

/**
 * Идентификатор комментария из якоря адреса.
 * @param hash - `route.hash` вместе с решёткой
 * @returns идентификатор либо `undefined`, если якорь не про комментарий
 */
export function getCommentIdFromHash(hash: string): string | undefined {
  const anchor = hash.slice(1);

  if (!anchor.startsWith(COMMENT_ANCHOR_PREFIX)) {
    return undefined;
  }

  return anchor.slice(COMMENT_ANCHOR_PREFIX.length) || undefined;
}

/**
 * Путь без домена, query и якоря.
 * @param pathOrUrl - путь или абсолютный адрес записи
 */
function extractPathname(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) {
    try {
      return new URL(pathOrUrl).pathname;
    } catch {
      return '';
    }
  }

  const separatorIndex = pathOrUrl.search(/[?#]/);

  return separatorIndex === -1 ? pathOrUrl : pathOrUrl.slice(0, separatorIndex);
}

/**
 * Цель обсуждения по адресу записи. Комментарии есть только у записей вида
 * `<раздел>/<слаг>` из `COMMENTS_ENABLED_SECTIONS`; списки и вложенные
 * адреса (архетип класса) своего обсуждения не имеют.
 * @param pathOrUrl - путь (`/spells/fireball`) или абсолютный адрес записи
 * @returns раздел и адрес либо `null`, если у страницы нет комментариев
 */
export function getCommentsTarget(pathOrUrl: string): CommentsTarget | null {
  const pathname = extractPathname(pathOrUrl).replace(/\/+$/, '');

  // Список одного раздела может выглядеть записью другого: `/items/magic`
  if (pathname in COMMENTS_ENABLED_SECTIONS) {
    return null;
  }

  const prefix = SECTION_PREFIXES.find((candidate) =>
    pathname.startsWith(`${candidate}/`),
  );

  if (!prefix) {
    return null;
  }

  const section = COMMENTS_ENABLED_SECTIONS[prefix];
  const slug = pathname.slice(prefix.length + 1);

  if (!section || !slug || slug.includes('/')) {
    return null;
  }

  const url = `${prefix}/${slug}`;

  // Слишком длинный ключ сервис не сохранит, а тред без ключа не найти.
  if (
    section.length > COMMENT_SECTION_MAX_LENGTH
    || url.length > COMMENT_URL_MAX_LENGTH
  ) {
    return null;
  }

  return { section, url };
}

/**
 * Идентификатор пользователя (`sub`) из JWT. Подпись не проверяется: значение
 * нужно только чтобы показать кнопки правки, права проверяет сервис.
 * @param token - JWT из отметки о входе
 */
export function getTokenSubject(token: string | null | undefined): string {
  const payload = token?.split('.')[1];

  if (!payload) {
    return '';
  }

  try {
    const decoded: unknown = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );

    const parsed = tokenPayloadSchema.safeParse(decoded);

    return parsed.success ? parsed.data.sub : '';
  } catch {
    return '';
  }
}

/**
 * HTTP-статус из ошибки `$fetch`.
 * @param error - пойманная ошибка
 */
export function getCommentErrorStatus(error: unknown): number | undefined {
  const parsed = fetchErrorSchema.safeParse(error);

  return parsed.success ? parsed.data.statusCode : undefined;
}

/**
 * Текст ошибки сервиса комментариев или общий запасной.
 * @param error - пойманная ошибка
 */
export function getCommentErrorMessage(error: unknown): string {
  const parsed = fetchErrorSchema.safeParse(error);

  if (!parsed.success) {
    return COMMENTS_TEXT.unknownError;
  }

  const body = problemDetailSchema.safeParse(parsed.data.data);

  if (!body.success) {
    return COMMENTS_TEXT.unknownError;
  }

  return body.data.detail ?? body.data.message ?? COMMENTS_TEXT.unknownError;
}

/**
 * Параметры антиспам-лимита из отказа 429: секунды до следующей попытки из
 * тела, а без них из заголовка `Retry-After`.
 * @param error - пойманная ошибка
 */
export function getCommentRateLimit(error: unknown): CommentRateLimitInfo {
  const parsed = fetchErrorSchema.safeParse(error);

  if (!parsed.success) {
    return { retryAfterSeconds: null, blocked: false };
  }

  const fromBody = parseCommentRateLimit(parsed.data.data);

  if (fromBody.retryAfterSeconds != null) {
    return fromBody;
  }

  const headerValue = parsed.data.response?.headers.get('retry-after');
  const headerSeconds = headerValue ? Number(headerValue) : Number.NaN;

  return {
    ...fromBody,
    retryAfterSeconds: Number.isFinite(headerSeconds) ? headerSeconds : null,
  };
}

/**
 * Словоформа для числа: «1 ответ», «3 ответа», «5 ответов».
 * @param count - число
 * @param forms - словоформы
 */
export function getPluralWord(count: number, forms: PluralForms): string {
  const form = new Intl.PluralRules('ru-RU').select(count);

  if (form === 'one' || form === 'few') {
    return forms[form];
  }

  return forms.many;
}

/**
 * Есть ли под комментарием живые ответы на любой глубине. Между ним и живым
 * ответом может стоять надгробие, которого нет в `replyCount`.
 * @param comment - комментарий сервиса
 */
export function hasLiveReplies(comment: PublicComment): boolean {
  return (comment.totalReplyCount ?? comment.replyCount) > 0;
}

/**
 * Присылает ли сервис точный размер поддерева.
 * @param comment - комментарий сервиса
 */
export function hasServerReplyTotal(comment: PublicComment): boolean {
  return comment.totalReplyCount != null;
}

/**
 * Надгробие ли это. Одного статуса мало: отличает заглушку отсутствие текста.
 * @param comment - комментарий публичной выдачи
 */
export function isCommentTombstone(
  comment: PublicComment,
): comment is CommentTombstone {
  return comment.status === 'DELETED' && comment.content === null;
}

/**
 * Узел локального дерева. Листья сразу загружены и развёрнуты: догружать
 * нечего, а свой новый ответ должен быть виден сразу.
 * @param comment - комментарий сервиса
 */
export function createCommentNode(comment: PublicComment): CommentNode {
  const isLeaf = !hasLiveReplies(comment);

  return {
    comment,
    replies: [],
    repliesLoaded: isLeaf,
    repliesLoading: false,
    repliesExpanded: isLeaf,
  };
}

/**
 * Накладывает ответ на восстановление на прежнюю запись: адрес, подпись
 * «кому ответили» и счётчики ответов не должны пропадать.
 * @param previous - прежняя запись
 * @param restored - комментарий из ответа сервиса
 */
export function mergeRestoredComment(
  previous: PublicComment,
  restored: CommentEntry,
): CommentEntry {
  return {
    ...restored,
    sourcePlatform: restored.sourcePlatform ?? previous.sourcePlatform,
    section: restored.section ?? previous.section,
    url: restored.url ?? previous.url,
    parentAuthorName: restored.parentAuthorName ?? previous.parentAuthorName,
    replyCount: Math.max(restored.replyCount, previous.replyCount),
    totalReplyCount: restored.totalReplyCount ?? previous.totalReplyCount,
  };
}

/**
 * Ищет узел по идентификатору во всём дереве.
 * @param nodes - корни дерева или поддерева
 * @param commentId - идентификатор комментария
 */
export function findCommentNode(
  nodes: Array<CommentNode>,
  commentId: string,
): CommentNode | undefined {
  for (const node of nodes) {
    if (node.comment.id === commentId) {
      return node;
    }

    const found = findCommentNode(node.replies, commentId);

    if (found) {
      return found;
    }
  }

  return undefined;
}

/**
 * Удаляет узел вместе с поддеревом. Меняет переданные массивы: это
 * реактивное состояние ленты.
 * @param nodes - корни дерева или поддерева
 * @param commentId - идентификатор комментария
 * @returns нашёлся ли узел
 */
export function removeCommentNode(
  nodes: Array<CommentNode>,
  commentId: string,
): boolean {
  const nodeIndex = nodes.findIndex((node) => node.comment.id === commentId);

  if (nodeIndex !== -1) {
    nodes.splice(nodeIndex, 1);

    return true;
  }

  return nodes.some((node) => removeCommentNode(node.replies, commentId));
}

/**
 * Число всех потомков узла. У незагруженной ветки берётся число от сервиса.
 * @param node - узел дерева
 */
export function countCommentDescendants(node: CommentNode): number {
  if (!node.repliesLoaded) {
    return node.comment.totalReplyCount ?? node.comment.replyCount;
  }

  return node.replies.reduce(
    (total, child) => total + 1 + countCommentDescendants(child),
    0,
  );
}

/**
 * Принадлежит ли комментарий треду. Идентификатор глобальный, поэтому якорь
 * на комментарий другой страницы или сайта не должен разворачивать чужую
 * ветку. Поля, которых сервис не прислал, не проверяются.
 * @param comment - комментарий сервиса
 * @param target - тред страницы
 */
export function isCommentFromThread(
  comment: PublicComment,
  target: CommentsTarget,
): boolean {
  return (
    (comment.sourcePlatform == null
      || comment.sourcePlatform === COMMENTS_SOURCE_PLATFORM)
    && (comment.section == null || comment.section === target.section)
    && (comment.url == null || comment.url === target.url)
  );
}
