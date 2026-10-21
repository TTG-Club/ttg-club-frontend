import type { RollOutcome, RollRequest } from '../model';

import { DiceRoller } from '@ttg-club/dice-roller-parser';
import { consola } from 'consola';

import {
  collectDiceValues,
  DEFAULT_ROLL_LABEL,
  formatFormula,
  getModeSuffix,
  ROLL_DICE_LABEL,
  ROLL_ERROR_TEXT,
  ROLL_TOAST_ICON,
} from '../model';

const roller = new DiceRoller();

/**
 * Броски кубиков из контента с уведомлением о результате.
 */
export function useDiceRoll() {
  const toast = useToast();

  /**
   * Бросает кубики и показывает результат.
   * @param request - формула, подпись и особый бросок
   * @returns итог броска или `undefined`, если формулу не удалось разобрать
   */
  function roll(request: RollRequest): RollOutcome | undefined {
    try {
      const result = roller.roll(formatFormula(request.formula, request.mode));
      const dice = collectDiceValues(result);

      const label = `${request.label ?? DEFAULT_ROLL_LABEL}${getModeSuffix(request.formula, request.mode)}`;

      toast.add({
        title: `${label}: ${result.value}`,
        description: [
          request.source,
          request.formula,
          dice.length ? `${ROLL_DICE_LABEL}: ${dice.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        icon: ROLL_TOAST_ICON,
        color: 'neutral',
      });

      return { value: result.value, dice };
    } catch (error) {
      if (import.meta.dev) {
        consola.error(error);
      }

      toast.add({ title: ROLL_ERROR_TEXT, color: 'error' });

      return undefined;
    }
  }

  return { roll };
}
