<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type {
    CommentCardAction,
    CommentNode,
    CommentTreeActions,
  } from '../../model';

  import { useCommentLinkCopy, useCommentTimestamp } from '../../composables';
  import {
    COMMENT_REPLIES_PLURAL_FORMS,
    COMMENT_TEXT,
    COMMENTS_ICON,
    COMMENTS_TEXT,
    countCommentDescendants,
    getCommentAnchorId,
    getPluralWord,
    hasServerReplyTotal,
    isCommentTombstone,
  } from '../../model';
  import CommentComposer from './CommentComposer.vue';
  import CommentTombstoneCard from './CommentTombstoneCard.vue';

  /** Карточка комментария: автор, время, текст, действия и формы. */
  const {
    node,
    actions,
    replyToName = null,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя, приходит от ветки. */
    replyToName?: string | null;
    /** Комментарий, подсвеченный после перехода по ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const { copyLink } = useCommentLinkCopy();
  const { isEditor } = useUser();

  const { createdLabel, createdFullLabel, editedTooltip } = useCommentTimestamp(
    () => node.comment,
  );

  const anchorId = computed(() => getCommentAnchorId(node.comment.id));

  /** Подсветка появляется сразу, а снимается с плавным угасанием. */
  const highlightClass = computed(() =>
    highlightedCommentId === node.comment.id
      ? 'bg-elevated'
      : 'bg-transparent transition-colors duration-1000',
  );

  /** Комментарий с текстом; `null` — надгробие. */
  const publishedComment = computed(() =>
    isCommentTombstone(node.comment) ? null : node.comment,
  );

  const isTombstone = computed(() => !publishedComment.value);

  /** У надгробия нет автора и текста, его называем явно. */
  const articleLabel = computed(() =>
    isTombstone.value ? COMMENT_TEXT.tombstone : undefined,
  );

  const replyPlaceholder = computed(() =>
    publishedComment.value
      ? `${COMMENT_TEXT.replyPlaceholderPrefix} ${publishedComment.value.authorName}`
      : '',
  );

  const isReplyOpen = ref(false);
  const isEditOpen = ref(false);
  const isDeleteOpen = ref(false);
  const isDeleting = ref(false);

  const isOwn = computed(() => actions.isOwnComment(node));

  /** Гость только читает: ответ и жалоба требуют входа. */
  const canComment = computed(() => actions.canComment());

  /** Править и удалять может автор, а также модераторы и администраторы. */
  const canManageComment = computed(() => isOwn.value || isEditor.value);

  const isReported = computed(() => actions.isCommentReported(node.comment.id));

  /** Кому отвечает комментарий: из ветки, а без неё — от сервиса. */
  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  const deleteDescription = computed(() =>
    node.comment.replyCount > 0
      ? COMMENT_TEXT.deleteBranchWarning
      : COMMENT_TEXT.deleteWarning,
  );

  /** Все потомки ветки; до загрузки число известно не всегда точно. */
  const repliesTotal = computed(() => countCommentDescendants(node));

  const showRepliesToggle = computed(() => repliesTotal.value > 0);

  const isRepliesOpen = computed(
    () => node.repliesLoaded && node.repliesExpanded,
  );

  const repliesToggleLabel = computed(() => {
    if (isRepliesOpen.value) {
      return COMMENT_TEXT.repliesHide;
    }

    // Без totalReplyCount до загрузки известны только прямые ответы:
    // число не показываем, чтобы не занижать его
    if (node.repliesLoaded || hasServerReplyTotal(node.comment)) {
      return `${repliesTotal.value} ${getPluralWord(repliesTotal.value, COMMENT_REPLIES_PLURAL_FORMS)}`;
    }

    return COMMENT_TEXT.repliesShow;
  });

  const repliesToggleIcon = computed(() =>
    isRepliesOpen.value ? COMMENTS_ICON.collapse : COMMENTS_ICON.expand,
  );

  const showReplyButton = computed(
    () => !isTombstone.value && canComment.value,
  );

  /** Форма ответа гаснет, если комментарий удалили или пользователь вышел. */
  const showReplyForm = computed(
    () => isReplyOpen.value && showReplyButton.value,
  );

  /** Форма правки гаснет после выхода, а набранный текст сохраняется. */
  const showEditForm = computed(
    () => isEditOpen.value && canManageComment.value,
  );

  /** Ряд под карточкой; у надгробия от него остаётся только ветка. */
  const showFooter = computed(() => {
    if (isTombstone.value) {
      return showRepliesToggle.value;
    }

    return (
      !showEditForm.value && (showRepliesToggle.value || showReplyButton.value)
    );
  });

  /** Действия карточки: общий источник для меню и ряда кнопок. */
  const cardActions = computed<Array<CommentCardAction>>(() => {
    const availableActions: Array<CommentCardAction> = [
      {
        key: 'copy-link',
        label: COMMENT_TEXT.copyLink,
        icon: COMMENTS_ICON.link,
        color: 'neutral',
        disabled: false,
        handler: copyCommentLink,
      },
    ];

    if (node.comment.parentId) {
      availableActions.push({
        key: 'show-parent',
        label: COMMENT_TEXT.showParent,
        icon: COMMENTS_ICON.parent,
        color: 'neutral',
        disabled: false,
        handler: showParentComment,
      });
    }

    if (canManageComment.value) {
      availableActions.push(
        {
          key: 'edit',
          label: COMMENT_TEXT.edit,
          icon: COMMENTS_ICON.edit,
          color: 'neutral',
          disabled: false,
          handler: openEdit,
        },
        {
          key: 'delete',
          label: COMMENT_TEXT.delete,
          icon: COMMENTS_ICON.delete,
          color: 'error',
          disabled: false,
          handler: openDelete,
        },
      );

      return availableActions;
    }

    if (!canComment.value) {
      return availableActions;
    }

    availableActions.push({
      key: 'report',
      label: isReported.value ? COMMENT_TEXT.reported : COMMENT_TEXT.report,
      icon: COMMENTS_ICON.report,
      color: 'error',
      disabled: isReported.value,
      handler: handleReport,
    });

    return availableActions;
  });

  const menuItems = computed<Array<DropdownMenuItem>>(() =>
    cardActions.value.map((action) => ({
      label: action.label,
      icon: action.icon,
      color: action.color,
      disabled: action.disabled,
      onSelect: action.handler,
    })),
  );

  // Право управлять может пропасть при открытом диалоге (выход, снятие роли),
  // и подтверждение ушло бы в 401. Цикла нет: вотчер меняет только флаг окна.
  watch(canManageComment, (canManage) => {
    if (!canManage) {
      isDeleteOpen.value = false;
    }
  });

  function runCardAction(action: CommentCardAction): void {
    action.handler?.();
  }

  function handleToggleReplies(): void {
    void actions.toggleReplies(node);
  }

  /** Родитель видимого ответа всегда отрисован: его ветка раскрыта. */
  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  function copyCommentLink(): void {
    void copyLink(actions.getCommentLink(node.comment.id));
  }

  function openEdit(): void {
    isEditOpen.value = true;
    isReplyOpen.value = false;
  }

  function closeEdit(): void {
    isEditOpen.value = false;
  }

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  function closeDelete(): void {
    isDeleteOpen.value = false;
  }

  function toggleReply(): void {
    isReplyOpen.value = !isReplyOpen.value;
    isEditOpen.value = false;
  }

  function closeReply(): void {
    isReplyOpen.value = false;
  }

  function handleReport(): void {
    void actions.submitReport(node);
  }

  async function confirmDelete(): Promise<void> {
    isDeleting.value = true;

    try {
      if (await actions.removeComment(node)) {
        isDeleteOpen.value = false;
      }
    } finally {
      isDeleting.value = false;
    }
  }

  function submitReplyAction(content: string): Promise<boolean> {
    return actions.submitReply(node, content);
  }

  function submitEditAction(content: string): Promise<boolean> {
    return actions.submitEdit(node, content);
  }
</script>

<template>
  <article
    :id="anchorId"
    class="group/comment -mx-2 flex scroll-mt-24 flex-col gap-1.5 rounded-lg px-2"
    :class="highlightClass"
    :aria-label="articleLabel"
  >
    <CommentTombstoneCard
      v-if="isTombstone"
      :node="node"
      :actions="actions"
      :reply-to-name="replyToName"
    />

    <template v-else-if="publishedComment">
      <header class="flex items-start gap-2 sm:items-center">
        <UAvatar
          :alt="publishedComment.authorName"
          size="xs"
          class="shrink-0"
        />

        <div
          class="flex min-w-0 flex-1 flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-x-2"
        >
          <span
            class="min-w-0 truncate text-sm/6 font-semibold text-highlighted"
          >
            {{ publishedComment.authorName }}
          </span>

          <div class="flex min-w-0 items-center gap-2">
            <UBadge
              v-if="isOwn"
              variant="subtle"
              size="sm"
              :label="COMMENT_TEXT.ownBadge"
            />

            <UTooltip
              v-if="createdLabel"
              :text="createdFullLabel"
            >
              <time
                class="text-xs whitespace-nowrap text-muted"
                :datetime="publishedComment.createdAt"
              >
                {{ createdLabel }}
              </time>
            </UTooltip>

            <UTooltip
              v-if="publishedComment.editedAt"
              :text="editedTooltip"
            >
              <span class="text-xs text-dimmed">{{ COMMENT_TEXT.edited }}</span>
            </UTooltip>

            <!--
              С мышью действия — ряд кнопок, который проявляется при наведении
              на карточку или фокусе. На сенсорных экранах остаётся меню.
            -->
            <div
              class="hidden items-center gap-0.5 opacity-0 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100 pointer-fine:flex"
            >
              <UTooltip
                v-for="action in cardActions"
                :key="action.key"
                :text="action.label"
              >
                <UButton
                  :icon="action.icon"
                  variant="ghost"
                  :color="action.color"
                  size="xs"
                  :disabled="action.disabled"
                  :aria-label="action.label"
                  @click.left.exact.prevent="runCardAction(action)"
                />
              </UTooltip>
            </div>

            <UDropdownMenu :items="menuItems">
              <UButton
                :icon="COMMENTS_ICON.menu"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="COMMENT_TEXT.actionsMenu"
                class="pointer-fine:hidden"
              />
            </UDropdownMenu>
          </div>
        </div>
      </header>

      <p
        v-if="replyToAuthorName"
        class="flex items-center gap-1 text-xs text-muted"
      >
        <UIcon
          :name="COMMENTS_ICON.reply"
          class="size-3.5 shrink-0"
          aria-hidden="true"
        />
        {{ COMMENT_TEXT.replyTo }} {{ replyToAuthorName }}
      </p>

      <!-- Текст выводится как есть, без HTML: сервис ввод не очищает -->
      <p
        v-if="!showEditForm"
        class="text-sm wrap-break-word whitespace-pre-line text-default"
      >
        {{ publishedComment.content }}
      </p>

      <CommentComposer
        v-else
        :initial-content="publishedComment.content"
        :placeholder="COMMENT_TEXT.editPlaceholder"
        :submit-label="COMMENT_TEXT.editSubmit"
        cancellable
        autofocus
        :with-cooldown="false"
        :submit-action="submitEditAction"
        @done="closeEdit"
        @cancel="closeEdit"
      />
    </template>

    <footer
      v-if="showFooter"
      class="-ml-2 flex flex-wrap items-center gap-1"
    >
      <UButton
        v-if="showRepliesToggle"
        variant="ghost"
        size="xs"
        :icon="repliesToggleIcon"
        :label="repliesToggleLabel"
        :loading="node.repliesLoading"
        @click.left.exact.prevent="handleToggleReplies"
      />

      <UButton
        v-if="showReplyButton"
        variant="ghost"
        color="neutral"
        size="xs"
        :icon="COMMENTS_ICON.reply"
        :label="COMMENT_TEXT.reply"
        @click.left.exact.prevent="toggleReply"
      />
    </footer>

    <CommentComposer
      v-if="showReplyForm"
      :placeholder="replyPlaceholder"
      :submit-label="COMMENT_TEXT.reply"
      cancellable
      autofocus
      :submit-action="submitReplyAction"
      @done="closeReply"
      @cancel="closeReply"
    />

    <UModal
      v-model:open="isDeleteOpen"
      :title="COMMENT_TEXT.deleteTitle"
      :description="deleteDescription"
      :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          :label="COMMENTS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          :disabled="isDeleting"
          @click.left.exact.prevent="closeDelete"
        />

        <UButton
          :label="COMMENT_TEXT.delete"
          :icon="COMMENTS_ICON.delete"
          color="error"
          :loading="isDeleting"
          @click.left.exact.prevent="confirmDelete"
        />
      </template>
    </UModal>
  </article>
</template>
