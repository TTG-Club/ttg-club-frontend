<script setup lang="ts">
  import type { FilterGroup, FilterSelection } from '../model';

  import {
    FILTER_SEARCH_DEBOUNCE_MS,
    getGroupSelection,
    isFilterSearchable,
    searchFilterGroups,
    SECTION_ICON,
    SECTION_TEXT,
    setGroupSelection,
  } from '../model';
  import SectionFilterGroup from './SectionFilterGroup.vue';

  /**
   * Фильтр прямо в левой колонке раздела, как на new.ttg.club: заголовок со
   * сбросом, поиск по фильтрам и сворачиваемые группы. Выбор применяется
   * сразу, без «Применить».
   */
  const {
    groups,
    selection,
    isCustomized = false,
  } = defineProps<{
    /** Видимые группы условий по содержимому. */
    groups: Array<FilterGroup>;
    selection: FilterSelection;
    isCustomized?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    'reset': [];
  }>();

  const search = ref('');

  const debouncedSearch = refDebounced(search, FILTER_SEARCH_DEBOUNCE_MS);

  // Очистка поля возвращает группы сразу, без задержки
  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const isSearchable = computed(() => isFilterSearchable(groups));

  const matches = computed(() =>
    searchFilterGroups(groups, appliedSearch.value),
  );

  const isSearching = computed(() => !!appliedSearch.value.trim());

  const isEmpty = computed(() => isSearching.value && !matches.value.length);

  /**
   * Выбранные ключи группы.
   * @param group - группа фильтра
   */
  function getSelected(group: FilterGroup): Array<string> {
    return getGroupSelection(selection, group);
  }

  /**
   * Отмечает значение группы или снимает отметку.
   * @param group - группа фильтра
   * @param key - ключ значения
   */
  function toggle(group: FilterGroup, key: string): void {
    const current = getSelected(group);

    const next = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key];

    emit('update:selection', setGroupSelection(selection, group, next));
  }

  /**
   * Заменяет выбор группы целиком, например через «Выбрать все».
   * @param group - группа фильтра
   * @param keys - выбранные ключи
   */
  function setGroup(group: FilterGroup, keys: Array<string>): void {
    emit('update:selection', setGroupSelection(selection, group, keys));
  }

  function reset(): void {
    emit('reset');
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex min-h-6 items-center justify-between gap-2">
      <span class="text-sm font-medium text-muted">
        {{ SECTION_TEXT.filters }}
      </span>

      <UButton
        v-if="isCustomized"
        :icon="SECTION_ICON.reset"
        :label="SECTION_TEXT.reset"
        color="error"
        variant="link"
        size="xs"
        class="px-0"
        @click.left.exact.prevent="reset"
      />
    </div>

    <UInput
      v-if="isSearchable"
      v-model="search"
      :icon="SECTION_ICON.search"
      :placeholder="SECTION_TEXT.filterSearch"
      :aria-label="SECTION_TEXT.filterSearchLabel"
      type="search"
      autocomplete="off"
      class="w-full"
    />

    <p
      v-if="isEmpty"
      class="py-2 text-sm text-muted"
    >
      {{ SECTION_TEXT.empty }}
    </p>

    <div class="flex flex-col">
      <SectionFilterGroup
        v-for="match in matches"
        :key="match.group.key"
        :group="match.group"
        :values="match.values"
        :selected="getSelected(match.group)"
        :is-expanded="isSearching"
        @toggle="toggle(match.group, $event)"
        @update:selected="setGroup(match.group, $event)"
      />
    </div>
  </div>
</template>
