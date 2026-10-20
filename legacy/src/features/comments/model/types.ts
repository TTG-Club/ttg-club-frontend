import type { SourcePlatform } from '@/shared/const/platform';

/**
 * Статус комментария на стороне сервиса. `HIDDEN_BY_BAN` в публичных выдачах
 * не встречается — сервис ставит его комментариям заблокированного автора и
 * отдаёт только в модерационных лентах; здесь он нужен, чтобы разбор не падал
 * на неожиданном значении.
 */
export type CommentStatus =
  | 'PUBLISHED'
  | 'DELETED'
  | 'PENDING_MODERATION'
  | 'REJECTED'
  | 'SPAM'
  | 'HIDDEN_BY_BAN';

/** Поля, которые есть у любого комментария — в том числе у надгробия. */
export interface CommentBase {
  id: string;
  /** Платформа-источник обсуждения (старые сборки сервиса не присылают). */
  sourcePlatform: SourcePlatform | null;
  /** Раздел страницы обсуждения (старые сборки сервиса не присылают). */
  section: string | null;
  /** URL страницы обсуждения (старые сборки сервиса не присылают). */
  url: string | null;
  parentId: string | null;
  status: CommentStatus;
  /** Число прямых ответов (детей первого уровня). */
  replyCount: number;
  /**
   * Число всех потомков ветки (ответы, ответы на ответы и глубже).
   * Опционально: старые сборки сервиса поле не присылают — тогда точное
   * число собирается на фронте догрузкой веток.
   */
  totalReplyCount: number | null;
  /**
   * Имя автора родительского комментария («кому ответили»). Опционально:
   * приходит там, где родитель не загружен на фронте (превью `/latest`).
   */
  parentAuthorName: string | null;
  createdAt: string;
}

/**
 * Комментарий с содержимым. Так приходят ответы на создание, правку, жалобу
 * и восстановление, а в публичных выдачах — всё, кроме надгробий.
 */
export interface CommentEntry extends CommentBase {
  authorId: string;
  authorName: string;
  content: string;
  dislikeCount: number;
  editedAt: string | null;
}

/**
 * Надгробие: заглушка на месте удалённого комментария, которая держит ветку
 * его ответов видимой. Приходит только в публичных выдачах и только у
 * удалённого комментария с живыми ответами — без ответов он из выдачи
 * пропадает совсем. Автора и текста у неё нет, место в дереве и счётчики
 * ответов есть.
 *
 * Пустые поля описаны объединением с типом значения, а не одним `null`:
 * в проекте выключен `strict`, и `UnwrapRef<null>` из типов Vue схлопывается
 * в `unknown` — узел с такими полями перестал бы быть присваиваемым внутри
 * `ref`. Отличает надгробие всё равно предикат `isCommentTombstone`, а не
 * форма типа.
 */
export interface CommentTombstone extends CommentBase {
  status: 'DELETED';
  authorId: string | null;
  authorName: string | null;
  content: string | null;
  dislikeCount: number | null;
  editedAt: string | null;
}

/**
 * Элемент публичной выдачи: обычный комментарий либо надгробие. Различать их
 * следует через `isCommentTombstone` — предикат сужает тип.
 */
export type PublicComment = CommentEntry | CommentTombstone;

/** Страница комментариев (Spring-пагинация). */
export interface CommentsPage<TComment = CommentEntry> {
  items: TComment[];
  totalElements: number;
  last: boolean;
}

/** Параметры антиспам-лимита из отказа 429 на отправку комментария. */
export interface CommentRateLimitInfo {
  /** Секунд до следующей разрешённой попытки; null — сервис не сообщил. */
  retryAfterSeconds: number | null;
  /** Трёхчасовая блокировка после повторных нарушений. */
  blocked: boolean;
}

/**
 * Цель обсуждения, выведенная из канонического пути деталки:
 * пара `section`/`url` — ключ треда в сервисе комментариев.
 */
export interface CommentsTarget {
  /** Раздел сайта (например, `spells`). */
  section: string;
  /** Канонический путь страницы (например, `/spells/fireball`). */
  url: string;
}

/** Тело создания корневого комментария или ответа. */
export interface CreateCommentRequest {
  sourcePlatform: SourcePlatform;
  section: string;
  url: string;
  content: string;
}

/**
 * Узел локального дерева комментариев. Сервис отдаёт только прямых детей
 * (`/replies`), поэтому дерево собирается на фронте по мере загрузки веток.
 */
export interface CommentNode {
  comment: PublicComment;
  replies: CommentNode[];
  /** Прямые ответы уже загружены (для листьев — сразу true). */
  repliesLoaded: boolean;
  /** Идёт загрузка поддерева ответов. */
  repliesLoading: boolean;
  /** Ответы развёрнуты (свёртка доступна на корневых ветках). */
  repliesExpanded: boolean;
}

/**
 * Действия над узлами дерева, прокидываемые вниз по рекурсивным веткам
 * (глубина дерева не ограничена, события наверх не всплывают).
 */
export interface CommentTreeActions {
  toggleReplies: (node: CommentNode) => Promise<void>;
  submitReply: (node: CommentNode, content: string) => Promise<boolean>;
  submitEdit: (node: CommentNode, content: string) => Promise<boolean>;
  removeComment: (node: CommentNode) => Promise<boolean>;
  /**
   * Возвращает надгробие в опубликованные (модератор, админ). Для остальных
   * ролей сервис отвечает 403, поэтому кнопка им не показывается.
   */
  restoreTombstone: (node: CommentNode) => Promise<boolean>;
  submitReport: (node: CommentNode) => Promise<void>;
  isOwnComment: (node: CommentNode) => boolean;
  isCommentReported: (commentId: string) => boolean;
  /**
   * Есть ли у пользователя право писать. Читать обсуждение может любой
   * гость, а ответ, жалоба и правка требуют входа — без него сервис
   * отвечает 401, поэтому такие действия скрываются, а не гасятся ошибкой.
   * Функция, а не флаг: объект действий собирается один раз, значение
   * должно перечитываться после входа и выхода.
   */
  canComment: () => boolean;
  /** Скроллит к отрисованному комментарию и коротко подсвечивает его. */
  highlightComment: (commentId: string) => void;
  /**
   * Абсолютная якорная ссылка на комментарий — всегда на каноническую
   * страницу обсуждения, а не на текущий адрес (в боковой панели адрес
   * страницы не совпадает с адресом деталки).
   */
  getCommentLink: (commentId: string) => string;
}
