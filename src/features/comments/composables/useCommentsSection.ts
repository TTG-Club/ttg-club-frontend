import Cookies from 'js-cookie';
import { useToast } from 'vue-toastification';

import { SSO_TOKEN_COOKIE, USER_TOKEN_COOKIE } from '@/shared/const/UI';
import { useUserStore } from '@/shared/stores/UserStore';
import { ToastEventBus } from '@/shared/utils/toast';

import { useCommentSubmitCooldown } from '@/features/comments';

import {
  COMMENT_ALREADY_DELETED_TOAST,
  COMMENT_DELETE_ERROR_TOAST,
  COMMENT_EDIT_ERROR_TOAST,
  COMMENT_REPLIES_LOAD_ERROR_TOAST,
  COMMENT_REPLY_ERROR_TOAST,
  COMMENT_REPORT_DUPLICATE_DESCRIPTION,
  COMMENT_REPORT_DUPLICATE_TOAST,
  COMMENT_REPORT_ERROR_TOAST,
  COMMENT_REPORT_SUCCESS_DESCRIPTION,
  COMMENT_REPORT_SUCCESS_TOAST,
  COMMENT_RESTORE_ERROR_TOAST,
  COMMENT_RESTORED_TOAST,
  COMMENT_SUBMIT_COOLDOWN_SECONDS,
  COMMENT_SUBMIT_ERROR_TOAST,
  COMMENTS_LOAD_ERROR_TOAST,
  COMMENTS_PREVIEW_PAGE_SIZE,
  COMMENTS_REPLIES_DEPTH_LIMIT,
  createCommentNode,
  createCommentReply,
  createRootComment,
  deleteComment,
  fetchCommentById,
  fetchCommentReplies,
  fetchCommentsCount,
  fetchLatestComment,
  fetchRootComments,
  findCommentNode,
  getCommentErrorMessage,
  getCommentFetchStatus,
  getCommentRateLimit,
  getTokenSubject,
  hasLiveReplies,
  hasServerReplyTotal,
  isCommentFromThread,
  isCommentTombstone,
  mergeRestoredComment,
  removeCommentNode,
  reportComment,
  restoreComment,
  updateComment,
} from '../model';

import type { CommentEntry, CommentNode, PublicComment } from '../model';
import type { Ref } from 'vue';

/*
 * Узлы дерева комментариев — это reactive-состояние ленты, а не входные
 * данные: загрузка ветки, отправка ответа и правка меняют именно тот узел,
 * который держит шаблон. Возврат нового объекта разорвал бы связь с деревом
 * (родитель хранит ссылку на узел), поэтому мутация параметра здесь —
 * не побочный эффект, а способ работы со структурой.
 */
/* eslint-disable no-param-reassign */

/**
 * Поднимается по цепочке `parentId` до корневого комментария ветки.
 * Надгробие удалённого комментария — обычное звено цепочки: сервис отдаёт
 * его вместо 404, пока под ним живы ответы.
 *
 * @param commentId Идентификатор комментария (может быть и корнем).
 * @param threadSection Раздел треда, в который поднимаем ветку.
 * @param threadUrl URL страницы треда.
 * @returns Корневой комментарий либо null при разрыве или цикле в цепочке,
 * а также если комментарий принадлежит другому треду (на экране может быть
 * несколько блоков сразу — страница и боковая панель).
 */
async function fetchRootOfComment(
  commentId: string,
  threadSection: string,
  threadUrl: string,
): Promise<PublicComment | null> {
  const visitedIds = new Set<string>([commentId]);

  let currentEntry = await fetchCommentById(commentId);

  if (!isCommentFromThread(currentEntry, threadSection, threadUrl)) {
    return null;
  }

  while (currentEntry.parentId) {
    // Битые данные могут закольцевать цепочку — прерываемся, а не виснем.
    if (visitedIds.has(currentEntry.parentId)) {
      return null;
    }

    visitedIds.add(currentEntry.parentId);

    currentEntry = await fetchCommentById(currentEntry.parentId);
  }

  return currentEntry;
}

/**
 * Снимает состояние свёртки всего поддерева: перезагрузка ветки пересоздаёт
 * узлы, и без снимка развёрнутость, заданную пользователем, не восстановить.
 *
 * @param node Корень ветки.
 * @param state Накопитель (заполняется рекурсией).
 */
