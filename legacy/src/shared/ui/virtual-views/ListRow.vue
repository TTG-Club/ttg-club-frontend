<script lang="ts" setup>
  import { isArray } from 'lodash-es';

  import type { AnyArray } from '@/shared/types/Utility';

  export type TListRowProps = {
    row: unknown | AnyArray;
    columns?: number;
    itemKey: string;
  };

  const props = withDefaults(defineProps<TListRowProps>(), {
    columns: 1,
  });

  const items = computed(() => (isArray(props.row) ? props.row : [props.row]));
</script>

<template>
  <div class="list-row">
    <div
      v-for="item in items"
      :key="item[itemKey]"
      class="list-row__column"
    >
      <slot v-bind="{ item }" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $item-spacing: 12px;

  .list-row {
    display: flex;
    flex-wrap: wrap;
    margin: calc(-1 * var(--item-spacing, #{$item-spacing * 0.5}) / 2);

    &__column {
      flex-basis: calc(100% / v-bind(columns));
      min-width: 0;
      padding: calc(var(--item-spacing, #{$item-spacing}) / 2);
    }
  }
</style>
