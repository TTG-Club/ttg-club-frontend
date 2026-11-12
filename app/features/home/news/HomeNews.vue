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
    HOME_NEWS_ALL_LABEL,
    HOME_NEWS_COUNT,
    HOME_NEWS_DATA_KEY,
    HOME_NEWS_EMPTY_TEXT,
    HOME_NEWS_ICON,
    HOME_NEWS_LABEL,
  } from '../model';
  import { HomePanel } from '../ui-kit';
  import { HomeNewsSwitcher } from './ui';

  const api = useApi();

  /**
   * Новости сайта: на месте всегда одна новость обложкой, свежие сменяют
   * друг друга по таймеру или по переключателю в подвале панели. Новости
   * пишут и публикуют на новом сайте, здесь они только читаются — в панели
   * справа, а страница открывается на новом сайте.
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

  const listUrl = getNewsListUrl('site', newSiteUrl);
</script>

<template>
  <HomePanel
    ref="panel"
    :label="HOME_NEWS_LABEL"
    :icon="HOME_NEWS_ICON"
    :to="listUrl"
    :link-label="HOME_NEWS_ALL_LABEL"
    flush
  >
    <!-- Переключатель стоит в подвале, в одной строке со ссылкой на все
      новости -->
    <template
      v-if="hasSwitcher"
      #aside
    >
      <HomeNewsSwitcher
        :items="newsList"
        :active-index="activeIndex"
        :is-stopped="isStopped"
        :is-running="isRunning"
        @select="select"
        @next="showNext"
        @previous="showPrevious"
        @toggle="toggleStopped"
      />
    </template>

    <!-- Скелетон повторяет обложку, чтобы лента не прыгала, когда новости
      приедут -->
    <USkeleton
      v-if="isLoading"
      class="aspect-16/10 w-full rounded-none sm:aspect-2/1 xl:aspect-21/9"
    />

    <p
      v-else-if="!activeNews"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_NEWS_EMPTY_TEXT }}
    </p>

    <!-- Новая обложка проявляется на месте прежней: обложки одного размера,
      вёрстка под ними не двигается. Проявление — CSS-анимация самой обложки,
      а не Transition: ей не нужно ждать ухода прежней -->
    <NewsHero
      v-else
      :key="activeNews.id"
      :news="activeNews"
      kind="site"
      class="animate-appear motion-reduce:animate-none"
      @open="open(activeNews.url)"
      @video="setVideoOpen"
    />

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="site"
      :url="openedUrl"
    />
  </HomePanel>
</template>
