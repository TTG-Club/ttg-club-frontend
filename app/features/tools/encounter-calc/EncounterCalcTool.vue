<script setup lang="ts">
  import { consola } from 'consola';

  import { SectionLayout } from '~section/layout';

  import {
    useEncounterCalculator,
    useEncounterGenerator,
    useEncounterTable,
  } from './composables';
  import { ENCOUNTER_CALC_TITLE, getEncounterTableTier } from './model';
  import {
    EncounterCreaturesCard,
    EncounterGeneratorCard,
    EncounterPartyCard,
    EncounterSummary,
    EncounterTableCard,
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

  const {
    tiers: tableTiers,
    environments: tableEnvironments,
    lastRoll,
    isRolling,
    loadOptions: loadTableOptions,
    roll: rollTable,
  } = useEncounterTable(addCreature);

  const defaultTableTier = computed(() => getEncounterTableTier(party.value));

  const isTransferOpen = ref(false);

  const canGenerate = computed(
    () => canAddCreature.value && result.value.characterCount > 0,
  );

  // Среды обитания для генератора берутся из фильтра бестиария, уровни и
  // окружения таблиц — из раздела случайных столкновений. Без них оба
  // генератора всё равно работают — по любой местности.
  onMounted(async () => {
    const [definition, tables] = await Promise.allSettled([
      loadDefinition(),
      loadTableOptions(),
    ]);

    if (definition.status === 'rejected') {
      consola.warn('Не удалось загрузить фильтр бестиария:', definition.reason);
    }

    if (tables.status === 'rejected') {
      consola.warn('Не удалось загрузить таблицы столкновений:', tables.reason);
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

        <EncounterTableCard
          :tiers="tableTiers"
          :environments="tableEnvironments"
          :default-tier="defaultTableTier"
          :last-roll="lastRoll"
          :loading="isRolling"
          :disabled="!canAddCreature"
          @roll="rollTable"
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
