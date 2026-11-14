<script setup lang="ts">
  import type {
    FilterGroup,
    FilterSelection,
    SourceGroupEntries,
  } from '../model';

  import { useSourceCatalog } from '../composables';
  import {
    applySourcePreset,
    countSources,
    FILTER_DRAWER_SIDE,
    FILTER_DRAWER_UI,
    FILTER_SEARCH_DEBOUNCE_MS,
    getGroupSelection,
    getSourceEntries,
    isSourcePresetActive,
    isSourcePresetAvailable,
    searchSourceEntries,
    SECTION_ICON,
    SECTION_TEXT,
    setGroupSelection,
    setSourcesSelected,
    SOURCE_PRESETS,
  } from '../model';
  import { SectionSourceGroup } from './ui';

  /**
   * Цвет кнопки быстрого набора: совпавший с выбором подсвечен.
   * @param isActive - совпадает ли набор с выбором
   */
  function getPresetColor(isActive: boolean): 'primary' | 'neutral' {
    return isActive ? 'primary' : 'neutral';
  }

  /**
   * Панель источников, как на new.ttg.club: выезжает слева, книги строками
   * с русским и английским названием и сокращением, группы сворачиваются,
   * над списком быстрые наборы и одна кнопка «Выбрать все / Снять все».
   * Выбор применяется сразу, как и в панели фильтра.
   */
  const {
    groups,
    selection,
    isCustomized = false,
  } = defineProps<{
    /** Видимые группы источников. */
    groups: Array<FilterGroup>;
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

  // Очистка поля возвращает список сразу, без задержки
  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const isSearching = computed(() => !!appliedSearch.value);

  const { englishNames, load } = useSourceCatalog();

  // Поиск — способ пройти по списку, а не часть выбора: при новом открытии
  // забытый запрос прятал бы часть книг без видимой причины
  watch(isOpen, (value) => {
    if (value) {
      load();
    } else {
      search.value = '';
    }
  });

  // При открытии раскрыты группы, где что-то выбрано; если не выбрано
  // ничего — все, иначе панель встретила бы одними заголовками
  const hasAnySelected = computed(
    () => countSources(groups, selection).selected > 0,
  );

  /**
   * Выбранные ключи группы.
   * @param group - группа источников
   */
  function getSelected(group: FilterGroup): Array<string> {
    return getGroupSelection(selection, group);
  }

  const visibleGroups = computed<Array<SourceGroupEntries>>(() =>
    groups
      .map((group) => ({
        group,
        isOpenByDefault: !hasAnySelected.value || !!getSelected(group).length,
        entries: searchSourceEntries(
          group,
          getSourceEntries(group, getSelected(group), englishNames.value),
          appliedSearch.value,
        ),
      }))
      .filter((visibleGroup) => visibleGroup.entries.length > 0),
  );

  const isEmpty = computed(() => !visibleGroups.value.length);

  const summary = computed(() => {
    const { selected, total } = countSources(groups, selection);

    return `${SECTION_TEXT.sourcesSelected} ${selected} ${SECTION_TEXT.sourcesOf} ${total}`;
  });

  // Наборы, для которых в разделе есть все группы; совпавший с выбором
  // подсвечен
  const presets = computed(() =>
    SOURCE_PRESETS.filter((preset) =>
      isSourcePresetAvailable(groups, preset.keys),
    ).map((preset) => ({
      ...preset,
      color: getPresetColor(
        isSourcePresetActive(groups, selection, preset.keys),
      ),
    })),
  );

  /**
   * Применяет быстрый набор: его группы выбраны целиком, остальные сняты.
   * @param keys - ключи групп набора
   */
  function applyPreset(keys: ReadonlyArray<string>): void {
    emit('update:selection', applySourcePreset(groups, selection, keys));
  }

  /** Выбрано ли всё показанное: тогда кнопка снимает отметки. */
  const isAllVisibleSelected = computed(
    () =>
      !isEmpty.value
      && visibleGroups.value.every((visibleGroup) =>
        visibleGroup.entries.every((entry) => entry.selected),
      ),
  );

  const toggleAllLabel = computed(() =>
    isAllVisibleSelected.value ? SECTION_TEXT.clearAll : SECTION_TEXT.selectAll,
  );

  const toggleAllIcon = computed(() =>
    isAllVisibleSelected.value ? SECTION_ICON.clearAll : SECTION_ICON.selectAll,
  );

  /**
   * Одна кнопка на оба действия: отмечает все показанные книги, а когда
   * отмечены уже все — снимает. Под поиском это только найденное.
   */
  function toggleAllVisible(): void {
    const isSelected = !isAllVisibleSelected.value;

    emit(
      'update:selection',
      visibleGroups.value.reduce(
        (next, { group, entries }) =>
          setGroupSelection(
            next,
            group,
            setSourcesSelected(
              getGroupSelection(next, group),
              entries.map((entry) => entry.key),
              isSelected,
            ),
          ),
        selection,
      ),
    );
  }

  /**
   * Заменяет выбор одной группы.
   * @param group - группа источников
   * @param keys - выбранные ключи группы
   */
  function setGroup(group: FilterGroup, keys: Array<string>): void {
    emit('update:selection', setGroupSelection(selection, group, keys));
  }

  /** Возвращает источники к выбору по умолчанию. */
  function reset(): void {
    emit('reset');
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="SECTION_TEXT.sources"
    :description="summary"
    :side="FILTER_DRAWER_SIDE"
    :ui="FILTER_DRAWER_UI"
  >
    <template #body>
      <!-- Блок растянут на отступы прокручиваемого тела во все стороны, -->
      <!-- чтобы список не просвечивал над прилипшим полем и по бокам. -->
      <div
        class="sticky -top-4 z-10 -mx-4 -mt-4 flex flex-wrap items-center gap-2 bg-default px-4 pt-4 pb-6 sm:-top-6 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6"
      >
        <UInput
          v-model="search"
          :icon="SECTION_ICON.search"
          :placeholder="SECTION_TEXT.sourceSearch"
          :aria-label="SECTION_TEXT.sourceSearchLabel"
          type="search"
          autocomplete="off"
          class="basis-full"
        />

        <!-- Наборы действуют на весь список, поэтому под поиском их нет: -->
        <!-- кнопка сняла бы отметки с книг, которых не видно. -->
        <template v-if="!isSearching">
          <UButton
            v-for="preset in presets"
            :key="preset.id"
            :label="preset.label"
            :color="preset.color"
            variant="subtle"
            size="sm"
            @click.left.exact.prevent="applyPreset(preset.keys)"
          />
        </template>

        <UButton
          :label="toggleAllLabel"
          :icon="toggleAllIcon"
          color="neutral"
          variant="subtle"
          size="sm"
          :disabled="isEmpty"
          @click.left.exact.prevent="toggleAllVisible"
        />
      </div>

      <p
        v-if="isEmpty"
        class="py-2 text-sm text-muted"
      >
        {{ SECTION_TEXT.empty }}
      </p>

      <div
        v-else
        class="flex flex-col gap-5"
      >
        <SectionSourceGroup
          v-for="visibleGroup in visibleGroups"
          :key="visibleGroup.group.key"
          :group="visibleGroup.group"
          :entries="visibleGroup.entries"
          :selected="getSelected(visibleGroup.group)"
          :is-open-by-default="visibleGroup.isOpenByDefault"
          :is-expanded="isSearching"
          @update:selected="setGroup(visibleGroup.group, $event)"
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
