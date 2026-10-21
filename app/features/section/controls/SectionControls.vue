<script setup lang="ts">
  import type { FilterDefinition, FilterSelection } from '../model';

  import { SectionFilterDrawer } from '../filter-drawer';
  import { SECTION_ICON, SECTION_TEXT } from '../model';

  /** Поиск, кнопка фильтра и сброс фильтра над списком раздела. */
  const {
    definition = undefined,
    selection,
    isCustomized = false,
  } = defineProps<{
    definition?: FilterDefinition | null;
    selection: FilterSelection;
    isCustomized?: boolean;
  }>();

  const emit = defineEmits<{
    'update:selection': [selection: FilterSelection];
    'reset': [];
  }>();

  const search = defineModel<string>('search', { required: true });

  const isFilterOpen = ref(false);
</script>

<template>
  <div class="flex gap-2">
    <UInput
      v-model="search"
      :icon="SECTION_ICON.search"
      :placeholder="SECTION_TEXT.searchPlaceholder"
      :aria-label="SECTION_TEXT.searchLabel"
      type="search"
      autocomplete="off"
      class="flex-auto"
    />

    <template v-if="definition">
      <UChip
        :show="isCustomized"
        inset
      >
        <UButton
          :icon="SECTION_ICON.filter"
          :aria-label="SECTION_TEXT.filter"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="isFilterOpen = true"
        />
      </UChip>

      <UButton
        v-if="isCustomized"
        :icon="SECTION_ICON.reset"
        :aria-label="SECTION_TEXT.reset"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="emit('reset')"
      />

      <SectionFilterDrawer
        v-model:open="isFilterOpen"
        :definition="definition"
        :selection="selection"
        :is-customized="isCustomized"
        @update:selection="emit('update:selection', $event)"
        @reset="emit('reset')"
      />
    </template>
  </div>
</template>
