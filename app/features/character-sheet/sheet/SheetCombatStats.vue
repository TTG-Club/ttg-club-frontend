<script setup lang="ts">
  import { useCharacterSheet, useSheetRoll } from '../composables';
  import {
    formatModifier,
    getArmorClass,
    getCalculatedArmorClass,
    getCharacterLevel,
    getInitiativeBonus,
    getPassivePerception,
    getProficiencyBonus,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';
  import SheetStatTile from './SheetStatTile.vue';

  /**
   * Боевые показатели: КД, инициатива, скорость, бонус мастерства и
   * пассивная Внимательность. КД и скорость правятся во всплывающем окне.
   */
  const { document, update } = useCharacterSheet();
  const { rollD20 } = useSheetRoll();

  const isArmorOpen = ref(false);
  const isSpeedOpen = ref(false);

  const proficiencyBonus = computed(() =>
    getProficiencyBonus(getCharacterLevel(document.value.classes)),
  );

  const armorClass = computed(() => getArmorClass(document.value));

  const calculatedArmorClass = computed(() =>
    getCalculatedArmorClass(document.value),
  );

  const isArmorAuto = computed(
    () => document.value.armorClassOverride === null,
  );

  const initiative = computed(() => getInitiativeBonus(document.value));

  const initiativeLabel = computed(() => formatModifier(initiative.value));

  const proficiencyLabel = computed(() =>
    formatModifier(proficiencyBonus.value),
  );

  const speedLabel = computed(
    () => `${document.value.speed} ${SHEET_LABELS.speedUnit}`,
  );

  const darkvisionHint = computed(() =>
    document.value.darkvision
      ? `${SHEET_LABELS.darkvision} ${document.value.darkvision} ${SHEET_LABELS.speedUnit}`
      : '',
  );

  const passivePerception = computed(() =>
    getPassivePerception(document.value, proficiencyBonus.value),
  );

  /**
   * Переключает КД между расчётом по снаряжению и своим значением.
   * @param isAuto - считать по снаряжению
   */
  function setArmorAuto(isAuto: boolean | 'indeterminate'): void {
    update((current) => ({
      ...current,
      armorClassOverride: isAuto === true ? null : calculatedArmorClass.value,
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
   * Бонус к КД сверх снаряжения: кольцо защиты, боевой стиль.
   * @param value - бонус
   */
  function setArmorBonus(value: number | null): void {
    update((current) => ({ ...current, armorClassBonus: value ?? 0 }));
  }

  /**
   * Свой бонус инициативы.
   * @param value - бонус
   */
  function setInitiativeBonus(value: number | null): void {
    update((current) => ({ ...current, initiativeBonus: value ?? 0 }));
  }

  /**
   * Скорость ходьбы.
   * @param value - скорость в футах
   */
  function setSpeed(value: number | null): void {
    update((current) => ({ ...current, speed: Math.max(0, value ?? 0) }));
  }

  /**
   * Тёмное зрение.
   * @param value - дальность в футах
   */
  function setDarkvision(value: number | null): void {
    update((current) => ({ ...current, darkvision: Math.max(0, value ?? 0) }));
  }

  function openArmor(): void {
    isArmorOpen.value = true;
  }

  function openSpeed(): void {
    isSpeedOpen.value = true;
  }

  function rollInitiative(): void {
    rollD20(SHEET_LABELS.initiative, initiative.value);
  }
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
    <UPopover v-model:open="isArmorOpen">
      <SheetStatTile
        :label="SHEET_LABELS.armorClass"
        :value="armorClass"
        :icon="SHEET_ICON.shield"
        is-interactive
        @activate="openArmor"
      />

      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
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
              :model-value="document.armorClassOverride ?? armorClass"
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
        </div>
      </template>
    </UPopover>

    <SheetStatTile
      :label="SHEET_LABELS.initiative"
      :value="initiativeLabel"
      :icon="SHEET_ICON.initiative"
      is-interactive
      @activate="rollInitiative"
    />

    <UPopover v-model:open="isSpeedOpen">
      <SheetStatTile
        :label="SHEET_LABELS.speed"
        :value="speedLabel"
        :hint="darkvisionHint"
        :icon="SHEET_ICON.speed"
        is-interactive
        @activate="openSpeed"
      />

      <template #content>
        <div class="flex w-64 flex-col gap-3 p-3">
          <UFormField :label="SHEET_LABELS.speed">
            <UInputNumber
              :model-value="document.speed"
              :min="0"
              :step="5"
              class="w-full"
              @update:model-value="setSpeed"
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
    </UPopover>

    <SheetStatTile
      :label="SHEET_LABELS.proficiencyBonus"
      :value="proficiencyLabel"
    />

    <SheetStatTile
      :label="SHEET_LABELS.passivePerception"
      :value="passivePerception"
    />
  </div>
</template>
