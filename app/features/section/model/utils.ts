import type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValueRaw,
} from 'vue-router';

import type {
  EntryName,
  EntrySource,
  FilterGroupResponse,
  FilterResponse,
} from './schema';
import type {
  FilterDefinition,
  FilterGroup,
  FilterGroupMatch,
  FilterKey,
  FilterPart,
  FilterPayload,
  FilterSelection,
  FilterValue,
  SectionListRequest,
  SectionOrder,
} from './types';

import { sortBy } from 'es-toolkit';

import {
  FILTER_SEARCH_MIN_GROUPS,
  FILTER_SEARCH_MIN_VALUES,
  QUERY_VALUES_SEPARATOR,
  SECTION_API_PREFIX,
  SECTION_DETAIL_FORBIDDEN_SEGMENTS,
  SOURCE_GROUPS_WITH_LABEL,
  SOURCES_PARAM,
  WORKSHOP_EDIT_SUFFIX,
  WORKSHOP_PREFIX,
} from './constants';

/**
 * Приводит группу из API к единому виду.
 * @param group - группа из ответа
 * @param param - параметр запроса группы
 */
function toGroup(group: FilterGroupResponse, param: string): FilterGroup {
  return {
    name: group.name ?? '',
    key: group.key,
    param,
    hidden: !!group.hidden,
    values: (group.values ?? []).map((value) => ({
      label: value.label,
      key: value.key,
      default: !!value.default,
      tooltip: value.tooltip ?? undefined,
    })),
  };
}

/**
 * Разбирает ответ ручки фильтра. Источники всех типов идут в запрос
 * одним параметром `book`, как в старом SPA.
 * @param response - проверенный ответ API
 */
export function normalizeFilter(response: FilterResponse): FilterDefinition {
  if (Array.isArray(response)) {
    return {
      sources: [],
      other: response.map((group) => toGroup(group, group.key)),
    };
  }

  return {
    sources: (response.sources ?? []).map((group) =>
      toGroup(group, SOURCES_PARAM),
    ),
    other: (response.other ?? []).map((group) => toGroup(group, group.key)),
  };
}

/**
 * Возвращает все группы фильтра подряд.
 * @param definition - фильтр раздела
 */
export function getFilterGroups(
  definition: FilterDefinition,
): Array<FilterGroup> {
  return [...definition.sources, ...definition.other];
}

/**
 * Собирает выбор по умолчанию.
 * @param definition - фильтр раздела
 */
export function getDefaultSelection(
  definition: FilterDefinition,
): FilterSelection {
  const selection: FilterSelection = {};

  for (const group of getFilterGroups(definition)) {
    const selected = group.values
      .filter((value) => value.default)
      .map((value) => String(value.key));

    selection[group.param] = [...(selection[group.param] ?? []), ...selected];
  }

  return selection;
}

/**
 * Читает значение параметра адреса как строку.
 * @param value - значение из `route.query`
 */
export function getQueryString(
  value: LocationQuery[string] | undefined,
): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;

  return typeof first === 'string' ? first : undefined;
}

/**
 * Восстанавливает выбор из адреса: параметр в адресе заменяет выбор
 * по умолчанию для своей группы, неизвестные ключи отбрасываются.
 * @param definition - фильтр раздела
 * @param query - параметры адреса
 */
export function selectionFromQuery(
  definition: FilterDefinition,
  query: LocationQuery,
): FilterSelection {
  const selection = getDefaultSelection(definition);
  const known = new Map<string, Set<string>>();

  for (const group of getFilterGroups(definition)) {
    const keys = known.get(group.param) ?? new Set<string>();

    for (const value of group.values) {
      keys.add(String(value.key));
    }

    known.set(group.param, keys);
  }

  for (const [param, keys] of known) {
    const raw = getQueryString(query[param]);

    if (raw === undefined) {
      continue;
    }

    selection[param] = raw
      .split(QUERY_VALUES_SEPARATOR)
      .filter((key) => keys.has(key));
  }

  return selection;
}

/**
 * Сравнивает два набора ключей без учёта порядка.
 * @param left - первый набор
 * @param right - второй набор
 */
