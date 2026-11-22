/**
 * Что эффект оставляет на том, на кого лёг.
 *
 * Зеркало `hasLastingEffectPayload` из
 * dnd5-test-migrate/src/engine/effectAutomation.ts: на нём строится список
 * вариантов «при успехе» — наложить при успешном спасброске можно только то,
 * что есть.
 */

import type { ActiveEffect } from './types';

/**
 * Есть ли у эффекта длящаяся нагрузка: ради неё эффект и кладётся в
 * `activeEffects` цели.
 *
 * @param effect накладываемый эффект.
 * @returns `true`, если у эффекта есть длящаяся нагрузка.
 */
export function hasLastingEffectPayload(effect: ActiveEffect): boolean {
  return (
    effect.conditionKey !== undefined
    || effect.changes.length > 0
    || effect.flags.length > 0
    || effect.recurringDamage !== undefined
    || effect.recurringSave !== undefined
  );
}
