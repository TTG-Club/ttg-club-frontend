<script setup lang="ts">
  import { NewsTile } from '~news/card';
  import { NewsDrawer } from '~news/drawer';
  import { getNewsListUrl, NEWS_KINDS, parseNewsList } from '~news/model';

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

  /**
   * Новости сообщества как на new.ttg.club: столбик плиток с автором и
   * датой. Создают их на новом сайте, здесь они только читаются.
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
        await $fetch(`${NEWS_KINDS.community.apiPath}/search`, {
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
  >
    <!-- Столбец или две колонки — по ширине самой панели, а не экрана -->
    <div class="@container p-2">
      <div
        v-if="isLoading"
        class="grid grid-cols-1 gap-1 @lg:grid-cols-2"
      >
        <div
          v-for="index in HOME_COMMUNITY_NEWS_COUNT"
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

      <p
        v-else-if="!newsList.length"
        class="m-1 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
      >
        {{ HOME_COMMUNITY_NEWS_EMPTY_TEXT }}
      </p>

      <div
        v-else
        class="grid grid-cols-1 gap-1 @lg:grid-cols-2"
      >
        <NewsTile
          v-for="news in newsList"
          :key="news.id"
          :news="news"
          kind="community"
          @open="open(news.url)"
        />
      </div>
    </div>

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="community"
      :url="openedUrl"
    />
  </HomePanel>
</template>
