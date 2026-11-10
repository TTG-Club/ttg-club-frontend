<script setup lang="ts">
  import type { SectionColumnSide } from '~/shared/consts';

  /**
   * Миниатюра раскладки раздела: колонки фильтров, списка и записи в том
   * порядке, в каком они встанут на странице. Фильтры — цветом акцента,
   * список — рамкой со строками, запись — сплошным блоком. Обычная ширина —
   * узкая страница по центру экрана с пустыми полями по бокам. Узкая
   * раскладка с записью рядом — та же колонка, где список стоит слева, а
   * запись карточкой справа.
   */
  const {
    filters,
    detail,
    overlay = false,
    centered = false,
  } = defineProps<{
    /** Где фильтры: колонкой слева, справа или над списком */
    filters: SectionColumnSide | 'top';
    /** С какой стороны от списка запись */
    detail: SectionColumnSide;
    /** Обычная ширина: страница по центру, запись поверх списка */
    overlay?: boolean;
    /** Узкая колонка по центру: список и запись рядом */
    centered?: boolean;
  }>();

  const isFiltersColumn = computed(() => filters !== 'top');

  // Запись слева от списка — список встаёт вторым
  const listOrderClass = computed(() =>
    detail === 'left' ? 'order-3' : 'order-2',
  );

  const detailOrderClass = computed(() =>
    detail === 'left' ? 'order-2' : 'order-3',
  );

  const filtersOrderClass = computed(() =>
    filters === 'right' ? 'order-4' : 'order-1',
  );
</script>

<template>
  <!-- Узкая раскладка: колонка по центру, список и запись рядом -->
  <div
    v-if="centered"
    class="flex h-10 w-full justify-center overflow-hidden rounded-sm border border-dashed border-accented"
    aria-hidden="true"
  >
    <span class="flex w-3/5 gap-0.5 py-0.5">
      <span
        class="flex flex-2 flex-col gap-1 rounded-xs border border-accented p-1"
      >
        <span class="h-1.5 shrink-0 rounded-xs bg-primary/60" />

        <span class="h-0.5 w-4/5 rounded-full bg-inverted/30" />

        <span class="h-0.5 w-3/5 rounded-full bg-inverted/30" />
      </span>

      <span class="flex-3 rounded-sm bg-inverted/20" />
    </span>
  </div>

  <!-- Обычная ширина: рамка экрана и узкая страница по центру -->
  <div
    v-else-if="overlay"
    class="flex h-10 w-full justify-center overflow-hidden rounded-sm border border-dashed border-accented"
    aria-hidden="true"
  >
    <span class="flex w-1/2 gap-0.5 py-0.5">
      <span class="w-1/4 shrink-0 rounded-xs bg-primary/60" />

      <span
        class="flex flex-1 flex-col gap-1 rounded-xs border border-accented p-1"
      >
        <span class="h-0.5 w-4/5 rounded-full bg-inverted/30" />

        <span class="h-0.5 w-3/5 rounded-full bg-inverted/30" />

        <span class="h-0.5 w-4/5 rounded-full bg-inverted/30" />
      </span>
    </span>
  </div>

  <div
    v-else
    class="flex h-10 w-full gap-0.5 overflow-hidden rounded-sm"
    aria-hidden="true"
  >
    <span
      v-if="isFiltersColumn"
      class="w-1/5 shrink-0 rounded-xs bg-primary/60"
      :class="filtersOrderClass"
    />

    <span
      class="flex flex-2 flex-col gap-1 rounded-xs border border-accented p-1"
      :class="listOrderClass"
    >
      <span
        v-if="!isFiltersColumn"
        class="h-1.5 shrink-0 rounded-xs bg-primary/60"
      />

      <span class="h-0.5 w-4/5 rounded-full bg-inverted/30" />

      <span class="h-0.5 w-3/5 rounded-full bg-inverted/30" />

      <span class="h-0.5 w-4/5 rounded-full bg-inverted/30" />
    </span>

    <span
      class="flex-3 rounded-xs bg-inverted/20"
      :class="detailOrderClass"
    />
  </div>
</template>
