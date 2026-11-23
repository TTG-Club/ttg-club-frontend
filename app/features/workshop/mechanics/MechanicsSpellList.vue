<script setup lang="ts">
  import type { SpellListForm } from '../model';

  import {
    createSpellListGroupForm,
    MECHANICS_LIMIT,
    MECHANICS_TEXT,
  } from '../model';
  import MechanicsEntityRefs from './MechanicsEntityRefs.vue';
  import MechanicsRow from './MechanicsRow.vue';
  import MechanicsSection from './MechanicsSection.vue';

  /**
   * Расширение списка заклинаний класса: группы заклинаний с уровнем, с
   * которого группа открывается, и числом заклинаний, которые из неё берут.
   */
  const spellList = defineModel<SpellListForm>({ required: true });

  function addGroup(): void {
    spellList.value.groups = [
      ...spellList.value.groups,
      createSpellListGroupForm(),
    ];
  }

  /**
   * Убирает группу.
   * @param index - номер группы
   */
  function removeGroup(index: number): void {
    spellList.value.groups = spellList.value.groups.filter(
      (_, position) => position !== index,
    );
  }
</script>

<template>
  <MechanicsSection
    :title="MECHANICS_TEXT.spellList"
    :hint="MECHANICS_TEXT.spellListHint"
    :count="spellList.groups.length"
    :add-label="MECHANICS_TEXT.add"
    @add="addGroup"
  >
    <UCheckbox
      v-model="spellList.requiresSpellcasting"
      :label="MECHANICS_TEXT.requiresSpellcasting"
    />

    <MechanicsRow
      v-for="(group, index) in spellList.groups"
      :key="index"
      @remove="removeGroup(index)"
    >
      <UFormField :label="MECHANICS_TEXT.requiredLevel">
        <UInputNumber
          v-model="group.requiredLevel"
          :min="1"
          :max="MECHANICS_LIMIT.level"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="MECHANICS_TEXT.groupCount"
        :help="MECHANICS_TEXT.groupCountHelp"
      >
        <UInput
          v-model="group.count"
          class="w-full"
        />
      </UFormField>

      <MechanicsEntityRefs
        v-model="group.spells"
        :label="MECHANICS_TEXT.spells"
      />
    </MechanicsRow>
  </MechanicsSection>
</template>
