<script setup lang="ts">
  import type { CommentNode, CommentTreeActions } from '../../model';

  import { COMMENT_TEXT, COMMENTS_MAX_VISUAL_DEPTH } from '../../model';
  import CommentCard from './CommentCard.vue';

  /** Ветка: комментарий и, рекурсивно, его ответы. */
  const {
    node,
    depth,
    actions,
    replyToName = null,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    /** Глубина в ветке: у корней 0. */
    depth: number;
    actions: CommentTreeActions;
    /**
     * Имя автора родителя. Ветка передаёт его вниз сама, поэтому после
     * восстановления родителя подпись у ответов появляется сразу.
     */
    replyToName?: string | null;
    /** Комментарий, подсвеченный после перехода по ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const repliesVisible = computed(
    () => node.repliesLoaded && node.repliesExpanded && node.replies.length > 0,
  );

  const isIndented = computed(() => depth < COMMENTS_MAX_VISUAL_DEPTH);

  /** Линия ветки есть только у развёрнутой ветки с отступом. */
  const threadLineVisible = computed(
    () => repliesVisible.value && isIndented.value,
  );

  /** Глубже лимита ответы идут без отступа, с подписью «в ответ». */
  const childrenContainerClass = computed(() =>
    isIndented.value
      ? 'relative ml-3 flex flex-col gap-5 pt-4 pl-3 sm:pl-4'
      : 'flex flex-col gap-5 pt-4',
  );

  function handleToggleReplies(): void {
    void actions.toggleReplies(node);
  }
</script>

<template>
  <div class="relative flex flex-col">
    <CommentCard
      :node="node"
      :actions="actions"
      :reply-to-name="replyToName"
      :highlighted-comment-id="highlightedCommentId"
    />

    <div
      v-if="repliesVisible"
      :class="childrenContainerClass"
    >
      <!-- Линия ветки по оси аватара родителя: клик сворачивает ответы -->
      <button
        v-if="threadLineVisible"
        type="button"
        class="group absolute inset-y-0 left-0 flex w-4 cursor-pointer"
        :aria-label="COMMENT_TEXT.threadCollapse"
        @click.left.exact.prevent="handleToggleReplies"
      >
        <span
          class="h-full border-l-2 border-default transition-colors group-hover:border-primary"
        />
      </button>

      <CommentThread
        v-for="child in node.replies"
        :key="child.comment.id"
        :node="child"
        :depth="depth + 1"
        :actions="actions"
        :reply-to-name="node.comment.authorName"
        :highlighted-comment-id="highlightedCommentId"
      />
    </div>
  </div>
</template>
