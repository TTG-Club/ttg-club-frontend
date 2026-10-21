<script setup lang="ts">
  import type {
    FilterDefinition,
    FilterGroup,
    FilterSelection,
  } from '../model';

  import {
    getGroupSelection,
    SECTION_ICON,
    SECTION_TEXT,
    setGroupSelection,
  } from '../model';

  /** Панель фильтра: группы значений чекбоксами, источники отдельно. */
  const {
    definition,
    selection,
    isCustomized = false,
  } = defineProps<{
    definition: FilterDefinition;
    selection: FilterSelection;
    isCustomized?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    'reset': [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const sources = computed(() =>
    definition.sources.filter((group) => !group.hidden),
  );

  const other = computed(() =>
    definition.other.filter((group) => !group.hidden),
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
    :title="SECTION_TEXT.filterTitle"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <section
          v-if="sources.length"
          class="flex flex-col gap-4"
        >
          <h3 class="font-semibold text-highlighted">
            {{ SECTION_TEXT.sources }}
          </h3>

          <UCheckboxGroup
            v-for="group in sources"
            :key="group.key"
            :legend="group.name"
            :items="getItems(group)"
            :model-value="getValue(group)"
            @update:model-value="update(group, $event)"
          />
        </section>

        <UCheckboxGroup
          v-for="group in other"
          :key="group.key"
          :legend="group.name"
          :items="getItems(group)"
          :model-value="getValue(group)"
          orientation="horizontal"
          :ui="{ fieldset: 'flex-wrap gap-x-4 gap-y-2' }"
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
