import type { EncounterRequest } from './types';

import { clamp } from 'es-toolkit';

import { TOOL_COUNT_MAX, TOOL_COUNT_MIN } from './constants';

/**
 * Количество результатов в пределах, которые принимает бэкенд: больше 99 он
 * молча отдаёт пустой список.
 * @param count - значение из поля, может быть пустым
 */
export function normalizeToolCount(count: number | null | undefined): number {
  if (!count || !Number.isFinite(count)) {
    return TOOL_COUNT_MIN;
  }

  return clamp(Math.trunc(count), TOOL_COUNT_MIN, TOOL_COUNT_MAX);
}

/**
 * Переключает книгу дикой магии. Последнюю выбранную книгу снять нельзя:
 * без книг бэкенду не из чего выбирать.
 * @param selected - выбранные книги
 * @param source - книга, по которой кликнули
 */
export function toggleRequiredSource(
  selected: ReadonlyArray<string>,
  source: string,
): Array<string> {
  if (!selected.includes(source)) {
    return [...selected, source];
  }

  return selected.length > 1
    ? selected.filter((item) => item !== source)
    : [...selected];
}

/**
 * Книга, выбранная по умолчанию: нужная, если она есть, иначе первая.
 * @param sources - книги с таблицами
 * @param preferred - книга по умолчанию
 */
export function getDefaultSources(
  sources: ReadonlyArray<string>,
  preferred: string,
): Array<string> {
  if (sources.includes(preferred)) {
    return [preferred];
  }

  const [first] = sources;

  return first ? [first] : [];
}

/**
 * Тело запроса столкновения без пустых полей.
 * @param level - средний уровень группы
 * @param environment - окружение
 */
export function buildEncounterRequest(
  level: number | undefined,
  environment: string | undefined,
): EncounterRequest {
  return {
    ...(level ? { level } : {}),
    ...(environment ? { environment } : {}),
  };
}
