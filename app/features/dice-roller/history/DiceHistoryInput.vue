<script setup lang="ts">
  import { useDiceRoll } from '../composables';
  import { ROLL_HISTORY_ICON, ROLL_HISTORY_TEXT } from '../model';

  /**
   * Бросок по введённой формуле. Стрелки вверх и вниз листают введённые
   * раньше формулы, как в терминале.
   */
  const { roll } = useDiceRoll();

  const formula = ref('');
  const isInvalid = refAutoReset(false, 2000);

  const typed: Array<string> = [];

  let typedIndex = -1;

  function rollFormula() {
    const value = formula.value.trim();

    if (!value) {
      return;
    }

    const outcome = roll(
      { formula: value, source: ROLL_HISTORY_TEXT.formulaSource },
      ROLL_HISTORY_TEXT.invalidFormula,
    );

    if (!outcome) {
      isInvalid.value = true;

      return;
    }

    if (typed[0] !== value) {
      typed.unshift(value);
    }

    typedIndex = -1;
    formula.value = '';
  }

  function showTyped(step: 1 | -1) {
    typedIndex = Math.min(Math.max(typedIndex + step, -1), typed.length - 1);
    formula.value = typed[typedIndex] ?? '';
  }

  function showOlder() {
    showTyped(1);
  }

  function showNewer() {
    showTyped(-1);
  }
</script>

<template>
  <div class="flex gap-2">
    <UInput
      v-model="formula"
      :placeholder="ROLL_HISTORY_TEXT.placeholder"
      :aria-label="ROLL_HISTORY_TEXT.inputLabel"
      :color="isInvalid ? 'error' : 'neutral'"
      :highlight="isInvalid"
      autocapitalize="off"
      autocomplete="off"
      class="flex-auto"
      @keydown.enter.exact.prevent="rollFormula"
      @keydown.up.exact.prevent="showOlder"
      @keydown.down.exact.prevent="showNewer"
    />

    <UButton
      :icon="ROLL_HISTORY_ICON.roll"
      :aria-label="ROLL_HISTORY_TEXT.inputLabel"
      color="neutral"
      variant="subtle"
      @click.left.exact.prevent="rollFormula"
    />
  </div>
</template>
