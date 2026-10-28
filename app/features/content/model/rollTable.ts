import type { RollTableData } from './types';

import { z } from 'zod';

import { ROLL_RANGE_SEPARATOR } from './constants';

/** Проверка таблицы бросков из API. */
export const rollTableSchema: z.ZodType<RollTableData> = z.object({
  name: z.string(),
  formula: z.string(),
  thead: z.array(z.string()),
  tbody: z.array(z.array(z.string())),
});

/**
 * Находит строку таблицы, в диапазон которой попал результат броска.
 * Первая ячейка строки — число (`5`) или диапазон (`1-4`).
 * @param rows - строки таблицы
 * @param result - результат броска
 * @returns индекс строки или -1
 */
export function findRollTableRow(
  rows: Array<Array<string>>,
  result: number,
): number {
  return rows.findIndex(([range = '']) => {
    const [min, max = min] = range
      .split(ROLL_RANGE_SEPARATOR)
      .map((part) => Number(part.trim()));

    if (min === undefined || max === undefined) {
      return false;
    }

    // Таблицы столкновений приходят с диапазоном задом наперёд: `20-11`
    return Math.min(min, max) <= result && result <= Math.max(min, max);
  });
}
