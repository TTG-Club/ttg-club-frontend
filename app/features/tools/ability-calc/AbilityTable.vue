<script setup lang="ts">
  import type { AbilityScores } from '../model';

  import { DiceRoller } from '~dice-roller/roller';

  import { ABILITY_CALC_TEXT, buildAbilityRows } from '../model';

  /**
   * Итог по характеристикам плитками, как характеристики существа в
   * бестиарии: значение, бонус расы, сумма и модификатор с броском.
   */
  const { scores, bonuses } = defineProps<{
    scores: AbilityScores;
    bonuses: AbilityScores;
  }>();

  const rows = computed(() => buildAbilityRows(scores, bonuses));

  /**
   * Число или прочерк.
   * @param value - значение
   */
  function show(value: number | undefined): string {
    return value === undefined ? ABILITY_CALC_TEXT.empty : String(value);
  }

  /**
   * Бонус расы со знаком или прочерк.
   * @param value - бонус
   */
  function showBonus(value: number | undefined): string {
    return value ? `+${value}` : ABILITY_CALC_TEXT.empty;
  }
</script>

<template>
  <div class="@container">
    <dl class="grid grid-cols-2 gap-2 @md:grid-cols-3 @3xl:grid-cols-6">
      <div
        v-for="row in rows"
        :key="row.key"
        class="overflow-hidden rounded-lg bg-hover text-center"
      >
        <dt
          class="flex h-8 items-center justify-center bg-hover font-semibold text-highlighted uppercase"
        >
          <UTooltip :text="row.name">
            <span class="cursor-help">{{ row.short }}</span>
          </UTooltip>
        </dt>

        <dd class="flex flex-col gap-1 p-3">
          <span class="text-2xl text-highlighted">{{ show(row.total) }}</span>

          <DiceRoller
            v-if="row.modifier"
            :formula="`1к20${row.modifier}`"
            :label="row.name"
            :source="ABILITY_CALC_TEXT.source"
            >{{ row.modifier }}</DiceRoller
          >

          <span
            v-else
            class="text-muted"
            >{{ ABILITY_CALC_TEXT.empty }}</span
          >

          <span class="mt-1 flex flex-col text-xs text-muted">
            <span>{{ ABILITY_CALC_TEXT.base }}: {{ show(row.base) }}</span>

            <span
              >{{ ABILITY_CALC_TEXT.raceBonus }}:
              {{ showBonus(row.bonus) }}</span
            >
          </span>
        </dd>
      </div>
    </dl>
  </div>
</template>
