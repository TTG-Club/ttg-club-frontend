<script setup lang="ts">
  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    applyHitPointsInput,
    changeHitPoints,
    HEALTH_TEXT,
    HIT_POINT_STEP_BUTTONS,
    parseHitPointsInput,
  } from '../model';

  /**
   * Быстрая правка текущих хитов, как на new.ttg.club: шаги урона и лечения
   * и поле «точное значение или сдвиг» (`20`, `-7`, `+3`). Правка сразу
   * уходит в лист: урон сперва снимает временные хиты, лечение не выше
   * максимума с прибавками.
   */
  const { size = 'lg' } = defineProps<{
    /** Размер кнопок шагов: в полной настройке здоровья они помельче. */
    size?: 'sm' | 'lg';
  }>();

  const { update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const expression = ref('');

  const isExpressionValid = computed(
    () => parseHitPointsInput(expression.value) !== null,
  );

  const stepButtons = HIT_POINT_STEP_BUTTONS.map((button) => ({
    ...button,
    ariaLabel: `${HEALTH_TEXT.quickStep} ${button.label}`,
  }));

  /**
   * Шаг урона или лечения.
   * @param step - сдвиг хитов
   */
  function applyStep(step: number): void {
    update((current) =>
      changeHitPoints(current, step, stats.value.hitPointsMax),
    );
  }

  /** Значение из поля; непонятный ввод просто очищается. */
  function applyExpression(): void {
    const input = parseHitPointsInput(expression.value);

    if (input) {
      update((current) =>
        applyHitPointsInput(current, input, stats.value.hitPointsMax),
      );
    }

    expression.value = '';
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2">
      <UButton
        v-for="button in stepButtons"
        :key="button.step"
        :label="button.label"
        :aria-label="button.ariaLabel"
        :color="button.color"
        :size="size"
        variant="soft"
        class="flex-1 justify-center tabular-nums"
        @click.left.exact.prevent="applyStep(button.step)"
      />
    </div>

    <div class="flex items-center gap-2">
      <span class="shrink-0 text-xs text-muted">
        {{ HEALTH_TEXT.expression }}
      </span>

      <div class="h-px flex-1 bg-default" />
    </div>

    <div class="flex gap-2">
      <UInput
        v-model="expression"
        class="flex-1"
        inputmode="text"
        :placeholder="HEALTH_TEXT.expressionPlaceholder"
        :aria-label="HEALTH_TEXT.expressionAria"
        :ui="{ base: 'text-center' }"
        @keydown.enter.prevent="applyExpression"
      />

      <UButton
        :label="HEALTH_TEXT.expressionApply"
        color="neutral"
        variant="subtle"
        :disabled="!isExpressionValid"
        @click.left.exact.prevent="applyExpression"
      />
    </div>
  </div>
</template>
