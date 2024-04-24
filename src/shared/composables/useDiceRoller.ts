import { DiceRoller } from 'dice-roller-parser';
import { type RollBase } from 'dice-roller-parser';
import { v4 } from 'uuid';
import { type ToastOptions } from 'vue-toastification/src/types';

import { useRollStore } from '@/shared/stores/RollStore';
import { getFormattedFormula, type RollType } from '@/shared/utils/roll';

export function useDiceRoller() {
  const roller = new DiceRoller();

  const rollStore = useRollStore();

  const doRoll = ({ formula, type }: { formula: string; type?: RollType }) =>
    roller.roll(
      getFormattedFormula({
        formula,
        type,
      }),
    );

  function tryRoll(options: { formula: string; type?: RollType }) {
    try {
      return doRoll(options);
    } catch {
      return undefined;
    }
  }

  function notifyResult({
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
  }) {
    rollStore.registerRoll(
      {
        id: v4(),
        date: new Date().toISOString(),
        roll,
        source,
        label,
        type,
      },
      toastOptions,
    );
  }

  return {
    doRoll,
    tryRoll,
    notifyResult,
  };
}
