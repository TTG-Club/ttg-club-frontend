<script lang="ts" setup>
  import { type RollBase } from 'dice-roller-parser';
  import { ref } from 'vue';

  import { useDiceRoller } from '@/shared/composables/useDiceRoller';

  const emit = defineEmits<{
    (e: 'roll', roll: RollBase): void;
  }>();

  const currentInput = ref('');

  const history: string[] = [];

  let historyIndex = -1;

  const { tryRoll, notifyResult } = useDiceRoller();

  function roll() {
    const formula = currentInput.value.trim();

    if (formula === '') {
      return;
    }

    const result = tryRoll({ formula });

    if (!result) {
      // TODO: Handle error
      return;
    }

    notifyResult({
      roll: result,
      source: 'Бросок по формуле',
    });

    if (history[0] !== formula) {
      history.unshift(formula);
    }

    currentInput.value = '';

    emit('roll', result);
  }

  function traverseHistory(direction: 'up' | 'down') {
    if (direction === 'up' && historyIndex < history.length - 1) {
      historyIndex++;
    }

    if (direction === 'down' && historyIndex >= 0) {
      historyIndex--;
    }

    currentInput.value = historyIndex >= 0 ? history[historyIndex] : '';
  }
</script>

<template>
  <div class="dice-history-input">
    <input
      v-model="currentInput"
      class="dice-history-input__input"
      type="text"
      placeholder="Введите формулу"
      aria-label="Формула для броска"
      @keyup.enter="roll()"
      @keyup.up="traverseHistory('up')"
      @keyup.down="traverseHistory('down')"
    />

    <svg-icon icon="dice/d6" />
  </div>
</template>

<style lang="scss" scoped>
  .dice-history-input {
    display: flex;
    align-items: center;

    &__input {
      all: unset;
      flex: auto;
      display: block;
      padding: 8px 0 8px 8px;
    }
  }
</style>
