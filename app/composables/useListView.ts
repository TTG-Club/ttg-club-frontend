import type { ComputedRef } from 'vue';
import type { ListColumnCount, ListView } from '~/shared/consts';

import {
  LIST_VIEW_COOKIE,
  LIST_VIEW_COOKIE_MAX_AGE_SECONDS,
  LIST_VIEW_DEFAULT,
  LIST_VIEW_OPTIONS,
} from '~/shared/consts';

type ListViewOption = (typeof LIST_VIEW_OPTIONS)[number];

export interface UseListViewReturn {
  /** Выбранный вид */
  view: ComputedRef<ListView>;
  /** Наибольшее число колонок: меньше, если столько не помещается */
  columns: ComputedRef<ListColumnCount>;
  /** Выбраны ли строки */
  isRows: ComputedRef<boolean>;
  /** Меняет вид списка */
  setView: (value: ListView) => void;
}

/**
 * Находит вид списка по сохранённому значению.
 *
 * @param value - Значение из cookie
 * @returns Вид; неизвестное значение — вид по умолчанию
 */
function findListViewOption(value: unknown): ListViewOption {
  return (
    LIST_VIEW_OPTIONS.find((option) => option.value === value)
    ?? LIST_VIEW_OPTIONS.find((option) => option.value === LIST_VIEW_DEFAULT)
    ?? LIST_VIEW_OPTIONS[0]
  );
}

/**
 * Вид списков разделов, как на new.ttg.club: карточками — не больше
 * выбранного числа колонок и не больше, чем помещается по ширине, — или
 * строками. Один на все разделы. В cookie — чтобы сервер сразу отдал
 * список в нужном виде.
 *
 * @returns Выбранный вид, число колонок, признак строк и смена вида
 */
export function useListView(): UseListViewReturn {
  const cookie = useCookie<unknown>(LIST_VIEW_COOKIE, {
    maxAge: LIST_VIEW_COOKIE_MAX_AGE_SECONDS,
    default: () => LIST_VIEW_DEFAULT,
  });

  const option = computed(() => findListViewOption(cookie.value));

  const view = computed<ListView>(() => option.value.value);

  const columns = computed<ListColumnCount>(() => option.value.columns);

  const isRows = computed(() => view.value === 'rows');

  return {
    view,
    columns,
    isRows,
    setView: (value) => {
      cookie.value = value;
    },
  };
}
