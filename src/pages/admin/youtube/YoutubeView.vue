<script setup lang="ts">
  import { useUIStore } from '@/shared/stores/UIStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { getDateString } from '@/shared/utils/getDateString';

  import YoutubeAddVideo from '@/features/youtube/components/YoutubeAddVideo.vue';
  import YoutubeEditVideo from '@/features/youtube/components/YoutubeEditVideo.vue';
  import YoutubePlayer from '@/features/youtube/components/YoutubePlayer.vue';
  import { useYoutube } from '@/features/youtube/composables/useYoutube';
  import { useYoutubeActive } from '@/features/youtube/composables/useYoutubeActive';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

  import PageLayout from '@/layouts/PageLayout.vue';

  import type { MaybeRef } from '@vueuse/core';

  const { isMobile } = storeToRefs(useUIStore());

  const {
    size,
    page,
    pages,
    itemsPerPage,
    isLoaded,
    load,
    videos,
    remove,
    isRemoving,
  } = useYoutube();

  const {
    limit: activeLimit,
    count: activeCount,
    isDisabled: isActivationDisabled,
    isSuccess: isActiveSuccess,
    isLoaded: isActiveLoaded,
    updateCount,
    updateActiveStatus,
  } = useYoutubeActive();

  const isAdding = ref(false);
  const editID = ref<TYoutubeVideo['id']>('');

  const init = async () => {
    try {
      await load();

      return updateCount();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updateVideoStatus = async (
    id: TYoutubeVideo['id'],
    status: MaybeRef<boolean>,
  ) => {
    try {
      await updateActiveStatus(id, status);

      return load(false);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  tryOnBeforeMount(async () => {
    await init();
  });
</script>

<template>
  <page-layout>
    <template #title> Youtube новости </template>

    <template #default>
      <div :class="$style.container">
        <div :class="$style.header">
          <div :class="$style.count">
            <span>Количество на странице</span>

            <n-select
              v-model:value="size"
              :options="itemsPerPage"
            />
          </div>

          <div
            v-if="isActiveLoaded"
            :class="{
              [$style.active]: true,
              [$style.error]: !isActiveSuccess,
            }"
          >
            На главной {{ activeCount }} из {{ activeLimit }}
          </div>

          <n-button
            v-if="isLoaded"
            icon-position="right"
            type="primary"
            @click.left.exact.prevent="isAdding = true"
          >
            <template #icon>
              <svg-icon icon="plus" />
            </template>

            <template
              v-if="!isMobile"
              #default
            >
              Новое видео
            </template>
          </n-button>
        </div>

        <div :class="$style.body">
          <div
            v-for="video in videos"
            :key="video.id"
            :class="$style.video"
          >
            <div :class="$style.player">
              <youtube-player :video="video" />
            </div>

            <div :class="$style.info">
              <div :class="$style.title">
                {{ video.name }}
              </div>

              <div v-if="getDateString(video.created)">
                Дата добавления: {{ getDateString(video.created) }}
              </div>

              <n-checkbox
                :checked="video.active"
                :disabled="isActivationDisabled(video.active)"
                @update:checked="updateVideoStatus(video.id, $event)"
              >
                Отображать на главной
              </n-checkbox>

              <youtube-edit-video
                :video="video"
                :model-value="editID === video.id"
                @saved="load()"
                @close="editID = ''"
              />
            </div>

            <n-flex
              size="small"
              :class="{
                [$style.controls]: true,
                [$style.editing]: editID === video.id,
              }"
            >
              <n-button
                size="small"
                type="primary"
                :loading="editID === video.id"
                @click.left.exact.prevent="editID = video.id"
              >
                <template #icon>
                  <svg-icon icon="edit" />
                </template>
              </n-button>

              <n-button
                size="small"
                type="error"
                :loading="isRemoving(video.id)"
                @click.left.exact.prevent="remove(video.id)"
              >
                <template #icon>
                  <svg-icon icon="remove" />
                </template>
              </n-button>
            </n-flex>
          </div>
        </div>

        <div
          v-if="pages > 1"
          :class="$style.paginate"
        >
          <n-pagination
            v-model:page="page"
            :page-count="pages"
          />
        </div>
      </div>
    </template>
  </page-layout>

  <youtube-add-video
    v-model="isAdding"
    @added="load()"
  />
</template>

<style module lang="scss">
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .count {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .active {
    flex: auto;
    display: flex;
    justify-content: flex-end;
  }

  .error {
    color: var(--error);
  }

  .body {
    padding: 16px 0;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 24px;
    min-height: 0;
    min-width: 0;

    @include media-min($md) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .add {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-secondary);
    cursor: pointer;
    margin-top: 16px;
    padding: 16px;
    border: {
      radius: 12px;
      width: 1px;
      style: solid;
      color: var(--border);
    }

    &:hover {
      > div {
        background-color: var(--primary);
      }
    }

    > div {
      @include css_anim();

      background-color: var(--border);
      border-radius: 12px;
      width: 48px;
      height: 48px;
      padding: 4px;
    }
  }

  .video {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 8px;
    padding: 12px;
    background-color: var(--bg-secondary);
    position: relative;
    min-height: 0;
    min-width: 0;
    border: {
      radius: 12px;
      width: 1px;
      style: solid;
      color: var(--border);
    }

    &:hover {
      .controls {
        pointer-events: initial;
        user-select: initial;
        opacity: 1;
      }
    }
  }

  .player {
    border-radius: 8px;
    overflow: hidden;
  }

  .info {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    padding-bottom: 8px;

    font: {
      weight: bold;
      size: var(--h5-font-size);
    }

    border-bottom: {
      width: 1px;
      style: solid;
      color: var(--border);
    }
  }

  .controls {
    @include css_anim();

    $compensate: 8px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: absolute;
    top: 0;
    right: 0;
    transform: translateX($compensate) translateY(-$compensate);
    opacity: 0;
    pointer-events: none;
    user-select: none;
    padding: 4px;
    background-color: var(--bg-secondary);
    border: {
      radius: 12px;
      width: 1px;
      style: solid;
      color: var(--border);
    }
  }

  .editing {
    opacity: 1;
  }

  .control {
    & &-body {
      padding: 6px;
    }
  }

  .paginate {
    margin-top: auto;
  }
</style>
