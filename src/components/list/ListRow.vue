<template>
  <div
    class="list-row"
  >
    <div
      v-for="item in items"
      :key="item[itemKey]"
      class="list-row__column"
    >
      <slot v-bind="{ item }" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import isArray from 'lodash/isArray';
  import type { AnyArray } from '@/types/Shared/Utility.types';

  export type TListRowProps = {
    row: unknown | AnyArray;
    columns?: number;
    itemKey: string;
  }

  const props = withDefaults(defineProps<TListRowProps>(), {
    columns: 1
  });

  const items = isArray(props.row) ? props.row : [props.row];
</script>

<style lang="scss" scoped>
    $item-spacing: 12px;

  .list-row {
    display: flex;
    flex-wrap: wrap;
        margin: calc(-1 * var(--item-spacing, #{$item-spacing * .5}) / 2);

    &__column {
      flex-basis: calc(100% / v-bind(columns));
            padding: calc(var(--item-spacing, #{$item-spacing}) / 2);
      min-width: 0;
    }
  }
</style>
