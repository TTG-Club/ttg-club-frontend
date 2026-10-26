<script setup lang="ts">
  import type { HomeFeedEntry, HomeVideo } from '../model';

  import {
    getHomeFeed,
    HOME_FEED_ICONS,
    HOME_NEWS_DATA_KEY,
    HOME_NEWS_PATH,
    HOME_NEWS_QUERY,
    HOME_VIDEOS_DATA_KEY,
    HOME_VIDEOS_ICON,
    HOME_VIDEOS_LABEL,
    HOME_VIDEOS_PATH,
    HOME_VIDEOS_QUERY,
    parseHomeNews,
    parseHomeVideos,
  } from '../model';
  import { HomePanel } from '../ui-kit';
  import HomeYoutubePlayer from './HomeYoutubePlayer.vue';

  // Панель необязательная: при ошибке обоих запросов её просто нет. Запросы
  // независимы: если core-api недоступен, остаются одни ролики, и наоборот
  const { data: videos } = useAsyncData(
    HOME_VIDEOS_DATA_KEY,
    async () =>
      parseHomeVideos(
        await $fetch(HOME_VIDEOS_PATH, { query: HOME_VIDEOS_QUERY }),
      ),
    { default: () => [] },
  );

  const { data: newsList } = useAsyncData(
    HOME_NEWS_DATA_KEY,
    async () =>
      parseHomeNews(await $fetch(HOME_NEWS_PATH, { query: HOME_NEWS_QUERY })),
    { default: () => [] },
  );

  const activeVideo = ref<HomeVideo>();

  /** Свежий ролик — в плеер во всю ширину панели */
  const currentVideo = computed(() => videos.value[0]);

  /**
   * Остальные ролики вперемешку с новостями нового сайта — плитками под
   * плеером. Ролик открывается в модалке, новость — на новом сайте в новой
   * вкладке. Превью с i.ytimg.com в плитки не ставим: у части пользователей
   * YouTube недоступен, и вместо картинок остались бы пустые прямоугольники —
   * плитку опознаёт значок, как в плите разделов.
   */
  const feed = computed(() =>
    getHomeFeed(videos.value.slice(1), newsList.value).map((entry) => ({
      ...entry,
      key: `${entry.kind}:${entry.url}`,
      icon: HOME_FEED_ICONS[entry.kind],
      title: entry.kind === 'video' ? entry.video.name : entry.news.title,
      target: entry.kind === 'news' ? '_blank' : undefined,
      rel: entry.kind === 'news' ? 'noopener noreferrer' : undefined,
    })),
  );

  /** Черта отделяет ленту от плеера; без плеера отделять нечего */
  const feedClass = computed(() =>
    currentVideo.value ? 'border-t border-default' : undefined,
  );

  const hasContent = computed(
    () => !!currentVideo.value || !!feed.value.length,
  );

  const isModalOpen = computed({
    get: () => !!activeVideo.value,
    set: (isOpen) => {
      if (!isOpen) {
        activeVideo.value = undefined;
      }
    },
  });

  /**
   * Открывает ролик в модалке.
   *
   * @param video - ролик из списка
   */
  function openVideo(video: HomeVideo): void {
    activeVideo.value = video;
  }

  /**
   * Обрабатывает клик по плитке ленты: ролик открывается в модалке вместо
   * перехода на YouTube, новость — обычной ссылкой в новой вкладке.
   *
   * @param entry - запись ленты
   * @param event - событие клика
   */
  function handleEntryClick(entry: HomeFeedEntry, event: MouseEvent): void {
    if (entry.kind !== 'video') {
      return;
    }

    event.preventDefault();
    openVideo(entry.video);
  }
</script>

<template>
  <HomePanel
    v-if="hasContent"
    :label="HOME_VIDEOS_LABEL"
    :icon="HOME_VIDEOS_ICON"
    flush
  >
    <template v-if="currentVideo">
      <HomeYoutubePlayer
        :key="currentVideo.id"
        :video="currentVideo"
      />

      <h3
        class="line-clamp-2 px-4 py-3 text-lg leading-snug font-semibold text-highlighted"
      >
        {{ currentVideo.name }}
      </h3>
    </template>

    <div
      v-if="feed.length"
      :class="feedClass"
      class="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2"
    >
      <a
        v-for="entry in feed"
        :key="entry.key"
        :href="entry.url"
        :target="entry.target"
        :rel="entry.rel"
        class="group flex min-w-0 items-center gap-3 rounded-lg p-2 no-underline transition-colors duration-200 hover:bg-hover"
        @click.left.exact="handleEntryClick(entry, $event)"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-default bg-overlay text-primary transition-colors duration-200 group-hover:border-primary group-hover:bg-primary-select group-hover:text-highlighted"
        >
          <UIcon
            :name="entry.icon"
            class="size-4.5"
          />
        </span>

        <span
          class="line-clamp-2 text-sm leading-snug font-medium text-default transition-colors duration-200 group-hover:text-highlighted"
        >
          {{ entry.title }}
        </span>
      </a>
    </div>

    <UModal
      v-model:open="isModalOpen"
      :title="activeVideo?.name"
      :ui="{ content: 'max-w-4xl', body: 'p-0 sm:p-0' }"
    >
      <template #body>
        <HomeYoutubePlayer
          v-if="activeVideo"
          :key="activeVideo.id"
          :video="activeVideo"
        />
      </template>
    </UModal>
  </HomePanel>
</template>