function isSameKeys(left: Array<string>, right: Array<string>): boolean {
  const rightSet = new Set(right);

  return (
    left.length === rightSet.size && left.every((key) => rightSet.has(key))
  );
}

/**
 * Записывает выбор в параметры адреса: только группы, отличные от выбора
 * по умолчанию, чтобы ссылка на раздел без фильтра оставалась чистой.
 * @param definition - фильтр раздела
 * @param selection - текущий выбор
 * @returns параметры фильтра; `undefined` убирает параметр из адреса
 */
export function selectionToQuery(
  definition: FilterDefinition,
  selection: FilterSelection,
): LocationQueryRaw {
  const defaults = getDefaultSelection(definition);
  const query: LocationQueryRaw = {};

  for (const [param, keys] of Object.entries(defaults)) {
    const selected = selection[param] ?? [];

    query[param] = isSameKeys(selected, keys)
      ? undefined
      : selected.join(QUERY_VALUES_SEPARATOR);
  }

  return query;
}

/**
 * Проверяет, отличается ли выбор от выбора по умолчанию.
 * @param definition - фильтр раздела
 * @param selection - текущий выбор
 */
export function isSelectionCustomized(
  definition: FilterDefinition,
  selection: FilterSelection,
): boolean {
  return Object.values(selectionToQuery(definition, selection)).some(
    (value) => value !== undefined,
  );
}

/**
 * Параметры адреса, которые занимают группы части фильтра.
 * @param definition - фильтр раздела
 * @param part - источники или условия по содержимому
 */
function getPartParams(
  definition: FilterDefinition,
  part: FilterPart,
): Set<string> {
  return new Set(definition[part].map((group) => group.param));
}

/**
 * Проверяет, отличается ли выбор части фильтра от выбора по умолчанию.
 * @param definition - фильтр раздела
 * @param selection - текущий выбор
 * @param part - источники или условия по содержимому
 */
export function isPartCustomized(
  definition: FilterDefinition,
  selection: FilterSelection,
  part: FilterPart,
): boolean {
  const query = selectionToQuery(definition, selection);

  return [...getPartParams(definition, part)].some(
    (param) => query[param] !== undefined,
  );
}

/**
 * Возвращает часть фильтра к выбору по умолчанию, не трогая другую.
 * @param definition - фильтр раздела
 * @param selection - текущий выбор
 * @param part - источники или условия по содержимому
 */
export function resetSelectionPart(
  definition: FilterDefinition,
  selection: FilterSelection,
  part: FilterPart,
): FilterSelection {
  const defaults = getDefaultSelection(definition);
  const reset: FilterSelection = {};

  for (const param of getPartParams(definition, part)) {
    reset[param] = defaults[param] ?? [];
  }

  return { ...selection, ...reset };
}

/**
 * Собирает фильтр для тела запроса: ключи значений возвращаются к типу
 * из API, потому что бэкенд ждёт, например, уровни числами.
 * @param definition - фильтр раздела
 * @param selection - текущий выбор
 */
export function buildFilterPayload(
  definition: FilterDefinition,
  selection: FilterSelection,
): FilterPayload {
  const payload: FilterPayload = {};

  for (const group of getFilterGroups(definition)) {
    const selected = new Set(selection[group.param] ?? []);

    const keys: Array<FilterKey> = group.values
      .filter((value) => selected.has(String(value.key)))
      .map((value) => value.key);

    payload[group.param] = [...(payload[group.param] ?? []), ...keys];
  }

  return payload;
}

/**
 * Собирает тело запроса страницы списка. Фильтр уходит, только если его
 * меняли, как в старом SPA.
 * @param options - страница, размер, поиск, сортировка и фильтр
 * @param options.page - номер страницы с нуля
 * @param options.size - размер страницы
 * @param options.search - строка поиска
 * @param options.order - сортировка
 * @param options.filter - фильтр для запроса, если он изменён
 */
export function buildListRequest(options: {
  page: number;
  size: number;
  search?: string;
  order?: Array<SectionOrder>;
  filter?: FilterPayload;
}): SectionListRequest {
  const request: SectionListRequest = {
    page: options.page,
    size: options.size,
  };

  if (options.search) {
    request.search = { value: options.search, exact: false };
  }

  if (options.order?.length) {
    request.order = options.order;
  }

  if (options.filter) {
    request.filter = options.filter;
  }

  return request;
}

