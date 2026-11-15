<script setup lang="ts">
  import type { NewsKind } from '../model';

  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

  import { NewsBody } from '../body';
  import {
    formatNewsDate,
    getNewsDetailPath,
    getNewsPageUrl,
    NEWS_DRAWER_SKELETON_LINES,
    NEWS_ICON,
    NEWS_TEXT,
    parseNewsDetailed,
  } from '../model';

  const api = useApi();

  /**
   * Панель справа для быстрого чтения новости нового сайта, как на
   * new.ttg.club. Кнопка «Открыть на новом сайте» ведёт на страницу новости
   * в новой вкладке — здесь своих страниц у новостей нет.
   */
  const { kind, url } = defineProps<{
    kind: NewsKind;
    /** Слаг открытой новости; пока его нет, грузить нечего */
    url: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { newSiteUrl } = useRuntimeConfig().public;

  const isWide = useMediaQuery(LAYOUT_DRAWER_QUERY);

  const { data: news, status } = useAsyncData(
    () => `news-drawer-${kind}-${url}`,
    async () =>
      url ? parseNewsDetailed(await api(getNewsDetailPath(kind, url))) : null,
    { server: false },
  );

  const isLoading = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const isError = computed(() => status.value === 'error');

  const pageUrl = computed(() => getNewsPageUrl(kind, url, newSiteUrl));

  const title = computed(() => news.value?.title ?? '');

  const publishedAt = computed(() =>
    formatNewsDate(news.value?.publishDateTime ?? null),
  );

  /** Закрывает панель. */
  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UDrawer
    v-model:open="isOpen"
    :title="title"
    :description="publishedAt"
    :inset="isWide"
    :handle="false"
    direction="right"
    handle-only
    :ui="{
      // Тянуть панель можно только за ручку (её нет), иначе свайп
      // перехватывает мышь и текст внутри не выделяется
      container: 'select-text **:select-text',
      content: 'w-full max-w-2xl',
      header: 'flex-col items-stretch gap-1',
      title: 'sr-only',
      description: 'sr-only',
    }"
  >
    <template #header>
      <div class="flex w-full items-center gap-1">
        <h2 class="min-w-0 flex-auto truncate text-lg text-highlighted">
          {{ title }}
        </h2>

        <UTooltip :text="NEWS_TEXT.openPage">
          <UButton
            :to="pageUrl"
            target="_blank"
            external
            :icon="NEWS_ICON.openPage"
            :aria-label="NEWS_TEXT.openPage"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </UTooltip>

        <UButton
          :icon="NEWS_ICON.close"
          :aria-label="NEWS_TEXT.close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="close"
        />
      </div>

      <span
        v-if="publishedAt"
        class="text-sm text-muted"
      >
        {{ publishedAt }}
      </span>
    </template>

    <template #body>
      <div
        v-if="isLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton class="aspect-video w-full rounded-xl" />

        <USkeleton
          v-for="index in NEWS_DRAWER_SKELETON_LINES"
          :key="index"
          class="h-6 w-full"
        />
      </div>

      <p v-else-if="isError || !news">
        {{ NEWS_TEXT.loadError }}
      </p>

      <NewsBody
        v-else
        :news="news"
      />
    </template>
  </UDrawer>
</template>
