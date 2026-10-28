<script setup lang="ts">
  import type { RollMode, RollOutcome } from '../model';

  import { useDiceRoll } from '../composables';
  import { ROLL_HINT } from '../model';

  /**
   * Кликабельная формула броска: замена тега `dice-roller` старого SPA.
   * Клик — обычный бросок, Shift — преимущество, Ctrl или Cmd — помеха.
   */
  const {
    formula,
    label = undefined,
    source = undefined,
    isAdvantage = false,
    isDisadvantage = false,
    isSavingThrow = false,
  } = defineProps<{
    formula: string;
    label?: string;
    source?: string;
    isAdvantage?: boolean;
    isDisadvantage?: boolean;
    isSavingThrow?: boolean;
  }>();

  const emit = defineEmits<{
    roll: [outcome: RollOutcome];
  }>();

  const { roll } = useDiceRoll();

  const colorClass = computed(() => {
    if (isAdvantage) {
      return 'text-advantage';
    }

    if (isDisadvantage) {
      return 'text-disadvantage';
    }

    if (isSavingThrow) {
      return 'text-saving-throw';
    }

    return 'text-dice';
  });

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
  }

  function rollDice(mode?: RollMode) {
    clearSelection();

    const outcome = roll({ formula, label, source, mode });

    if (outcome) {
      emit('roll', outcome);
    }
  }

  function rollNormal() {
    rollDice();
  }

  function rollWithAdvantage() {
    rollDice('advantage');
  }

  function rollWithDisadvantage() {
    rollDice('disadvantage');
  }
</script>

<template>
  <UTooltip>
    <span
      :class="colorClass"
      class="cursor-pointer font-medium whitespace-nowrap transition-colors"
      role="button"
      tabindex="0"
      @dblclick.prevent.stop
      @click.left.exact.prevent.stop="rollNormal"
      @click.left.shift.exact.prevent.stop="rollWithAdvantage"
      @click.left.ctrl.exact.prevent.stop="rollWithDisadvantage"
      @click.left.meta.exact.prevent.stop="rollWithDisadvantage"
      @keydown.enter.exact.prevent="rollNormal"
    >
      <slot>{{ formula }}</slot>
    </span>

    <template #content>
      {{ ROLL_HINT }} <b>{{ formula }}</b>
    </template>
  </UTooltip>
</template>
