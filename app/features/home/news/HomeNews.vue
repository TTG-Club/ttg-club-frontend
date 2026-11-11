<script setup lang="ts">
  import { NewsHero, NewsTile } from '~news/card';
  import { NewsDrawer } from '~news/drawer';
  import {
    getNewsListUrl,
    getNewsSearchPath,
    NEWS_KINDS,
    parseNewsList,
  } from '~news/model';

  import { useHomeNewsReader } from '../composables';
  import {
    HOME_NEWS_ALL_LABEL,
    HOME_NEWS_COUNT,
    HOME_NEWS_DATA_KEY,
    HOME_NEWS_EMPTY_TEXT,
    HOME_NEWS_ICON,
    HOME_NEWS_LABEL,
    HOME_NEWS_TILE_COUNT,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const api = useApi();

  /**
   * Новости сайта как на new.ttg.club: обложка свежей новости и ряд плиток
   * под ней. Новости пишут и публикуют на новом сайте, здесь они только
   * читаются — в панели справа, а страница открывается на новом сайте.
   */
  const { newSiteUrl } = useRuntimeConfig().public;

  // Клиентская загрузка: блок ниже первого экрана и не должен держать ответ
  // главной в ожидании бэкенда нового сайта. Пока запрос идёт — скелетон
  const {
    data: newsList,
    status,
    refresh,
  } = useAsyncData(
    HOME_NEWS_DATA_KEY,
    async () =>
      parseNewsList(
        await api(getNewsSearchPath('site'), {
          query: { ...NEWS_KINDS.site.searchQuery, cnt: HOME_NEWS_COUNT },
        }),
      ),
    { default: () => [], lazy: true, server: false },
  );

  const { isLoading, isDrawerOpen, openedUrl, open } = useHomeNewsReader(
    newsList,
    status,
    refresh,
  );

  const heroNews = computed(() => newsList.value[0]);

  /** Остальные новости после обложки — плитками в две колонки */
  const restNews = computed(() => newsList.value.slice(1));

  const listUrl = getNewsListUrl('site', newSiteUrl);
</script>

<template>
  <HomePanel
    :label="HOME_NEWS_LABEL"
    :icon="HOME_NEWS_ICON"
    :to="listUrl"
    :link-label="HOME_NEWS_ALL_LABEL"
    flush
  >
    <div
      v-if="isLoading"
      class="flex flex-col"
    >
      <USkeleton
        class="aspect-16/10 w-full rounded-none sm:aspect-2/1 xl:aspect-21/9"
      />

      <div class="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
        <div
          v-for="index in HOME_NEWS_TILE_COUNT"
          :key="index"
          class="flex items-center gap-3 p-2"
        >
          <USkeleton class="h-16 w-24 shrink-0 rounded-md" />

          <div class="flex flex-1 flex-col gap-2">
            <USkeleton class="h-2.5 w-16 rounded" />

            <USkeleton class="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </div>

    <p
      v-else-if="!heroNews"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_NEWS_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="flex flex-col"
    >
      <NewsHero
        :news="heroNews"
        kind="site"
        @open="open(heroNews.url)"
      />

      <div
        v-if="restNews.length"
        class="grid grid-cols-1 gap-1 border-t border-default p-2 sm:grid-cols-2"
      >
        <NewsTile
          v-for="news in restNews"
          :key="news.id"
          :news="news"
          kind="site"
          @open="open(news.url)"
        />
      </div>
    </div>

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="site"
      :url="openedUrl"
    />
  </HomePanel>
</template>
