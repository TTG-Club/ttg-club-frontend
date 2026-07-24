import { SOURCE_PLATFORM } from '@/shared/const/platform';

import {
  COMMENT_ANCHOR_PREFIX,
  COMMENT_SECTION_MAX_LENGTH,
  COMMENT_URL_MAX_LENGTH,
  COMMENTS_ENABLED_SECTIONS,
} from './constants';

import type {
  CommentEntry,
  CommentNode,
  CommentsTarget,
  CommentTombstone,
  PublicComment,
} from './types';

/**
 * DOM-идентификатор якоря комментария — для ссылок вида `#comment-<id>`.
 *
 * @param commentId Идентификатор комментария.
 */
export function getCommentAnchorId(commentId: string): string {
  return `${COMMENT_ANCHOR_PREFIX}${commentId}`;
}

/**
 * Извлекает pathname из абсолютного адреса; относительный путь очищается
 * от query и hash. Невалидный абсолютный адрес превращается в пустой путь.
 *
 * @param pathOrUrl Канонический путь либо абсолютный URL деталки.
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
 * Префиксы разделов от длинного к короткому: `/items/magic` должен
 * побеждать `/items`, иначе магические предметы попали бы в чужой тред.
 */
const commentsSectionPrefixes = Object.keys(COMMENTS_ENABLED_SECTIONS).sort(
  (first, second) => second.length - first.length,
);

/**
 * Выводит цель обсуждения из канонического пути деталки. Комментарии
 * включаются только на страницах разделов из `COMMENTS_ENABLED_SECTIONS`, и
 * только когда за префиксом раздела остаётся ровно один сегмент — слаг
 * сущности. Списки, мастерская, вложенные архетипы классов
 * (`/classes/бард/знаний`) и служебные страницы отсекаются.
 *
 * @param pathOrUrl Канонический путь (`/spells/ognennyj-shar`) либо
 * абсолютный URL деталки.
 */
export function getCommentsTarget(pathOrUrl: string): CommentsTarget | null {
  const pathname = extractPathname(pathOrUrl).replace(/\/+$/, '');

  const prefix = commentsSectionPrefixes.find((candidate) =>
    pathname.startsWith(`${candidate}/`),
  );

  if (!prefix) {
    return null;
  }

  const section = COMMENTS_ENABLED_SECTIONS[prefix];
  const slug = pathname.slice(prefix.length + 1);

  // Ровно один сегмент: пустой слаг — это список, а лишние сегменты — уже
  // другая сущность (архетип класса), у неё своего обсуждения нет.
  if (!section || !slug || slug.includes('/')) {
    return null;
  }

  const url = `${prefix}/${slug}`;

  // Предохранитель от ограничений сервиса: слишком длинный ключ не создаст
  // тред, к которому нельзя будет обратиться повторно.
  if (
    section.length > COMMENT_SECTION_MAX_LENGTH ||
    url.length > COMMENT_URL_MAX_LENGTH
  ) {
    return null;
  }

  return { section, url };
}

/**
 * Достаёт идентификатор пользователя (клейм `sub`) из JWT сервиса
 * аутентификации. Сервис комментариев подписывает комментарии этим же
 * идентификатором, а профиль сайта (`/user/info`) его не отдаёт — сравнить
 * «свой или чужой» больше не по чему.
 *
 * Подпись здесь не проверяется и не может быть проверена: это делает сервис
 * на каждом запросе. Значение используется только для показа кнопок правки и
 * удаления — подделка токена в браузере ничего не даст, сервис всё равно
 * ответит 403.
 *
 * @param token JWT из куки авторизации.
 * @returns UUID пользователя либо пустая строка, если токена нет или он битый.
 */
