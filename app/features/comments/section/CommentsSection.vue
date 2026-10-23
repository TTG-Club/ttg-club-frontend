<script setup lang="ts">
  import type { ButtonProps } from '@nuxt/ui';

  import type { CommentsTarget, CommentTreeActions } from '../model';

  import { AuthModal } from '~user/auth-modal';

  import { useCommentsSection } from '../composables';
  import {
    COMMENT_HIGHLIGHT_DURATION_MS,
    COMMENTS_ICON,
    COMMENTS_PLURAL_FORMS,
    COMMENTS_TEXT,
    getCommentAnchorId,
    getCommentErrorMessage,
    getCommentIdFromHash,
    getPluralWord,
  } from '../model';
  import {
    CommentComposer,
    CommentsLoginNote,
    CommentsPreviewCard,
    CommentsSkeleton,
    CommentThread,
  } from './ui';

  /**
   * Обсуждение записи. Блок стартует свёрнутым: последний комментарий и
   * кнопка, а полная лента грузится по клику или по ссылке на комментарий.
   * Читать может любой, писать — только вошедший.
   */
  const { target } = defineProps<{
    target: CommentsTarget;
  }>();

  const route = useRoute();
  const siteConfig = useSiteConfig();
  const { isLoggedIn } = useUser();

  const isAuthOpen = ref(false);
  const isInitialized = ref(false);
  const isExpanded = ref(false);

  const {
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
  } = useCommentsSection(target);

  /** Право писать: гостю ответ, правка и жалоба не показываются. */
  function canComment(): boolean {
    return isLoggedIn.value;
  }

  /**
   * Ссылка на комментарий строится от адреса записи, а не от текущего: рядом
   * со списком адрес вкладки ведёт на раздел.
   */
  function getCommentLink(commentId: string): string {
    return `${siteConfig.url}${target.url}#${getCommentAnchorId(commentId)}`;
  }

  /** Комментарий, подсвеченный после перехода по ссылке. */
  const highlightedCommentId = ref<string | null>(null);

  const { start: startHighlightFade, stop: stopHighlightFade } = useTimeoutFn(
    () => {
      highlightedCommentId.value = null;
    },
    COMMENT_HIGHLIGHT_DURATION_MS,
    { immediate: false },
  );

  /** Прокручивает к отрисованному комментарию и коротко подсвечивает его. */
  function highlightComment(commentId: string): void {
    document
      .getElementById(getCommentAnchorId(commentId))
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    stopHighlightFade();
    highlightedCommentId.value = commentId;
    startHighlightFade();
  }

  const treeActions: CommentTreeActions = {
    toggleReplies,
    submitReply,
    submitEdit,
    removeComment,
    restoreTombstone,
    submitReport,
    isOwnComment,
    isCommentReported,
    canComment,
    highlightComment,
    getCommentLink,
  };

  const hasComments = computed(() => rootNodes.value.length > 0);

  /** Пустоту утверждаем по счётчику: превью может не собраться из надгробий. */
  const isThreadEmpty = computed(() => totalCount.value === 0);

  /** Гостю на пустом обсуждении кнопка блока сразу ведёт ко входу. */
  const isGuestOnEmptyThread = computed(
    () => !isLoggedIn.value && isThreadEmpty.value,
  );

  const expandButtonLabel = computed(() => {
    if (totalCount.value > 0) {
      return `${COMMENTS_TEXT.expandPrefix} ${totalCount.value} ${getPluralWord(totalCount.value, COMMENTS_PLURAL_FORMS)}`;
    }

    return isGuestOnEmptyThread.value
      ? COMMENTS_TEXT.expandEmptyGuest
      : COMMENTS_TEXT.expandEmpty;
  });

  const loadErrorMessage = computed(() =>
    getCommentErrorMessage(loadError.value),
  );

  const retryActions = computed<Array<ButtonProps>>(() => [
    { label: COMMENTS_TEXT.retry, onClick: handleRetry },
  ]);

  const commentsListElement = useTemplateRef<HTMLElement>('commentsList');

  function hasCommentAnchor(): boolean {
    return !!getCommentIdFromHash(route.hash);
  }

  /** Открывает комментарий из якоря: раскрывает ветку и подсвечивает его. */
  async function revealCommentFromHash(): Promise<void> {
    const commentId = getCommentIdFromHash(route.hash);

    if (!commentId || !(await revealComment(commentId))) {
      return;
    }

    await nextTick();
    highlightComment(commentId);
  }

  async function expandComments(): Promise<void> {
    if (isExpanded.value) {
      return;
    }

    isExpanded.value = true;
    await loadComments();
  }

  async function expandAndReveal(): Promise<void> {
    await expandComments();
    await revealCommentFromHash();
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  function handleExpand(): void {
    if (isGuestOnEmptyThread.value) {
      openAuth();

      return;
    }

    void expandComments();
  }

  function handleLoadMore(): void {
    void loadMoreComments();
  }

  /** Повторяет загрузку того режима, где случилась ошибка. */
  function handleRetry(): void {
    if (isExpanded.value) {
      void loadComments();
    } else {
      void loadPreview();
    }
  }

  /**
   * Новый комментарий встаёт сверху ленты, а форма стоит снизу: после
   * отправки подводим взгляд к нему.
   */
  async function submitRootAndReveal(content: string): Promise<boolean> {
    const success = await submitRootComment(content);

    if (success) {
      await nextTick();

      commentsListElement.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    return success;
  }

  /** Без якоря в адресе грузится только превью. */
  async function initializeComments(): Promise<void> {
    if (isInitialized.value) {
      return;
    }

    isInitialized.value = true;

    if (hasCommentAnchor()) {
      await expandAndReveal();

      return;
    }

    await loadPreview();
  }

  onMounted(initializeComments);

  // Переход по ссылке на другой комментарий без перезагрузки страницы
  watch(
    () => route.hash,
    () => {
      if (isInitialized.value && hasCommentAnchor()) {
        void expandAndReveal();
      }
    },
  );
</script>

<template>
  <section class="flex flex-col gap-4">
    <USeparator />

    <ClientOnly>
      <header class="flex items-center gap-2">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ COMMENTS_TEXT.title }}
        </h2>

        <UBadge
          v-if="totalCount > 0"
          variant="subtle"
          size="sm"
          :label="totalCount"
        />
      </header>

      <template v-if="!isExpanded">
        <CommentsSkeleton
          v-if="isPreviewLoading"
          :rows="1"
        />

        <UEmpty
          v-else-if="loadError"
          :icon="COMMENTS_ICON.error"
          :title="COMMENTS_TEXT.loadError"
          :description="loadErrorMessage"
          :actions="retryActions"
        />

        <template v-else>
          <button
            v-if="latestComment"
            type="button"
            class="-mx-2 flex cursor-pointer flex-col rounded-lg px-2 py-1 text-left transition-colors hover:bg-elevated"
            @click.left.exact.prevent="handleExpand"
          >
            <CommentsPreviewCard :comment="latestComment" />
          </button>

          <p
            v-else-if="isThreadEmpty"
            class="py-2 text-center text-sm text-muted"
          >
            {{ COMMENTS_TEXT.empty }}
          </p>

          <p
            v-else
            class="py-2 text-center text-sm text-muted"
          >
            {{ COMMENTS_TEXT.previewUnavailable }}
          </p>

          <UButton
            variant="soft"
            color="neutral"
            block
            :icon="COMMENTS_ICON.comments"
            :label="expandButtonLabel"
            @click.left.exact.prevent="handleExpand"
          />
        </template>
      </template>

      <template v-else>
        <CommentsSkeleton v-if="isLoading" />

        <UEmpty
          v-else-if="loadError"
          :icon="COMMENTS_ICON.error"
          :title="COMMENTS_TEXT.loadError"
          :description="loadErrorMessage"
          :actions="retryActions"
        />

        <template v-else>
          <p
            v-if="!hasComments"
            class="py-4 text-center text-sm text-muted"
          >
            {{ COMMENTS_TEXT.empty }}
          </p>

          <div
            v-else
            ref="commentsList"
            class="flex scroll-mt-24 flex-col gap-6"
          >
            <CommentThread
              v-for="node in rootNodes"
              :key="node.comment.id"
              :node="node"
              :depth="0"
              :actions="treeActions"
              :highlighted-comment-id="highlightedCommentId"
            />
          </div>

          <UButton
            v-if="!isLastPage"
            variant="soft"
            color="neutral"
            block
            :label="COMMENTS_TEXT.loadMore"
            :loading="isLoadingMore"
            @click.left.exact.prevent="handleLoadMore"
          />

          <CommentComposer
            v-if="isLoggedIn"
            :placeholder="COMMENTS_TEXT.rootPlaceholder"
            :submit-action="submitRootAndReveal"
          />

          <CommentsLoginNote
            v-else
            @login="openAuth"
          />
        </template>
      </template>

      <AuthModal v-model="isAuthOpen" />

      <template #fallback>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ COMMENTS_TEXT.title }}
        </h2>

        <CommentsSkeleton :rows="1" />
      </template>
    </ClientOnly>
  </section>
</template>
