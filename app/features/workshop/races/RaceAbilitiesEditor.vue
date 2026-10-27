<script setup lang="ts">
  import type { RaceAbility } from '../model';

  import { WorkshopListSection } from '../form';
  import {
    createRaceAbility,
    RACE_ABILITIES_TEXT,
    RACE_ABILITY_OPTIONS,
    RACE_LIST_ICON,
  } from '../model';

  /** Бонусы характеристик расы. */
  const abilities = defineModel<Array<RaceAbility>>({ required: true });

  const abilityItems = [...RACE_ABILITY_OPTIONS];

  /**
   * Заменяет бонус по номеру.
   * @param abilityIndex - номер бонуса
   * @param update - новые поля бонуса
   */
  function patchAbility(
    abilityIndex: number,
    update: Partial<RaceAbility>,
  ): void {
    abilities.value = abilities.value.map((ability, index) =>
      index === abilityIndex ? { ...ability, ...update } : ability,
    );
  }

  function addAbility(): void {
    abilities.value = [...abilities.value, createRaceAbility()];
  }

  /**
   * Удаляет бонус.
   * @param abilityIndex - номер бонуса
   */
  function removeAbility(abilityIndex: number): void {
    abilities.value = abilities.value.filter(
      (_, index) => index !== abilityIndex,
    );
  }

  /**
   * Меняет характеристику бонуса.
   * @param abilityIndex - номер бонуса
   * @param ability - код характеристики
   */
  function changeAbility(abilityIndex: number, ability: string): void {
    patchAbility(abilityIndex, { ability });
  }

  /**
   * Меняет размер бонуса.
   * @param abilityIndex - номер бонуса
   * @param bonus - размер бонуса
   */
  function changeBonus(abilityIndex: number, bonus: number | null): void {
    patchAbility(abilityIndex, { bonus });
  }

  /**
   * Имя поля бонуса: по нему форма показывает ошибку проверки.
   * @param abilityIndex - номер бонуса
   */
  function getBonusFieldName(abilityIndex: number): string {
    return `abilities.${abilityIndex}.bonus`;
  }
</script>

<template>
  <WorkshopListSection
    :title="RACE_ABILITIES_TEXT.title"
    :add-label="RACE_ABILITIES_TEXT.add"
    :add-icon="RACE_LIST_ICON.add"
    :is-empty="!abilities.length"
    :empty-text="RACE_ABILITIES_TEXT.empty"
    @add="addAbility"
  >
    <div
      v-for="(ability, abilityIndex) in abilities"
      :key="abilityIndex"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField
        :label="RACE_ABILITIES_TEXT.ability"
        class="min-w-48 flex-1"
      >
        <USelect
          :model-value="ability.ability"
          :items="abilityItems"
          class="w-full"
          @update:model-value="changeAbility(abilityIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="RACE_ABILITIES_TEXT.bonus"
        :name="getBonusFieldName(abilityIndex)"
        class="w-32"
      >
        <UInputNumber
          :model-value="ability.bonus"
          class="w-full"
          @update:model-value="changeBonus(abilityIndex, $event)"
        />
      </UFormField>

      <UButton
        :aria-label="RACE_ABILITIES_TEXT.remove"
        :icon="RACE_LIST_ICON.remove"
        color="neutral"
        variant="ghost"
        @click.left.exact.prevent="removeAbility(abilityIndex)"
      />
    </div>
  </WorkshopListSection>
</template>
