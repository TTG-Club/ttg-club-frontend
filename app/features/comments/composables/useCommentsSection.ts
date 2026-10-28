import type { Ref } from 'vue';

import type {
  CommentEntry,
  CommentNode,
  CommentsTarget,
  PublicComment,
} from '../model';

import { USER_SESSION_MARKER_COOKIE } from '#shared/consts';

import {
  COMMENT_SUBMIT_COOLDOWN_SECONDS,
  COMMENT_TOAST,
  COMMENTS_HTTP_STATUS,
  COMMENTS_ICON,
  COMMENTS_PREVIEW_PAGE_SIZE,
  COMMENTS_REPLIES_DEPTH_LIMIT,
  COMMENTS_TEXT,
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
  getCommentErrorStatus,
  getCommentRateLimit,
  getTokenSubject,
  hasLiveReplies,
  hasServerReplyTotal,
  isCommentFromThread,
  isCommentTombstone,
  mergeRestoredComment,
  readWithoutStaleToken,
  removeCommentNode,
  reportComment,
  restoreComment,
  updateComment,
} from '../model';
import { useCommentSubmitCooldown } from './useCommentSubmitCooldown';

/**
 * Поднимается по цепочке `parentId` до корня ветки. Надгробие — обычное
 * звено цепочки: сервис отдаёт его вместо 404, пока под ним живы ответы.
 * @param commentId - идентификатор комментария
 * @param target - тред страницы
 * @returns корень либо `null` при цикле или чужом треде
 */
async function fetchRootOfComment(
  commentId: string,
  target: CommentsTarget,
): Promise<PublicComment | null> {
  const visitedIds = new Set<string>([commentId]);

  let currentEntry = await fetchCommentById(commentId);

  if (!isCommentFromThread(currentEntry, target)) {
    return null;
  }

  while (currentEntry.parentId) {
    // Битые данные могут закольцевать цепочку: прерываемся, а не виснем
    if (visitedIds.has(currentEntry.parentId)) {
      return null;
    }

    visitedIds.add(currentEntry.parentId);
    currentEntry = await fetchCommentById(currentEntry.parentId);
  }

  return currentEntry;
}

/**
 * Снимок свёртки поддерева: перезагрузка ветки пересоздаёт узлы, и без него
 * свёрнутые пользователем ветки раскрылись бы.
 * @param node - корень ветки
 * @param state - накопитель
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
 * Возвращает поддереву свёртку из снимка. Корнем управляет вызывающий код.
 * @param node - корень ветки
 * @param state - снимок из `collectRepliesExpanded`
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

/** Возвращаемое значение useCommentsSection. */
export interface UseCommentsSectionReturn {
  /** Корни локального дерева. */
  rootNodes: Ref<Array<CommentNode>>;

  /** Опубликованные комментарии страницы вместе с ответами. */
  totalCount: Ref<number>;

  /** Самый свежий комментарий для свёрнутого превью. */
  latestComment: Ref<CommentEntry | null>;

  /** Идёт первая загрузка ленты. */
  isLoading: Ref<boolean>;

  /** Идёт загрузка превью. */
  isPreviewLoading: Ref<boolean>;

  /** Идёт догрузка следующей страницы. */
  isLoadingMore: Ref<boolean>;

  /** Страницы корней закончились. */
  isLastPage: Ref<boolean>;

  /** Ошибка последней загрузки; `null`, если она удалась. */
  loadError: Ref<unknown>;

  loadPreview: () => Promise<void>;
  loadComments: () => Promise<void>;
  loadMoreComments: () => Promise<void>;
  toggleReplies: (node: CommentNode) => Promise<void>;
  revealComment: (commentId: string) => Promise<boolean>;
  submitRootComment: (content: string) => Promise<boolean>;
  submitReply: (node: CommentNode, content: string) => Promise<boolean>;
  submitEdit: (node: CommentNode, content: string) => Promise<boolean>;
  removeComment: (node: CommentNode) => Promise<boolean>;
  restoreTombstone: (node: CommentNode) => Promise<boolean>;
  submitReport: (node: CommentNode) => Promise<void>;
  isOwnComment: (node: CommentNode) => boolean;
  isCommentReported: (commentId: string) => boolean;
}

/**
 * Обсуждение записи: лента корней с пагинацией, дерево ответов, отправка,
 * правка, удаление и жалобы.
 *
 * Сервис отдаёт только прямых детей, поэтому ветки догружаются рекурсивно.
 * Удаление мягкое и его итог локально не вычислить: комментарий с живыми
 * ответами остаётся надгробием, без них пропадает. Поэтому после удаления
 * ветка перечитывается целиком.
 * @param target - тред страницы
 */
