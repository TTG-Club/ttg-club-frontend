<script setup lang="ts">
  import type { NewsDetailed } from '../model';

  import { getMarkupText } from '../markup';
  import { MarkupRender } from '../markup/ui';
  import {
    getNewsImageUrl,
    NEWS_FALLBACK_IMAGE,
    NEWS_ICON,
    NEWS_TEXT,
    toNewsMarkup,
  } from '../model';
  import { NewsVideoPlayer } from '../video';

  /**
   * Текст новости нового сайта для панели чтения: обложка или ролик, автор и
   * первоисточник (у новостей сообщества), анонс и сам текст.
   */
  const { news } = defineProps<{
    news: NewsDetailed;
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  /** Своя обложка новости: заставка ролика или картинка над текстом */
  const ownImage = computed(() =>
    getNewsImageUrl(news.previewImageUrl, newSiteUrl),
  );

  const poster = computed(() => ownImage.value ?? undefined);

  const coverImage = computed(() => ownImage.value ?? NEWS_FALLBACK_IMAGE);

  const previewNodes = computed(() => toNewsMarkup(news.preview));

  const contentNodes = computed(() => toNewsMarkup(news.content));

  // Пустые блоки не рендерим: иначе остаётся призрачный отступ
  const hasPreview = computed(
    () => getMarkupText(previewNodes.value).length > 0,
  );

  const hasContent = computed(
    () => getMarkupText(contentNodes.value).length > 0,
  );
</script>

<template>
  <article class="flex flex-col gap-4">
    <!-- Видео заменяет обложку; обложка становится его заставкой -->
    <NewsVideoPlayer
      v-if="news.videoUrl"
      :url="news.videoUrl"
      :title="news.title"
      :poster="poster"
    />

    <img
      v-else
      decoding="async"
      :src="coverImage"
      :alt="news.title"
      class="aspect-video w-full rounded-xl object-cover"
    />

    <div
      v-if="news.authorName || news.sourceUrl"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <span
        v-if="news.authorName"
        class="flex min-w-0 items-center gap-1.5 text-sm text-toned"
      >
        <UIcon
          :name="NEWS_ICON.author"
          class="size-4 shrink-0 text-dimmed"
        />

        <span class="truncate">{{ news.authorName }}</span>
      </span>

      <UButton
        v-if="news.sourceUrl"
        :to="news.sourceUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        external
        :icon="NEWS_ICON.openPage"
        size="xs"
        color="neutral"
        variant="soft"
      >
        {{ NEWS_TEXT.source }}
      </UButton>
    </div>

    <!-- Строка не шире 65 знаков: длинный текст во всю ширину читать тяжело -->
    <div class="flex max-w-prose flex-col">
      <div
        v-if="hasPreview"
        class="text-lg text-toned"
      >
        <MarkupRender :render-node="previewNodes" />
      </div>

      <MarkupRender
        v-if="hasContent"
        :render-node="contentNodes"
      />
    </div>
  </article>
</template>
