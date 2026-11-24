import type { RollMode } from '~dice-roller/model';

import type { SheetRollContext, SheetRollMode } from '../model';

import { useDiceRoll } from '~dice-roller/composables';

import {
  combineRollModes,
  getD20Formula,
  getDamageFormula,
  getSheetRollMode,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useSheetStats } from './useSheetStats';

/**
 * Режим по клику: Shift — преимущество, Ctrl/Cmd — помеха.
 * @param event - событие клика
 */
function getClickMode(event?: MouseEvent): SheetRollMode {
  if (event?.shiftKey) {
    return 'advantage';
  }

  return event?.ctrlKey || event?.metaKey ? 'disadvantage' : 'normal';
}

/**
 * Режим броска для бросателя кубиков: обычный бросок режима не передаёт.
 * @param mode - режим листа
 */
function toDiceMode(mode: SheetRollMode): RollMode | undefined {
  return mode === 'normal' ? undefined : mode;
}

/**
 * Броски из листа: проверки, спасброски и атаки к20 и урон. Преимущество и
 * помеха берутся из флагов эффектов (состояния, истощение, шумный доспех) и
 * складываются с модификатором клика по правилу 5e. Источник броска в
 * истории — имя персонажа.
 */
export function useSheetRoll() {
  const { roll } = useDiceRoll();
  const { name } = useCharacterSheet();
  const { stats } = useSheetStats();

  /**
   * Бросок к20 с бонусом.
   * @param label - что бросаем: «Атлетика», «Спасбросок Силы»
   * @param bonus - бонус броска
   * @param event - клик: модификаторы задают преимущество или помеху
   * @param context - вид броска для флагов эффектов
   */
  function rollD20(
    label: string,
    bonus: number,
    event?: MouseEvent,
    context?: SheetRollContext,
  ): void {
    const effectMode = context
      ? getSheetRollMode(stats.value.flags, context)
      : 'normal';

    roll({
      formula: getD20Formula(bonus),
      label,
      source: name.value,
      mode: toDiceMode(combineRollModes(effectMode, getClickMode(event))),
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

  /**
   * Бросок произвольной формулы: кость хитов, восстановление зарядов.
   * @param label - что бросаем
   * @param formula - формула броска
   * @param isQuiet - без всплывающего уведомления: итог показывает само окно
   * @returns результат; бросок не удался — 0
   */
  function rollFormula(
    label: string,
    formula: string,
    isQuiet = false,
  ): number {
    return roll({ formula, label, source: name.value, isQuiet })?.value ?? 0;
  }

  return { rollD20, rollDamage, rollFormula };
}
