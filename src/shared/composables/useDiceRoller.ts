import { DiceRoller } from 'dice-roller-parser';
import { type RollBase } from 'dice-roller-parser';
import { v4 } from 'uuid';
import { h } from 'vue';
import { POSITION, useToast } from 'vue-toastification';
import { type ToastOptions } from 'vue-toastification/src/types';

import { ToastEventBus } from '@/core/configs/ToastConfig';

import {
  DiceRollRenderer,
  getFormattedFormula,
  isCritical,
  type RollType,
} from '@/shared/utils/roll';

import { useDiceHistory } from '@/features/dice-history/composables';

import { useRollStore } from '../stores/RollStore';

export function useDiceRoller() {
  const roller = new DiceRoller();
  const toast = useToast(ToastEventBus);

  const rollStore = useRollStore();
  const history = useDiceHistory();

  /**
   * Выполнение броска
   *
   * @param formula - Формула броска.
   * @param type - Бросок с преимуществом или помехой
   */
  const doRoll = ({
    formula,
    type,
  }: {
    formula: string;
    type?: RollType;
  }): RollBase =>
    roller.roll(
      getFormattedFormula({
        formula,
        type,
      }),
    );

  const tryRoll = (options: { formula: string; type?: RollType }) => {
    try {
      return doRoll(options);
    } catch {
      return undefined;
    }
  };

  const getRendered = ({
    roll,
    label,
    type,
  }: {
    roll: RollBase;
    label?: string;
    type?: RollType;
  }) => {
    if (!roll) {
      throw new Error('roll is not defined');
    }

    const rendered = h(
      'span',
      {
        class: 'dice-roll__rendered',
      },
      DiceRollRenderer.render(roll),
    );

    return h(
      'span',
      {
        class: 'dice-roll',
      },
      [
        h(
          'strong',
          {
            class: {
              'dice-roll__result': true,
              'is-success': isCritical(roll, 'success'),
              'is-failure': isCritical(roll, 'failure'),
            },
          },
          Math.max(0, Math.floor(roll.value)),
        ),
        h(
          'span',
          {
            class: 'dice-roll__body',
          },
          label
            ? [
                h(
                  'span',
                  {
                    class: 'dice-roll__label',
                  },
                  `${label}${DiceRollRenderer.getLabelSuffix(roll, type)}`,
                ),
                rendered,
              ]
            : rendered,
        ),
      ],
    );
  };

  const notifyResult = ({
    roll,
    source,
    label,
    type,
    toastOptions,
  }: {
    roll: RollBase;
    source?: string;
    label?: string;
    type?: RollType;
    toastOptions?: ToastOptions;
  }) => {
    // TODO: Consider rendering toast and register roll in the according places (DiceHistory feature, DiceToast feature?)
    rollStore.registerRoll({
      id: v4(),
      date: new Date().toISOString(),
      roll,
      source,
      label,
      type,
    });

    if (history.isOpen.value) {
      return;
    }

    const toastOpts: ToastOptions = {
      position: POSITION.BOTTOM_RIGHT,
      timeout: 5000,
      icon: false,
      ...toastOptions,
    };

    toast(
      getRendered({
        roll,
        label,
        type,
      }),
      toastOpts,
    );
  };

  return {
    roller,
    doRoll,
    tryRoll,
    getFormattedFormula,
    notifyResult,
  };
}

export default {
  useDiceRoller,
};
