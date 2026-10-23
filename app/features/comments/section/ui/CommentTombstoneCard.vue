<script setup lang="ts">
  import type { CommentNode, CommentTreeActions } from '../../model';

  import { useCommentLinkCopy, useCommentTimestamp } from '../../composables';
  import { COMMENT_TEXT, COMMENTS_ICON } from '../../model';

  /**
   * Заглушка на месте удалённого комментария, которая держит видимыми его
   * ответы. Ответ, жалобу и правку сервис отклоняет, поэтому остались только
   * ссылка, переход к родителю и восстановление для модераторов.
   */
  const {
    node,
    actions,
    replyToName = null,
  } = defineProps<{
    node: CommentNode;
    actions: CommentTreeActions;
    /** Имя автора родителя: кому отвечал удалённый комментарий. */
    replyToName?: string | null;
  }>();

  const { copyLink } = useCommentLinkCopy();
  const { isEditor } = useUser();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(
    () => node.comment,
  );

  const replyToAuthorName = computed(
    () => replyToName ?? node.comment.parentAuthorName,
  );

  const isRestoring = ref(false);

  function copyCommentLink(): void {
    void copyLink(actions.getCommentLink(node.comment.id));
  }

  function showParentComment(): void {
    const { parentId } = node.comment;

    if (parentId) {
      actions.highlightComment(parentId);
    }
  }

  /** Восстановление обратимо, поэтому без подтверждения. */
  async function restore(): Promise<void> {
    isRestoring.value = true;

    try {
      await actions.restoreTombstone(node);
    } finally {
      isRestoring.value = false;
    }
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
    <UAvatar
      :icon="COMMENTS_ICON.delete"
      size="xs"
      class="shrink-0"
      aria-hidden="true"
    />

    <p class="min-w-0 text-sm text-muted italic">
      {{ COMMENT_TEXT.tombstone }}
    </p>

    <UTooltip
      v-if="createdLabel"
      :text="createdFullLabel"
    >
      <time
        class="text-xs whitespace-nowrap text-muted"
        :datetime="node.comment.createdAt"
      >
        {{ createdLabel }}
      </time>
    </UTooltip>

    <UTooltip :text="COMMENT_TEXT.copyLink">
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="COMMENTS_ICON.link"
        :aria-label="COMMENT_TEXT.copyLink"
        @click.left.exact.prevent="copyCommentLink"
      />
    </UTooltip>

    <UTooltip
      v-if="node.comment.parentId"
      :text="COMMENT_TEXT.showParent"
    >
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="COMMENTS_ICON.parent"
        :aria-label="COMMENT_TEXT.showParent"
        @click.left.exact.prevent="showParentComment"
      />
    </UTooltip>

    <UTooltip
      v-if="isEditor"
      :text="COMMENT_TEXT.restoreTooltip"
    >
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="COMMENTS_ICON.restore"
        :loading="isRestoring"
        :aria-label="COMMENT_TEXT.restore"
        @click.left.exact.prevent="restore"
      />
    </UTooltip>
  </div>

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
</template>