function collectRepliesExpanded(
  node: CommentNode,
  state: Map<string, boolean> = new Map(),
): Map<string, boolean> {
  state.set(node.comment.id, node.repliesExpanded);

  for (const child of node.replies) {
    collectRepliesExpanded(child, state);
  }

  return state;
}

/**
 * Возвращает поддереву состояние свёртки из снимка. Узлы, которых в снимке
 * не было (ответы, появившиеся с тех пор), остаются как их создал загрузчик.
 * Корень пропускается: его свёрткой управляет вызывающий код.
 *
 * @param node Корень ветки.
 * @param state Снимок из `collectRepliesExpanded`.
 */
function restoreRepliesExpanded(
  node: CommentNode,
  state: Map<string, boolean>,
): void {
  for (const child of node.replies) {
    const wasExpanded = state.get(child.comment.id);

    if (wasExpanded !== undefined) {
      child.repliesExpanded = wasExpanded;
    }

    restoreRepliesExpanded(child, state);
  }
}

interface UseCommentsSectionOptions {
  /** Раздел сайта в сервисе комментариев. */
  section: string;
  /** URL страницы внутри раздела (ключ обсуждения). */
  url: string;
}

/** Возвращаемое значение композабла useCommentsSection. */
export interface UseCommentsSectionReturn {
  /** Корни локального дерева комментариев. */
  rootNodes: Ref<CommentNode[]>;

  /** Опубликованные комментарии страницы вместе с ответами (`/count`). */
  totalCount: Ref<number>;

  /** Самый свежий комментарий — для свёрнутого превью. */
  latestComment: Ref<CommentEntry | null>;

  /** Идёт первичная загрузка ленты. */
  isLoading: Ref<boolean>;

  /** Идёт загрузка свёрнутого превью. */
  isPreviewLoading: Ref<boolean>;

  /** Идёт догрузка следующей страницы корней. */
  isLoadingMore: Ref<boolean>;

  /** Страницы корней закончились. */
  isLastPage: Ref<boolean>;

  /** Ошибка последней загрузки; `null` — последняя попытка удалась. */
  loadError: Ref<unknown>;

  /** Грузит превью свёрнутого блока (свежий комментарий и счётчик). */
  loadPreview: () => Promise<void>;

  /** Грузит первую страницу ленты. */
  loadComments: () => Promise<void>;

  /** Дописывает следующую страницу корней. */
  loadMoreComments: () => Promise<void>;

  /** Разворачивает или сворачивает ветку ответов узла. */
  toggleReplies: (node: CommentNode) => Promise<void>;

  /** Готовит комментарий к показу по якорной ссылке. */
  revealComment: (commentId: string) => Promise<boolean>;

  /** Создаёт корневой комментарий. */
  submitRootComment: (content: string) => Promise<boolean>;

  /** Создаёт ответ на комментарий. */
  submitReply: (node: CommentNode, content: string) => Promise<boolean>;

  /** Сохраняет новый текст своего комментария. */
  submitEdit: (node: CommentNode, content: string) => Promise<boolean>;

  /** Мягко удаляет комментарий. */
  removeComment: (node: CommentNode) => Promise<boolean>;

  /** Возвращает надгробие в опубликованные (модератор, админ). */
  restoreTombstone: (node: CommentNode) => Promise<boolean>;

  /** Отправляет жалобу на комментарий. */
  submitReport: (node: CommentNode) => Promise<void>;

  /** Свой ли это комментарий. */
  isOwnComment: (node: CommentNode) => boolean;

  /** Жаловался ли пользователь на комментарий в этой сессии. */
  isCommentReported: (commentId: string) => boolean;
}

/**
 * Состояние блока комментариев страницы: лента корней с серверной
 * пагинацией, локальное дерево ответов, создание, правка, удаление и жалобы.
 *
 * Сервис отдаёт только прямых детей комментария, поэтому ветка догружается
 * рекурсивно отдельными запросами. Удаление мягкое: комментарий с живыми
 * ответами остаётся в выдаче надгробием (ветка не пропадает), без ответов —
 * исчезает; итог локально не вычислить, поэтому затронутая ветка после
 * удаления и восстановления перезапрашивается целиком.
 *
 * @param options Раздел и URL страницы обсуждения.
 */
