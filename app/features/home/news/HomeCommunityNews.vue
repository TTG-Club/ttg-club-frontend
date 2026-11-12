<script setup lang="ts">
  import { NewsHero } from '~news/card';
  import { NewsDrawer } from '~news/drawer';
  import {
    getNewsListUrl,
    getNewsSearchPath,
    NEWS_KINDS,
    parseNewsList,
  } from '~news/model';

  import { useHomeNewsReader } from '../composables';
  import {
    HOME_COMMUNITY_NEWS_ALL_LABEL,
    HOME_COMMUNITY_NEWS_COUNT,
    HOME_COMMUNITY_NEWS_DATA_KEY,
    HOME_COMMUNITY_NEWS_EMPTY_TEXT,
    HOME_COMMUNITY_NEWS_ICON,
    HOME_COMMUNITY_NEWS_LABEL,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const api = useApi();

  /**
   * Последняя новость сообщества — обложкой, как главная новость сайта,
   * только в узкой панели. Создают их на новом сайте, здесь они только
   * читаются.
   */
  const { newSiteUrl } = useRuntimeConfig().public;

  const {
    data: newsList,
    status,
    refresh,
  } = useAsyncData(
    HOME_COMMUNITY_NEWS_DATA_KEY,
    async () =>
      parseNewsList(
        await api(getNewsSearchPath('community'), {
          query: {
            ...NEWS_KINDS.community.searchQuery,
            cnt: HOME_COMMUNITY_NEWS_COUNT,
          },
        }),
      ),
    { default: () => [], lazy: true, server: false },
  );

  const { isLoading, isDrawerOpen, openedUrl, open } = useHomeNewsReader(
    newsList,
    status,
    refresh,
  );

  const latestNews = computed(() => newsList.value[0]);

  const listUrl = getNewsListUrl('community', newSiteUrl);
</script>

<template>
  <!-- Блок виден всегда: если новостей нет или бэкенд их не отдаёт, стоит
    заглушка — раскладка ленты не прыгает -->
  <HomePanel
    :label="HOME_COMMUNITY_NEWS_LABEL"
    :icon="HOME_COMMUNITY_NEWS_ICON"
    :to="listUrl"
    :link-label="HOME_COMMUNITY_NEWS_ALL_LABEL"
    flush
    fill
  >
    <!-- Скелетон тех же пропорций, что обложка: панель не прыгает, когда
      новость приедет -->
    <USkeleton
      v-if="isLoading"
      class="aspect-16/10 min-h-0 w-full flex-auto rounded-none sm:aspect-2/1 xl:aspect-16/10"
    />

    <p
      v-else-if="!latestNews"
      class="m-3 flex flex-auto items-center justify-center rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMUNITY_NEWS_EMPTY_TEXT }}
    </p>

    <NewsHero
      v-else
      :news="latestNews"
      kind="community"
      compact
      @open="open(latestNews.url)"
    />

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="community"
      :url="openedUrl"
    />
  </HomePanel>
</template>
