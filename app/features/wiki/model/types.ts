import type { SectionOrder } from '~section/model';

/** Раздел вики: заголовок, адрес, ручки списка и фильтра и сортировка. */
export interface WikiSection {
  /** Ключ раздела для данных SSR. */
  key: string;
  title: string;
  /** Адрес раздела на сайте. */
  path: string;
  listUrl: string;
  /** Ручка фильтра; у источников фильтра нет, только поиск. */
  filterUrl?: string;
  order: Array<SectionOrder>;
}
