<script setup lang="ts">
  import { consola } from 'consola';

  import { AppFooter } from '~infrastructure/footer';

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
    EncounterTransferModal,
  } from './ui';

  /**
   * Калькулятор столкновений по правилам «Руководства мастера» 2014: сверху
   * итог, ниже группа слева и генерация с существами справа.
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

  /** Диапазон таблиц столкновений по среднему уровню группы. */
  const tableTier = computed(() => getEncounterTableTier(party.value));

  const tableTierLabel = computed(
    () =>
      tableTiers.value.find(({ value }) => value === tableTier.value)?.label,
  );

  /**
   * Бросает по таблице диапазона группы.
   * @param environment Среда обитания; пусто — случайная.
   */
  function rollPartyTable(environment: string | undefined): Promise<void> {
    return rollTable(tableTier.value, environment);
  }

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
  <!-- Колонка по центру, как на new.ttg.club: сверху итог, ниже группа -->
  <!-- слева и генерация с существами справа; на узком экране — стопкой. -->
  <div class="flex min-h-page flex-col md:min-h-dvh">
    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-auto flex-col gap-6 px-4 pt-4 pb-8 md:pt-6"
    >
      <h1 class="text-2xl text-highlighted">
        {{ ENCOUNTER_CALC_TITLE }}
      </h1>

      <EncounterSummary :result="result" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <EncounterPartyCard
          :party="party"
          :can-add="canAddPartyRow"
          @add="addPartyRow"
          @update="updatePartyRow"
          @remove="removePartyRow"
        />

        <div class="flex min-w-0 flex-col gap-6">
          <EncounterGeneratorCard
            :environments="environmentItems"
            :table-environments="tableEnvironments"
            :tier-label="tableTierLabel"
            :last-roll="lastRoll"
            :generating="isGenerating"
            :rolling="isRolling"
            :can-generate="canGenerate"
            :can-roll="canAddCreature"
            @generate="generate"
            @roll="rollPartyTable"
          />

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
      </div>

      <EncounterTransferModal
        v-model:open="isTransferOpen"
        :creatures="creatures"
      />
    </div>

    <AppFooter />
  </div>
</template>
