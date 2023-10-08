<template>
  <transition
    mode="out-in"
    name="fade"
  >
    <div
      v-if="currentVideo"
      :class="$style['youtube-block']"
    >
      <youtube-player
        ref="youtube"
        :video="currentVideo"
        show-name
        has-radius
      />

      <div
        v-if="oldVideos.length"
        :class="$style.list"
      >
        <a
          v-for="(video, key) in oldVideos"
          :key="key"
          :href="`//youtu.be/${video.id}`"
          :class="$style.link"
          @click.left.exact.prevent="activeVideo = video.id"
          >{{ video.name }}</a
        >
      </div>
    </div>
  </transition>

  <base-modal
    v-for="(video, key) in videos"
    :key="key"
    :model-value="activeVideo === video.id"
    @close="activeVideo = null"
  >
    <template #title>
      {{ video.name }}
    </template>

    <template #default>
      <youtube-player :video="video" />
    </template>
  </base-modal>
</template>

<script setup lang="ts">
  import { tryOnBeforeMount } from '@vueuse/core';
  import { computed, ref } from 'vue';

  import { YoutubeApi } from '@/features/youtube/api';
  import YoutubePlayer from '@/features/youtube/components/YoutubePlayer.vue';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import BaseModal from '@/shared/ui/modals/BaseModal.vue';

  const youtube = ref<HTMLElement>();
  const videos = ref<Array<TYoutubeVideo>>([]);
  const activeVideo = ref<TYoutubeVideo['id'] | null>(null);

  const currentVideo = computed<TYoutubeVideo | null>(() => {
    if (videos.value.length) {
      return videos.value[0];
    }

    return null;
  });

  const oldVideos = computed<Array<TYoutubeVideo>>(() =>
    videos.value.slice(1, videos.value.length)
  );

  const getVideos = async () => {
    try {
      const { list } = await YoutubeApi.load({
        page: 0,
        limit: 5,
        activeStatus: true,
        order: [
          {
            field: 'created',
            direction: 'desc'
          },
          {
            field: 'name',
            direction: 'asc'
          }
        ]
      });

      return Promise.resolve(list);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  tryOnBeforeMount(async () => {
    videos.value = await getVideos();
  });
</script>

<style module lang="scss">
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .youtube-block {
    flex: 1 1 calc(33% - 10px);
    background-color: var(--bg-table-list);
    border-radius: 12px;
    overflow: hidden;
    padding: 16px;
    flex-direction: column;
    display: flex;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .link {
    @include css_anim($time: 0.5s);

    display: flex;
    padding: 8px 8px;
    background-color: var(--bg-sub-menu);
    color: var(--text-color);
    border-radius: 8px;
    align-items: center;
    border: 1px solid var(--border);

    &:hover {
      background-color: var(--bg-main);
      color: var(--text-color-title);
    }
  }

  .no-video {
    height: 180px;
    margin: 0 0 8px 0;
    border-radius: 12px;

    @include media-min($sm) {
      height: 300px;
    }

    @include media-min($xl) {
      height: 100%;
    }
  }
</style>
