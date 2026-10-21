<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import { useCommentTimestamp } from '../composables';
  import { COMMENT_REPLY_TO_PREFIX, getCommentAuthorInitial } from '../model';

  import type { CommentEntry } from '../model';

  const { comment } = defineProps<{
    comment: CommentEntry;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(() => comment);

  const authorInitial = computed(() =>
    getCommentAuthorInitial(comment.authorName),
  );
</script>

<template>
  <article class="comments-preview-card">
    <header class="comments-preview-card__header">
      <n-avatar
        round
        size="small"
      >
        {{ authorInitial }}
      </n-avatar>

      <span class="comments-preview-card__author">
        {{ comment.authorName }}
      </span>

      <n-tooltip
        v-if="createdLabel"
        trigger="hover"
      >
        <template #trigger>
          <time
            class="comments-preview-card__time"
            :datetime="comment.createdAt"
          >
            {{ createdLabel }}
          </time>
        </template>

        {{ createdFullLabel }}
      </n-tooltip>
    </header>

    <p
      v-if="comment.parentAuthorName"
      class="comments-preview-card__reply-to"
    >
      <icon icon="tabler:arrow-back-up" />

      {{ COMMENT_REPLY_TO_PREFIX }} {{ comment.parentAuthorName }}
    </p>

    <!-- Контент рендерится текстом: сервис не санитизирует ввод -->
    <p class="comments-preview-card__content">
      {{ comment.content }}
    </p>
  </article>
</template>

<style lang="scss" scoped>
  .comments-preview-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    &__header {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    &__author {
      overflow: hidden;

      min-width: 0;

      font-weight: 600;
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__time {
      flex-shrink: 0;
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

    &__content {
      overflow: hidden;
      /* stylelint-disable-next-line value-no-vendor-prefix */
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;

      margin: 0;

      font-size: var(--main-font-size);
      color: var(--text-color);
      overflow-wrap: break-word;
      white-space: pre-line;
    }
  }
</style>
