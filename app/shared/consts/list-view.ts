/**
 * Вид списков разделов, как на new.ttg.club: карточками не больше чем в
 * две, три или четыре колонки — но и не больше, чем помещается по ширине, —
 * или строками в одну колонку, где названия не обрезаются.
 */
export const LIST_VIEW_OPTIONS = [
  { value: 'columns-2', label: 'До двух колонок', columns: 2 },
  { value: 'columns-3', label: 'До трёх колонок', columns: 3 },
  { value: 'columns-4', label: 'До четырёх колонок', columns: 4 },
  { value: 'rows', label: 'Строками', columns: 1 },
] as const;

type ListViewOption = (typeof LIST_VIEW_OPTIONS)[number];

/** Вид списка: карточками до двух, трёх или четырёх колонок либо строками. */
export type ListView = ListViewOption['value'];

/** Наибольшее число колонок списка. */
export type ListColumnCount = ListViewOption['columns'];

/** Вид по умолчанию — до трёх колонок, как на new.ttg.club. */
export const LIST_VIEW_DEFAULT: ListView = 'columns-3';

/** Cookie с видом списков: её читает сервер, чтобы список не прыгал. */
export const LIST_VIEW_COOKIE = 'ttg_list_view';

/** Срок хранения вида списков. */
export const LIST_VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
