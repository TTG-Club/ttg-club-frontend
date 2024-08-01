<script lang="ts" setup>
  import { throttle } from 'lodash-es';

  import type { FilterComposable } from '@/shared/composable/useFilter';
  import { useUIStore } from '@/shared/stores/UIStore';

  import ListFilter from '@/features/filter/ListFilter.vue';

  import type { MaybeRef } from '@vueuse/core';

  type TEmit = {
    (e: 'update'): void;
    (e: 'search', v: MaybeRef<string>): void;
  };

  const props = withDefaults(
    defineProps<{
      showRightSide?: boolean;
      title?: string | null;
      fullScreenDisabled?: boolean;
      filterInstance?: FilterComposable;
      onLoadMore?: () => Promise<void>;
      isEnd?: boolean;
    }>(),
    {
      showRightSide: false,
      title: null,
      fullScreenDisabled: false,
      filterInstance: undefined,
      onLoadMore: undefined,
      isEnd: false,
    },
  );

  const emit = defineEmits<TEmit>();

  const uiStore = useUIStore();

  const { isMobile, fullscreen, bodyElement } = storeToRefs(uiStore);

  const container = ref<HTMLDivElement | null>(null);
  const leftSide = ref<HTMLDivElement | null>(null);
  const fixedContainer = ref<HTMLDivElement | null>(null);
  const shadow = ref(false);

  const isFullScreen = computed(() => {
    return fullscreen.value && !props.fullScreenDisabled;
  });

  provide('fullScreenDisabled', props.fullScreenDisabled);

  const toggleShadow = () => {
    if (!bodyElement.value || !container.value) {
      return;
    }

    shadow.value =
      uiStore.bodyScroll.y + bodyElement.value.offsetHeight <
      container.value.offsetHeight - 24;
  };

  const scrollHandler = throttle(() => {
    toggleShadow();
  }, 200);

  const fixedContainerRect = useElementBounding(fixedContainer);

  const bodyScroll = useScroll(bodyElement, {
    behavior: 'smooth',
    throttle: 300,
    onScroll: scrollHandler,
  });

  useResizeObserver(bodyElement, scrollHandler);

  const scrollToActive = (oldLink?: Element) => {
    if (isMobile.value) {
      return;
    }

    if (!leftSide.value) {
      return;
    }

    const link = oldLink || leftSide.value.querySelector('.router-link-active');

    if (!link) {
      return;
    }

    const rect = link.getBoundingClientRect();

    if (!bodyElement.value || (!rect?.top && rect?.top !== 0)) {
      return;
    }

    fixedContainerRect.update();

    bodyScroll.y.value =
      rect.top + bodyScroll.y.value - fixedContainerRect.height.value;
  };

  const scrollToLastActive = (url: string) => {
    if (isMobile.value) {
      return;
    }

    if (!leftSide.value) {
      return;
    }

    const link = leftSide.value
      .querySelector(`[href="${url}"]`)
      ?.closest('.link-item-expand');

    if (!link) {
      return;
    }

    setTimeout(() => {
      scrollToActive(link);
    }, 350);
  };

  const onUpdateSearch = (value: string) => {
    bodyScroll.y.value = 0;

    emit('search', value);
  };

  const onUpdateFilter = () => {
    bodyScroll.y.value = 0;

    emit('update');
  };

  onMounted(() => {
    useInfiniteScroll(
      bodyElement,
      async () => {
        if (props.isEnd || !props.onLoadMore) {
          return;
        }

        await props.onLoadMore();
      },
      {
        distance: 1080,
        interval: 1000,
      },
    );
  });
</script>

