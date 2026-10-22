<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { ABILITIES, ABILITY_CALC_TEXT, assignUnique } from '../model';

  /**
   * Значения бросков или стандартного набора, каждое со своей
   * характеристикой. Характеристика достаётся только одному значению;
   * уже назначенные отмечены точкой.
   */
  const { values, isDisabled = false } = defineProps<{
    values: ReadonlyArray<number | undefined>;
    isDisabled?: boolean;
  }>();

  const keys = defineModel<Array<AbilityKey | undefined>>({ required: true });

  const items = computed(() =>
    ABILITIES.map((ability) => ({
      label: ability.name,
      value: ability.key,
      chip: keys.value.includes(ability.key)
        ? { color: 'primary' as const }
        : undefined,
    })),
  );

  /**
   * Назначает характеристику значению.
   * @param index - ячейка
   * @param key - характеристика; пусто — снять
   */
  function assign(index: number, key: AbilityKey | null | undefined): void {
    keys.value = assignUnique(keys.value, index, key ?? undefined);
  }

  /**
   * Подпись значения в ячейке.
   * @param value - значение
   */
  function getValueLabel(value: number | undefined): string {
    return value === undefined ? ABILITY_CALC_TEXT.empty : String(value);
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <UFieldGroup
      v-for="(value, index) in values"
      :key="index"
      class="w-full"
    >
      <UBadge
        :label="getValueLabel(value)"
        color="neutral"
        variant="subtle"
        size="lg"
        class="w-12 shrink-0 justify-center"
      />

      <USelectMenu
        :model-value="keys[index]"
        :items="items"
        :placeholder="ABILITY_CALC_TEXT.bonusPlaceholder"
        :search-input="false"
        :disabled="isDisabled || value === undefined"
        value-key="value"
        clear
        class="w-full"
        @update:model-value="assign(index, $event)"
      />
    </UFieldGroup>
  </div>
</template>