export function useCommentsSection(
  target: CommentsTarget,
): UseCommentsSectionReturn {
  const toast = useToast();
  const { user } = useUser();
  const { startCooldown } = useCommentSubmitCooldown();

  // Отметка о входе хранит access-токен: в нём `sub`, которым сервис
  // подписывает автора. Профиль сайта идентификатор не отдаёт.
  const sessionMarker = useCookie<string | null>(USER_SESSION_MARKER_COOKIE, {
    readonly: true,
  });

  const selfAuthorId = computed(() =>
    user.value ? getTokenSubject(sessionMarker.value) : '',
  );

  /** Имя, которое сервис запишет автором нового комментария. */
  const selfDisplayName = computed(
    () => user.value?.displayName || user.value?.username || '',
  );

  const rootNodes = ref<Array<CommentNode>>([]);
  const totalCount = ref(0);
  const currentPage = ref(0);
  const isLastPage = ref(true);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const loadError = ref<unknown>(null);
  const latestComment = ref<CommentEntry | null>(null);
  const isPreviewLoading = ref(false);

  /**
   * Жалобы этой сессии: сервис не отдаёт флаг «уже жаловался», узнать можно
   * только по 409.
   */
  const reportedCommentIds = ref<Set<string>>(new Set());

  /**
   * Загрузки веток в полёте, чтобы клик во время фоновой догрузки ждал её,
   * а не запускал те же запросы снова. Ключ — сам узел: перезагрузка ветки
   * пересоздаёт узлы, и новый не должен получить промис старого.
   */
  const repliesLoadPromises = new WeakMap<CommentNode, Promise<void>>();

  function notifyError(error: unknown, title: string): void {
    toast.add({
      title,
      description: getCommentErrorMessage(error),
      color: 'error',
      icon: COMMENTS_ICON.error,
    });
  }

  /**
   * Отказ отправки. При 429 пауза ставится по сроку из ответа: сервис
   * считает его от последнего успешного комментария.
   */
  function notifySubmitError(error: unknown, title: string): void {
    if (getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.tooManyRequests) {
      const { retryAfterSeconds } = getCommentRateLimit(error);

      if (retryAfterSeconds != null) {
        startCooldown(retryAfterSeconds);
      }
    }

    notifyError(error, title);
  }

  /** Имя автора нового комментария: отображаемое вместо логина. */
  function withSelfDisplayName(created: CommentEntry): CommentEntry {
    return selfDisplayName.value
      ? { ...created, authorName: selfDisplayName.value }
      : created;
  }

  /**
   * Свежий комментарий для превью. `/latest` учитывает ответы в ветках;
   * без него берётся первый живой корень.
   */
  async function fetchPreviewComment(): Promise<CommentEntry | null> {
    try {
      const latest = await fetchLatestComment(target);

      return latest && !isCommentTombstone(latest) ? latest : null;
    } catch (error) {
      // 401 — не «эндпоинта нет», а истёкшая сессия
      if (getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.unauthorized) {
        throw error;
      }

      const previewPage = await fetchRootComments(
        target,
        0,
        COMMENTS_PREVIEW_PAGE_SIZE,
      );

      return (
        previewPage.items.find(
          (comment): comment is CommentEntry => !isCommentTombstone(comment),
        ) ?? null
      );
    }
  }

  async function loadPreview(): Promise<void> {
    isPreviewLoading.value = true;
    loadError.value = null;

    try {
      const [preview, commentsCount] = await readWithoutStaleToken(() =>
        Promise.all([fetchPreviewComment(), fetchCommentsCount(target)]),
      );

      latestComment.value = preview;
      totalCount.value = commentsCount;
    } catch (error) {
      loadError.value = error;
    } finally {
      isPreviewLoading.value = false;
    }
  }

  /**
   * Рекурсивно догружает поддерево. Верхний узел не разворачивается: этим
   * управляет клик или фоновая догрузка; внутренние разворачиваются сразу.
   */
  async function loadRepliesDeep(
    node: CommentNode,
    depth: number,
  ): Promise<void> {
    if (depth >= COMMENTS_REPLIES_DEPTH_LIMIT) {
      return;
    }

    const replies = await fetchCommentReplies(node.comment.id);

    node.replies = replies.map(createCommentNode);
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
   * Гарантирует загрузку ветки узла.
   * @param node - узел
   * @param force - перечитать загруженную ветку; прежние ответы остаются на
   * экране до замены, чтобы ветка не схлопывалась в спиннер
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
   * Фоновая догрузка веток корней, чтобы кнопки сразу показывали точное
   * число ответов. Не нужна, если сервис прислал `totalReplyCount`.
   */
  async function prefetchReplyCounts(): Promise<void> {
    const pendingRoots = rootNodes.value.filter(
      (root) =>
        !root.repliesLoaded
        && root.comment.replyCount > 0
        && !hasServerReplyTotal(root.comment),
    );

    for (const root of pendingRoots) {
      try {
        await ensureRepliesLoaded(root);
      } catch {
        // Ветка догрузится по клику
      }
    }
  }

  async function loadComments(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      const [firstPage, commentsCount] = await readWithoutStaleToken(() =>
        Promise.all([fetchRootComments(target, 0), fetchCommentsCount(target)]),
      );

      rootNodes.value = firstPage.items.map(createCommentNode);
      currentPage.value = 0;
      isLastPage.value = firstPage.last;
      totalCount.value = commentsCount;

      void prefetchReplyCounts();
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Следующая страница корней. Свежие комментарии сдвигают пагинацию, поэтому
   * уже показанные отсеиваются по id.
   */
  async function loadMoreComments(): Promise<void> {
    if (isLastPage.value || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = await fetchRootComments(target, currentPage.value + 1);
      const knownIds = new Set(rootNodes.value.map((node) => node.comment.id));

      rootNodes.value = [
        ...rootNodes.value,
        ...nextPage.items
          .filter((comment) => !knownIds.has(comment.id))
          .map(createCommentNode),
      ];

      currentPage.value += 1;
      isLastPage.value = nextPage.last;

      void prefetchReplyCounts();
    } catch (error) {
      notifyError(error, COMMENTS_TEXT.loadError);
    } finally {
      isLoadingMore.value = false;
    }
  }

  /** Тихо обновляет счётчик: он вторичен, сбой не показываем. */
  async function refreshCount(): Promise<void> {
    try {
      totalCount.value = await fetchCommentsCount(target);
    } catch {
      // Обновится при следующей загрузке ленты
    }
  }

  /** Первая загрузка ветки тянет поддерево, дальше это свёртка. */
  async function toggleReplies(node: CommentNode): Promise<void> {
    if (node.repliesLoaded) {
      node.repliesExpanded = !node.repliesExpanded;

      return;
    }

    try {
      await ensureRepliesLoaded(node);
      node.repliesExpanded = true;
    } catch (error) {
      notifyError(error, COMMENT_TOAST.repliesLoadError);
    }
  }

  async function submitRootComment(content: string): Promise<boolean> {
    try {
      const created = await createRootComment({ ...target, content });

      rootNodes.value = [
        createCommentNode(withSelfDisplayName(created)),
        ...rootNodes.value,
      ];

      totalCount.value += 1;
      startCooldown(COMMENT_SUBMIT_COOLDOWN_SECONDS);

      return true;
    } catch (error) {
      notifySubmitError(error, COMMENT_TOAST.submitError);

      return false;
    }
  }

  async function submitReply(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    // Форма могла остаться открытой с тех пор, как комментарий был живым
    if (isCommentTombstone(node.comment)) {
      return false;
    }

    try {
      const created = await createCommentReply(node.comment.id, {
        ...target,
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

      return true;
    } catch (error) {
      notifySubmitError(error, COMMENT_TOAST.replyError);

      return false;
    }
  }

  async function submitEdit(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    const { comment } = node;

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
        getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.conflict
          ? COMMENT_TOAST.alreadyDeleted
          : COMMENT_TOAST.editError;

      notifyError(error, title);

      return false;
    }
  }

  /** Корень ветки, где лежит комментарий. */
  function findBranchRoot(commentId: string): CommentNode | undefined {
    return rootNodes.value.find((root) => !!findCommentNode([root], commentId));
  }

  /**
   * Перечитывает корневую ветку целиком: удаление последнего ответа под
   * надгробием убирает и надгробие, и это может подняться до корня.
   * @throws ошибку запроса; 404 значит, что корень ушёл из выдачи
   */
  async function reloadRootBranch(rootNode: CommentNode): Promise<void> {
    const refreshed = await fetchCommentById(rootNode.comment.id);

    rootNode.comment = refreshed;

    if (!hasLiveReplies(refreshed)) {
      rootNode.replies = [];
      rootNode.repliesLoaded = true;
      rootNode.repliesExpanded = true;

      return;
    }

    // Фоновая загрузка, начатая до удаления, принесла бы устаревшую ветку
    await repliesLoadPromises.get(rootNode)?.catch(() => undefined);

    const repliesExpandedState = collectRepliesExpanded(rootNode);

    await ensureRepliesLoaded(rootNode, true);

    restoreRepliesExpanded(rootNode, repliesExpandedState);
  }

  async function syncBranchAfterRemoval(node: CommentNode): Promise<void> {
    const rootNode = findBranchRoot(node.comment.id);

    if (rootNode) {
      try {
        await reloadRootBranch(rootNode);
      } catch (error) {
        if (getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.notFound) {
          removeCommentNode(rootNodes.value, rootNode.comment.id);
        } else if (!hasLiveReplies(node.comment)) {
          // Узел с ответами не убираем: сервис оставит надгробие, и вместе
          // с узлом пропали бы живые ответы
          removeCommentNode(rootNodes.value, node.comment.id);
        }
      }
    }

    await refreshCount();
  }

  /**
   * Удаляет комментарий. Ветка приводится в порядок в фоне: диалог
   * подтверждения не ждёт перечитывания глубокого треда.
   */
  async function removeComment(node: CommentNode): Promise<boolean> {
    try {
      await deleteComment(node.comment.id);
    } catch (error) {
      notifyError(error, COMMENT_TOAST.deleteError);

      return false;
    }

    void syncBranchAfterRemoval(node);

    return true;
  }

  /**
   * Восстанавливает надгробие. Только так модератор увидит текст удалённого:
   * в публичных выдачах сервис его не отдаёт.
   */
  async function restoreTombstone(node: CommentNode): Promise<boolean> {
    try {
      const restored = await restoreComment(node.comment.id);

      node.comment = mergeRestoredComment(node.comment, restored);

      toast.add({
        title: COMMENT_TOAST.restored,
        color: 'success',
        icon: COMMENTS_ICON.restore,
      });

      void refreshCount();

      return true;
    } catch (error) {
      notifyError(error, COMMENT_TOAST.restoreError);

      // 409: комментарий уже тронул другой модератор, сверяем ветку
      if (getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.conflict) {
        const branchRoot = findBranchRoot(node.comment.id);

        if (branchRoot) {
          void reloadRootBranch(branchRoot).catch(() => undefined);
        }
      }

      return false;
    }
  }

  /** Запоминает жалобу новым Set, чтобы пересчитались подписчики. */
  function markReported(commentId: string): void {
    reportedCommentIds.value = new Set([
      ...reportedCommentIds.value,
      commentId,
    ]);
  }

  /** Жалоба; 409 значит «уже жаловались», кнопка тоже гаснет. */
  async function submitReport(node: CommentNode): Promise<void> {
    const { comment } = node;

    if (
      isCommentTombstone(comment)
      || reportedCommentIds.value.has(comment.id)
    ) {
      return;
    }

    try {
      const updated = await reportComment(comment.id);

      node.comment = { ...comment, dislikeCount: updated.dislikeCount };
      markReported(comment.id);

      toast.add({
        title: COMMENT_TOAST.reportSuccess,
        description: COMMENT_TOAST.reportSuccessDescription,
        color: 'success',
        icon: COMMENTS_ICON.report,
      });
    } catch (error) {
      if (getCommentErrorStatus(error) === COMMENTS_HTTP_STATUS.conflict) {
        markReported(comment.id);

        toast.add({
          title: COMMENT_TOAST.reportDuplicate,
          description: COMMENT_TOAST.reportDuplicateDescription,
          color: 'info',
          icon: COMMENTS_ICON.report,
        });

        return;
      }

      notifyError(error, COMMENT_TOAST.reportError);
    }
  }

  /** Разворачивает свёрнутых предков, чтобы комментарий стал виден. */
  function expandCommentAncestors(commentId: string): void {
    let currentNode = findCommentNode(rootNodes.value, commentId);

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
   * Комментарий с дальней страницы: поднимаемся до корня, ставим ветку
   * сверху ленты и догружаем её. Дедупликация в `loadMoreComments` не даст
   * корню задвоиться.
   */
  async function revealCommentFromDistantPage(
    commentId: string,
  ): Promise<boolean> {
    try {
      const rootEntry = await fetchRootOfComment(commentId, target);

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
      // 404: комментарий удалён или ссылка битая, остаёмся на ленте
      return false;
    }
  }

  /**
   * Готовит комментарий из якоря: догружает ветки текущей страницы, а если
   * его там нет, поднимает его ветку по id. Затем разворачивает предков.
   * @returns нашёлся ли комментарий
   */
  async function revealComment(commentId: string): Promise<boolean> {
    if (!findCommentNode(rootNodes.value, commentId)) {
      await Promise.all(
        rootNodes.value
          .filter((root) => !root.repliesLoaded && root.comment.replyCount > 0)
          .map((root) => ensureRepliesLoaded(root).catch(() => undefined)),
      );
    }

    if (
      !findCommentNode(rootNodes.value, commentId)
      && !(await revealCommentFromDistantPage(commentId))
    ) {
      return false;
    }

    expandCommentAncestors(commentId);

    return true;
  }

  /**
   * Свой ли комментарий: по `sub` токена, а без него по логину, который
   * сервис записывает автором.
   */
  function isOwnComment(node: CommentNode): boolean {
    const { authorId, authorName } = node.comment;

    if (selfAuthorId.value && authorId) {
      return selfAuthorId.value === authorId;
    }

    return !!user.value?.username && user.value.username === authorName;
  }

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
