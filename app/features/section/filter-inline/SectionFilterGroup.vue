<script setup lang="ts">
  import type { FilterGroup, FilterValue } from '../model';

  import { getSelectAllState, SECTION_ICON, SECTION_TEXT } from '../model';
  import SectionFilterValues from './SectionFilterValues.vue';

  /**
   * Группа фильтра в левой колонке, как на new.ttg.club: строка-заголовок с
   * линией до стрелки и значения метками под ней. Группа с выбором раскрыта
   * сразу, во время поиска раскрыты все.
   */
  const {
    group,
    values,
    selected,
    isExpanded = false,
  } = defineProps<{
    group: FilterGroup;
    /** Значения, подошедшие под поиск по фильтрам. */
    values: Array<FilterValue>;
    /** Выбранные ключи группы. */
    selected: Array<string>;
    /** Держит группу раскрытой, например во время поиска. */
    isExpanded?: boolean;
  }>();

  const emit = defineEmits<{
    'toggle': [key: string];
    'update:selected': [keys: Array<string>];
  }>();

  const selectedCount = computed(() => selected.length);

  const hasSelection = computed(() => selectedCount.value > 0);

  const allKeys = computed(() =>
    group.values.map((value) => String(value.key)),
  );

  const allState = computed(() => getSelectAllState(allKeys.value, selected));

  // Снимок на момент появления группы: дальше её открывает сам пользователь
  const isOpenedByUser = ref(selected.length > 0);

  const isOpen = computed(() => isExpanded || isOpenedByUser.value);

  /**
   * Запоминает, раскрыл или свернул группу пользователь.
   * @param value - группа раскрыта
   */
  function setOpen(value: boolean): void {
    isOpenedByUser.value = value;
  }

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
  <UCollapsible
    :open="isOpen"
    class="flex flex-col"
    @update:open="setOpen"
  >
    <UButton
      :trailing-icon="SECTION_ICON.expand"
      color="neutral"
      variant="link"
      block
      class="group justify-between gap-2 px-0 text-default hover:text-highlighted"
      :ui="{
        trailingIcon:
          'transition-transform duration-200 group-data-[state=open]:rotate-180',
      }"
    >
      <span class="min-w-0 truncate text-left text-base">
        {{ group.name }}
      </span>

      <span class="min-w-3 grow border-t border-default" />

      <UBadge
        v-if="hasSelection"
        :label="selectedCount"
        variant="subtle"
        size="sm"
      />
    </UButton>

    <template #content>
      <div class="flex flex-col gap-3 pt-1 pb-4">
        <UCheckbox
          :model-value="allState"
          :label="SECTION_TEXT.selectAll"
          @update:model-value="setAll"
        />

        <SectionFilterValues
          :values="values"
          :selected="selected"
          @toggle="toggle"
        />
      </div>
    </template>
  </UCollapsible>
</template>
