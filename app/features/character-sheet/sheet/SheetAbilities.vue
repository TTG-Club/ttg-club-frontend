<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { useCharacterSheet, useSheetRoll } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    ABILITY_SCORE,
    formatModifier,
    getAbilityModifier,
    getCharacterLevel,
    getProficiencyBonus,
    getSavingThrowBonus,
    SHEET_LABELS,
  } from '../model';

  /**
   * Характеристики: значение, модификатор и спасбросок каждой. Клик по
   * модификатору — проверка, по спасброску — спасбросок.
   */
  const { document, update } = useCharacterSheet();
  const { rollD20 } = useSheetRoll();

  const proficiencyBonus = computed(() =>
    getProficiencyBonus(getCharacterLevel(document.value.classes)),
  );

  const rows = computed(() =>
    ABILITY_KEYS.map((key) => {
      const score = document.value.abilities[key];
      const modifier = getAbilityModifier(score);

      const save = getSavingThrowBonus(
        document.value,
        key,
        proficiencyBonus.value,
      );

      return {
        key,
        label: ABILITY_LABELS[key],
        score,
        modifier,
        modifierLabel: formatModifier(modifier),
        save,
        saveLabel: formatModifier(save),
        isProficient: document.value.savingThrows.includes(key),
        racialBonus: document.value.raceAbilityBonuses[key] ?? 0,
      };
    }),
  );

  /**
   * Меняет значение характеристики.
   * @param key - характеристика
   * @param value - новое значение
   */
  function setScore(key: AbilityKey, value: number | null): void {
    if (value === null) {
      return;
    }

    update((current) => ({
      ...current,
      abilities: { ...current.abilities, [key]: value },
    }));
  }

  /**
   * Включает или снимает владение спасброском.
   * @param key - характеристика
   */
  function toggleSavingThrow(key: AbilityKey): void {
    update((current) => ({
      ...current,
      savingThrows: current.savingThrows.includes(key)
        ? current.savingThrows.filter((ability) => ability !== key)
        : [...current.savingThrows, key],
    }));
  }

  /**
   * Проверка характеристики.
   * @param key - характеристика
   * @param event - клик
   */
  function rollCheck(key: AbilityKey, event: MouseEvent): void {
    rollD20(
      ABILITY_LABELS[key].name,
      getAbilityModifier(document.value.abilities[key]),
      event,
    );
  }

  /**
   * Спасбросок.
   * @param key - характеристика
   * @param event - клик
   */
  function rollSave(key: AbilityKey, event: MouseEvent): void {
    rollD20(
      `${SHEET_LABELS.savingThrow}: ${ABILITY_LABELS[key].name}`,
      getSavingThrowBonus(document.value, key, proficiencyBonus.value),
      event,
    );
  }
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
    <div
      v-for="row in rows"
      :key="row.key"
      class="flex flex-col items-center gap-1 rounded-xl border border-default bg-elevated/40 p-2"
    >
      <span class="text-xs tracking-wide text-muted uppercase">
        {{ row.label.name }}
      </span>

      <button
        type="button"
        class="rounded-md px-2 text-3xl leading-tight font-semibold text-highlighted hover:text-primary"
        @click.left.prevent="rollCheck(row.key, $event)"
      >
        {{ row.modifierLabel }}
      </button>

      <UInputNumber
        :model-value="row.score"
        :min="ABILITY_SCORE.min"
        :max="ABILITY_SCORE.max"
        size="xs"
        class="w-20"
        :ui="{ base: 'text-center' }"
        @update:model-value="setScore(row.key, $event)"
      />

      <div
        class="mt-1 flex w-full items-center justify-between gap-1 border-t border-default pt-1"
      >
        <UCheckbox
          :model-value="row.isProficient"
          :aria-label="SHEET_LABELS.savingThrowsHint"
          size="sm"
          @update:model-value="toggleSavingThrow(row.key)"
        />

        <button
          type="button"
          class="text-sm text-default hover:text-primary"
          :title="SHEET_LABELS.savingThrows"
          @click.left.prevent="rollSave(row.key, $event)"
        >
          {{ SHEET_LABELS.savingThrowShort }} {{ row.saveLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
