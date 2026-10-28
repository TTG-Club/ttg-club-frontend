<script setup lang="ts">
  import type { CreatureAbilityScore } from '../model';

  import { DiceRoller } from '~dice-roller/roller';

  /**
   * Таблица характеристик, как в старом SPA: плитки с тёмной шапкой-сокращением
   * и броском проверки под ней. Колонок столько, сколько влезает рядом с
   * картинкой: две, три или все шесть в ряд.
   */
  const { scores, source } = defineProps<{
    scores: Array<CreatureAbilityScore>;
    /** Имя существа для истории бросков. */
    source: string;
  }>();
</script>

<template>
  <div class="@container flow-root">
    <dl class="grid grid-cols-2 gap-2 @3xs:grid-cols-3 @3xl:grid-cols-6">
      <div
        v-for="score in scores"
        :key="score.key"
        class="overflow-hidden rounded-lg bg-hover text-center"
      >
        <dt
          class="flex h-8 items-center justify-center bg-hover font-semibold text-highlighted uppercase"
        >
          <UTooltip :text="score.name">
            <span class="cursor-help">{{ score.label }}</span>
          </UTooltip>
        </dt>

        <dd class="p-2">
          <DiceRoller
            :formula="score.formula"
            :label="score.rollLabel"
            :source="source"
            >{{ score.value }}</DiceRoller
          >
        </dd>
      </div>
    </dl>
  </div>
</template>