export function useCommentsSection(
  options: UseCommentsSectionOptions,
): UseCommentsSectionReturn {
  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();

  const { user } = storeToRefs(userStore);

  /**
   * Отображаемое имя текущего пользователя (или логин, если имя не задано).
   * Нужно, чтобы свежесозданный комментарий сразу показывал имя, а не логин:
   * сервис стамперит логин из токена, а синк на бэкенде переставит имя уже
   * в фоне.
   */
  const selfDisplayName = computed(
    () => user.value?.displayName || user.value?.username || '',
  );

  /**
   * Подменяет имя автора у только что созданного комментария на отображаемое —
   * до того, как фоновый синк перепишет снимок имени на стороне сервиса.
   *
   * @param created Комментарий из ответа сервиса.
   */
  function withSelfDisplayName(created: CommentEntry): CommentEntry {
    return selfDisplayName.value
      ? { ...created, authorName: selfDisplayName.value }
      : created;
  }

  const rootNodes = ref<CommentNode[]>([]);

  /**
   * Комментарии страницы вместе с ответами (эндпоинт `/count`). Считает
   * только опубликованные, поэтому с числом карточек в ленте не совпадает:
   * надгробия удалённых в счётчик не входят.
   */
  const totalCount = ref(0);

  const currentPage = ref(0);
  const isLastPage = ref(true);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const loadError = ref<unknown>(null);

  /** Самый свежий корневой комментарий — для свёрнутого превью. */
  const latestComment = ref<CommentEntry | null>(null);

  const isPreviewLoading = ref(false);

  /**
   * Жалобы, отправленные в этой сессии. Сервис не отдаёт флаг «я уже
   * жаловался» — узнать можно только по 409, и после перезагрузки страницы
   * состояние кнопки не восстановить.
   */
  const reportedCommentIds = ref<Set<string>>(new Set());

  /**
   * Показывает тост с текстом ошибки сервиса.
   *
   * @param error Пойманная ошибка.
   * @param title Заголовок тоста.
   */
  function notifyError(error: unknown, title: string): void {
    toast.error(`${title}. ${getCommentErrorMessage(error)}`);
  }

  const { startCooldown } = useCommentSubmitCooldown();

  /**
   * Отказ отправки: при 429 включает паузу на срок из ответа сервиса —
   * его отсчёт идёт от последнего успешного комментария, поэтому локальные
   * 20 секунд здесь ставить нельзя (кнопка разблокировалась бы раньше,
   * чем разрешит сервис). Затем показывает тост с текстом сервиса.
   *
   * @param error Пойманная ошибка.
   * @param title Заголовок тоста.
   */
  function notifySubmitError(error: unknown, title: string): void {
    if (getCommentFetchStatus(error) === 429) {
      const { retryAfterSeconds } = getCommentRateLimit(error);

      if (retryAfterSeconds !== null) {
        startCooldown(retryAfterSeconds);
      }
    }

    notifyError(error, title);
  }

  /**
   * Самый свежий комментарий страницы для превью. Предпочтителен `/latest`
   * (учитывает ответы внутри веток), при его отсутствии — откат к последнему
   * корневому комментарию (свежий ответ в глубине ветки в него не попадёт).
   */
  async function fetchPreviewComment(): Promise<CommentEntry | null> {
    try {
      const latest = await fetchLatestComment(options.section, options.url);

      // Надгробие в превью не показать — ни автора, ни текста у него нет.
      return latest && !isCommentTombstone(latest) ? latest : null;
    } catch (error) {
      // 401 — не «эндпоинта нет», а протухла сессия: пробрасываем наверх.
      if (getCommentFetchStatus(error) === 401) {
        throw error;
      }

      const previewPage = await fetchRootComments(
        options.section,
        options.url,
        0,
        COMMENTS_PREVIEW_PAGE_SIZE,
      );

      // Среди корней бывают надгробия — превью из них не собрать (нет ни
      // автора, ни текста), поэтому берём самый свежий живой корень.
      return (
        previewPage.items.find(
          (rootComment) => !isCommentTombstone(rootComment),
        ) ?? null
      );
    }
  }

  /**
   * Лёгкая загрузка свёрнутого превью: самый свежий комментарий и общий
   * счётчик страницы.
   */
  async function loadPreview(): Promise<void> {
    isPreviewLoading.value = true;
    loadError.value = null;

    try {
      const [preview, commentsCount] = await Promise.all([
        fetchPreviewComment(),
        fetchCommentsCount(options.section, options.url),
      ]);

      latestComment.value = preview;
      totalCount.value = commentsCount;
    } catch (error) {
      loadError.value = error;
    } finally {
      isPreviewLoading.value = false;
    }
  }

  /**
   * Первичная загрузка: первая страница корней и общий счётчик параллельно.
   */
  async function loadComments(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      const [firstPage, commentsCount] = await Promise.all([
        fetchRootComments(options.section, options.url, 0),
        fetchCommentsCount(options.section, options.url),
      ]);

      rootNodes.value = firstPage.items.map((comment) =>
        createCommentNode(comment),
      );

      currentPage.value = 0;
      isLastPage.value = firstPage.last;
      totalCount.value = commentsCount;

      prefetchReplyCounts();
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Догрузка следующей страницы корней. Свежие комментарии могли сдвинуть
   * серверную пагинацию — уже показанные отфильтровываются по id.
   */
  async function loadMoreComments(): Promise<void> {
    if (isLastPage.value || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = await fetchRootComments(
        options.section,
        options.url,
        currentPage.value + 1,
      );

      const knownIds = new Set(rootNodes.value.map((node) => node.comment.id));

      const freshNodes = nextPage.items
        .filter((comment) => !knownIds.has(comment.id))
        .map((comment) => createCommentNode(comment));

      rootNodes.value = [...rootNodes.value, ...freshNodes];
      currentPage.value += 1;
      isLastPage.value = nextPage.last;

      prefetchReplyCounts();
    } catch (error) {
      notifyError(error, COMMENTS_LOAD_ERROR_TOAST);
    } finally {
      isLoadingMore.value = false;
    }
  }

  /**
   * Тихо обновляет серверный счётчик комментариев страницы.
   * Сбой не показываем: счётчик — вторичная информация.
   */
  async function refreshCount(): Promise<void> {
    try {
      totalCount.value = await fetchCommentsCount(options.section, options.url);
    } catch {
      // Счётчик обновится при следующей загрузке ленты.
    }
  }

  /**
   * Рекурсивно догружает поддерево ответов: на каждый узел с ответами уходит
   * отдельный запрос (сервис отдаёт только прямых детей). Глубина ограничена
   * предохранителем — хвост догрузится кнопкой уже внутри ветки.
   * Верхний узел не разворачивается — этим управляет вызывающий (клик или
   * фоновый префетч); внутренние узлы разворачиваются сразу, чтобы клик
   * показал всё поддерево.
   *
   * @param node Узел, для которого загружаются ответы.
   * @param depth Текущая глубина рекурсии.
   */
  async function loadRepliesDeep(
    node: CommentNode,
    depth: number,
  ): Promise<void> {
    if (depth >= COMMENTS_REPLIES_DEPTH_LIMIT) {
      return;
    }

    const replies = await fetchCommentReplies(node.comment.id);

    node.replies = replies.map((reply) => createCommentNode(reply));

    node.repliesLoaded = true;

    if (depth > 0) {
      node.repliesExpanded = true;
    }

    await Promise.all(
      node.replies
        .filter((child) => !child.repliesLoaded)
        .map((child) => loadRepliesDeep(child, depth + 1)),
    );
  }

  /**
   * Загрузки веток в полёте. Дедупликация нужна, чтобы клик по ветке во время
   * фонового префетча не запускал второй набор тех же запросов, а дожидался
   * уже идущего.
   *
   * Ключ — сам узел, а не id комментария: перезагрузка ветки пересоздаёт узлы
   * поддерева, и по строковому ключу новый узел получил бы промис старого,
   * отцепленного от дерева. Клик по такой ветке раскрыл бы её пустой.
   */
  const repliesLoadPromises = new WeakMap<CommentNode, Promise<void>>();

  /**
   * Гарантирует, что поддерево ответов узла загружено. Повторные вызовы
   * во время загрузки возвращают уже идущий Promise.
   *
   * @param node Узел, ветку которого загружаем.
   * @param force Перечитать уже загруженную ветку. Флаг `repliesLoaded` при
   * этом не сбрасывается: прежние ответы остаются на экране до самой замены,
   * иначе ветка на время фонового запроса схлопывалась бы в спиннер.
   */
  function ensureRepliesLoaded(
    node: CommentNode,
    force = false,
  ): Promise<void> {
    if (node.repliesLoaded && !force) {
      return Promise.resolve();
    }

    const inFlight = repliesLoadPromises.get(node);

    if (inFlight) {
      return inFlight;
    }

    const loadPromise = (async () => {
      node.repliesLoading = true;

      try {
        await loadRepliesDeep(node, 0);
      } finally {
        node.repliesLoading = false;
        repliesLoadPromises.delete(node);
      }
    })();

    repliesLoadPromises.set(node, loadPromise);

    return loadPromise;
  }

  /**
   * Кнопка «Показать/Скрыть ответы»: первая загрузка тянет всё поддерево,
   * дальше работает как свёртка без перезапросов.
   *
   * @param node Узел ветки.
   */
  async function toggleReplies(node: CommentNode): Promise<void> {
    if (node.repliesLoaded) {
      node.repliesExpanded = !node.repliesExpanded;

      return;
    }

    try {
      await ensureRepliesLoaded(node);

      node.repliesExpanded = true;
    } catch (error) {
      notifyError(error, COMMENT_REPLIES_LOAD_ERROR_TOAST);
    }
  }

  /**
   * Фоновая догрузка веток корней без разворачивания — чтобы кнопки сразу
   * показывали точное число ответов, когда сервис сообщает только прямых
   * детей. Если сервис присылает `totalReplyCount`, точное число уже есть —
   * дорогая догрузка пропускается. Ветки грузятся последовательно; ошибки
   * не показываются — число появится после явного раскрытия ветки.
   */
  async function prefetchReplyCounts(): Promise<void> {
    const pendingRoots = rootNodes.value.filter(
      (root) =>
        !root.repliesLoaded &&
        root.comment.replyCount > 0 &&
        !hasServerReplyTotal(root.comment),
    );

    for (const root of pendingRoots) {
      try {
        await ensureRepliesLoaded(root);
      } catch {
        // Ветка догрузится по клику — фоновый сбой не показываем.
      }
    }
  }

  /**
   * Создаёт корневой комментарий и показывает его сверху ленты.
   *
   * @param content Текст комментария.
   * @returns true при успехе — форма очищается.
   */
  async function submitRootComment(content: string): Promise<boolean> {
    try {
      const created = await createRootComment({
        section: options.section,
        url: options.url,
        content,
      });

      rootNodes.value = [
        createCommentNode(withSelfDisplayName(created)),
        ...rootNodes.value,
      ];

      totalCount.value += 1;
      startCooldown(COMMENT_SUBMIT_COOLDOWN_SECONDS);

      // Заменяем логин на отображаемое имя во всех комментариях автора (best-effort).
      userStore.syncCommentsName();

      return true;
    } catch (error) {
      notifySubmitError(error, COMMENT_SUBMIT_ERROR_TOAST);

      return false;
    }
  }

  /**
   * Создаёт ответ на комментарий. Если ветка ещё не загружена — догружает её
   * целиком, свежий ответ приедет вместе с остальными.
   *
   * @param node Узел, которому отвечают.
   * @param content Текст ответа.
   * @returns true при успехе — форма ответа закрывается.
   */
  async function submitReply(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    // Отвечать заглушке нельзя — сервис ответил бы 409. Форма ответа могла
    // остаться открытой с того момента, когда комментарий ещё был живым.
    if (isCommentTombstone(node.comment)) {
      return false;
    }

    try {
      const created = await createCommentReply(node.comment.id, {
        section: options.section,
        url: options.url,
        content,
      });

      node.comment = {
        ...node.comment,
        replyCount: node.comment.replyCount + 1,
      };

      totalCount.value += 1;

      if (node.repliesLoaded) {
        node.replies = [
          ...node.replies,
          createCommentNode(withSelfDisplayName(created)),
        ];

        node.repliesExpanded = true;
      } else {
        await toggleReplies(node);
      }

      startCooldown(COMMENT_SUBMIT_COOLDOWN_SECONDS);

      // Заменяем логин на отображаемое имя во всех комментариях автора (best-effort).
      userStore.syncCommentsName();

      return true;
    } catch (error) {
      notifySubmitError(error, COMMENT_REPLY_ERROR_TOAST);

      return false;
    }
  }

  /**
   * Сохраняет новый текст своего комментария.
   *
   * @param node Правимый узел.
   * @param content Новый текст.
   * @returns true при успехе — форма правки закрывается.
   */
  async function submitEdit(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    const { comment } = node;

    // Править нечего: у надгробия нет текста, а сервис ответил бы 409.
    if (isCommentTombstone(comment)) {
      return false;
    }

    try {
      const updated = await updateComment(comment.id, content);

      node.comment = {
        ...comment,
        content: updated.content,
        editedAt: updated.editedAt,
      };

      return true;
    } catch (error) {
      const title =
        getCommentFetchStatus(error) === 409
          ? COMMENT_ALREADY_DELETED_TOAST
          : COMMENT_EDIT_ERROR_TOAST;

      notifyError(error, title);

      return false;
    }
  }

  /**
   * Корневой узел ветки, в которой лежит комментарий (сам корень — тоже
   * ветка). `undefined` — комментария нет в загруженной части ленты.
   *
   * @param commentId Идентификатор комментария.
   */
  function findBranchRoot(commentId: string): CommentNode | undefined {
    return rootNodes.value.find((root) => !!findCommentNode([root], commentId));
  }

  /**
   * Перечитывает ветку корня целиком — вместе со счётчиками ответов и
   * надгробиями. Локально исход удаления не вычислить: комментарий с живыми
   * ответами сервис оставляет в выдаче надгробием, без ответов — убирает
   * совсем, а вместе с последним ответом уходит и надгробие-родитель.
   * Перечитывается именно корневая ветка, а не поддерево родителя: удаление
   * последнего ответа под надгробием убирает и само надгробие, а это может
   * подняться каскадом до самого корня.
   *
   * @param rootNode Корневой узел затронутой ветки.
   * @throws Ошибку запроса; 404 означает, что корень ушёл из выдачи.
   */
  async function reloadRootBranch(rootNode: CommentNode): Promise<void> {
    const refreshed = await fetchCommentById(rootNode.comment.id);

    rootNode.comment = refreshed;

    // Ветка стала листом — та же конвенция, что в createCommentNode:
    // у листа нечего догружать и нечего сворачивать.
    if (!hasLiveReplies(refreshed)) {
      rootNode.replies = [];
      rootNode.repliesLoaded = true;
      rootNode.repliesExpanded = true;

      return;
    }

    // Загрузка, начатая до правки (фоновый префетч), несёт снимок ветки с ещё
    // живым удалённым комментарием: дожидаемся её, иначе она допишет
    // устаревшие ответы поверх свежих, если завершится позже нашего запроса.
    await repliesLoadPromises.get(rootNode)?.catch(() => undefined);

    // Какие ветки пользователь свернул — знает только клиент, а перезагрузка
    // пересоздаёт узлы поддерева. Без переноса все свёрнутые подветки
    // раскрылись бы: loadRepliesDeep разворачивает всё глубже корня.
    const repliesExpandedState = collectRepliesExpanded(rootNode);

    await ensureRepliesLoaded(rootNode, true);

    restoreRepliesExpanded(rootNode, repliesExpandedState);
  }

  /**
   * Приводит ленту в соответствие с сервисом после удаления: на месте
   * комментария с ответами останется надгробие, а комментарий без ответов
   * (вместе с осиротевшим надгробием-родителем) уйдёт из выдачи.
   *
   * @param node Удалённый узел.
   */
  async function syncBranchAfterRemoval(node: CommentNode): Promise<void> {
    const rootNode = findBranchRoot(node.comment.id);

    if (rootNode) {
      try {
        await reloadRootBranch(rootNode);
      } catch (error) {
        if (getCommentFetchStatus(error) === 404) {
          // Корень ушёл из выдачи вместе со всей веткой.
          removeCommentNode(rootNodes.value, rootNode.comment.id);
        } else if (!hasLiveReplies(node.comment)) {
          // Ветка не перечиталась. Убрать можно только узел без живых
          // потомков: у комментария с ответами сервис оставит надгробие, и
          // локальное удаление спрятало бы вместе с ним живые ответы —
          // в том числе те, что лежат глубже вложенного надгробия. Такой
          // узел подождёт следующей загрузки ленты.
          removeCommentNode(rootNodes.value, node.comment.id);
        }
      }
    }

    await refreshCount();
  }

  /**
   * Мягко удаляет свой комментарий. Ветку приводим в порядок уже в фоне:
   * перечитывание глубокого треда — это запрос на каждый узел, и держать
   * ими открытый диалог подтверждения незачем, удаление уже состоялось.
   *
   * @param node Удаляемый узел.
   * @returns true, если сервис принял удаление.
   */
  async function removeComment(node: CommentNode): Promise<boolean> {
    try {
      await deleteComment(node.comment.id);
    } catch (error) {
      notifyError(error, COMMENT_DELETE_ERROR_TOAST);

      return false;
    }

    syncBranchAfterRemoval(node);

    return true;
  }

  /**
   * Возвращает надгробие в опубликованные (модератор, админ) — заодно это
   * единственный способ увидеть текст удалённого: в публичных выдачах сервис
   * его не отдаёт. Ветку не перезапрашиваем: ответы под надгробием и так были
   * видны, ответ сервиса — уже актуальная запись самого узла.
   *
   * @param node Узел-надгробие.
   * @returns true, если комментарий восстановлен.
   */
  async function restoreTombstone(node: CommentNode): Promise<boolean> {
    try {
      const restored = await restoreComment(node.comment.id);

      // Подписи «в ответ …» у детей обновятся сами: ветка берёт имя из
      // родителя, а не хранит его копию в узле.
      node.comment = mergeRestoredComment(node.comment, restored);

      toast.success(COMMENT_RESTORED_TOAST);

      // Счётчик вторичен — подтверждение действия его не ждёт.
      refreshCount();

      return true;
    } catch (error) {
      notifyError(error, COMMENT_RESTORE_ERROR_TOAST);

      // 409 — комментарий уже не в статусе DELETED: его успел тронуть другой
      // модератор, и карточка показывает устаревшее состояние. Сверяемся в
      // фоне: об ошибке уже сказал тост, держать ради этого спиннер незачем.
      if (getCommentFetchStatus(error) === 409) {
        const branchRoot = findBranchRoot(node.comment.id);

        if (branchRoot) {
          reloadRootBranch(branchRoot).catch(() => undefined);
        }
      }

      return false;
    }
  }

  /**
   * Запоминает жалобу в рамках сессии (иммутабельная замена Set,
   * чтобы computed-подписчики гарантированно пересчитались).
   *
   * @param commentId Идентификатор комментария.
   */
  function markReported(commentId: string): void {
    reportedCommentIds.value = new Set([
      ...reportedCommentIds.value,
      commentId,
    ]);
  }

  /**
   * Отправляет жалобу на комментарий. 409 означает «уже жаловались» (или
   * комментарий удалён) — запоминаем и в этом случае, чтобы погасить кнопку.
   *
   * @param node Узел, на который жалуются.
   */
  async function submitReport(node: CommentNode): Promise<void> {
    const { comment } = node;

    // Жаловаться не на что: у надгробия нет текста, а сервис ответил бы 409.
    if (
      isCommentTombstone(comment) ||
      reportedCommentIds.value.has(comment.id)
    ) {
      return;
    }

    try {
      const updated = await reportComment(comment.id);

      node.comment = {
        ...comment,
        dislikeCount: updated.dislikeCount,
      };

      markReported(comment.id);

      toast.success(
        `${COMMENT_REPORT_SUCCESS_TOAST}. ${COMMENT_REPORT_SUCCESS_DESCRIPTION}`,
      );
    } catch (error) {
      if (getCommentFetchStatus(error) === 409) {
        markReported(node.comment.id);

        toast.info(
          `${COMMENT_REPORT_DUPLICATE_TOAST}. ${COMMENT_REPORT_DUPLICATE_DESCRIPTION}`,
        );

        return;
      }

      notifyError(error, COMMENT_REPORT_ERROR_TOAST);
    }
  }

  /**
   * Разворачивает свёрнутых предков комментария, чтобы он оказался видим
   * (после фонового префетча верхние узлы веток остаются свёрнутыми).
   *
   * @param commentId Идентификатор комментария.
   */
  function expandCommentAncestors(commentId: string): void {
    let currentNode = findCommentNode(rootNodes.value, commentId);

    // Подъём по parentId завершается на корне (parentId = null).
    while (currentNode?.comment.parentId) {
      const parentNode = findCommentNode(
        rootNodes.value,
        currentNode.comment.parentId,
      );

      if (!parentNode) {
        break;
      }

      parentNode.repliesExpanded = true;
      currentNode = parentNode;
    }
  }

  /**
   * Комментарий вне загруженной части ленты: поднимаемся по цепочке до его
   * корня, вставляем корень сверху ленты («ветка по ссылке») и догружаем её.
   * Дедуп в `loadMoreComments` не даст корню задвоиться при листании.
   *
   * @param commentId Идентификатор комментария из якоря.
   * @returns true, если ветка с комментарием загрузилась.
   */
  async function revealCommentFromDistantPage(
    commentId: string,
  ): Promise<boolean> {
    try {
      const rootEntry = await fetchRootOfComment(
        commentId,
        options.section,
        options.url,
      );

      if (!rootEntry) {
        return false;
      }

      if (!findCommentNode(rootNodes.value, rootEntry.id)) {
        rootNodes.value = [createCommentNode(rootEntry), ...rootNodes.value];
      }

      const rootNode = findCommentNode(rootNodes.value, rootEntry.id);

      if (rootNode) {
        await ensureRepliesLoaded(rootNode).catch(() => undefined);
      }

      return !!findCommentNode(rootNodes.value, commentId);
    } catch {
      // 404 — комментарий удалён или ссылка битая; тихо остаёмся на ленте.
      return false;
    }
  }

  /**
   * Готовит комментарий к показу по якорной ссылке: догружает ветки корней
   * текущей страницы, а если цель не нашлась (корень на дальней странице
   * пагинации) — поднимает её ветку по id и вставляет сверху ленты.
   * Затем разворачивает предков цели.
   *
   * @param commentId Идентификатор комментария из якоря.
   * @returns true, если комментарий найден в дереве.
   */
  async function revealComment(commentId: string): Promise<boolean> {
    if (!findCommentNode(rootNodes.value, commentId)) {
      const unloadedRoots = rootNodes.value.filter(
        (root) => !root.repliesLoaded && root.comment.replyCount > 0,
      );

      await Promise.all(
        unloadedRoots.map((root) =>
          ensureRepliesLoaded(root).catch(() => undefined),
        ),
      );
    }

    if (!findCommentNode(rootNodes.value, commentId)) {
      const revealed = await revealCommentFromDistantPage(commentId);

      if (!revealed) {
        return false;
      }
    }

    expandCommentAncestors(commentId);

    return true;
  }

  /**
   * Идентификатор пользователя из SSO-токена — тот же клейм `sub`, которым
   * сервис комментариев подписывает автора. Профиль сайта (`/user/info`) его
   * не отдаёт, поэтому берём из куки; логин — запасной вариант, когда токен
   * недоступен (сервис стамперит в `authorName` именно его).
   */
  const selfAuthorId = computed(() => {
    // От user зависимость намеренная: после входа и выхода кука меняется,
    // а пересчитать computed по самой куке нельзя — она нереактивна.
    const hasUser = !!user.value;

    return hasUser
      ? getTokenSubject(
          Cookies.get(SSO_TOKEN_COOKIE) ?? Cookies.get(USER_TOKEN_COOKIE),
        )
      : '';
  });

  /**
   * Свой ли комментарий: сравнение UUID автора с клеймом `sub` токена, а при
   * недоступном токене — логина с именем автора.
   *
   * @param node Узел дерева комментариев.
   */
  function isOwnComment(node: CommentNode): boolean {
    const { authorId, authorName } = node.comment;

    if (selfAuthorId.value && authorId) {
      return selfAuthorId.value === authorId;
    }

    return !!user.value?.username && user.value.username === authorName;
  }

  /**
   * Отправлял ли пользователь жалобу на комментарий в этой сессии.
   *
   * @param commentId Идентификатор комментария.
   */
  function isCommentReported(commentId: string): boolean {
    return reportedCommentIds.value.has(commentId);
  }

  return {
    rootNodes,
    totalCount,
    latestComment,
    isLoading,
    isPreviewLoading,
    isLoadingMore,
    isLastPage,
    loadError,

    loadPreview,
    loadComments,
    loadMoreComments,
    toggleReplies,
    revealComment,
    submitRootComment,
    submitReply,
    submitEdit,
    removeComment,
    restoreTombstone,
    submitReport,
    isOwnComment,
    isCommentReported,
  };
}
