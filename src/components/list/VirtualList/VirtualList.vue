<template>
  <dynamic-scroller
    ref="scroller"
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
  import clsx from 'clsx';
  import { computed, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import omit from 'lodash/omit';
  import { DEFAULT_KEY_FIELD } from '@/common/const';
  import type { TVirtualListProps, TVirtualListRef } from '@/components/list/VirtualList/types';

  const route = useRoute();

  const props = withDefaults(defineProps<TVirtualListProps>(), {
    keyField: DEFAULT_KEY_FIELD,
    pageMode: true,
    minItemSize: 55,
    getItemClass: () => undefined,
    getItemIndexByKey: undefined
  });

  const getItemIndexByKey = computed(() => props.getItemIndexByKey || (
    (items, key) => items.findIndex(item => item[props.keyField] === key)
  ));

  const scroller = ref<Record<string, any>>();

  const scrollerProps = computed(() => omit(props, 'getItemIndexByKey', 'getItemClass'));

  const getItemClasses = (item: unknown) => clsx('virtual-list__item', props.getItemClass?.(item));

  /**
   * Метод для прокрутки к элементу по ключу
   * т.к. индекс элемента может меняться
   */
  const scrollToItemByKey = (key: string) => {
    const scrollIndex = getItemIndexByKey.value(props.items, key);

    if (!scroller.value || scrollIndex === -1) {
      return {
        scrolled: false,
        index: scrollIndex
      };
    }

    scroller.value?.scrollToItem?.(scrollIndex);

    return {
      scrolled: true,
      index: scrollIndex
    };
  };

  defineExpose<TVirtualListRef>({
    scroller,
    scrollToItemByKey
  });
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
