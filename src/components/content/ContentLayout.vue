<template>
  <div
    ref="container"
    :class="{ 'is-showed-right-side': showRightSide }"
    class="content-layout"
  >
    <div
      :class="{ 'is-fullscreen': fullscreenState }"
      class="content-layout__body"
    >
      <div
        :class="{
          'is-fullscreen': fullscreenState,
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
          :class="{ 'is-shadow': shadow || (showRightSide && fullscreenState) }"
          class="content-layout__side--left_body"
        >
          <slot
            v-if="!items || !items.length"
            name="default"
          />

          <div
            v-else-if="!virtualized"
            class="content-layout__items"
          >
            <div
              v-for="(item, key) in items"
              :key="key"
              class="content-layout__item"
            >
              <slot
                :item="item"
                :index="key"
                name="default"
              />
            </div>
          </div>

          <virtual-grouped-list
            v-else-if="virtualizedType === 'grouped'"
            :list="mergedListProps"
            :grid="computedGrid"
            :get-group="customGetGroup"
          >
            <template #default="{ item }">
              <slot
                name="default"
                :item="item"
              />
            </template>
          </virtual-grouped-list>

          <virtual-grid-list
            v-else-if="virtualizedType === 'grid'"
            :list="mergedListProps"
            :flat="computedFlat"
          >
            <template #default="{ item }">
              <slot
                name="default"
                :item="item"
              />
            </template>
          </virtual-grid-list>
        </div>
      </div>

      <div
        v-if="showRightSide"
        ref="detail"
        :class="{ 'is-fullscreen': fullscreenState }"
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

<script setup lang="ts" generic="T extends Array<unknown>">
  import {
    computed, onMounted, ref, watch
  } from 'vue';
  import type { MaybeRef } from '@vueuse/core';
  import {
    useElementBounding, useInfiniteScroll, useScroll
  } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import throttle from 'lodash/throttle';
  import { useUIStore } from '@/store/UI/UIStore';
  import ListFilter from '@/components/filter/ListFilter.vue';
  import type { FilterComposable } from '@/common/composition/useFilter';
  import { getListProps } from '@/components/list/VirtualList/helpers';
  import { getGroupByFirstLetter } from '@/common/helpers/list';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import type { TGroup, TItem } from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { checkIsListGridFlat, getListGridInTabProps } from '@/components/list/VirtualGridList/helpers';
  import type { TVirtualListProps } from '@/components/list/VirtualList/types';
  import type { TGetGroup } from '@/components/list/VirtualGroupedList/types';
  import type { TVirtualGridListProps } from '@/components/list/VirtualGridList/VirtualGridList.vue';
  import VirtualGridList from '@/components/list/VirtualGridList/VirtualGridList.vue';

  type TEmit = {
    (e: 'update'): void;
    (e: 'search', v: MaybeRef<string>): void;
  }

  const props = withDefaults(
    defineProps<{
      showRightSide?: boolean;
      title?: string | null;
      forceFullscreenState?: boolean;
      filterInstance?: FilterComposable;
      virtualized?: boolean;
      virtualizedType?: 'grouped' | 'grid';
      listProps?: Omit<TVirtualListProps, 'items'>;
      getGroup?: TGetGroup<TItem, TGroup>;
      grid?: TVirtualGridListProps;
      flat?: TVirtualGridListProps;
      onLoadMore?:() => Promise<void>;
      isEnd?: boolean;
      items?: T
    }>(),
    {
      showRightSide: false,
      title: null,
      forceFullscreenState: undefined,
      filterInstance: undefined,
      onLoadMore: undefined,
      isEnd: false,
      virtualized: false,
      virtualizedType: 'grouped',
      listProps: undefined,
      getGroup: undefined,
      grid: undefined,
      flat: undefined,
      items: []
    }
  );

  const emit = defineEmits<TEmit>();

  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen,
    bodyElement
  } = storeToRefs(uiStore);

  const container = ref<HTMLDivElement | null>(null);
  const leftSide = ref<HTMLDivElement | null>(null);
  const fixedContainer = ref<HTMLDivElement | null>(null);
  const shadow = ref(false);

  const fullscreenState = computed(() => {
    if (typeof props.forceFullscreenState === 'boolean') {
      return props.forceFullscreenState;
    }

    return fullscreen.value;
  });

  const mergedListProps = computed(() => getListProps({
    items: props.items,
    ...props.listProps
  }));

  const customGetGroup = computed(() => {
    if (props.getGroup) {
      return props.getGroup;
    }

    return getGroupByFirstLetter;
  });

  const computedGrid = computed(() => {
    if (!props.virtualized) {
      return {};
    }

    if (props.grid) {
      return props.grid;
    }

    return getListGridInTabProps({
      showRightSide: props.showRightSide,
      fullscreen: fullscreen.value,
      inTab: false
    });
  });

  const computedFlat = computed(() => {
    if (!props.virtualized) {
      return false;
    }

    if (props.flat) {
      return props.flat;
    }

    return checkIsListGridFlat({
      showRightSide: props.flat,
      fullscreen: fullscreen.value
    });
  });

  const toggleShadow = () => {
    if (!bodyElement.value || !container.value) {
      return;
    }

    shadow.value
      = uiStore.bodyScroll.y + bodyElement.value.offsetHeight < container.value.offsetHeight - 24;
  };

  const scrollHandler = throttle(() => {
    toggleShadow();
  }, 200);

  const fixedContainerRect = useElementBounding(fixedContainer);
  const bodyRect = useElementBounding(bodyElement);

  const bodyScroll = useScroll(bodyElement, {
    behavior: 'smooth',
    throttle: 300,
    onScroll: scrollHandler
  });

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

    if (!bodyElement.value || !rect?.top && rect?.top !== 0) {
      return;
    }

    fixedContainerRect.update();

    bodyScroll.y.value = rect.top + bodyScroll.y.value - fixedContainerRect.height.value;
  };

  const scrollToLastActive = (url: string) => {
    if (isMobile.value) {
      return;
    }

    if (!leftSide.value) {
      return;
    }

    const link = leftSide.value.querySelector(`[href="${ url }"]`)
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

  watch(bodyRect.height, scrollHandler, {
    immediate: true,
    flush: 'post'
  });

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
        interval: 1000
      }
    );
  });
