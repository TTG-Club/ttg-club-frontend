<script setup lang="ts">
  import type {
    FilterDefinition,
    FilterGroup,
    FilterPart,
    FilterSelection,
  } from '../model';

  import {
    getGroupSelection,
    SECTION_ICON,
    SECTION_TEXT,
    setGroupSelection,
  } from '../model';

  /**
   * Панель части фильтра: источники столбиком или условия по содержимому
   * в строку, значения чекбоксами.
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

  const groups = computed(() =>
    definition[part].filter((group) => !group.hidden),
  );

  const isSources = computed(() => part === 'sources');

  const title = computed(() =>
    isSources.value ? SECTION_TEXT.sources : SECTION_TEXT.filterTitle,
  );

  const orientation = computed(() =>
    isSources.value ? 'vertical' : 'horizontal',
  );

  const checkboxUi = computed(() =>
    isSources.value ? undefined : { fieldset: 'flex-wrap gap-x-4 gap-y-2' },
  );

  function getItems(group: FilterGroup) {
    return group.values.map((value) => ({
      label: value.label,
      value: String(value.key),
      description: value.tooltip,
    }));
  }

  function getValue(group: FilterGroup) {
    return getGroupSelection(selection, group);
  }

  function update(group: FilterGroup, keys: Array<string>) {
    emit('update:selection', setGroupSelection(selection, group, keys));
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="title"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <UCheckboxGroup
          v-for="group in groups"
          :key="group.key"
          :legend="group.name"
          :items="getItems(group)"
          :model-value="getValue(group)"
          :orientation="orientation"
          :ui="checkboxUi"
          @update:model-value="update(group, $event)"
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
        @click.left.exact.prevent="emit('reset')"
      />
    </template>
  </USlideover>
</template>
