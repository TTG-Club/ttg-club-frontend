<script setup lang="ts">
  import { consola } from 'consola';

  import { SectionLayout } from '~section/layout';

  import { useEncounterCalculator, useEncounterGenerator } from './composables';
  import { ENCOUNTER_CALC_TITLE } from './model';
  import {
    EncounterCreaturesCard,
    EncounterGeneratorCard,
    EncounterPartyCard,
    EncounterSummary,
    EncounterTransferModal,
  } from './ui';

  /**
   * Калькулятор столкновений по правилам «Руководства мастера» 2014: слева
   * группа и генератор, справа итог и существа.
   */
  const {
    party,
    creatures,
    result,
    canAddPartyRow,
    canAddCreature,
    addPartyRow,
    updatePartyRow,
    removePartyRow,
    addCreature,
    addCustomCreature,
    updateCreature,
    removeCreature,
    clearCreatures,
  } = useEncounterCalculator();

  const { isGenerating, environmentItems, loadDefinition, generate } =
    useEncounterGenerator(result, addCreature);

  const isTransferOpen = ref(false);

  const canGenerate = computed(
    () => canAddCreature.value && result.value.characterCount > 0,
  );

  // Среды обитания для генератора берутся из фильтра бестиария; без них
  // генератор всё равно работает — по любой местности.
  onMounted(async () => {
    try {
      await loadDefinition();
    } catch (error) {
      consola.warn('Не удалось загрузить фильтр бестиария:', error);
    }
  });
</script>

<template>
  <SectionLayout
    :title="ENCOUNTER_CALC_TITLE"
    is-full-width
  >
    <template #controls>
      <div class="flex flex-col gap-4">
        <EncounterPartyCard
          :party="party"
          :can-add="canAddPartyRow"
          @add="addPartyRow"
          @update="updatePartyRow"
          @remove="removePartyRow"
        />

        <EncounterGeneratorCard
          :environments="environmentItems"
          :loading="isGenerating"
          :disabled="!canGenerate"
          @generate="generate"
        />
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <EncounterSummary :result="result" />

      <EncounterCreaturesCard
        :creatures="creatures"
        :can-add="canAddCreature"
        @add="addCreature"
        @add-custom="addCustomCreature"
        @update="updateCreature"
        @remove="removeCreature"
        @clear="clearCreatures"
        @transfer="isTransferOpen = true"
      />
    </div>

    <EncounterTransferModal
      v-model:open="isTransferOpen"
      :creatures="creatures"
    />
  </SectionLayout>
</template>
