<template>
  <page-layout
    :use-social-links="false"
    :show-separator="false"
  >
    <template #title>
      Youtube новости
    </template>

    <template #default>
      <div :class="$style.container">
        <div :class="$style.header">
          <div :class="$style.count">
            <span>Количество видео на странице</span>

            <ui-select
              :model-value="itemsPerPage.find(item => item.value === limit)"
              :options="itemsPerPage"
              label="name"
              track-by="value"
              @update:model-value="limit = $event.value"
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

          <ui-button
            v-if="isLoaded"
            icon="plus"
            icon-position="right"
          >
            <template
              v-if="!isMobile"
              #default
            >
              Новое видео
            </template>
          </ui-button>
        </div>

        <div :class="$style.body">
          <div
            v-for="video in videos"
            :key="video.id"
            :class="$style.video"
          >
            <div :class="$style.player">
              <div>
                <youtube-player :video="video" />
              </div>
            </div>

            <div :class="$style.info">
              <h3>
                {{ video.name }}
              </h3>

              <span v-if="getDate(video.created)">
                Дата добавления: {{ getDate(video.created) }}
              </span>
            </div>

            <div>
              <ui-checkbox
                :model-value="video.active"
                :disabled="isActivationDisabled(video.active)"
                type="toggle"
                @update:model-value="updateVideoStatus(video.id, $event)"
              >
                Отображать на главной
              </ui-checkbox>
            </div>

            <div :class="$style.controls">
              <ui-button
                icon="edit"
                :class="$style.control"
                :body-class="$style['control-body']"
                @click.left.exact.prevent="editVideo = cloneDeep(video)"
              />

              <ui-button
                icon="remove"
                color="error"
                :loading="isRemoving(video.id)"
                :class="$style.control"
                :body-class="$style['control-body']"
                @click.left.exact.prevent="remove(video.id)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="pages > 1"
          :class="$style.paginate"
        >
          <ui-paginate
            v-model="page"
            :page-count="pages"
          />
        </div>
      </div>
    </template>
  </page-layout>

  <youtube-edit-modal
    :video="editVideo"
    @close="editVideo = undefined"
  />
</template>

<script setup lang="ts">
  import { type MaybeRef, tryOnBeforeMount } from '@vueuse/core';
  import { ref } from 'vue';
  import cloneDeep from 'lodash/cloneDeep';
  import { storeToRefs } from 'pinia';
  import { useYoutube } from '@/features/youtube/composition/useYoutube';
  import { useYoutubeActive } from '@/features/youtube/composition/useYoutubeActive';
  import { getDate } from '@/common/composition/useDayjs';
  import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
  import YoutubePlayer from '@/features/youtube/components/YoutubePlayer.vue';
  import UiCheckbox from '@/components/UI/kit/UiCheckbox.vue';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import UiPaginate from '@/components/UI/kit/UiPaginate.vue';
  import YoutubeEditModal from '@/features/youtube/components/YoutubeEditModal.vue';
  import UiSelect from '@/components/UI/kit/UiSelect.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import PageLayout from '@/components/content/PageLayout.vue';

  const { isMobile } = storeToRefs(useUIStore());

  const {
    limit,
    page,
    pages,
    itemsPerPage,
    isLoaded,
    load,
    add,
    videos,
    remove,
    isRemoving
  } = useYoutube();

  const {
    limit: activeLimit,
    count: activeCount,
    isDisabled: isActivationDisabled,
    isSuccess: isActiveSuccess,
    isLoaded: isActiveLoaded,
    updateCount,
    updateActiveStatus
  } = useYoutubeActive();

  const editVideo = ref<TYoutubeVideo>();

  const init = async () => {
    try {
      await load();

      return updateCount();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const updateVideoStatus = async (id: TYoutubeVideo['id'], status: MaybeRef<boolean>) => {
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

<style
  module
  lang="scss"
>
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
    margin-left: auto;
  }

  .error {
    color: var(--error);
  }

  .body {
    padding: 16px 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
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
    };

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
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background-color: var(--bg-secondary);
    position: relative;
    border: {
      radius: 12px;
      width: 1px;
      style: solid;
      color: var(--border);
    };

    &:hover {
      .controls {
        pointer-events: initial;
        user-select: initial;
        opacity: 1;
      }
    }
  }

  .info {
    h3 {
      margin-top: 0;
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
    };
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
