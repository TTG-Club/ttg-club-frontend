import type { SheetSnapshot } from './types';

import { isEqual } from 'es-toolkit';

import { sheetDocumentSchema } from './schema';

/** Объект JSON-документа: ключи — строки, значения — что угодно из JSON. */
type JsonObject = Record<string, unknown>;

/** Элемент списка, который узнаётся по собственному идентификатору. */
type IdentifiedItem = JsonObject & { id: string };

/**
 * Объект ли значение JSON-документа (не массив и не null).
 * @param value - значение документа
 * @returns true, если это объект
 */
function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Элемент списка с собственным строковым идентификатором.
 * @param value - значение документа
 * @returns true, если элемент можно узнать по `id`
 */
function isIdentifiedItem(value: unknown): value is IdentifiedItem {
  return isJsonObject(value) && typeof value.id === 'string';
}

/**
 * Список, все элементы которого узнаются по уникальному `id` (предметы,
 * заклинания, заметки, эффекты). Такие списки сливаются поэлементно; прочие —
 * целиком, как одно значение.
 * @param value - значение документа
 * @returns элементы списка; null — список не такой
 */
function toIdentifiedItems(value: unknown): Array<IdentifiedItem> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(isIdentifiedItem);

  if (items.length !== value.length) {
    return null;
  }

  const ids = new Set(items.map((item) => item.id));

  return ids.size === items.length ? items : null;
}

/**
 * Список объектов без собственного `id` (ячейки заклинаний и т. п.).
 * @param value - значение документа
 * @returns элементы списка; null — список не такой
 */
function toObjectItems(value: unknown): Array<JsonObject> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(isJsonObject);

  return items.length === value.length ? items : null;
}

/**
 * Индекс элементов списка по `id`.
 * @param items - элементы списка
 * @returns элементы по идентификатору
 */
function indexById(items: Array<IdentifiedItem>): Map<string, IdentifiedItem> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Поэлементное слияние списков с `id`. Порядок — как у сервера, свои новые
 * элементы дописываются в конец. Удаление побеждает только неизменённый
 * элемент: если одна сторона удалила, а другая поправила, правка остаётся.
 * @param base - элементы на момент начала правки
 * @param mine - свои элементы
 * @param theirs - элементы с сервера
 * @returns слитый список
 */
function mergeIdentifiedLists(
  base: Array<IdentifiedItem>,
  mine: Array<IdentifiedItem>,
  theirs: Array<IdentifiedItem>,
): Array<unknown> {
  const baseById = indexById(base);
  const mineById = indexById(mine);
  const theirsById = indexById(theirs);

  const fromTheirs = theirs.flatMap((theirsItem) => {
    const baseItem = baseById.get(theirsItem.id);
    const mineItem = mineById.get(theirsItem.id);

    if (!mineItem) {
      // Нет у себя: либо удалил сам (держим удаление, если сервер элемент не
      // трогал), либо его только что добавили на сервере
      return baseItem && isEqual(baseItem, theirsItem) ? [] : [theirsItem];
    }

    return [mergeSheetValues(baseItem, mineItem, theirsItem)];
  });

  const fromMine = mine.filter((mineItem) => {
    if (theirsById.has(mineItem.id)) {
      return false;
    }

    const baseItem = baseById.get(mineItem.id);

    // Свой новый элемент остаётся; удалённый на сервере — только если сам его
    // успел поправить
    return !baseItem || !isEqual(baseItem, mineItem);
  });

  return [...fromTheirs, ...fromMine];
}

/**
 * Поключевое слияние объектов. Удаление ключа побеждает только неизменённое
 * значение — как и у элементов списков.
 * @param base - объект на момент начала правки
 * @param mine - свой объект
 * @param theirs - объект с сервера
 * @returns слитый объект
 */
function mergeObjects(
  base: JsonObject,
  mine: JsonObject,
  theirs: JsonObject,
): JsonObject {
  const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]);

  return Object.fromEntries(
    [...keys].flatMap((key): Array<[string, unknown]> => {
      const inBase = key in base;
      const inMine = key in mine;
      const inTheirs = key in theirs;

      if (!inMine) {
        return inBase && isEqual(base[key], theirs[key])
          ? []
          : [[key, theirs[key]]];
      }

      if (!inTheirs) {
        return inBase && isEqual(base[key], mine[key])
          ? []
          : [[key, mine[key]]];
      }

      return [[key, mergeSheetValues(base[key], mine[key], theirs[key])]];
    }),
  );
}

/**
 * Трёхстороннее слияние значений JSON-документа — так одновременные правки
 * разных людей не затирают друг друга. Что поменял только один, берётся у
 * него; объекты сливаются по ключам, списки с `id` — по элементам, списки
 * объектов той же длины — по позициям. Числа, которые поменяли оба,
 * складываются как приращения: два одновременных «+1» к хитам или счётчику
 * дают «+2», а не теряют одно нажатие. Прочее, что поменяли оба, берётся
 * своё: правка сделана позже, раз сервер уже успел принять чужую.
 * @param base - значение на момент начала правки (последнее сохранённое)
 * @param mine - своё значение
 * @param theirs - значение с сервера
 * @returns слитое значение
 */
export function mergeSheetValues(
  base: unknown,
  mine: unknown,
  theirs: unknown,
): unknown {
  if (isEqual(mine, base)) {
    return theirs;
  }

  if (isEqual(theirs, base)) {
    return mine;
  }

  // Поменяли оба. Совпадение итогов не значит, что правка одна: два «+1» к
  // одному числу дают одинаковый документ, поэтому сначала — разбор вглубь
  if (
    typeof base === 'number'
    && typeof mine === 'number'
    && typeof theirs === 'number'
  ) {
    return theirs + (mine - base);
  }

  if (isJsonObject(base) && isJsonObject(mine) && isJsonObject(theirs)) {
    return mergeObjects(base, mine, theirs);
  }

  const baseItems = toIdentifiedItems(base);
  const mineItems = toIdentifiedItems(mine);
  const theirsItems = toIdentifiedItems(theirs);

  if (baseItems && mineItems && theirsItems) {
    return mergeIdentifiedLists(baseItems, mineItems, theirsItems);
  }

  const baseObjects = toObjectItems(base);
  const mineObjects = toObjectItems(mine);
  const theirsObjects = toObjectItems(theirs);

  if (
    baseObjects
    && mineObjects
    && theirsObjects
    && mineObjects.length === baseObjects.length
    && theirsObjects.length === baseObjects.length
  ) {
    return mineObjects.map((mineItem, index) =>
      mergeSheetValues(baseObjects[index], mineItem, theirsObjects[index]),
    );
  }

  return mine;
}

/**
 * Сливает свои правки листа (имя и документ) с версией, которую сервер
 * принял от другого редактора. Документ проходит ту же схему, что и ответ
 * сервера, — слияние не может собрать лист, который лист не прочтёт.
 * @param base - лист на момент начала своей правки (последнее сохранённое)
 * @param mine - свой лист с несохранёнными правками
 * @param theirs - актуальный лист с сервера
 * @returns слитый лист
 */
export function mergeSheetSnapshots(
  base: SheetSnapshot,
  mine: SheetSnapshot,
  theirs: SheetSnapshot,
): SheetSnapshot {
  const name = mergeSheetValues(base.name, mine.name, theirs.name);

  return {
    name: typeof name === 'string' ? name : mine.name,
    data: sheetDocumentSchema.parse(
      mergeSheetValues(base.data, mine.data, theirs.data),
    ),
  };
}
