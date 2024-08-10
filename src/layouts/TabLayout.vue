<script lang="ts" setup>
  import type { FilterComposable } from '@/shared/composable/useFilter';

  import ListFilter from '@/features/filter/ListFilter.vue';

  const props = withDefaults(
    defineProps<{
      filterInstance?: FilterComposable;
      onLoadMore?: () => Promise<void>;
      isEnd?: boolean;
    }>(),
    {
      filterInstance: undefined,
      onLoadMore: undefined,
      isEnd: false,
    },
  );

  const dropdownHeight = ref(0);

  const list = ref<HTMLDivElement | null>(null);

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
        interval: 1000,
      },
    );

    useResizeObserver(list, (entries) => {
      if (Array.isArray(entries) && entries.length) {
        const entry = entries[0];
        const { height } = entry.contentRect;

        dropdownHeight.value = height || 0;
      }
    });
  });
</script>

<template>
  <div class="tab-layout">
    <div
      v-if="filterInstance"
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
        <slot name="default" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .tab-layout {
    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100%;

    &__filter {
      position: relative;
      flex-shrink: 0;
      padding-bottom: 8px;

      &_dropdown {
        pointer-events: none;

        position: absolute;
        z-index: 10;
        top: 100%;
        left: 0;

        width: 100%;
        height: 100%;

        :deep(*) {
          pointer-events: auto;
        }
      }
    }

    &__items {
      overflow: auto;
      flex: 1 1 100%;

      &--inner {
        padding: 8px 16px 16px;

        @include media-min($xl) {
          padding: 8px 24px 24px;
        }
      }
    }
  }
</style>
