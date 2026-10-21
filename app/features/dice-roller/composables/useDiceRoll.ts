import type { RollOutcome, RollRequest } from '../model';

import { DiceRoller } from '@ttg-club/dice-roller-parser';
import { consola } from 'consola';

import {
  collectDiceValues,
  DEFAULT_ROLL_LABEL,
  formatFormula,
  getModeSuffix,
  getRollCritical,
  ROLL_DICE_LABEL,
  ROLL_ERROR_TEXT,
  ROLL_TOAST_ICON,
} from '../model';
import { useDiceHistory } from './useDiceHistory';

const roller = new DiceRoller();

/**
 * Броски кубиков из контента: результат попадает в историю, а пока
 * история закрыта, ещё и в уведомление.
 */
export function useDiceRoll() {
  const toast = useToast();
  const history = useDiceHistory();

  /**
   * Бросает кубики и показывает результат.
   * @param request - формула, подпись и особый бросок
   * @param errorText - текст ошибки, если формулу не удалось разобрать
   * @returns итог броска или `undefined`, если формулу не удалось разобрать
   */
  function roll(
    request: RollRequest,
    errorText: string = ROLL_ERROR_TEXT,
  ): RollOutcome | undefined {
    try {
      const result = roller.roll(formatFormula(request.formula, request.mode));
      const dice = collectDiceValues(result);
      const critical = getRollCritical(result);

      const label = `${request.label ?? DEFAULT_ROLL_LABEL}${getModeSuffix(request.formula, request.mode)}`;

      history.add({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        formula: request.formula,
        value: result.value,
        dice,
        label,
        source: request.source,
        critical,
      });

      if (!history.isOpen.value) {
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
      }

      return { value: result.value, dice, critical };
    } catch (error) {
      if (import.meta.dev) {
        consola.error(error);
      }

      toast.add({ title: errorText, color: 'error' });

      return undefined;
    }
  }

  return { roll };
}
