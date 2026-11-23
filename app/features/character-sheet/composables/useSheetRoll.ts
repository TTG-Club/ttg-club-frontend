import type { RollMode } from '~dice-roller/model';

import { useDiceRoll } from '~dice-roller/composables';

import { getD20Formula, getDamageFormula } from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Особый бросок по клику: Shift — преимущество, Ctrl/Cmd — помеха.
 * @param event - событие клика
 */
function getRollMode(event?: MouseEvent): RollMode | undefined {
  if (event?.shiftKey) {
    return 'advantage';
  }

  return event?.ctrlKey || event?.metaKey ? 'disadvantage' : undefined;
}

/**
 * Броски из листа: проверки, спасброски и атаки к20 и урон. Источник броска
 * в истории — имя персонажа.
 */
export function useSheetRoll() {
  const { roll } = useDiceRoll();
  const { name } = useCharacterSheet();

  /**
   * Бросок к20 с бонусом.
   * @param label - что бросаем: «Атлетика», «Спасбросок Силы»
   * @param bonus - бонус броска
   * @param event - клик: модификаторы задают преимущество или помеху
   */
  function rollD20(label: string, bonus: number, event?: MouseEvent): void {
    roll({
      formula: getD20Formula(bonus),
      label,
      source: name.value,
      mode: getRollMode(event),
    });
  }

  /**
   * Бросок урона.
   * @param label - что бросаем
   * @param damage - урон с модификатором из листа
   */
  function rollDamage(label: string, damage: string): void {
    roll({ formula: getDamageFormula(damage), label, source: name.value });
  }

  return { rollD20, rollDamage };
}
