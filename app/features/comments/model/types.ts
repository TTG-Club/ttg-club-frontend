import type { COMMENT_STATUSES } from './constants';

/** Статус комментария на стороне сервиса. */
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

/** Поля, которые есть у любого комментария, в том числе у надгробия. */
export interface CommentBase {
  id: string;
  /** Сайт обсуждения; старые сборки сервиса его не присылают. */
  sourcePlatform: string | null;
  /** Раздел страницы обсуждения; старые сборки сервиса его не присылают. */
  section: string | null;
  /** Адрес страницы обсуждения; старые сборки сервиса его не присылают. */
  url: string | null;
  parentId: string | null;
  status: CommentStatus;
  /** Число прямых ответов. */
  replyCount: number;
  /**
   * Число всех потомков ветки. Старые сборки сервиса поле не присылают, тогда
   * точное число собирается догрузкой веток.
   */
  totalReplyCount: number | null;
  /** Имя автора родителя: приходит там, где родитель не загружен. */
  parentAuthorName: string | null;
  createdAt: string;
}

/** Комментарий с автором и текстом. */
export interface CommentEntry extends CommentBase {
  authorId: string;
  authorName: string;
  content: string;
  dislikeCount: number;
  editedAt: string | null;
}

/**
 * Надгробие: заглушка на месте удалённого комментария, которая держит ветку
 * его ответов видимой. Автора и текста у неё нет.
 */
export interface CommentTombstone extends CommentBase {
  status: 'DELETED';
  authorId: null;
  authorName: null;
  content: null;
  dislikeCount: null;
  editedAt: null;
}

/** Элемент публичной выдачи: обычный комментарий либо надгробие. */
export type PublicComment = CommentEntry | CommentTombstone;

/** Страница комментариев (Spring-пагинация). */
export interface CommentsPage {
  items: Array<PublicComment>;
  totalElements: number;
  last: boolean;
}

/** Параметры антиспам-лимита из отказа 429. */
export interface CommentRateLimitInfo {
  /** Секунд до следующей попытки; `null`, если сервис не сообщил. */
  retryAfterSeconds: number | null;
  /** Длительная блокировка после повторных нарушений. */
  blocked: boolean;
}

/** Цель обсуждения: пара раздела и адреса страницы, ключ треда в сервисе. */
export interface CommentsTarget {
  /** Раздел сайта, например `magic-items`. */
  section: string;
  /** Канонический адрес страницы, например `/items/magic/bag-of-holding`. */
  url: string;
}

/** Тело создания корневого комментария или ответа. */
export interface CreateCommentRequest {
  sourcePlatform: string;
  section: string;
  url: string;
  content: string;
}

/** Данные формы отправки: платформу подставляет запрос. */
export type CommentDraft = Omit<CreateCommentRequest, 'sourcePlatform'>;

/**
 * Узел локального дерева. Сервис отдаёт только прямых детей, поэтому дерево
 * собирается на фронте по мере загрузки веток.
 */
export interface CommentNode {
  comment: PublicComment;
  replies: Array<CommentNode>;
  /** Прямые ответы загружены; у листьев сразу `true`. */
  repliesLoaded: boolean;
  /** Идёт загрузка поддерева. */
  repliesLoading: boolean;
  /** Ответы развёрнуты. */
  repliesExpanded: boolean;
}

/**
 * Действия над узлами, которые ветка передаёт вниз по рекурсии: глубина
 * дерева не ограничена, события наверх не всплывают.
 */
export interface CommentTreeActions {
  toggleReplies: (node: CommentNode) => Promise<void>;
  submitReply: (node: CommentNode, content: string) => Promise<boolean>;
  submitEdit: (node: CommentNode, content: string) => Promise<boolean>;
  removeComment: (node: CommentNode) => Promise<boolean>;
  /** Возвращает надгробие в опубликованные; доступно модераторам. */
  restoreTombstone: (node: CommentNode) => Promise<boolean>;
  submitReport: (node: CommentNode) => Promise<void>;
  isOwnComment: (node: CommentNode) => boolean;
  isCommentReported: (commentId: string) => boolean;
  /**
   * Может ли пользователь писать. Функция, а не флаг: объект действий
   * собирается один раз, а значение меняется после входа и выхода.
   */
  canComment: () => boolean;
  /** Прокручивает к отрисованному комментарию и коротко подсвечивает его. */
  highlightComment: (commentId: string) => void;
  /** Абсолютная ссылка на комментарий на странице обсуждения. */
  getCommentLink: (commentId: string) => string;
}

/** Действие карточки: пункт меню на сенсорных экранах и кнопка с мышью. */
export interface CommentCardAction {
  key: string;
  label: string;
  icon: string;
  color: 'error' | 'neutral';
  disabled: boolean;
  handler?: () => void;
}
