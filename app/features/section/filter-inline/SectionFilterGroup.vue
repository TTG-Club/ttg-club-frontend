<script setup lang="ts">
  import type { FilterGroup, FilterValue } from '../model';

  import { SECTION_ICON } from '../model';

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
    toggle: [key: string];
  }>();

  const selectedCount = computed(() => selected.length);

  const hasSelection = computed(() => selectedCount.value > 0);

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
   * Вид метки: выбранная залита.
   * @param value - значение фильтра
   */
  function getVariant(value: FilterValue) {
    return selected.includes(String(value.key)) ? 'solid' : 'subtle';
  }

  /**
   * Цвет метки: выбранная — акцентная.
   * @param value - значение фильтра
   */
  function getColor(value: FilterValue) {
    return selected.includes(String(value.key)) ? 'primary' : 'neutral';
  }

  /**
   * Отмечает значение или снимает отметку.
   * @param value - значение фильтра
   */
  function toggle(value: FilterValue): void {
    emit('toggle', String(value.key));
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
      <span class="min-w-0 truncate text-left font-medium">
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
      <div class="flex flex-wrap gap-2 pt-1 pb-3">
        <UTooltip
          v-for="value in values"
          :key="value.key"
          :text="value.tooltip"
          :disabled="!value.tooltip"
        >
          <UBadge
            :label="value.label"
            :variant="getVariant(value)"
            :color="getColor(value)"
            :aria-pressed="selected.includes(String(value.key))"
            role="button"
            tabindex="0"
            class="max-w-full min-w-8 cursor-pointer justify-center select-none hover:brightness-95"
            @click.left.exact.prevent="toggle(value)"
            @keydown.enter.prevent="toggle(value)"
            @keydown.space.prevent="toggle(value)"
          />
        </UTooltip>
      </div>
    </template>
  </UCollapsible>
</template>
