<template>
  <div
    ref="layout"
    class="tab-layout"
  >
    <div
      v-if="filterInstance"
      ref="filter"
      class="tab-layout__filter"
    >
      <div class="tab-layout__filter_body">
        <list-filter
          :filter-instance="filterInstance"
          :in-tab="true"
          @search="$emit('search', $event)"
          @update="$emit('update')"
        />
      </div>

      <div
        :style="{ height: `${dropdownHeight}px` }"
        class="tab-layout__filter_dropdown"
        data-tab-filter
      />
    </div>

    <div
      ref="list"
      class="tab-layout__items"
    >
      <div class="tab-layout__items--inner">
        <slot
          v-if="!items || !items.length"
          name="default"
        />

        <div
          v-else-if="!virtualized"
          class="tab-layout__items"
        >
          <div
            v-for="(item, key) in items"
            :key="key"
            class="tab-layout__item"
          >
            <slot
              :item="item"
              name="default"
            />
          </div>
        </div>

        <virtual-grouped-list
          v-else
          :list="mergedListProps"
          :grid="grid"
          :get-group="customGetGroup"
        >
          <template #default="{ item }">
            <slot
              name="default"
              :item="item"
            />
          </template>
        </virtual-grouped-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Array<unknown>">
  import { useInfiniteScroll, useResizeObserver } from '@vueuse/core';
  import {
    onMounted, ref, computed
  } from 'vue';
  import ListFilter from '@/components/filter/ListFilter.vue';
  import type { FilterComposable } from '@/common/composition/useFilter';
  import { getListGridInTabProps } from '@/components/list/VirtualGridList/helpers';
  import { getListProps } from '@/components/list/VirtualList/helpers';
  import { getGroupByFirstLetter } from '@/common/helpers/list';
  import VirtualGroupedList, { TGroup, TItem } from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { TVirtualListProps } from '@/components/list/VirtualList/types';
  import { TGetGroup } from '@/components/list/VirtualGroupedList/types';
  import type { TVirtualGridListProps } from '@/components/list/VirtualGridList/VirtualGridList.vue';

  const props = withDefaults(
    defineProps<{
      filterInstance?: FilterComposable;
      virtualized?: boolean;
      listProps?: Omit<TVirtualListProps, 'items'>;
      getGroup?: TGetGroup<TItem, TGroup>;
      grid?: TVirtualGridListProps;
      onLoadMore?:() => Promise<void>;
      isEnd?: boolean;
      items?: T
    }>(),
    {
      filterInstance: undefined,
      onLoadMore: undefined,
      isEnd: false,
      virtualized: false,
      listProps: undefined,
      getGroup: undefined,
      grid: undefined,
      items: []
    }
  );

  const dropdownHeight = ref(0);

  const list = ref<HTMLDivElement | null>(null);

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

  const grid = computed(() => {
    if (!props.virtualized) {
      return {};
    }

    return getListGridInTabProps({
      showRightSide: false,
      fullscreen: false,
      inTab: true
    });
  });

  onMounted(() => {
    useInfiniteScroll(
      list,
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

    useResizeObserver(list, entries => {
      if (Array.isArray(entries) && entries.length) {
        const entry = entries[0];
        const { height } = entry.contentRect;

        dropdownHeight.value = height || 0;
      }
    });
  });
</script>

<style lang="scss" scoped>
  .tab-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &__filter {
      flex-shrink: 0;
      position: relative;
      padding-bottom: 8px;

      &_dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;

        :deep(*) {
          pointer-events: auto;
        }
      }
    }

    &__items {
      flex: 1 1 100%;
      overflow: auto;

      &--inner {
        padding: 8px 16px 16px;

        @include media-min($xl) {
          padding: 8px 24px 24px;
        }
      }
    }
  }
</style>
