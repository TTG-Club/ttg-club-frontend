<script setup lang="ts">
  import {
    COMMENT_THREAD_COLLAPSE_LABEL,
    COMMENTS_MAX_VISUAL_DEPTH,
  } from '../model';

  import CommentCard from './CommentCard.vue';

  import type { CommentNode, CommentTreeActions } from '../model';

  defineOptions({ name: 'CommentThread' });

  const {
    node,
    depth,
    actions,
    replyToName = null,
    highlightedCommentId = null,
  } = defineProps<{
    node: CommentNode;
    /** Глубина в ветке: корни — 0. */
    depth: number;
    actions: CommentTreeActions;
    /**
     * Имя автора родителя — подпись «кому ответили». Ветка передаёт его вниз
     * сама, поэтому оно всегда актуально: восстановление родителя-надгробия
     * тут же проявляет подпись у его ответов.
     */
    replyToName?: string | null;
    /** Комментарий, подсвеченный после перехода по якорной ссылке. */
    highlightedCommentId?: string | null;
  }>();

  const repliesVisible = computed(
    () => node.repliesLoaded && node.repliesExpanded && node.replies.length > 0,
  );

  /**
   * До лимита вложенности дети получают отступ под линию ветки, глубже —
   * рисуются «ровно», на уровне родителя (кому ответили — подпись
   * в карточке). Линия под аватаром родителя рисуется только для ветки
   * с отступом.
   */
  const isIndented = computed(() => depth < COMMENTS_MAX_VISUAL_DEPTH);

  function handleToggleReplies(): void {
    actions.toggleReplies(node);
  }
</script>

<template>
  <div class="comment-thread">
    <comment-card
      :node="node"
      :actions="actions"
      :reply-to-name="replyToName"
      :highlighted-comment-id="highlightedCommentId"
    />

    <div
      v-if="repliesVisible"
      class="comment-thread__children"
      :class="{ 'is-indented': isIndented }"
    >
      <!--
        Единая кликабельная линия ветки: от карточки родителя до конца
        ответов по оси его аватара; наведение подсвечивает всю линию,
        клик сворачивает ветку.
      -->
      <button
        v-if="isIndented"
        class="comment-thread__line"
        type="button"
        :aria-label="COMMENT_THREAD_COLLAPSE_LABEL"
        @click.left.exact.prevent="handleToggleReplies"
      />

      <comment-thread
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

<style lang="scss" scoped>
  .comment-thread {
    position: relative;
    display: flex;
    flex-direction: column;

    &__children {
      display: flex;
      flex-direction: column;
      gap: 20px;

      // Вертикальный отступ задан здесь, а не gap-обёрткой, чтобы линия
      // ветки шла без разрывов.
      padding-top: 16px;

      &.is-indented {
        position: relative;
        margin-left: 12px;
        padding-left: 12px;
      }
    }

    &__line {
      cursor: pointer;

      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;

      display: flex;

      width: 16px;
      padding: 0;

      background: transparent;
      border: 0;
      border-left: 2px solid var(--border);

      transition: border-color 0.2s ease;

      &:hover {
        border-left-color: var(--primary);
      }
    }
  }
</style>
