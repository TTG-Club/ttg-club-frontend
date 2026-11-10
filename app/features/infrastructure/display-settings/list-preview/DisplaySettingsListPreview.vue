<script setup lang="ts">
  import type { ListColumnCount } from '~/shared/consts';

  import {
    LIST_PREVIEW_CARD_ROW_COUNT,
    LIST_PREVIEW_GRID_CLASS,
    LIST_PREVIEW_ROW_COUNT,
  } from './constants';

  /**
   * Миниатюра вида списка: сетка карточек в нужное число колонок или строки
   * во всю ширину.
   */
  const { columns } = defineProps<{
    /** Наибольшее число колонок; одна — строки */
    columns: ListColumnCount;
  }>();

  const gridClass = computed(() => LIST_PREVIEW_GRID_CLASS[columns]);

  const cardCount = computed(() => columns * LIST_PREVIEW_CARD_ROW_COUNT);
</script>

<template>
  <span
    v-if="gridClass"
    class="grid h-10 gap-0.5"
    :class="gridClass"
    aria-hidden="true"
  >
    <span
      v-for="card in cardCount"
      :key="card"
      class="rounded-xs border border-accented"
    />
  </span>

  <span
    v-else
    class="flex h-10 flex-col justify-center gap-1"
    aria-hidden="true"
  >
    <span
      v-for="row in LIST_PREVIEW_ROW_COUNT"
      :key="row"
      class="h-1.5 rounded-xs bg-inverted/30"
    />
  </span>
</template>
