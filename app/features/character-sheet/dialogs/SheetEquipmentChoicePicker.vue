<script setup lang="ts">
  import type { StartingEquipmentCategory } from '~character/model';

  import type { CatalogOption } from '../model';

  import {
    fetchEquipmentChoiceOptions,
    STARTING_EQUIPMENT_TEXT,
  } from '../model';

  /**
   * Выбор предмета для позиции стартового снаряжения «на выбор»: записи
   * справочника из категории грузятся при первом открытии списка.
   */
  const { category, label } = defineProps<{
    category: StartingEquipmentCategory;
    /** Подпись позиции: «Воинское оружие». */
    label: string;
  }>();

  const pick = defineModel<CatalogOption | undefined>({ default: undefined });

  const options = shallowRef<Array<CatalogOption>>([]);
  const isLoading = ref(false);
  const isLoaded = ref(false);

  /** Грузит записи категории один раз. */
  async function load(): Promise<void> {
    if (isLoaded.value || isLoading.value) {
      return;
    }

    isLoading.value = true;

    try {
      options.value = await fetchEquipmentChoiceOptions(category);
      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Список открыт: пора грузить записи.
   * @param open - открыт ли список
   */
  function handleOpen(open: boolean): void {
    if (open) {
      void load();
    }
  }

  /**
   * Ставит выбранную запись.
   * @param option - запись справочника
   */
  function choose(option: CatalogOption | undefined): void {
    pick.value = option;
  }
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-xs text-muted">{{ label }}</span>

    <USelectMenu
      :model-value="pick"
      :items="options"
      :loading="isLoading"
      :placeholder="STARTING_EQUIPMENT_TEXT.choicePlaceholder"
      label-key="name"
      description-key="caption"
      by="url"
      size="sm"
      class="w-full"
      @update:open="handleOpen"
      @update:model-value="choose"
    >
      <template #empty>
        {{ STARTING_EQUIPMENT_TEXT.choiceEmpty }}
      </template>
    </USelectMenu>
  </div>
</template>
