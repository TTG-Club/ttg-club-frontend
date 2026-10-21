import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import type {
  EntryName,
  EntrySource,
  FilterGroupResponse,
  FilterResponse,
} from './schema';
import type {
  FilterDefinition,
  FilterGroup,
  FilterKey,
  FilterPayload,
  FilterSelection,
  SectionListRequest,
  SectionOrder,
} from './types';

import {
  QUERY_VALUES_SEPARATOR,
  SECTION_API_PREFIX,
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
 * Делит список на группы по подписи, сохраняя порядок записей.
 * @param items - записи списка
 * @param getGroup - подпись группы записи
 */
export function groupItems<T>(
  items: Array<T>,
  getGroup: (item: T) => string,
): Array<{ name: string; items: Array<T> }> {
  const groups: Array<{ name: string; items: Array<T> }> = [];

  for (const item of items) {
    const name = getGroup(item);
    const last = groups.at(-1);

    if (last && last.name === name) {
      last.items.push(item);
    } else {
      groups.push({ name, items: [item] });
    }
  }

  return groups;
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
