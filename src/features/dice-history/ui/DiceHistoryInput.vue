<script lang="ts" setup>
  import { ref } from 'vue';

  import { useDiceRoller } from '@/shared/composables/useDiceRoller';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import { useClassName } from '@/shared/utils/className';

  const cn = useClassName();

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
  <div :class="cn()">
    <input
      v-model="currentInput"
      :class="cn('input')"
      type="text"
      placeholder="Введите формулу"
      aria-label="Формула для броска"
      @keyup.enter="roll()"
      @keyup.up="traverseHistory('up')"
      @keyup.down="traverseHistory('down')"
    />

    <ui-button
      icon="dice/d6"
      type="text"
      :color="invalid ? 'error' : 'text'"
      :body-class="cn('dice-button')[0]"
      @click="roll()"
    />
  </div>
</template>

<style lang="scss" module>
  .dice-history-input {
    $root: &;

    display: flex;
    align-items: center;

    &__input {
      all: unset;
      display: block;
      flex: auto;
      padding: 10px 0 8px 16px;
    }

    &__dice-button {
      @include css_anim($item: color);
    }
  }
</style>
