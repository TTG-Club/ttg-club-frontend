<template>
  <span
    v-tippy="{ content: `Нажмите для броска: <b>${formula}</b>` }"
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

<script lang="ts">
  import { computed, defineComponent, ref } from 'vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useDiceRoller } from '@/shared/compositions/useDiceRoller';
  import { useIsDev } from '@/shared/helpers/isDev';

  export default defineComponent({
    props: {
      formula: {
        type: String,
        default: '',
        required: true
      },
      label: {
        type: String,
        default: 'Бросок'
      },
      isAdvantage: {
        type: Boolean,
        default: false
      },
      isDisadvantage: {
        type: Boolean,
        default: false
      },
      isSavingThrow: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
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

      const tryRoll = (type?: 'advantage' | 'disadvantage') => {
        clearSelection();

        try {
          notifyResult({
            label: props.label,
            roll: doRoll({
              formula: props.formula,
              type
            }),
            type
          });
        } catch (err) {
          if (isDev) {
            console.error(err);
          }

          toast.error('Произошла ошибка, попробуйте еще раз...');
        }
      };

      return {
        tryRoll,
        classes
      };
    }
  });
</script>

<style lang="scss" scoped>
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
        color: var(--bg-saving_throw);
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
      color: red;
    }
  }
</style>
