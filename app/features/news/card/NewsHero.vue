<script setup lang="ts">
  import type { NewsKind, NewsShort } from '../model';

  import {
    getNewsCover,
    getNewsHeroMeta,
    getNewsPageUrl,
    getNewsPreviewText,
    NEWS_ICON,
    NEWS_TEXT,
  } from '../model';
  import { NewsVideoModal, VIDEO_PLAY_ICON, VIDEO_PLAY_LABEL } from '../video';

  const { news, kind } = defineProps<{
    news: NewsShort;
    kind: NewsKind;
  }>();

  defineEmits<{
    open: [];
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  const coverImage = computed(() => getNewsCover(news));

  const pageUrl = computed(() => getNewsPageUrl(kind, news.url, newSiteUrl));

  const meta = computed(() => getNewsHeroMeta(news));

  const previewText = computed(() => getNewsPreviewText(news.preview));

  const playLabel = computed(() => `${VIDEO_PLAY_LABEL}: ${news.title}`);

  // Ролик смотрят прямо с главной, в окне поверх страницы: кнопка «Смотреть»
  // по центру обложки. Клик мимо неё по-прежнему открывает саму новость
  const isVideoOpen = ref(false);

  /** Открывает ролик новости в окне поверх страницы. */
  function playVideo(): void {
    isVideoOpen.value = true;
  }
</script>

<template>
  <!--
    Кнопки лежат рядом со ссылкой-обложкой, а не внутри неё: ссылка внутри
    ссылки — невалидная разметка. Обычный клик открывает новость в панели,
    ctrl+click и средняя кнопка — страницу на новом сайте.
  -->
  <div class="group relative overflow-hidden">
    <a
      :href="pageUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="relative block text-on-image no-underline"
      @click.left.exact.prevent="$emit('open')"
    >
      <img
        :src="coverImage"
        :alt="news.title"
        class="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-2/1 xl:aspect-21/9"
      />

      <span
        aria-hidden="true"
        class="absolute inset-0 bg-linear-to-t from-image-scrim/80 via-image-scrim/25 to-image-scrim/5"
      />

      <span
        class="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-4 sm:p-6"
      >
        <span
          v-if="meta"
          class="font-mono text-[11px] leading-none tracking-[0.16em] text-on-image/70 uppercase"
        >
          {{ meta }}
        </span>

        <span
          class="line-clamp-2 text-xl leading-tight font-semibold text-balance text-shadow-image-scrim/60 text-shadow-md sm:text-2xl xl:text-3xl"
        >
          {{ news.title }}
        </span>

        <span
          v-if="previewText"
          class="line-clamp-2 max-w-3xl text-sm leading-snug text-on-image/80 text-shadow-image-scrim/55 text-shadow-sm sm:text-base"
        >
          {{ previewText }}
        </span>
      </span>
    </a>

    <button
      v-if="news.videoUrl"
      type="button"
      class="absolute top-1/2 left-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-[75%] cursor-pointer items-center justify-center rounded-full bg-image-scrim/60 text-on-image ring-1 ring-on-image/30 backdrop-blur-sm transition-transform hover:scale-110 sm:size-20"
      :aria-label="playLabel"
      @click.left.exact.prevent="playVideo"
    >
      <UIcon
        :name="VIDEO_PLAY_ICON"
        class="size-7 sm:size-9"
      />
    </button>

    <UButton
      :to="pageUrl"
      target="_blank"
      external
      :icon="NEWS_ICON.openPage"
      :aria-label="NEWS_TEXT.openPage"
      variant="ghost"
      size="sm"
      class="absolute top-2 right-2 z-20 bg-image-scrim/40 text-on-image ring-1 ring-on-image/20 backdrop-blur-sm hover:bg-image-scrim/60 hover:text-on-image"
    />

    <NewsVideoModal
      v-if="news.videoUrl"
      v-model:open="isVideoOpen"
      :url="news.videoUrl"
      :title="news.title"
    />
  </div>
</template>
