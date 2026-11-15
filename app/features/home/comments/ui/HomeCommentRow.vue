<script setup lang="ts">
  import type { CommentEntry } from '~comments/model';

  import { useCommentTimestamp } from '~comments/composables';
  import {
    COMMENT_TEXT,
    getCommentPageLink,
    getCommentSectionLabel,
  } from '~comments/model';

  const { comment } = defineProps<{
    /** Комментарий из ленты сайта */
    comment: CommentEntry;
  }>();

  const { createdLabel, createdFullLabel } = useCommentTimestamp(() => comment);

  // Без адреса страницы вести некуда — такую строку блок не показывает
  const commentLink = computed(() => getCommentPageLink(comment));

  const sectionLabel = computed(() =>
    comment.section ? getCommentSectionLabel(comment.section) : undefined,
  );
</script>

<template>
  <NuxtLink
    v-if="commentLink"
    :to="commentLink"
    class="flex flex-col gap-1 rounded-xl px-3 py-2 no-underline transition-colors hover:bg-elevated"
  >
    <!-- Метка раздела вынесена из переносимой группы: внутри неё длинное имя
      автора сталкивало бы её на вторую строку -->
    <div class="flex items-start gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span class="flex min-w-0 items-center gap-1.5">
          <UAvatar
            :alt="comment.authorName"
            size="2xs"
            class="shrink-0"
          />

          <span class="text-sm font-medium text-highlighted">
            {{ comment.authorName }}
          </span>
        </span>

        <span
          class="text-xs text-muted"
          :title="createdFullLabel"
        >
          {{ createdLabel }}
        </span>

        <span
          v-if="comment.parentAuthorName"
          class="text-xs text-muted"
        >
          {{ COMMENT_TEXT.replyTo }} {{ comment.parentAuthorName }}
        </span>
      </div>

      <UBadge
        v-if="sectionLabel"
        :label="sectionLabel"
        color="neutral"
        variant="subtle"
        size="sm"
        class="ml-auto shrink-0"
      />
    </div>

    <p class="line-clamp-2 text-sm leading-relaxed break-words text-default">
      {{ comment.content }}
    </p>
  </NuxtLink>
</template>
