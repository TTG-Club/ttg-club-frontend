<script setup lang="ts">
  import type { ProficienciesForm } from '../model';

  import {
    ARMOR_TYPE_OPTIONS,
    MECHANICS_LANGUAGE_OPTIONS,
    MECHANICS_TEXT,
    WEAPON_TYPE_OPTIONS,
    WORKSHOP_ABILITY_OPTIONS,
    WORKSHOP_FIELD_TEXT,
    WORKSHOP_SKILL_OPTIONS,
  } from '../model';
  import MechanicsEntityRefs from './MechanicsEntityRefs.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /** Владения, которые запись выдаёт без выбора. */
  const proficiencies = defineModel<ProficienciesForm>({ required: true });

  const weaponCategoryItems = [...WEAPON_TYPE_OPTIONS];
  const armorItems = [...ARMOR_TYPE_OPTIONS];
  const abilityItems = [...WORKSHOP_ABILITY_OPTIONS];
  const skillItems = [...WORKSHOP_SKILL_OPTIONS];
  const languageItems = [...MECHANICS_LANGUAGE_OPTIONS];

  /** Сколько видов владений заполнено. */
  const filledCount = computed(
    () =>
      [
        proficiencies.value.weaponCategories,
        proficiencies.value.weapons,
        proficiencies.value.armorCategories,
        proficiencies.value.savingThrows,
        proficiencies.value.skills,
        proficiencies.value.tools,
        proficiencies.value.languages,
      ].filter((list) => list.length > 0).length,
  );
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.proficiencies"
    :count="filledCount"
  >
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField :label="MECHANICS_TEXT.weaponCategories">
        <USelectMenu
          v-model="proficiencies.weaponCategories"
          :items="weaponCategoryItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.armorCategories">
        <USelectMenu
          v-model="proficiencies.armorCategories"
          :items="armorItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.savingThrows">
        <USelectMenu
          v-model="proficiencies.savingThrows"
          :items="abilityItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          :search-input="false"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField :label="MECHANICS_TEXT.skills">
        <USelectMenu
          v-model="proficiencies.skills"
          :items="skillItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.languages"
        class="md:col-span-2"
      >
        <USelectMenu
          v-model="proficiencies.languages"
          :items="languageItems"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          value-key="value"
          class="w-full"
          multiple
        />
      </UFormField>

      <MechanicsEntityRefs
        v-model="proficiencies.weapons"
        :label="MECHANICS_TEXT.weapons"
      />

      <MechanicsEntityRefs
        v-model="proficiencies.tools"
        :label="MECHANICS_TEXT.tools"
      />
    </div>
  </MechanicsSection>
</template>
