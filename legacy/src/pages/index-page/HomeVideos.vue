<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';

  import { YoutubeApi } from '@/features/youtube/api';
  import YoutubePlayer from '@/features/youtube/components/YoutubePlayer.vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import HomePanel from './HomePanel.vue';
  import {
    getHomeVideoUrl,
    HOME_VIDEOS_ICON,
    HOME_VIDEOS_LABEL,
    HOME_VIDEOS_QUERY,
    parseHomeVideos,
  } from './model';

  const videos = ref<Array<TYoutubeVideo>>([]);
  const activeVideoId = ref<TYoutubeVideo['id'] | null>(null);

  /** Свежий ролик — в плеер во всю ширину панели */
  const currentVideo = computed<TYoutubeVideo | null>(
    () => videos.value[0] ?? null,
  );

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

  /**
   * Загружает свежие ролики и проверяет ответ API. Панель необязательная: при
   * ошибке запроса она просто не показывается.
   */
  const loadVideos = async (): Promise<void> => {
    try {
      const { items: loadedVideos } = await YoutubeApi.load(HOME_VIDEOS_QUERY);

      videos.value = parseHomeVideos(loadedVideos);
    } catch {
      videos.value = [];
    }
  };

  const openVideo = (videoId: TYoutubeVideo['id']) => {
    activeVideoId.value = videoId;
  };

  const closeVideo = () => {
    activeVideoId.value = null;
  };

  onBeforeMount(loadVideos);
</script>

<template>
  <home-panel
    v-if="currentVideo"
    :label="HOME_VIDEOS_LABEL"
    :icon="HOME_VIDEOS_ICON"
    flush
  >
    <youtube-player :video="currentVideo" />

    <h3 class="home-videos__title">
      {{ currentVideo.name }}
    </h3>

    <div
      v-if="olderVideos.length"
      class="home-videos__list"
    >
      <a
        v-for="video in olderVideos"
        :key="video.id"
        :href="video.url"
        class="home-videos__tile"
        @click.left.exact.prevent="openVideo(video.id)"
      >
        <span class="home-videos__badge">
          <svg-icon
            :icon="HOME_VIDEOS_ICON"
            :size="18"
          />
        </span>

        <span class="home-videos__name">{{ video.name }}</span>
      </a>
    </div>

    <base-modal
      v-for="video in olderVideos"
      :key="video.id"
      :model-value="activeVideoId === video.id"
      @close="closeVideo"
    >
      <template #title>
        {{ video.name }}
      </template>

      <template #default>
        <youtube-player :video="video" />
      </template>
    </base-modal>
  </home-panel>
</template>

<style lang="scss" scoped>
  .home-videos {
    &__title {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;

      margin: 0;
      padding: 12px 16px;

      font-family: 'Open Sans', sans-serif;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-color-title);
    }

    &__list {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;

      padding: 8px;

      border-top: 1px solid var(--border);

      @include media-min($sm) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    &__tile {
      display: flex;
      gap: 12px;
      align-items: center;

      min-width: 0;
      padding: 8px;

      text-decoration: none;

      border-radius: 8px;

      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--hover);

        .home-videos__badge {
          color: var(--text-color-title);
          background-color: var(--primary-select);
          border-color: var(--primary);
        }

        .home-videos__name {
          color: var(--text-color-title);
        }
      }
    }

    &__badge {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      width: 32px;
      height: 32px;

      color: var(--primary);

      background-color: var(--bg-light-main);
      border: 1px solid var(--border);
      border-radius: 8px;

      transition:
        border-color 0.2s ease,
        color 0.2s ease,
        background-color 0.2s ease;
    }

    &__name {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;

      font-size: 14px;
      font-weight: 500;
      line-height: 1.375;
      color: var(--text-color);

      transition: color 0.2s ease;
    }
  }
</style>
