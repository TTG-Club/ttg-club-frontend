<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import { useUserStore } from '@/shared/stores/UserStore';
  import { getPlural } from '@/shared/utils/string';

  import { useCommentsSection } from '../composables';
  import {
    COMMENT_ANCHOR_PREFIX,
    COMMENT_COMPOSER_ROOT_PLACEHOLDER,
    COMMENT_HIGHLIGHT_DURATION_MS,
    COMMENTS_EMPTY_MESSAGE,
    COMMENTS_EXPAND_EMPTY_GUEST_LABEL,
    COMMENTS_EXPAND_EMPTY_LABEL,
    COMMENTS_EXPAND_PREFIX,
    COMMENTS_LOAD_ERROR_TOAST,
    COMMENTS_LOAD_MORE_LABEL,
    COMMENTS_PLURAL_FORMS,
    COMMENTS_PREVIEW_UNAVAILABLE,
    COMMENTS_RETRY_LABEL,
    COMMENTS_SECTION_TITLE,
    getCommentAnchorId,
    getCommentErrorMessage,
  } from '../model';

  import CommentComposer from './CommentComposer.vue';
  import CommentsAuthModal from './CommentsAuthModal.vue';
  import CommentsLoginNote from './CommentsLoginNote.vue';
  import CommentsPreviewCard from './CommentsPreviewCard.vue';
  import CommentsSkeleton from './CommentsSkeleton.vue';
  import CommentThread from './CommentThread.vue';

  import type { CommentTreeActions } from '../model';

  const {
    section,
    url,
    title = COMMENTS_SECTION_TITLE,
  } = defineProps<{
    /** Раздел сайта в сервисе комментариев (например, `spells`). */
    section: string;
    /** URL страницы внутри раздела — ключ обсуждения. */
    url: string;
    /** Заголовок блока. */
    title?: string;
  }>();

  const route = useRoute();
  const userStore = useUserStore();

  const { isAuthenticated } = storeToRefs(userStore);

  const isAuthOpen = ref(false);

  /** Лента уже загружалась в этой сессии (защита от повторной загрузки). */
  const isInitialized = ref(false);

  /**
   * Свёрнутый режим: показывается последний комментарий и кнопка
   * разворачивания; полная лента грузится только по клику.
   */
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
  } = useCommentsSection({ section, url });

  /**
   * Право писать: гостю не показываются ответ, правка и жалоба — сервис
   * отвечает на них 401. Читать обсуждение можно и без входа.
   */
  function canComment(): boolean {
    return isAuthenticated.value;
  }

  /**
   * Абсолютная якорная ссылка на комментарий. Строится от канонического
   * адреса обсуждения, а не от текущего: в боковой панели адрес вкладки может
   * быть адресом списка, и ссылка с него не привела бы к комментарию.
   *
   * @param commentId Идентификатор комментария.
   */
  function getCommentLink(commentId: string): string {
    return `${window.location.origin}${url}#${getCommentAnchorId(commentId)}`;
  }

  /** Комментарий, подсвеченный после перехода по якорной ссылке. */
  const highlightedCommentId = ref<string | null>(null);

  const { start: startHighlightFade, stop: stopHighlightFade } = useTimeoutFn(
    () => {
      highlightedCommentId.value = null;
    },
    COMMENT_HIGHLIGHT_DURATION_MS,
    { immediate: false },
  );

  /**
   * Скроллит к уже отрисованному комментарию и коротко подсвечивает его
   * (переход по якорю, «Показать родительский» из меню ответа).
   *
   * @param commentId Идентификатор комментария.
   */
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

  /**
   * У страницы нет ни одного опубликованного комментария. Считаем по
   * серверному счётчику, а не по превью: превью может не собраться и при
   * живом обсуждении (сверху ленты одни надгробия).
   */
  const isThreadEmpty = computed(() => totalCount.value === 0);

  /**
   * Гость на пустом обсуждении: разворачивать нечего, а единственное, что ему
   * тут доступно, — войти и начать разговор. Кнопка свёрнутого блока в этом
   * случае и подписана, и работает как вход.
   */
  const isGuestOnEmptyThread = computed(
    () => !isAuthenticated.value && isThreadEmpty.value,
  );

  /** Подпись кнопки разворачивания свёрнутого блока. */
  const expandButtonLabel = computed(() => {
    if (totalCount.value > 0) {
      return `${COMMENTS_EXPAND_PREFIX} ${totalCount.value} ${getPlural(totalCount.value, COMMENTS_PLURAL_FORMS)}`;
    }

    return isGuestOnEmptyThread.value
      ? COMMENTS_EXPAND_EMPTY_GUEST_LABEL
      : COMMENTS_EXPAND_EMPTY_LABEL;
  });

  const loadErrorMessage = computed(() =>
    getCommentErrorMessage(loadError.value),
  );

  /** Идёт загрузка того режима, который сейчас показан. */
  const isBusy = computed(() =>
    isExpanded.value ? isLoading.value : isPreviewLoading.value,
  );

  /** Есть ли в адресе якорь комментария. */
  function hasCommentAnchor(): boolean {
    return route.hash.slice(1).startsWith(COMMENT_ANCHOR_PREFIX);
  }

  /**
   * Разворачивает свёрнутый блок и грузит полную ленту.
   */
  async function expandComments(): Promise<void> {
    if (isExpanded.value) {
      return;
    }

    isExpanded.value = true;

    await loadComments();
  }

  /**
   * Открывает комментарий из якоря `#comment-<id>`: догружает ветки корней,
   * скроллит к карточке и коротко подсвечивает её.
   */
  async function revealCommentFromHash(): Promise<void> {
    const commentId = route.hash.slice(1 + COMMENT_ANCHOR_PREFIX.length);

    if (!commentId) {
      return;
    }

    const found = await revealComment(commentId);

    if (!found) {
      return;
    }

    await nextTick();

    highlightComment(commentId);
  }

  /**
   * Переход по якорю: сначала разворачивает блок, затем раскрывает ветку
   * и подсвечивает целевой комментарий.
   */
  async function expandAndReveal(): Promise<void> {
    await expandComments();
    await revealCommentFromHash();
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }

  /**
   * Клик по кнопке свёрнутого блока. Гостю на пустом обсуждении она ведёт
   * сразу в окно входа: разворачивать нечего, а подпись обещает вход.
   */
  function handleExpand(): void {
    if (isGuestOnEmptyThread.value) {
      openAuth();

      return;
    }

    expandComments();
  }

  function handleLoadMore(): void {
    loadMoreComments();
  }

  /** Повтор загрузки того режима, в котором случилась ошибка. */
  function handleRetry(): void {
    if (isExpanded.value) {
      loadComments();
    } else {
      loadPreview();
    }
  }

  const commentsListElement = ref<HTMLElement | null>(null);

  /**
   * Свежий комментарий появляется сверху ленты (сортировка «новые сверху»),
   * а форма стоит снизу — после отправки подводим взгляд к добавленной записи.
   *
   * @param content Текст комментария.
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

  /**
   * Первичная загрузка. Обсуждение читают все, включая гостей, — вход нужен
   * только чтобы писать. Без якоря в адресе блок стартует свёрнутым: грузится
   * только превью.
   */
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

  // Повторный переход по якорю без перезагрузки страницы (клик по ссылке
  // на другой комментарий, кнопка «назад») разворачивает блок, раскрывает
  // ветку и подсвечивает цель.
  watch(
    () => route.hash,
    () => {
      if (isInitialized.value && hasCommentAnchor()) {
        expandAndReveal();
      }
    },
  );
