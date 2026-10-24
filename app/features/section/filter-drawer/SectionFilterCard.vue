<script setup lang="ts">
  import type { FilterGroup, FilterValue } from '../model';

  import { SectionFilterValues } from '../filter-inline';
  import {
    getSelectAllState,
    getSourceFilterValue,
    SECTION_TEXT,
    SOURCE_FILTER_BADGE_CLASS,
  } from '../model';

  /**
   * Группа фильтра карточкой, как источники на new.ttg.club: название и
   * «Выбрать все» в шапке, под чертой значения метками.
   */
  const {
    group,
    values,
    selected,
    isSources = false,
  } = defineProps<{
    group: FilterGroup;
    /** Значения, подошедшие под поиск. */
    values: Array<FilterValue>;
    /** Выбранные ключи группы. */
    selected: Array<string>;
    /**
     * Группа источников: книги подписаны названием, а сокращение — в
     * подсказке.
     */
    isSources?: boolean;
  }>();

  const emit = defineEmits<{
    'toggle': [key: string];
    'update:selected': [keys: Array<string>];
  }>();

  const shownValues = computed(() =>
    isSources ? values.map(getSourceFilterValue) : values,
  );

  const allKeys = computed(() =>
    group.values.map((value) => String(value.key)),
  );

  const allState = computed(() => getSelectAllState(allKeys.value, selected));

  /**
   * Отмечает все значения группы или снимает все отметки.
   * @param value - новое состояние «Выбрать все»
   */
  function setAll(value: boolean | 'indeterminate'): void {
    emit('update:selected', value === true ? allKeys.value : []);
  }

  /**
   * Отмечает значение или снимает отметку.
   * @param key - ключ значения
   */
  function toggle(key: string): void {
    emit('toggle', key);
  }
</script>

<template>
  <section class="rounded-xl border border-default">
    <header
      class="flex items-center justify-between gap-3 border-b border-default px-4 py-3"
    >
      <h3 class="min-w-0 truncate text-highlighted">
        {{ group.name }}
      </h3>

      <UCheckbox
        :model-value="allState"
        :label="SECTION_TEXT.selectAll"
        size="sm"
        class="shrink-0"
        @update:model-value="setAll"
      />
    </header>

    <SectionFilterValues
      :values="shownValues"
      :selected="selected"
      :size="isSources ? 'md' : 'lg'"
      :badge-class="isSources ? SOURCE_FILTER_BADGE_CLASS : undefined"
      class="p-4"
      @toggle="toggle"
    />
  </section>
</template>
