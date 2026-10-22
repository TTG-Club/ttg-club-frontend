import type { LocationQuery } from 'vue-router';

import type { SearchResponse } from './schema';
import type { SearchRange, SearchRequest } from './types';

/** Пустой ответ: пока строка поиска пуста, запрос не нужен. */
export const EMPTY_SEARCH_RESPONSE: SearchResponse = { items: [], total: 0 };

/**
 * Собирает тело запроса поиска.
 * @param term - строка поиска
 * @param page - номер страницы с единицы
 * @param size - размер страницы
 */
export function buildSearchRequest(
  term: string,
  page: number,
  size: number,
): SearchRequest {
  return {
    page: page - 1,
    size,
    search: { value: term, exact: false },
    order: [],
  };
}

/**
 * Номер страницы из адреса; всё, кроме целого числа больше нуля, — первая.
 * @param value - параметр адреса
 */
export function getSearchPage(
  value: LocationQuery[string] | undefined,
): number {
  const first = Array.isArray(value) ? value[0] : value;
  const page = Number(first);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Сколько всего страниц результатов.
 * @param total - сколько найдено
 * @param size - размер страницы
 */
export function getSearchPageCount(total: number, size: number): number {
  return Math.ceil(total / size);
}

/**
 * Номера результатов на текущей странице; без результатов — `null`.
 * @param page - номер страницы с единицы
 * @param size - размер страницы
 * @param total - сколько найдено
 */
export function getSearchRange(
  page: number,
  size: number,
  total: number,
): SearchRange | null {
  const from = (page - 1) * size + 1;

  if (!total || from > total) {
    return null;
  }

  return { from, to: Math.min(page * size, total) };
}