/**
 * Делит список на группы по подписи, как старый SPA: записи одной группы
 * собираются вместе, даже если ручка отдала их вперемешку (оружие идёт по
 * названию, а группируется по типу). Запись с несколькими подписями попадает
 * в каждую из своих групп (снаряжение по категориям). Группы идут по
 * `getOrder`, а без него — в порядке первой записи; записи внутри группы
 * сохраняют свой порядок.
 * @param items - записи списка
 * @param getGroup - подпись группы записи или несколько подписей
 * @param getOrder - порядок группы записи
 */
export function groupItems<T>(
  items: Array<T>,
  getGroup: (item: T) => string | Array<string>,
  getOrder?: (item: T, group: string) => number,
): Array<{ name: string; items: Array<T> }> {
  const groups = new Map<
    string,
    { name: string; order: number; items: Array<T> }
  >();

  for (const item of items) {
    for (const name of [getGroup(item)].flat()) {
      const group = groups.get(name);

      if (group) {
        group.items.push(item);
      } else {
        groups.set(name, {
          name,
          order: getOrder?.(item, name) ?? groups.size,
          items: [item],
        });
      }
    }
  }

  return sortBy([...groups.values()], [(group) => group.order]).map(
    ({ name, items: groupItemsList }) => ({ name, items: groupItemsList }),
  );
}

/**
 * Возвращает выбранные ключи одной группы: у групп источников параметр
 * общий, поэтому выбор делится по ключам значений группы.
 * @param selection - текущий выбор
 * @param group - группа фильтра
 */
export function getGroupSelection(
  selection: FilterSelection,
  group: FilterGroup,
): Array<string> {
  const keys = new Set(group.values.map((value) => String(value.key)));

  return (selection[group.param] ?? []).filter((key) => keys.has(key));
}

/**
 * Заменяет выбор одной группы, не трогая выбор соседних групп
 * с тем же параметром.
 * @param selection - текущий выбор
 * @param group - группа фильтра
 * @param keys - новые выбранные ключи группы
 */
export function setGroupSelection(
  selection: FilterSelection,
  group: FilterGroup,
  keys: Array<string>,
): FilterSelection {
  const groupKeys = new Set(group.values.map((value) => String(value.key)));

  const others = (selection[group.param] ?? []).filter(
    (key) => !groupKeys.has(key),
  );

  return { ...selection, [group.param]: [...others, ...keys] };
}

/**
 * Возвращает ручку записи по её адресу на сайте: `/gods/Bane` читается
 * из `POST /api/v1/gods/Bane`, как в старом SPA.
 * @param path - адрес страницы записи
 */
export function getEntryApiPath(path: string): string {
  return `${SECTION_API_PREFIX}${path}`;
}

/**
 * Проверяет, нужна ли рядом с книгой подпись её группы: сторонний
 * материал и хомбрю помечаются, официальные книги — нет.
 * @param source - источник записи
 */
export function hasSourceGroupLabel(source: EntrySource): boolean {
  return !!source.group && SOURCE_GROUPS_WITH_LABEL.has(source.group.shortName);
}

/**
 * Возвращает страницу правки записи в мастерской: `/gods/Bane` правится
 * на `/workshop/gods/Bane/edit`, как в старом SPA.
 * @param path - адрес страницы записи
 */
export function getWorkshopEditPath(path: string): string {
  return `${WORKSHOP_PREFIX}${path}${WORKSHOP_EDIT_SUFFIX}`;
}

/**
 * Группа записи по первой букве русского названия, как у снаряжения в
 * старом SPA.
 * @param entry - запись списка
 * @param entry.name - название записи
 */
export function getFirstLetterGroup(entry: { name: EntryName }): string {
  return entry.name.rus.charAt(0);
}

/**
 * Адрес записи из списка; он же её ключ — у каждой записи он свой.
 * @param entry - запись списка
 * @param entry.url - адрес записи
 */
export function getEntryUrl(entry: { url: string }): string {
  return entry.url;
}

