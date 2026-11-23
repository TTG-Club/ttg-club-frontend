<script setup lang="ts">
  import type { AbilityBonusForm } from '../model';

  import {
    createAbilityBonusForm,
    MECHANICS_TEXT,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
  } from '../model';
  import MechanicsRow from './MechanicsRow.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Повышения характеристик: из каких выбирают, на сколько, до какого предела
   * и сколько характеристик. У расы строки складываются, у черты и
   * предыстории — это варианты «или».
   */
  const bonuses = defineModel<Array<AbilityBonusForm>>({ required: true });

  const abilityItems = [...WORKSHOP_ABILITY_OPTIONS];

  function add(): void {
    bonuses.value = [...bonuses.value, createAbilityBonusForm()];
  }

  /**
   * Убирает повышение.
   * @param index - номер строки
   */
  function remove(index: number): void {
    bonuses.value = bonuses.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.abilityBonuses"
    :hint="MECHANICS_TEXT.abilityBonusesHint"
    :count="bonuses.length"
    :add-label="MECHANICS_TEXT.add"
    @add="add"
  >
    <MechanicsRow
      v-for="(bonus, index) in bonuses"
      :key="index"
      @remove="remove(index)"
    >
      <UFormField
        :label="MECHANICS_TEXT.abilities"
        class="sm:col-span-2"
      >
        <USelectMenu
          v-model="bonus.abilities"
          :items="abilityItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.bonus">
        <UInputNumber
          v-model="bonus.bonus"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.upto">
        <UInputNumber
          v-model="bonus.upto"
          :min="1"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.count">
        <UInputNumber
          v-model="bonus.count"
          :min="1"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.fromChoiceKey">
        <UInput
          v-model="bonus.fromChoiceKey"
          class="w-full"
        />
      </UFormField>
    </MechanicsRow>
  </MechanicsSection>
</template>
