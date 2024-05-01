<script lang="ts" setup>
  import { ref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useClassName } from '@/shared/composables/useClassName';
  import { useDiceRoller } from '@/shared/composables/useDiceRoller';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

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
      @keyup.enter="roll"
      @keyup.up="traverseHistory('up')"
      @keyup.down="traverseHistory('down')"
    />

    <button
      type="button"
      :class="cn('dice-button', { invalid })"
      @click="roll"
    >
      <svg-icon icon="dice/d6" />
    </button>
  </div>
</template>

<style lang="scss" module>
  .dice-history-input {
    $root: &;

    display: flex;
    align-items: center;
    padding-right: 4px;

    &__input {
      all: unset;
      display: block;
      flex: auto;
      padding: 10px 0 8px 16px;
    }

    &__dice-button {
      all: unset;

      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      @include css_anim($item: color);

      &:hover {
        color: var(--btn-primary);
      }

      &--invalid {
        color: var(--error);
      }
    }
  }
</style>
