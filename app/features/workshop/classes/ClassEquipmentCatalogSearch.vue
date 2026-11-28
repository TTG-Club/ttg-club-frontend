<script setup lang="ts">
  import type {
    CatalogOption,
    CatalogSearchSource,
  } from '~character-sheet/model';
  import type { StartingEquipmentSection } from '~character/model';

  import { useCatalogSearch } from '~character-sheet/composables';
  import {
    ARMOR_SEARCH,
    ITEM_SEARCH,
    WEAPON_SEARCH,
  } from '~character-sheet/model';

  import { STARTING_EQUIPMENT_EDITOR_TEXT } from '../model';

  /**
   * Поиск записи справочника для позиции стартового снаряжения: по разделу
   * оружия, доспехов или снаряжения, тем же запросом, что и в листе.
   */
  const { section, url, name } = defineProps<{
    section: StartingEquipmentSection;
    /** Адрес выбранной записи; null — ещё не выбрана. */
    url: string | null;
    name: string;
  }>();

  const emit = defineEmits<{
    pick: [option: CatalogOption];
  }>();

  const searchSource = computed<CatalogSearchSource>(() => {
    if (section === 'WEAPON') {
      return WEAPON_SEARCH;
    }

    return section === 'ARMOR' ? ARMOR_SEARCH : ITEM_SEARCH;
  });

  const { searchTerm, options, isLoading } = useCatalogSearch(searchSource);

  /** Выбранная запись: её нет среди найденного, пока поиск не набран. */
  const selected = computed<CatalogOption | undefined>(() =>
    url ? { name, url, caption: '' } : undefined,
  );

  const items = computed<Array<CatalogOption>>(() => {
    const current = selected.value;

    if (
      !current
      || options.value.some((option) => option.url === current.url)
    ) {
      return options.value;
    }

    return [current, ...options.value];
  });

  /**
   * Отдаёт выбранную запись.
   * @param option - запись справочника
   */
  function pick(option: CatalogOption | undefined): void {
    if (option) {
      emit('pick', option);
    }
  }
</script>

<template>
  <USelectMenu
    v-model:search-term="searchTerm"
    :model-value="selected"
    :items="items"
    :loading="isLoading"
    :placeholder="STARTING_EQUIPMENT_EDITOR_TEXT.searchPlaceholder"
    :search-input="{
      placeholder: STARTING_EQUIPMENT_EDITOR_TEXT.searchPlaceholder,
    }"
    label-key="name"
    description-key="caption"
    by="url"
    class="w-full"
    ignore-filter
    @update:model-value="pick"
  >
    <template #empty>
      {{ STARTING_EQUIPMENT_EDITOR_TEXT.nothingFound }}
    </template>
  </USelectMenu>
</template>
