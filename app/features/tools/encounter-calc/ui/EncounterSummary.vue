<script setup lang="ts">
  import type { EncounterResult } from '../model';

  import {
    DIFFICULTY_COLOR,
    DIFFICULTY_HINT,
    DIFFICULTY_LABEL,
    formatExperience,
    formatMultiplier,
    SUMMARY_LABELS,
  } from '../model';
  import EncounterBudgetBar from './EncounterBudgetBar.vue';

  const { result } = defineProps<{
    result: EncounterResult;
  }>();

  const difficultyLabel = computed(() => DIFFICULTY_LABEL[result.difficulty]);
  const difficultyColor = computed(() => DIFFICULTY_COLOR[result.difficulty]);
  const difficultyHint = computed(() => DIFFICULTY_HINT[result.difficulty]);

  const stats = computed(() => [
    {
      label: SUMMARY_LABELS.adjustedExperience,
      value: formatExperience(result.adjustedExperience),
      note: `${SUMMARY_LABELS.multiplier} ${formatMultiplier(result.multiplier)}`,
    },
    {
      label: SUMMARY_LABELS.totalExperience,
      value: formatExperience(result.totalExperience),
    },
    {
      label: SUMMARY_LABELS.perCharacter,
      value: formatExperience(result.experiencePerCharacter),
    },
    {
      label: SUMMARY_LABELS.dailyBudget,
      value: formatExperience(result.dailyBudget),
    },
  ]);
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-4"
    aria-live="polite"
  >
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-semibold text-highlighted">
        {{ SUMMARY_LABELS.difficulty }}
      </span>

      <UBadge
        :color="difficultyColor"
        variant="subtle"
        size="lg"
      >
        {{ difficultyLabel }}
      </UBadge>
    </div>

    <dl class="grid grid-cols-2 gap-3 text-sm @2xl:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex flex-col"
      >
        <dt class="text-muted">{{ stat.label }}</dt>

        <dd class="font-semibold text-highlighted tabular-nums">
          {{ stat.value }}

          <span
            v-if="stat.note"
            class="text-xs font-normal text-muted"
          >
            {{ stat.note }}
          </span>
        </dd>
      </div>
    </dl>

    <EncounterBudgetBar
      :adjusted-experience="result.adjustedExperience"
      :thresholds="result.thresholds"
    />

    <p class="text-sm">
      {{ difficultyHint }}
    </p>

    <p class="text-xs text-muted">
      {{ SUMMARY_LABELS.multiplierHint }}
    </p>
  </section>
</template>
