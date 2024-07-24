<script lang="ts" setup>
  import { useToast } from 'vue-toastification';

  import { useDiceRoller } from '@/shared/composable/useDiceRoller';
  import { ToastEventBus } from '@/shared/config';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

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
  <n-input-group>
    <n-input
      v-model:value="currentInput"
      placeholder="Введите формулу"
      :input-props="{
        'aria-label': 'Формула для броска',
        'autocapitalize': 'off',
        'autocomplete': 'off',
        'formnovalidate': true,
      }"
      clearable
      @keyup.enter.exact.prevent="roll"
      @keyup.up.exact.prevent="traverseHistory('up')"
      @keyup.down.exact.prevent="traverseHistory('down')"
    />

    <n-button
      secondary
      @click.left.exact.prevent="roll"
    >
      <template #icon>
        <svg-icon icon="dice/d6" />
      </template>
    </n-button>
  </n-input-group>
</template>
