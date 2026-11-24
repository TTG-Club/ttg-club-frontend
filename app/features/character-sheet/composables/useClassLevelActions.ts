import type { SheetClass } from '../model';

import {
  applyLevelUpStep,
  createCustomLevelStep,
  removeClass,
  removeClassLevel,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useLevelUpWizard } from './useLevelUpWizard';

/**
 * Повышение и понижение уровня класса — общие для окна классов и окна
 * опыта. Класс справочника повышается мастером, свой — сразу по среднему
 * кости; понижение и снятие класса забирают ровно выданное ими.
 */
export function useClassLevelActions() {
  const { update } = useCharacterSheet();
  const wizard = useLevelUpWizard();

  /**
   * Повышает уровень класса.
   * @param sheetClass - класс листа
   * @returns true — открылся мастер, и окно, откуда повышали, пора закрыть
   */
  function levelUp(sheetClass: SheetClass): boolean {
    if (!sheetClass.url) {
      update((current) => {
        const step = createCustomLevelStep(current, sheetClass.id);

        return step ? applyLevelUpStep(current, step) : current;
      });

      return false;
    }

    void wizard.startLevelUp(sheetClass.id);

    return true;
  }

  /**
   * Снимает последний уровень класса.
   * @param classId - класс листа
   */
  function levelDown(classId: string): void {
    update((current) => removeClassLevel(current, classId));
  }

  /**
   * Снимает класс целиком.
   * @param classId - класс листа
   */
  function dropClass(classId: string): void {
    update((current) => removeClass(current, classId));
  }

  return { levelUp, levelDown, dropClass };
}
