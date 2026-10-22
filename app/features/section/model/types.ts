import type { Ref } from 'vue';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';

/** Ключ значения фильтра: строка или число, как его отдаёт API. */
export type FilterKey = string | number;

/** Значение фильтра из API. */
export interface FilterValue {
  label: string;
  key: FilterKey;
  default: boolean;
  tooltip?: string;
}

/** Группа фильтра после разбора ответа API. */
export interface FilterGroup {
  name: string;
  key: string;
  /**
   * Параметр запроса и адреса: у источников это общий `book`,
   * у остальных групп — ключ группы.
   */
  param: string;
  hidden: boolean;
  values: Array<FilterValue>;
}

/** Фильтр раздела: источники и прочие условия. */
export interface FilterDefinition {
  sources: Array<FilterGroup>;
  other: Array<FilterGroup>;
}

/** Выбранные значения по параметрам: ключи значений строками. */
export type FilterSelection = Record<string, Array<string>>;

/** Фильтр в теле запроса списка. */
export type FilterPayload = Record<string, Array<FilterKey>>;

/** Сортировка списка. */
export interface SectionOrder {
  field: string;
  direction: 'asc' | 'desc';
}

/** Тело запроса списка раздела. */
export interface SectionListRequest {
  page: number;
  size: number;
  search?: { value: string; exact: boolean };
  order?: Array<SectionOrder>;
  filter?: FilterPayload;
}

/** Раздел справочника: заголовок, адрес, ручки списка и фильтра и сортировка. */
export interface SectionConfig {
  /** Ключ раздела для данных SSR. */
  key: string;
  title: string;
  /** Адрес раздела на сайте. */
  path: string;
  listUrl: string;
  /** Ручка фильтра; без неё у раздела только поиск. */
  filterUrl?: string;
  order: Array<SectionOrder>;
  /** Размер страницы; по умолчанию `SECTION_PAGE_SIZE`. */
  pageSize?: number;
}

/**
 * Где список держит поиск и фильтр: в адресе страницы раздела или в
 * памяти, как списки во вкладках класса.
 */
export interface SectionQueryStore {
  query: Readonly<Ref<LocationQuery>>;
  /** Накладывает изменения: `undefined` убирает параметр. */
  update: (patch: LocationQueryRaw) => void;
}
