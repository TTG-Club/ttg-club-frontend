<template>
  <dynamic-scroller
    v-bind="scrollerProps"
    class="virtual-list"
    list-tag="ul"
    item-tag="li"
  >
    <template #default="{ item, index, active }">
      <dynamic-scroller-item
        :key="item[keyField]"
        :active="active"
        :data-index="index"
        :item="item"
        :class="getItemClasses(item)"
      >
        <slot v-bind="{ item, index, active }" />
      </dynamic-scroller-item>
    </template>
  </dynamic-scroller>
</template>

<script lang="ts" setup>
  import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
  import clsx from "clsx";
  import { computed } from "vue";
  import { DEFAULT_KEY_FIELD } from '@/common/const';
  import type { Maybe } from "@/types/Shared/Utility.types";

  /* TODO: Добавить generic-типизацию по выходу Vue 3.3 */

  export type TVirtualListProps = {
    items: unknown[];
    keyField?: string,
    minItemSize?: number;
    pageMode?: boolean;
    getItemClass?: (item: unknown) => Maybe<string>;
  };

  const props = withDefaults(defineProps<TVirtualListProps>(), {
    keyField: DEFAULT_KEY_FIELD,
    pageMode: true,
    minItemSize: 55,
    getItemClass: () => undefined
  });

  const scrollerProps = computed(() => {
    const { getItemClass, ...rest } = props;

    return rest;
  });

  const getItemClasses = (item: unknown) => clsx('virtual-list__item', props.getItemClass?.(item));
</script>

<style lang="scss" scoped>
  $item-spacing: 12px;

    .virtual-list {
        --item-spacing: #{$item-spacing};
    }

  :deep {
    &.vue-recycle-scroller {
            // Добавляем отрицательный margin для родителя, чтобы не было лишнего отступа
            margin-bottom: calc(-1 * var(--item-spacing, #{$item-spacing}));
    }

    .vue-recycle-scroller__item-wrapper {
      padding: 0;
      margin: 0;
    }

    .vue-recycle-scroller__item-view {
      margin: 0;
      padding: 0;

            // Добавляем отступ между элементами
            > .virtual-list__item {
                padding-bottom: var(--item-spacing, #{$item-spacing})
      }
    }
  }
</style>
