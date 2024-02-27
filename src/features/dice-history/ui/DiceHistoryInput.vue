<script lang="ts" setup>
  import { ref } from 'vue';

  import { useDiceRoller } from '@/shared/composables/useDiceRoller';

  const currentInput = ref('');
  const invalid = ref(false);

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
      flashInvalid();

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

  function flashInvalid() {
    invalid.value = true;

    setTimeout(() => {
      invalid.value = false;
    }, 1000);
  }
</script>

<template>
  <div
    class="dice-history-input"
    :class="{ 'dice-history-input--invalid': invalid }"
  >
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

    <svg-icon
      class="dice-history-input__dice-icon"
      icon="dice/d6"
    />
  </div>
</template>

<style lang="scss" scoped>
  .dice-history-input {
    $root: &;

    display: flex;
    align-items: center;

    &--invalid {
      #{$root}__dice-icon {
        color: var(--error);
      }
    }

    &__input {
      all: unset;
      display: block;
      flex: auto;
      padding: 8px 0 8px 8px;
    }

    &__dice-icon {
      @include css_anim($item: color);
    }
  }
</style>
