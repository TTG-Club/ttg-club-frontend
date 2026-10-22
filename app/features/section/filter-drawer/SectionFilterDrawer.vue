<script setup lang="ts">
  import type {
    FilterDefinition,
    FilterGroup,
    FilterPart,
    FilterSelection,
  } from '../model';

  import { xor } from 'es-toolkit';

  import {
    FILTER_SEARCH_DEBOUNCE_MS,
    getGroupSelection,
    searchFilterGroups,
    SECTION_ICON,
    SECTION_TEXT,
    setGroupSelection,
  } from '../model';
  import SectionFilterCard from './SectionFilterCard.vue';

  /**
   * Панель части фильтра, как источники на new.ttg.club: поиск сверху и
   * группы карточками со «Выбрать все» и значениями метками.
   */
  const {
    part,
    definition,
    selection,
    isCustomized = false,
  } = defineProps<{
    part: FilterPart;
    definition: FilterDefinition;
    selection: FilterSelection;
    isCustomized?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    'reset': [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const search = ref('');

  const debouncedSearch = refDebounced(search, FILTER_SEARCH_DEBOUNCE_MS);

  // Очистка поля возвращает группы сразу, без задержки
  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const groups = computed(() =>
    definition[part].filter((group) => !group.hidden),
  );

  const matches = computed(() =>
    searchFilterGroups(groups.value, appliedSearch.value),
  );

  const isEmpty = computed(() => !matches.value.length);

  const isSources = computed(() => part === 'sources');

  const title = computed(() =>
    isSources.value ? SECTION_TEXT.sources : SECTION_TEXT.filterTitle,
  );

  const searchPlaceholder = computed(() =>
    isSources.value ? SECTION_TEXT.sourceSearch : SECTION_TEXT.filterSearch,
  );

  const searchLabel = computed(() =>
    isSources.value
      ? SECTION_TEXT.sourceSearchLabel
      : SECTION_TEXT.filterSearchLabel,
  );

  /**
   * Выбранные ключи группы.
   * @param group - группа фильтра
   */
  function getSelected(group: FilterGroup): Array<string> {
    return getGroupSelection(selection, group);
  }

  /**
   * Заменяет выбор группы целиком, например через «Выбрать все».
   * @param group - группа фильтра
   * @param keys - выбранные ключи
   */
  function setGroup(group: FilterGroup, keys: Array<string>): void {
    emit('update:selection', setGroupSelection(selection, group, keys));
  }

  /**
   * Отмечает значение группы или снимает отметку.
   * @param group - группа фильтра
   * @param key - ключ значения
   */
  function toggle(group: FilterGroup, key: string): void {
    setGroup(group, xor(getSelected(group), [key]));
  }

  function reset(): void {
    emit('reset');
  }

  // Новая панель открывается без старого поиска
  watch(isOpen, (value) => {
    if (!value) {
      search.value = '';
    }
  });
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="title"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UInput
          v-model="search"
          :icon="SECTION_ICON.search"
          :placeholder="searchPlaceholder"
          :aria-label="searchLabel"
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

        <SectionFilterCard
          v-for="match in matches"
          :key="match.group.key"
          :group="match.group"
          :values="match.values"
          :selected="getSelected(match.group)"
          @toggle="toggle(match.group, $event)"
          @update:selected="setGroup(match.group, $event)"
        />
      </div>
    </template>

    <template #footer>
      <UButton
        :icon="SECTION_ICON.reset"
        :label="SECTION_TEXT.reset"
        :disabled="!isCustomized"
        color="neutral"
        variant="subtle"
        block
        @click.left.exact.prevent="reset"
      />
    </template>
  </USlideover>
</template>
