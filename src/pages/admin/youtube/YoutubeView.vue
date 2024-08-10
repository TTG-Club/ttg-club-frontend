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
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .header {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .count {
    display: flex;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
  }

  .active {
    display: flex;
    flex: auto;
    justify-content: flex-end;
  }

  .error {
    color: var(--error);
  }

  .body {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 24px;

    min-width: 0;
    min-height: 0;
    padding: 16px 0;

    @include media-min($md) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .add {
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-top: 16px;
    padding: 16px;

    background-color: var(--bg-secondary);
    border: {
      width: 1px;
      color: var(--border);

      radius: 12px;
      style: solid;
    }

    &:hover {
      > div {
        background-color: var(--primary);
      }
    }

    > div {
      width: 48px;
      height: 48px;
      padding: 4px;

      background-color: var(--border);
      border-radius: 12px;

      @include css-anim();
    }
  }

  .video {
    position: relative;

    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 8px;

    width: 100%;
    min-width: 0;
    min-height: 0;
    padding: 12px;

    background-color: var(--bg-secondary);
    border: {
      width: 1px;
      color: var(--border);

      radius: 12px;
      style: solid;
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
    overflow: hidden;
    border-radius: 8px;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .title {
    overflow: hidden;
    display: inline-block;

    width: 100%;
    padding-bottom: 8px;

    text-overflow: ellipsis;
    white-space: nowrap;

    font: {
      size: var(--h5-font-size);

      weight: bold;
    }

    border-bottom: {
      width: 1px;
      color: var(--border);

      style: solid;
    }
  }

  .controls {
    $compensate: 8px;

    pointer-events: none;
    user-select: none;

    position: absolute;
    top: 0;
    right: 0;
    transform: translateX($compensate) translateY(-$compensate);

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    padding: 4px;

    opacity: 0;
    background-color: var(--bg-secondary);
    border: {
      width: 1px;
      color: var(--border);

      radius: 12px;
      style: solid;
    }

    @include css-anim();
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
