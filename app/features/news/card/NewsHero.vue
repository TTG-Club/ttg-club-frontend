<script setup lang="ts">
  import type { NewsKind, NewsShort } from '../model';

  import {
    getNewsCover,
    getNewsMeta,
    getNewsPageUrl,
    getNewsPreviewText,
    NEWS_ICON,
    NEWS_META_SEPARATOR,
    NEWS_TEXT,
  } from '../model';
  import { NewsVideoModal, VIDEO_PLAY_ICON, VIDEO_PLAY_LABEL } from '../video';

  const { news, kind } = defineProps<{
    news: NewsShort;
    kind: NewsKind;
  }>();

  defineEmits<{
    (e: 'open'): void;
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  const coverImage = computed(() => getNewsCover(news));

  const pageUrl = computed(() => getNewsPageUrl(kind, news.url, newSiteUrl));

  const meta = computed(() =>
    [news.typeName, getNewsMeta(news)]
      .filter(Boolean)
      .join(NEWS_META_SEPARATOR),
  );

  const previewText = computed(() => getNewsPreviewText(news.preview));

  // Ролик смотрят прямо с главной, в окне поверх страницы: кнопка «Смотреть»
  // по центру обложки. Клик мимо неё по-прежнему открывает саму новость
  const overlay = useOverlay();

  const videoModal = overlay.create(NewsVideoModal, { destroyOnClose: true });

  /** Открывает ролик новости в окне поверх страницы. */
  function playVideo(): void {
    if (news.videoUrl) {
      videoModal.open({ url: news.videoUrl, title: news.title });
    }
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
      class="relative block text-white no-underline"
      @click.left.exact.prevent="$emit('open')"
    >
      <img
        :src="coverImage"
        :alt="news.title"
        class="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-2/1 xl:aspect-21/9"
      />

      <span
        aria-hidden="true"
        class="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/5"
      />

      <span
        class="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-4 sm:p-6"
      >
        <span
          v-if="meta"
          class="font-mono text-[11px] leading-none tracking-[0.16em] text-white/70 uppercase"
        >
          {{ meta }}
        </span>

        <span
          class="line-clamp-2 text-xl leading-tight font-semibold text-balance [text-shadow:0_2px_8px_#000000a0] sm:text-2xl xl:text-3xl"
        >
          {{ news.title }}
        </span>

        <span
          v-if="previewText"
          class="line-clamp-2 max-w-3xl text-sm leading-snug text-white/80 [text-shadow:0_2px_6px_#00000090] sm:text-base"
        >
          {{ previewText }}
        </span>
      </span>
    </a>

    <button
      v-if="news.videoUrl"
      type="button"
      class="absolute top-1/2 left-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-[75%] cursor-pointer items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform hover:scale-110 sm:size-20"
      :aria-label="`${VIDEO_PLAY_LABEL}: ${news.title}`"
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
      class="absolute top-2 right-2 z-20 bg-black/40 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/60 hover:text-white"
    />
  </div>
</template>
