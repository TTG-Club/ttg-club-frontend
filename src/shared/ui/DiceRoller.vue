<script setup lang="ts">
  import { type RollBase } from 'dice-roller-parser';
  import { useToast } from 'vue-toastification';

  import { useDiceRoller } from '@/shared/composable/useDiceRoller';
  import { ToastEventBus } from '@/shared/config';
  import { useIsDev } from '@/shared/utils/isDev';

  import { type RollType } from '../utils/roll';

  const props = withDefaults(
    defineProps<{
      formula: string;
      source?: string;
      label?: string;
      isAdvantage?: boolean;
      isDisadvantage?: boolean;
      isSavingThrow?: boolean;
    }>(),
    {
      source: undefined,
      label: 'Бросок',
      isAdvantage: false,
      isDisadvantage: false,
      isSavingThrow: false,
    },
  );

  const emit = defineEmits<{
    (e: 'roll-result', v: RollBase['value']): void;
    (e: 'roll', v: RollBase): void;
  }>();

  const isDev = useIsDev();
  const toast = useToast(ToastEventBus);

  const { doRoll, notifyResult } = useDiceRoller();

  const error = ref(false);

  const classByType = computed(() => {
    if (props.isAdvantage) {
      return 'is-advantage';
    }

    if (props.isDisadvantage) {
      return 'is-disadvantage';
    }

    if (props.isSavingThrow) {
      return 'is-saving-throw';
    }

    return 'is-dice';
  });

  const classes = computed(() => {
    const result = [classByType.value];

    if (error.value) {
      result.push('is-error');
    }

    return result;
  });

  const clearSelection = () => {
    // @ts-ignore
    if (document.selection && document.selection.empty) {
      // @ts-ignore
      document.selection.empty();

      return;
    }

    if (window.getSelection) {
      const sel = window.getSelection();

      sel?.removeAllRanges();
    }
  };

  const tryRoll = (type?: RollType) => {
    clearSelection();

    try {
      const roll = doRoll({
        formula: props.formula,
        type,
      });

      notifyResult({
        source: props.source,
        label: props.label,
        roll,
        type,
      });

      emit('roll-result', roll.value);
    } catch (err) {
      if (isDev) {
        console.error(err);
      }

      toast.error('Произошла ошибка, попробуйте еще раз...');
    }
  };
</script>

<template>
  <n-tooltip>
    <template #trigger>
      <span
        :class="classes"
        class="dice-roller"
        @dblclick.prevent.stop
        @click.left.exact.prevent.stop="tryRoll()"
        @click.left.shift.exact.prevent.stop="tryRoll('advantage')"
        @click.left.ctrl.exact.prevent.stop="tryRoll('disadvantage')"
        @click.left.meta.exact.prevent.stop="tryRoll('disadvantage')"
      >
        <slot>{{ formula }}</slot>
      </span>
    </template>

    <template #default>
      Нажмите для броска: <b>{{ formula }}</b>
    </template>
  </n-tooltip>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .dice-roller {
    @include css_anim();

    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;

    &:not(.is-error) {
      &.is-dice {
        color: var(--bg-dice);
      }

      &.is-advantage {
        color: var(--bg-advantage);
      }

      &.is-disadvantage {
        color: var(--bg-disadvantage);
      }

      &.is-saving-throw {
        color: var(--bg-saving-throw);
      }
    }

    &.is-error {
      color: var(--error);
    }
  }
</style>

<style lang="scss">
  .dice-roll {
    display: flex;

    &__result {
      font-size: var(--h1-font-size);
      line-height: var(--h1-font-size);
      font-weight: 600;
    }

    &__body {
      margin-left: 8px;
      display: flex;
      flex-direction: column;
    }

    &__label {
      font-weight: 600;
      text-transform: uppercase;
      font-size: calc(var(--main-font-size) - 2px);
      line-height: calc(var(--main-font-size) + 2px);
      padding-top: 4px;
    }

    del {
      text-decoration: red line-through;
    }

    .is-success {
      color: var(--bg-advantage);
    }

    .is-failure {
      color: var(--bg-disadvantage);
    }
  }
</style>