/**
 * Приводит значение параметра к виду `route.query`: числа становятся
 * строками, пустые значения — `null`.
 * @param value - значение параметра
 */
function toQueryValue(value: LocationQueryValueRaw): string | null {
  return value === null || value === undefined ? null : String(value);
}

/**
 * Накладывает изменения на параметры, как `router.replace` с
 * `{ ...route.query, ...patch }`: `undefined` и `null` убирают параметр.
 * Нужен спискам во вкладках, которые держат поиск и фильтр не в адресе.
 * @param query - текущие параметры
 * @param patch - изменения
 */
export function mergeQuery(
  query: LocationQuery,
  patch: LocationQueryRaw,
): LocationQuery {
  const merged: LocationQuery = { ...query };

  for (const [key, value] of Object.entries(patch)) {
    merged[key] = Array.isArray(value)
      ? value.map(toQueryValue)
      : toQueryValue(value);
  }

  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== null),
  );
}

/**
 * Часть адреса записи после раздела: так запись хранится в `?detail=`.
 * @param sectionPath - адрес раздела, например `/spells`
 * @param path - адрес записи, например `/spells/fireball`
 */
export function getDetailSlug(sectionPath: string, path: string): string {
  const prefix = `${sectionPath}/`;

  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/**
 * Адрес записи из `?detail=`; без значения или с подозрительными
 * сегментами (`..`) — `undefined`.
 * @param sectionPath - адрес раздела
 * @param slug - значение параметра
 */
export function getDetailPath(
  sectionPath: string,
  slug: string | undefined,
): string | undefined {
  const segments = slug?.split('/') ?? [];

  const isValid =
    segments.length > 0
    && segments.every(
      (segment) =>
        segment.length > 0 && !SECTION_DETAIL_FORBIDDEN_SEGMENTS.has(segment),
    );

  return isValid ? `${sectionPath}/${slug}` : undefined;
}

/**
 * Нужен ли поиск по фильтрам: групп больше пяти или значений больше двадцати.
 * @param groups - видимые группы фильтра
 */
export function isFilterSearchable(
  groups: ReadonlyArray<FilterGroup>,
): boolean {
  const valuesCount = groups.reduce(
    (total, group) => total + group.values.length,
    0,
  );

  return (
    groups.length > FILTER_SEARCH_MIN_GROUPS
    || valuesCount > FILTER_SEARCH_MIN_VALUES
  );
}

/**
 * Группы и значения под поиск по фильтрам. Совпало название группы — она
 * остаётся целиком, иначе в ней остаются подошедшие значения; группы без
 * значений пропадают.
 * @param groups - видимые группы фильтра
 * @param query - строка поиска
 */
export function searchFilterGroups(
  groups: ReadonlyArray<FilterGroup>,
  query: string,
): Array<FilterGroupMatch> {
  const needle = query.trim().toLocaleLowerCase();

  const matches = groups.map((group) => {
    if (!needle || group.name.toLocaleLowerCase().includes(needle)) {
      return { group, values: group.values };
    }

    return {
      group,
      // У книг ищем и по сокращению, и по названию из подсказки
      values: group.values.filter((value) =>
        [value.label, value.tooltip].some((text) =>
          text?.toLocaleLowerCase().includes(needle),
        ),
      ),
    };
  });

  return matches.filter((match) => match.values.length > 0);
}

/**
 * Книга в фильтре источников подписана названием, а сокращение уходит в
 * подсказку; без названия остаётся сокращение.
 * @param value - книга из фильтра
 */
export function getSourceFilterValue(value: FilterValue): FilterValue {
  if (!value.tooltip) {
    return value;
  }

  return { ...value, label: value.tooltip, tooltip: value.label };
}

/**
 * Состояние «Выбрать все» у группы: частичный выбор показывается чёрточкой.
 * @param keys - все ключи группы
 * @param selected - выбранные ключи группы
 */
export function getSelectAllState(
  keys: ReadonlyArray<string>,
  selected: ReadonlyArray<string>,
): boolean | 'indeterminate' {
  if (!selected.length) {
    return false;
  }

  return keys.every((key) => selected.includes(key)) || 'indeterminate';
}
