<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { clamp } from 'es-toolkit';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    ABILITY_EFFECT_KEYS,
    ABILITY_KEYS,
    ABILITY_LABELS,
    ABILITY_SCORE,
    getAbilityModifier,
    SHEET_LABELS,
  } from '../model';
  import SheetAbilityTile from './SheetAbilityTile.vue';

  /**
   * Ряд характеристик: шесть плиток в строку (на узком — по три), клик —
   * проверка с преимуществом или помехой от эффектов, ± — быстрая правка
   * записанного значения, шестерёнка — точный ввод.
   */
  const { document, update, ensureEditable } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  const editedAbility = ref<AbilityKey | null>(null);

  const isEditOpen = computed({
    get: () => editedAbility.value !== null,
    set: (open: boolean) => {
      if (!open) {
        editedAbility.value = null;
      }
    },
  });

  const editTitle = computed(() =>
    editedAbility.value
      ? ABILITY_LABELS[editedAbility.value].name
      : SHEET_LABELS.abilities,
  );

  /** Откуда прибавка к характеристике: источники механики. */
  const hints = computed(() =>
    Object.fromEntries(
      ABILITY_KEYS.map((key) => [
        key,
        document.value.sources
          .filter((source) => source.abilityIncreases[key])
          .map((source) => `${source.name} +${source.abilityIncreases[key]}`)
          .join(', '),
      ]),
    ),
  );

  /**
   * Меняет записанное значение.
   * @param key - характеристика
   * @param value - новое значение
   */
  function setScore(key: AbilityKey, value: number | null): void {
    if (value === null) {
      return;
    }

    update((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [key]: clamp(value, ABILITY_SCORE.min, ABILITY_SCORE.max),
      },
    }));
  }

  /**
   * Быстрая правка ±.
   * @param key - характеристика
   * @param delta - на сколько
   */
  function adjust(key: AbilityKey, delta: number): void {
    if (!ensureEditable()) {
      return;
    }

    setScore(key, document.value.abilities[key] + delta);
  }

  /**
   * Проверка характеристики.
   * @param key - характеристика
   * @param event - клик
   */
  function rollCheck(key: AbilityKey, event: MouseEvent): void {
    rollD20(
      ABILITY_LABELS[key].name,
      getAbilityModifier(stats.value.abilities[key]),
      event,
      { kind: 'abilityCheck', ability: ABILITY_EFFECT_KEYS[key] },
    );
  }

  /**
   * Открывает точную правку.
   * @param key - характеристика
   */
  function openEdit(key: AbilityKey): void {
    if (!ensureEditable()) {
      return;
    }

    editedAbility.value = key;
  }

  /**
   * Значение из поля точной правки.
   * @param value - новое значение
   */
  function setEditedScore(value: number | null): void {
    if (editedAbility.value) {
      setScore(editedAbility.value, value);
    }
  }
</script>

<template>
  <div class="@container">
    <div class="grid grid-cols-3 gap-3 pb-2 @xl:grid-cols-6">
      <SheetAbilityTile
        v-for="key in ABILITY_KEYS"
        :key="key"
        :ability-key="key"
        :score="stats.abilities[key]"
        :base-score="document.abilities[key]"
        :hint="hints[key]"
        @roll="rollCheck(key, $event)"
        @settings="openEdit(key)"
        @adjust="adjust(key, $event)"
      />
    </div>

    <UModal
      v-model:open="isEditOpen"
      :title="editTitle"
      :ui="{ content: 'max-w-xs' }"
    >
      <template #body>
        <UInputNumber
          v-if="editedAbility"
          :model-value="document.abilities[editedAbility]"
          :min="ABILITY_SCORE.min"
          :max="ABILITY_SCORE.max"
          class="w-full"
          @update:model-value="setEditedScore"
        />
      </template>
    </UModal>
  </div>
</template>
