<script setup lang="ts">
  import type { HomeVideo } from '../model';

  import {
    getHomeVideoUrl,
    HOME_VIDEOS_DATA_KEY,
    HOME_VIDEOS_ICON,
    HOME_VIDEOS_LABEL,
    HOME_VIDEOS_PATH,
    HOME_VIDEOS_QUERY,
    parseHomeVideos,
  } from '../model';
  import { HomePanel } from '../ui-kit';
  import HomeYoutubePlayer from './HomeYoutubePlayer.vue';

  // Панель необязательная: при ошибке запроса её просто нет
  const { data: videos } = useAsyncData(
    HOME_VIDEOS_DATA_KEY,
    async () =>
      parseHomeVideos(
        await $fetch(HOME_VIDEOS_PATH, { query: HOME_VIDEOS_QUERY }),
      ),
    { default: () => [] },
  );

  const activeVideo = ref<HomeVideo>();

  /** Свежий ролик — в плеер во всю ширину панели */
  const currentVideo = computed(() => videos.value[0]);

  /**
   * Остальные ролики — плитками под плеером, открываются в модалке. Превью с
   * i.ytimg.com в плитки не ставим: у части пользователей YouTube недоступен,
   * и вместо картинок остались бы пустые прямоугольники — плитку опознаёт
   * значок, как в плите разделов.
   */
  const olderVideos = computed(() =>
    videos.value.slice(1).map((video) => ({
      ...video,
      url: getHomeVideoUrl(video.id),
    })),
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
</script>

<template>
  <HomePanel
    v-if="currentVideo"
    :label="HOME_VIDEOS_LABEL"
    :icon="HOME_VIDEOS_ICON"
    flush
  >
    <HomeYoutubePlayer
      :key="currentVideo.id"
      :video="currentVideo"
    />

    <h3
      class="line-clamp-2 px-4 py-3 text-lg leading-snug font-semibold text-highlighted"
    >
      {{ currentVideo.name }}
    </h3>

    <div
      v-if="olderVideos.length"
      class="grid grid-cols-1 gap-1 border-t border-default p-2 sm:grid-cols-2"
    >
      <a
        v-for="video in olderVideos"
        :key="video.id"
        :href="video.url"
        class="group flex min-w-0 items-center gap-3 rounded-lg p-2 no-underline transition-colors duration-200 hover:bg-hover"
        @click.left.exact.prevent="openVideo(video)"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-default bg-overlay text-primary transition-colors duration-200 group-hover:border-primary group-hover:bg-primary-select group-hover:text-highlighted"
        >
          <UIcon
            :name="HOME_VIDEOS_ICON"
            class="size-4.5"
          />
        </span>

        <span
          class="line-clamp-2 text-sm leading-snug font-medium text-default transition-colors duration-200 group-hover:text-highlighted"
        >
          {{ video.name }}
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
