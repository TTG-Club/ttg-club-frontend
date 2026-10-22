<script setup lang="ts">
  import type { CreatureAbilityScore } from '../model';

  import { DiceRoller } from '~dice-roller/roller';

  /** Таблица характеристик: сокращение с подсказкой и бросок проверки. */
  const { scores, source } = defineProps<{
    scores: Array<CreatureAbilityScore>;
    /** Имя существа для истории бросков. */
    source: string;
  }>();
</script>

<template>
  <dl class="grid grid-cols-3 gap-2 sm:grid-cols-6">
    <div
      v-for="score in scores"
      :key="score.key"
      class="rounded-lg border border-default px-2 py-2 text-center"
    >
      <dt class="text-sm font-semibold text-highlighted">
        <UTooltip :text="score.name">
          <span class="cursor-help">{{ score.label }}</span>
        </UTooltip>
      </dt>

      <dd>
        <DiceRoller
          :formula="score.formula"
          :label="score.rollLabel"
          :source="source"
          >{{ score.value }}</DiceRoller
        >
      </dd>
    </div>
  </dl>
</template>