export function getTokenSubject(token: string | undefined): string {
  const payload = token?.split('.')[1];

  if (!payload) {
    return '';
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded: unknown = JSON.parse(atob(normalized));

    if (
      decoded &&
      typeof decoded === 'object' &&
      'sub' in decoded &&
      typeof decoded.sub === 'string'
    ) {
      return decoded.sub;
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Буква для аватара автора: первый символ имени в верхнем регистре.
 * Пустая строка — аватар остаётся без подписи (имени нет у надгробия).
 *
 * @param authorName Имя автора комментария.
 */
export function getCommentAuthorInitial(authorName: string | null): string {
  return authorName?.trim().charAt(0).toUpperCase() ?? '';
}

/**
 * Есть ли под комментарием живые ответы — то, ради чего ветку нужно грузить
 * и держать. Считает потомков на любой глубине, а не прямых детей: между
 * комментарием и живым ответом может стоять надгробие, а оно в `replyCount`
 * родителя не входит (там только опубликованные дети). По `replyCount` такой
 * узел выглядел бы листом, и живая ветка под надгробием не догрузилась бы
 * совсем — сервис отдал бы её, но за ней никто бы не пришёл.
 *
 * Старые сборки сервиса `totalReplyCount` не присылают — тогда известны
 * только прямые ответы, и вложенное надгробие остаётся невидимым; лучшего
 * источника у клиента нет.
 *
 * @param comment Комментарий сервиса.
 */
export function hasLiveReplies(comment: PublicComment): boolean {
  return (comment.totalReplyCount ?? comment.replyCount) > 0;
}

/**
 * Создаёт узел локального дерева комментариев. Листья (без живых ответов)
 * сразу считаются загруженными и развёрнутыми, чтобы не показывать для них
 * кнопку догрузки и сразу отображать ответы, добавленные текущим
 * пользователем.
 *
 * Имя автора родителя в узле не хранится: подпись «кому ответили» ветка
 * передаёт вниз пропом. Иначе её пришлось бы обновлять руками — например,
 * когда модератор восстановит родителя-надгробие и имя станет известно.
 *
 * @param comment Комментарий сервиса.
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
 * Накладывает ответ сервиса на восстановление поверх прежней записи: поля,
 * которых в одиночном ответе может не быть, берутся из неё — ссылка на
 * страницу и подпись «кому ответили» не должны пропадать после действия.
 *
 * @param previous Прежняя запись из дерева комментариев.
 * @param restored Комментарий из ответа сервиса.
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
    // Счётчики ответов терять нельзя: обнулившись, они убирают кнопку ветки,
    // и живые ответы становятся недостижимы. Отсутствующее поле схема
    // превращает в 0/null, а от восстановления ответы не исчезают —
    // поэтому берём большее из известных.
    replyCount: Math.max(restored.replyCount, previous.replyCount),
    totalReplyCount: restored.totalReplyCount ?? previous.totalReplyCount,
  };
}

/**
 * Ищет узел по идентификатору комментария во всём дереве (в глубину).
 *
 * @param nodes Корни дерева или поддерева.
 * @param commentId Идентификатор искомого комментария.
 */
export function findCommentNode(
  nodes: CommentNode[],
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
 * Принадлежит ли комментарий треду этой платформы. Проверка нужна на переходах
 * по прямой ссылке: комментарий там достаётся по идентификатору, а он
 * глобальный — без сверки якорь на комментарий другого сайта развернул бы чужую
 * ветку. Старые сборки сервиса этих полей не присылают — тогда принадлежность
 * не проверяется (доверяем).
 *
 * @param comment Комментарий сервиса.
 * @param section Раздел треда.
 * @param url URL страницы треда.
 */
export function isCommentFromThread(
  comment: PublicComment,
  section: string,
  url: string,
): boolean {
  return (
    (comment.sourcePlatform === null ||
      comment.sourcePlatform === SOURCE_PLATFORM) &&
    (comment.section === null || comment.section === section) &&
    (comment.url === null || comment.url === url)
  );
}

/**
 * Надгробие ли это — заглушка на месте удалённого комментария, которая
 * держит видимой ветку его ответов. Сужает тип, открывая доступ к автору и
 * тексту в отрицательной ветке.
 *
 * Одного статуса мало: `DELETED` приходит и у обычного удалённого
 * комментария, вместе с автором и полным текстом. Отличает заглушку именно
 * отсутствие текста.
 *
 * @param comment Комментарий публичной выдачи.
 */
export function isCommentTombstone(
  comment: PublicComment,
): comment is CommentTombstone {
  return comment.status === 'DELETED' && comment.content === null;
}

/**
 * Присылает ли сервис точный размер поддерева (`totalReplyCount`).
 * Если да — фоновую догрузку счётчиков можно не запускать.
 *
 * @param comment Комментарий сервиса.
 */
export function hasServerReplyTotal(comment: PublicComment): boolean {
  return comment.totalReplyCount !== null;
}

/**
 * Считает всех потомков узла (ответы, ответы на ответы и глубже).
 * Для загруженной ветки — фактический размер поддерева. Для ещё не
 * загруженной берётся серверное `totalReplyCount` (новые сборки), а если
 * его нет — известны только прямые ответы (`replyCount`), число уточнится
 * после догрузки ветки.
 *
 * @param node Узел дерева комментариев.
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
 * Удаляет узел вместе с поддеревом из дерева (мутирует переданные массивы —
 * они являются reactive-состоянием ленты).
 *
 * @param nodes Корни дерева или поддерева.
 * @param commentId Идентификатор удаляемого комментария.
 * @returns true, если узел нашёлся и был удалён.
 */
export function removeCommentNode(
  nodes: CommentNode[],
  commentId: string,
): boolean {
  const nodeIndex = nodes.findIndex((node) => node.comment.id === commentId);

  if (nodeIndex !== -1) {
    nodes.splice(nodeIndex, 1);

    return true;
  }

  return nodes.some((node) => removeCommentNode(node.replies, commentId));
}
