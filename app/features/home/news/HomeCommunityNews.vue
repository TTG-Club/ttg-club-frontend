<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue';

  import { NewsHero } from '~news/card';
  import { NewsDrawer } from '~news/drawer';
  import {
    getNewsListUrl,
    getNewsSearchPath,
    NEWS_KINDS,
    parseNewsList,
  } from '~news/model';

  import { useHomeNewsReader, useHomeNewsRotation } from '../composables';
  import {
    HOME_COMMUNITY_NEWS_ALL_LABEL,
    HOME_COMMUNITY_NEWS_COUNT,
    HOME_COMMUNITY_NEWS_DATA_KEY,
    HOME_COMMUNITY_NEWS_EMPTY_TEXT,
    HOME_COMMUNITY_NEWS_ICON,
    HOME_COMMUNITY_NEWS_LABEL,
  } from '../model';
  import { HomePanel } from '../ui-kit';
  import { HomeNewsSwitcher } from './ui';

  const api = useApi();

  /**
   * Новости сообщества — как новости сайта, только в узкой панели: одна
   * новость обложкой, свежие сменяют друг друга по таймеру или по
   * переключателю в подвале. Создают их на новом сайте, здесь они только
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

  const newsCount = computed(() => newsList.value.length);

  const panel = useTemplateRef<ComponentPublicInstance>('panel');

  const {
    activeIndex,
    isStopped,
    isRunning,
    select,
    showNext,
    showPrevious,
    toggleStopped,
    setVideoOpen,
  } = useHomeNewsRotation(newsCount, panel, isDrawerOpen);

  const activeNews = computed(() => newsList.value[activeIndex.value]);

  const hasSwitcher = computed(() => newsCount.value > 1);

  const listUrl = getNewsListUrl('community', newSiteUrl);
</script>

<template>
  <!-- Блок виден всегда: если новостей нет или бэкенд их не отдаёт, стоит
    заглушка — раскладка ленты не прыгает -->
  <HomePanel
    ref="panel"
    :label="HOME_COMMUNITY_NEWS_LABEL"
    :icon="HOME_COMMUNITY_NEWS_ICON"
    :to="listUrl"
    :link-label="HOME_COMMUNITY_NEWS_ALL_LABEL"
    flush
    fill
  >
    <template
      v-if="hasSwitcher"
      #aside
    >
      <HomeNewsSwitcher
        :items="newsList"
        :active-index="activeIndex"
        :is-stopped="isStopped"
        :is-running="isRunning"
        compact
        @select="select"
        @next="showNext"
        @previous="showPrevious"
        @toggle="toggleStopped"
      />
    </template>

    <!-- Скелетон тех же пропорций, что обложка: панель не прыгает, когда
      новость приедет -->
    <USkeleton
      v-if="isLoading"
      class="aspect-16/10 min-h-0 w-full flex-auto rounded-none sm:aspect-2/1 xl:aspect-16/10"
    />

    <p
      v-else-if="!activeNews"
      class="m-3 flex flex-auto items-center justify-center rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_COMMUNITY_NEWS_EMPTY_TEXT }}
    </p>

    <NewsHero
      v-else
      :key="activeNews.id"
      :news="activeNews"
      kind="community"
      compact
      class="animate-appear motion-reduce:animate-none"
      @open="open(activeNews.url)"
      @video="setVideoOpen"
    />

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="community"
      :url="openedUrl"
    />
  </HomePanel>
</template>