</script>

<style lang="scss" scoped>
  .content-layout {
    width: 100%;
    max-width: var(--max-content);
    min-height: calc(var(--max-vh) - 56px);
    margin: 0 auto;

    &__body {
      width: 100%;
      min-height: calc(var(--max-vh) - 56px);
      display: flex;
      justify-content: flex-start;
      position: relative;

      &.is-fullscreen {
        border-radius: 12px;
      }

      @include media-min($md) {
        min-height: var(--max-vh);
      }
    }

    &__title {
      font-size: calc(var(--h1-font-size) - 10px);
      font-weight: 400;
    }

    &__fixed {
      position: sticky;
      top: 0;
      z-index: 3;
      pointer-events: none;
      padding-bottom: 16px;

      &:after {
        content: '';
        display: block;
        position: absolute;
        bottom: 0;
        height: 16px;
        width: 100%;
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
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        flex-shrink: 0;

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
            width: 40%;
          }
        }

        &_body {
          &:after {
            content: '';
            display: block;
            pointer-events: none;
            width: calc(100% + 16px);
            height: 24px;
            box-shadow: 0 0 32px 32px var(--bg-main);
            position: sticky;
            bottom: 0;
            margin: 0 -16px;
            //z-index: 16;
            opacity: 0;
            background-color: var(--bg-main);
            transition: opacity 0.2s;
            border: {
              top-left-radius: 20%;
              top-right-radius: 20%;
            };
          }

          &.is-shadow {
            &:after {
              opacity: 1;
            }
          }
        }
      }

      &--right {
        display: block;
        top: 0;
        left: 0;
        right: 0;
        height: calc(var(--max-vh) - 56px);
        overflow: hidden;
        border-radius: 0;
        background-color: var(--bg-secondary);
        position: fixed;
        margin-left: auto;
        z-index: 12;

        @include media-min($md) {
          left: 56px;
          height: var(--max-vh);
        }

        @include media-min($xl) {
          left: 0;
          top: 24px;
          position: sticky;
          width: calc(60% - 24px);
          height: calc(var(--max-vh) - 24px - 24px);
          border-radius: 12px;
        }

        &.is-fullscreen {
          width: auto;
          max-width: 100%;
          margin-left: initial;
          height: calc(var(--max-vh) - 56px);

          @include media-min($md) {
            height: var(--max-vh);
          }

          @include media-min($xl) {
            width: var(--max-content);
            max-width: var(--max-content);
            margin-left: -100%;
            z-index: 16;
            height: calc(var(--max-vh) - 48px);
          }
        }
      }
    }

    @include media-min($md) {
      min-height: var(--max-vh);
    }
  }
</style>