<template>
  <div
    ref="container"
    :class="{ 'is-showed-right-side': showRightSide }"
    class="content-layout"
  >
    <div
      :class="{ 'is-fullscreen': isFullScreen }"
      class="content-layout__body"
    >
      <div
        :class="{
          'is-fullscreen': isFullScreen,
          'is-showed-right-side': showRightSide,
        }"
        class="content-layout__side--left"
      >
        <div
          ref="fixedContainer"
          class="content-layout__fixed"
        >
          <div class="content-layout__fixed_body">
            <h1
              v-if="$slots.title"
              class="content-layout__title"
            >
              <slot name="title" />
            </h1>

            <h1
              v-else-if="title"
              class="content-layout__title"
            >
              {{ title }}
            </h1>

            <div
              v-if="filterInstance"
              class="content-layout__filter"
            >
              <list-filter
                :filter-instance="filterInstance"
                @search="onUpdateSearch"
                @update="onUpdateFilter"
              />
            </div>

            <div
              v-if="$slots.fixed"
              class="content-layout__fixed_slot"
            >
              <slot name="fixed" />
            </div>
          </div>
        </div>

        <div
          ref="leftSide"
          :class="{ 'is-shadow': shadow || (showRightSide && isFullScreen) }"
          class="content-layout__side--left_body"
        >
          <slot name="default" />
        </div>
      </div>

      <div
        v-if="showRightSide"
        :class="{ 'is-fullscreen': isFullScreen }"
        class="content-layout__side--right"
      >
        <router-view
          v-if="!$slots['right-side']"
          @scroll-to-active="scrollToActive"
          @scroll-to-last-active="scrollToLastActive"
        />

        <slot name="right-side" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .content-layout {
    width: 100%;
    max-width: var(--max-content);
    min-height: calc(var(--max-vh) - 56px);
    margin: 0 auto;

    &__body {
      position: relative;

      display: flex;
      justify-content: flex-start;

      width: 100%;
      min-height: calc(var(--max-vh) - 56px);

      &.is-fullscreen {
        border-radius: 12px;
      }

      @include media-min($md) {
        min-height: var(--max-vh);
      }
    }

    &__title {
      font-size: var(--h2-font-size);
      font-weight: 400;
      line-height: var(--h2-line-height);

      @include media-min($lg) {
        font-size: var(--h1-font-size);
        line-height: var(--h1-line-height);
      }
    }

    &__fixed {
      pointer-events: none;

      position: sticky;
      z-index: 3;
      top: 0;

      padding-bottom: 16px;

      &::after {
        content: '';

        position: absolute;
        bottom: 0;

        display: block;

        width: 100%;
        height: 16px;

        background: linear-gradient(
          180deg,
          var(--bg-main) 0,
          var(--bg-main) 15%,
          transparent 80%,
          transparent 90%,
          transparent 100%
        );
      }

      &_body {
        pointer-events: auto;

        display: flex;
        flex-direction: column;
        gap: 12px;

        padding-top: 16px;

        background-color: var(--bg-main);

        @include media-min($md) {
          gap: 16px;
        }

        @include media-min($xl) {
          padding-top: 24px;
        }
      }
    }

    &__side {
      &--left {
        position: relative;

        display: flex;
        flex-direction: column;
        flex-shrink: 0;

        width: 100%;

        ::-webkit-scrollbar-track {
          background-color: transparent;

          &:hover {
            background-color: transparent;
          }
        }

        &.is-fullscreen {
          border-radius: 12px;
        }

        &.is-showed-right-side:not(.is-fullscreen) {
          width: 100%;

          @include media-min($xl) {
            width: 36%;
          }
        }

        &_body {
          &::after {
            pointer-events: none;
            content: '';

            position: sticky;
            bottom: 0;

            display: block;

            width: calc(100% + 16px);
            height: 24px;
            margin: 0 -16px;

            opacity: 0;
            background-color: var(--bg-main);
            box-shadow: 0 0 32px 32px var(--bg-main);

            transition: opacity 0.2s;
            border: {
              top-left-radius: 20%;
              top-right-radius: 20%;
            }
          }

          &.is-shadow {
            &::after {
              opacity: 1;
            }
          }
        }
      }

      &--right {
        position: fixed;
        z-index: 12;
        top: 0;
        right: 0;
        left: 0;

        overflow: hidden;
        display: block;

        height: calc(var(--max-vh) - 56px);
        margin-left: auto;

        background: var(--bg-secondary-gradient);
        border-radius: 0;

        @include media-min($md) {
          left: 64px;
          height: var(--max-vh);
        }

        @include media-min($xl) {
          position: sticky;
          top: 24px;
          left: 0;

          width: calc(64% - 24px);
          height: calc(var(--max-vh) - 24px - 24px);

          border-radius: 12px;
        }

        &.is-fullscreen {
          width: auto;
          max-width: 100%;
          height: calc(var(--max-vh) - 56px);
          margin-left: initial;

          @include media-min($md) {
            height: var(--max-vh);
          }

          @include media-min($xl) {
            z-index: 16;

            width: var(--max-content);
            max-width: var(--max-content);
            height: calc(var(--max-vh) - 48px);
            margin-left: -100%;
          }
        }
      }
    }

    @include media-min($md) {
      min-height: var(--max-vh);
    }
  }
</style>
