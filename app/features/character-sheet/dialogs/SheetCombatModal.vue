<script setup lang="ts">
  import type { ExtraSpeedKey } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    EXTRA_SPEED_KEYS,
    getCalculatedArmorClass,
    SHEET_LABELS,
    SPEED_LABELS,
  } from '../model';

  /**
   * Настройка боевых показателей: класс доспеха (по снаряжению или своё
   * значение, бонус), скорости, тёмное зрение и бонус инициативы. Значения
   * механики и эффектов считаются поверх этих.
   */
  const { section } = defineProps<{
    section: 'armor' | 'speed';
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const isArmorAuto = computed(
    () => document.value.armorClassOverride === null,
  );

  const title = computed(() =>
    section === 'armor' ? SHEET_LABELS.armorClassFull : SHEET_LABELS.speed,
  );

  /**
   * Переключает КД между расчётом и своим значением.
   * @param isAuto - считать по снаряжению
   */
  function setArmorAuto(isAuto: boolean | 'indeterminate'): void {
    update((current) => ({
      ...current,
      armorClassOverride:
        isAuto === true ? null : getCalculatedArmorClass(current),
    }));
  }

  /**
   * Своё значение КД.
   * @param value - КД
   */
  function setArmorOverride(value: number | null): void {
    update((current) => ({ ...current, armorClassOverride: value ?? 0 }));
  }

  /**
   * Свой бонус к КД.
   * @param value - бонус
   */
  function setArmorBonus(value: number | null): void {
    update((current) => ({ ...current, armorClassBonus: value ?? 0 }));
  }

  /**
   * Скорость ходьбы.
   * @param value - скорость в футах
   */
  function setSpeed(value: number | null): void {
    update((current) => ({ ...current, speed: Math.max(0, value ?? 0) }));
  }

  /**
   * Особая скорость, заданная вручную.
   * @param key - вид скорости
   * @param value - скорость в футах
   */
  function setExtraSpeed(key: ExtraSpeedKey, value: number | null): void {
    update((current) => ({
      ...current,
      speeds: { ...current.speeds, [key]: Math.max(0, value ?? 0) },
    }));
  }

  /**
   * Тёмное зрение.
   * @param value - дальность в футах
   */
  function setDarkvision(value: number | null): void {
    update((current) => ({ ...current, darkvision: Math.max(0, value ?? 0) }));
  }

  /**
   * Свой бонус инициативы.
   * @param value - бонус
   */
  function setInitiativeBonus(value: number | null): void {
    update((current) => ({ ...current, initiativeBonus: value ?? 0 }));
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-3' }"
  >
    <template #body>
      <template v-if="section === 'armor'">
        <p
          v-if="stats.armorClassSource"
          class="text-sm text-muted"
        >
          {{ stats.armorClassSource }}: {{ stats.armorClass }}
        </p>

        <UCheckbox
          :model-value="isArmorAuto"
          :label="SHEET_LABELS.armorClassAuto"
          @update:model-value="setArmorAuto"
        />

        <UFormField
          v-if="!isArmorAuto"
          :label="SHEET_LABELS.armorClassManual"
        >
          <UInputNumber
            :model-value="document.armorClassOverride ?? stats.armorClass"
            :min="0"
            class="w-full"
            @update:model-value="setArmorOverride"
          />
        </UFormField>

        <UFormField
          v-else
          :label="SHEET_LABELS.armorClassBonus"
        >
          <UInputNumber
            :model-value="document.armorClassBonus"
            class="w-full"
            @update:model-value="setArmorBonus"
          />
        </UFormField>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="SPEED_LABELS.walk">
            <UInputNumber
              :model-value="document.speed"
              :min="0"
              :step="5"
              class="w-full"
              @update:model-value="setSpeed"
            />
          </UFormField>

          <UFormField
            v-for="key in EXTRA_SPEED_KEYS"
            :key="key"
            :label="SPEED_LABELS[key]"
          >
            <UInputNumber
              :model-value="document.speeds[key]"
              :min="0"
              :step="5"
              class="w-full"
              @update:model-value="setExtraSpeed(key, $event)"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.darkvision">
            <UInputNumber
              :model-value="document.darkvision"
              :min="0"
              :step="5"
              class="w-full"
              @update:model-value="setDarkvision"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.initiativeBonus">
            <UInputNumber
              :model-value="document.initiativeBonus"
              class="w-full"
              @update:model-value="setInitiativeBonus"
            />
          </UFormField>
        </div>
      </template>
    </template>
  </UModal>
</template>
