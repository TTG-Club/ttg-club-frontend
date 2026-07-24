<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { useToast } from 'vue-toastification';

  import { useUserStore } from '@/shared/stores/UserStore';
  import { ToastEventBus } from '@/shared/utils/toast';

  import { useCommentTimestamp } from '../composables';
  import {
    COMMENT_COPY_LINK_ERROR_TOAST,
    COMMENT_COPY_LINK_LABEL,
    COMMENT_COPY_LINK_SUCCESS_TOAST,
    COMMENT_REPLY_TO_PREFIX,
    COMMENT_RESTORE_FEED_TOOLTIP,
    COMMENT_RESTORE_LABEL,
    COMMENT_SHOW_PARENT_LABEL,
    COMMENT_TOMBSTONE_TEXT,
  } from '../model';

  import type { CommentNode, CommentTreeActions } from '../model';

  const {
    node,
    actions,
    replyToName = null,
  } = defineProps<{
    /** Узел-надгробие: удалённый комментарий с живой веткой ответов. */
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя — подпись «кому отвечало» удалённое. */
    replyToName?: string | null;
  }>();

  const toast = useToast(ToastEventBus);
  const userStore = useUserStore();

  const { isEditor } = storeToRefs(userStore);

  const { copy, isSupported } = useClipboard({ legacy: true });

  /**
   * Подпись «кому ответили» остаётся и у заглушки: в плоской части ветки
   * (за лимитом вложенности) без неё непонятно, к чему относятся ответы.
   */
  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  const { createdLabel, createdFullLabel } = useCommentTimestamp(
    () => node.comment,
  );

  const isRestoring = ref(false);

  /**
   * Копирование ссылки и переход к родителю у заглушки сохранены: это не
   * действия над комментарием, сервис их не отбивает. Прямую ссылку на
   * надгробие он поддерживает — отдаёт заглушку вместо 404.
   */
  async function copyCommentLink(): Promise<void> {
    if (!isSupported.value) {
      toast.error(COMMENT_COPY_LINK_ERROR_TOAST);

      return;
    }

    try {
      await copy(actions.getCommentLink(node.comment.id));

      toast.success(COMMENT_COPY_LINK_SUCCESS_TOAST);
    } catch {
      toast.error(COMMENT_COPY_LINK_ERROR_TOAST);
    }
  }

  function handleCopyLink(): void {
    copyCommentLink();
  }

  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  /**
   * Возвращает комментарий в опубликованные. Подтверждения не требует:
   * действие обратимо — комментарий всегда можно удалить снова. Текст и автор
   * придут вместе с ответом сервиса: в публичных выдачах их не отдают, и это
   * единственный способ их увидеть.
   */
  async function restore(): Promise<void> {
    isRestoring.value = true;

    try {
      await actions.restoreTombstone(node);
    } finally {
      isRestoring.value = false;
    }
  }

  function handleRestore(): void {
    restore();
  }
</script>

<template>
  <!--
    Заглушка на месте удалённого комментария. Аватар с иконкой вместо
    инициала повторяет габарит обычной карточки — линия ветки идёт по той же
    оси. Из действий остались только те, что не трогают сам комментарий:
    ответ, жалобу и правку сервис отклоняет (409), поэтому их здесь нет.
  -->
  <div class="comment-tombstone">
    <n-avatar
      round
      size="small"
      aria-hidden="true"
    >
      <icon icon="tabler:trash" />
    </n-avatar>

    <p class="comment-tombstone__text">
      {{ COMMENT_TOMBSTONE_TEXT }}
    </p>

    <n-tooltip
      v-if="createdLabel"
      trigger="hover"
    >
      <template #trigger>
        <time
          class="comment-tombstone__time"
          :datetime="node.comment.createdAt"
        >
          {{ createdLabel }}
        </time>
      </template>

      {{ createdFullLabel }}
    </n-tooltip>

    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          size="tiny"
          :aria-label="COMMENT_COPY_LINK_LABEL"
          @click.left.exact.prevent="handleCopyLink"
        >
          <template #icon>
            <icon icon="tabler:link" />
          </template>
        </n-button>
      </template>

      {{ COMMENT_COPY_LINK_LABEL }}
    </n-tooltip>

    <n-tooltip
      v-if="node.comment.parentId"
      trigger="hover"
    >
      <template #trigger>
        <n-button
          quaternary
          size="tiny"
          :aria-label="COMMENT_SHOW_PARENT_LABEL"
          @click.left.exact.prevent="showParentComment"
        >
          <template #icon>
            <icon icon="tabler:corner-left-up" />
          </template>
        </n-button>
      </template>

      {{ COMMENT_SHOW_PARENT_LABEL }}
    </n-tooltip>

    <n-tooltip
      v-if="isEditor"
      trigger="hover"
    >
      <template #trigger>
        <n-button
          quaternary
          size="tiny"
          :loading="isRestoring"
          :aria-label="COMMENT_RESTORE_LABEL"
          @click.left.exact.prevent="handleRestore"
        >
          <template #icon>
            <icon icon="tabler:arrow-back-up" />
          </template>
        </n-button>
      </template>

      {{ COMMENT_RESTORE_FEED_TOOLTIP }}
    </n-tooltip>
  </div>

  <p
    v-if="replyToAuthorName"
    class="comment-tombstone__reply-to"
  >
    <icon icon="tabler:arrow-back-up" />

    {{ COMMENT_REPLY_TO_PREFIX }} {{ replyToAuthorName }}
  </p>
</template>

<style lang="scss" scoped>
  .comment-tombstone {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;

    &__text {
      min-width: 0;
      margin: 0;

      font-size: var(--main-font-size);
      font-style: italic;
      color: var(--text-g-color);
    }

    &__time {
      font-size: 12px;
      color: var(--text-g-color);
      white-space: nowrap;
    }

    &__reply-to {
      display: flex;
      gap: 4px;
      align-items: center;

      margin: 0;

      font-size: 12px;
      color: var(--text-g-color);
    }
  }
</style>
