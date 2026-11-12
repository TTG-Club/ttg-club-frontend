<script setup lang="ts">
  import type { NewsKind, NewsShort } from '../model';

  import { getNewsCover, getNewsMeta, getNewsPageUrl } from '../model';
  import { VIDEO_PLAY_ICON } from '../video';

  const { news, kind } = defineProps<{
    news: NewsShort;
    kind: NewsKind;
  }>();

  defineEmits<{
    open: [];
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  const coverImage = computed(() => getNewsCover(news, newSiteUrl));

  const pageUrl = computed(() => getNewsPageUrl(kind, news.url, newSiteUrl));

  // Над заголовком — автор (у новостей сообщества) и дата одной строкой
  const meta = computed(() => getNewsMeta(news));
</script>

<template>
  <!--
    Строка ленты: обложка слева, подпись и заголовок. Обычный клик открывает
    новость в панели, ctrl+click и средняя кнопка — страницу на новом сайте
    (за это отвечает `.exact`).
  -->
  <a
    :href="pageUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="group flex min-w-0 items-center gap-3 rounded-lg p-2 no-underline transition-colors hover:bg-elevated"
    @click.left.exact.prevent="$emit('open')"
  >
    <span class="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
      <img
        decoding="async"
        :src="coverImage"
        :alt="news.title"
        loading="lazy"
        class="size-full object-cover"
      />

      <!-- Значок ролика: запись с видео видно ещё в ленте -->
      <span
        v-if="news.videoUrl"
        aria-hidden="true"
        class="absolute inset-0 flex items-center justify-center bg-image-scrim/25"
      >
        <span
          class="flex size-7 items-center justify-center rounded-full bg-image-scrim/60 text-on-image ring-1 ring-on-image/30"
        >
          <UIcon
            :name="VIDEO_PLAY_ICON"
            class="size-3.5"
          />
        </span>
      </span>
    </span>

    <span class="flex min-w-0 flex-1 flex-col gap-1">
      <span
        v-if="meta"
        class="truncate font-mono text-[10px] leading-none tracking-[0.14em] text-dimmed uppercase"
      >
        {{ meta }}
      </span>

      <span
        class="line-clamp-2 text-sm leading-snug font-medium text-highlighted transition-colors group-hover:text-primary"
      >
        {{ news.title }}
      </span>
    </span>
  </a>
</template>
