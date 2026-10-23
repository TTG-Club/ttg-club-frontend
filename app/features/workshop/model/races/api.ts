import type { SelectOption } from '../types';

import { RACES_LIST_PATH } from './constants';
import { parseRaceParentOptions } from './schemas';

/**
 * Расы для выбора родительской.
 * @param excludeId - идентификатор редактируемой расы
 */
export async function fetchRaceParentOptions(
  excludeId?: number,
): Promise<Array<SelectOption>> {
  return parseRaceParentOptions(
    await $fetch<unknown>(RACES_LIST_PATH, { method: 'POST', body: {} }),
    excludeId,
  );
}
