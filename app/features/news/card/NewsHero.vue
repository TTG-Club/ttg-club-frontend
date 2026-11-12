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

  const {
    news,
    kind,
    compact = false,
  } = defineProps<{
    news: NewsShort;
    kind: NewsKind;
    /**
     * Малая обложка — для узкой панели: кегль заголовка меньше, анонса нет,
     * а картинка добирает высоту панели, если ту растянул ряд
     */
    compact?: boolean;
  }>();

  defineEmits<{
    open: [];
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  const coverImage = computed(() => getNewsCover(news, newSiteUrl));

  const pageUrl = computed(() => getNewsPageUrl(kind, news.url, newSiteUrl));

  const meta = computed(() => getNewsHeroMeta(news));

  const previewText = computed(() => getNewsPreviewText(news.preview));

  // Малая обложка стоит в панели-столбце и тянется вместе с ней: вся цепочка
  // до картинки — флекс-столбцы, пропорции задают только её наименьшую высоту
  const rootClass = computed(() =>
    compact ? 'flex flex-auto flex-col' : undefined,
  );

  const linkClass = computed(() =>
    compact ? 'flex flex-auto flex-col' : 'block',
  );

  const imageClass = computed(() =>
    compact
      ? 'min-h-0 flex-auto aspect-16/10 sm:aspect-2/1 xl:aspect-16/10'
      : 'aspect-16/10 sm:aspect-2/1 xl:aspect-21/9',
  );

  const captionClass = computed(() => (compact ? 'p-4' : 'p-4 sm:p-6'));

  const titleClass = computed(() =>
    compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl xl:text-3xl',
  );

  const hasPreview = computed(() => !compact && Boolean(previewText.value));

  const playButtonClass = computed(() =>
    compact ? 'size-14' : 'size-16 sm:size-20',
  );

  const playIconClass = computed(() =>
    compact ? 'size-6' : 'size-7 sm:size-9',
  );

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
  <div
    class="group relative overflow-hidden"
    :class="rootClass"
  >
    <a
      :href="pageUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="relative text-on-image no-underline"
      :class="linkClass"
      @click.left.exact.prevent="$emit('open')"
    >
      <img
        decoding="async"
        :src="coverImage"
        :alt="news.title"
        class="w-full object-cover transition-transform duration-500 group-hover:scale-105"
        :class="imageClass"
      />

      <span
        aria-hidden="true"
        class="absolute inset-0 bg-linear-to-t from-image-scrim/80 via-image-scrim/25 to-image-scrim/5"
      />

      <span
        class="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2"
        :class="captionClass"
      >
        <span
          v-if="meta"
          class="font-mono text-[11px] leading-none tracking-[0.16em] text-on-image/70 uppercase"
        >
          {{ meta }}
        </span>

        <span
          class="line-clamp-2 leading-tight font-semibold text-balance text-shadow-image-scrim/60 text-shadow-md"
          :class="titleClass"
        >
          {{ news.title }}
        </span>

        <span
          v-if="hasPreview"
          class="line-clamp-2 max-w-3xl text-sm leading-snug text-on-image/80 text-shadow-image-scrim/55 text-shadow-sm sm:text-base"
        >
          {{ previewText }}
        </span>
      </span>
    </a>

    <button
      v-if="news.videoUrl"
      type="button"
      class="absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-[75%] cursor-pointer items-center justify-center rounded-full bg-image-scrim/60 text-on-image ring-1 ring-on-image/30 backdrop-blur-sm transition-transform hover:scale-110"
      :class="playButtonClass"
      :aria-label="playLabel"
      @click.left.exact.prevent="playVideo"
    >
      <UIcon
        :name="VIDEO_PLAY_ICON"
        :class="playIconClass"
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