</script>

<template>
  <section class="comments-section">
    <!--
      Разделитель отбивает обсуждение от контента материала как отдельный
      блок. Своя линия, а не `n-divider`: тот красится `dividerColor`, который
      в теме проекта не переопределён, и на фоне деталки почти не виден.
    -->
    <hr class="comments-section__divider" />

    <header class="comments-section__header">
      <h2 class="comments-section__title">
        {{ title }}
      </h2>

      <n-tag
        v-if="totalCount > 0"
        size="small"
        :bordered="false"
      >
        {{ totalCount }}
      </n-tag>
    </header>

    <comments-skeleton
      v-if="isBusy"
      :rows="isExpanded ? 3 : 1"
    />

    <div
      v-else-if="loadError"
      class="comments-section__stack comments-section__stack_error"
    >
      <n-alert
        type="error"
        :title="COMMENTS_LOAD_ERROR_TOAST"
      >
        {{ loadErrorMessage }}
      </n-alert>

      <n-button
        size="small"
        @click.left.exact.prevent="handleRetry"
      >
        {{ COMMENTS_RETRY_LABEL }}
      </n-button>
    </div>

    <div
      v-else-if="!isExpanded"
      class="comments-section__stack"
    >
      <button
        v-if="latestComment"
        class="comments-section__preview"
        type="button"
        @click.left.exact.prevent="handleExpand"
      >
        <comments-preview-card :comment="latestComment" />
      </button>

      <!--
        Отсутствие превью ещё не значит отсутствия обсуждения: сверху
        ленты могут стоять надгробия, из которых карточку не собрать.
        Пустоту утверждаем только по серверному счётчику.
      -->
      <p
        v-else
        class="comments-section__note"
      >
        {{
          isThreadEmpty ? COMMENTS_EMPTY_MESSAGE : COMMENTS_PREVIEW_UNAVAILABLE
        }}
      </p>

      <n-button
        block
        secondary
        @click.left.exact.prevent="handleExpand"
      >
        <template #icon>
          <icon icon="tabler:message-circle" />
        </template>

        {{ expandButtonLabel }}
      </n-button>
    </div>

    <div
      v-else
      class="comments-section__stack"
    >
      <p
        v-if="!hasComments"
        class="comments-section__note"
      >
        {{ COMMENTS_EMPTY_MESSAGE }}
      </p>

      <div
        v-else
        ref="commentsListElement"
        class="comments-section__list"
      >
        <comment-thread
          v-for="node in rootNodes"
          :key="node.comment.id"
          :node="node"
          :depth="0"
          :actions="treeActions"
          :highlighted-comment-id="highlightedCommentId"
        />
      </div>

      <n-button
        v-if="!isLastPage"
        block
        secondary
        :loading="isLoadingMore"
        @click.left.exact.prevent="handleLoadMore"
      >
        {{ COMMENTS_LOAD_MORE_LABEL }}
      </n-button>

      <!--
        Гостю на месте формы — приглашение войти: читать обсуждение может
        любой, отправлять комментарии — только авторизованный.
      -->
      <comment-composer
        v-if="isAuthenticated"
        :placeholder="COMMENT_COMPOSER_ROOT_PLACEHOLDER"
        :submit-action="submitRootAndReveal"
      />

      <comments-login-note
        v-else
        @login="openAuth"
      />
    </div>

    <comments-auth-modal v-model="isAuthOpen" />
  </section>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .comments-section {
    display: flex;
    flex-direction: column;
    gap: 16px;

    // Горизонтальный отступ деталки задаёт `.content-padding` внутри каждого
    // `*Body.vue`, а блок обсуждения — их сосед в слоте и этот отступ не
    // наследует. Повторяем значения оттуда, иначе комментарии уезжают левее
    // текста материала.
    padding: 0 16px 16px;

    @include media-min($xl) {
      padding: 0 24px 16px;
    }

    &__divider {
      width: 100%;
      margin: 0;
      border: 0;
      border-top: 1px solid var(--border);
    }

    &__header {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    // Обёртка ветки состояния держит тот же вертикальный ритм, что и сама
    // секция, чтобы вложенность не меняла отступы.
    &__stack {
      display: flex;
      flex-direction: column;
      gap: 16px;

      &_error {
        gap: 8px;
        align-items: flex-start;
      }
    }

    &__title {
      margin: 0;
      font-size: var(--h4-font-size);
      line-height: var(--h4-line-height);
      color: var(--text-color-title);
    }

    &__preview {
      cursor: pointer;

      display: flex;
      flex-direction: column;

      margin: 0 -8px;
      padding: 4px 8px;

      text-align: left;

      background: transparent;
      border: 0;
      border-radius: 8px;

      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--hover);
      }
    }

    &__note {
      margin: 0;
      padding: 8px 0;

      font-size: var(--main-font-size);
      color: var(--text-g-color);
      text-align: center;
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }
</style>
