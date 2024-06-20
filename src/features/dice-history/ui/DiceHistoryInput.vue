<script lang="ts" setup>
  import { ref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { useClassName } from '@/shared/composable/useClassName';
  import { useDiceRoller } from '@/shared/composable/useDiceRoller';
  import { ToastEventBus } from '@/shared/config';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const cn = useClassName();

  const currentInput = ref('');
  const invalid = ref(false);

  const history: string[] = [];

  let historyIndex = -1;

  const toast = useToast(ToastEventBus);

  const { tryRoll, notifyResult } = useDiceRoller();

  function roll() {
    const formula = currentInput.value.trim();

    if (formula === '') {
      return;
    }

    const result = tryRoll({ formula });

    if (!result) {
      toast.error('Неверная формула для броска');
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

    historyIndex = -1;
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
    }, 2000);
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
      @keyup.enter="roll"
      @keyup.up="traverseHistory('up')"
      @keyup.down="traverseHistory('down')"
    />

    <ui-button
      type="plain"
      size="md"
      icon="dice/d6"
      color="text"
      :class="cn('button', { invalid })"
      @click="roll"
    />
  </div>
</template>

<style lang="scss" module>
  .dice-history-input {
    $root: &;

    display: flex;
    align-items: center;
    overflow: hidden;

    &__input {
      all: unset;
      display: block;
      flex: auto;
      padding: 8px 12px;
      font-size: var(--main-font-size);
      line-height: 22px;
    }

    &__button {
      color: var(--text-b-color);

      &:hover {
        color: var(--text-color);
      }

      &--invalid {
        color: var(--error);

        &:hover {
          color: var(--error-hover);
        }
      }
    }
  }
</style>
