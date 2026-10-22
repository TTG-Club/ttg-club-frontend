<script setup lang="ts">
  import type { FilterDefinition, FilterPart, FilterSelection } from '../model';

  import { SectionFilterDrawer } from '../filter-drawer';
  import { isPartCustomized, SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Поиск и две кнопки над списком раздела, как на старом сайте:
   * фильтр по содержимому и источники открывают каждая свою панель.
   */
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
    /** Сброс одной части фильтра или, без неё, всего фильтра. */
    'reset': [part?: FilterPart];
  }>();

  const search = defineModel<string>('search', { required: true });

  const isDrawerOpen = ref(false);

  // Часть остаётся после закрытия, чтобы панель не менялась на анимации
  const drawerPart = ref<FilterPart>('other');

  const hasOther = computed(
    () => !!definition?.other.some((group) => !group.hidden),
  );

  const hasSources = computed(
    () => !!definition?.sources.some((group) => !group.hidden),
  );

  const isOtherCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'other'),
  );

  const isSourcesCustomized = computed(
    () => !!definition && isPartCustomized(definition, selection, 'sources'),
  );

  const isDrawerPartCustomized = computed(() =>
    drawerPart.value === 'sources'
      ? isSourcesCustomized.value
      : isOtherCustomized.value,
  );

  /**
   * Открывает панель части фильтра.
   * @param part - источники или условия по содержимому
   */
  function openDrawer(part: FilterPart) {
    drawerPart.value = part;
    isDrawerOpen.value = true;
  }

  function openFilter() {
    openDrawer('other');
  }

  function openSources() {
    openDrawer('sources');
  }

  function resetAll() {
    emit('reset');
  }
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
      <UTooltip
        v-if="hasOther"
        :text="SECTION_TEXT.filter"
      >
        <UChip
          :show="isOtherCustomized"
          inset
        >
          <UButton
            :icon="SECTION_ICON.filter"
            :aria-label="SECTION_TEXT.filter"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="openFilter"
          />
        </UChip>
      </UTooltip>

      <UTooltip
        v-if="hasSources"
        :text="SECTION_TEXT.sources"
      >
        <UChip
          :show="isSourcesCustomized"
          inset
        >
          <UButton
            :icon="SECTION_ICON.sources"
            :aria-label="SECTION_TEXT.sources"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="openSources"
          />
        </UChip>
      </UTooltip>

      <UTooltip
        v-if="isCustomized"
        :text="SECTION_TEXT.resetAll"
      >
        <UButton
          :icon="SECTION_ICON.reset"
          :aria-label="SECTION_TEXT.resetAll"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="resetAll"
        />
      </UTooltip>

      <SectionFilterDrawer
        v-model:open="isDrawerOpen"
        :part="drawerPart"
        :definition="definition"
        :selection="selection"
        :is-customized="isDrawerPartCustomized"
        @update:selection="emit('update:selection', $event)"
        @reset="emit('reset', drawerPart)"
      />
    </template>
  </div>
</template>
