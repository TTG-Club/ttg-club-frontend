import type { BookmarkEntry, BookmarkGroupNode, BookmarkItem } from './types';

/**
 * Проверяет, что запись — ссылка.
 * @param entry - запись закладок
 */
export function isBookmarkItem(entry: BookmarkEntry): entry is BookmarkItem {
  return !!entry.url && !!entry.parentUUID;
}

/**
 * Возвращает группы: записи без родителя.
 * @param entries - все записи
 */
export function getGroups(entries: Array<BookmarkEntry>): Array<BookmarkEntry> {
  return entries
    .filter((entry) => !entry.parentUUID)
    .sort((left, right) => left.order - right.order);
}

/**
 * Собирает дерево: группы, в них категории, в категориях ссылки.
 * @param entries - все записи
 */
export function buildBookmarkTree(
  entries: Array<BookmarkEntry>,
): Array<BookmarkGroupNode> {
  const byOrder = (left: BookmarkEntry, right: BookmarkEntry) =>
    left.order - right.order;

  return getGroups(entries).map((group) => ({
    ...group,
    children: entries
      .filter((entry) => entry.parentUUID === group.uuid && !entry.url)
      .sort(byOrder)
      .map((category) => ({
        ...category,
        children: entries
          .filter(
            (entry): entry is BookmarkItem =>
              isBookmarkItem(entry) && entry.parentUUID === category.uuid,
          )
          .sort(byOrder),
      })),
  }));
}

/**
 * Возвращает группу по умолчанию.
 * @param entries - все записи
 * @param defaultOrder - порядок группы по умолчанию
 */
export function findDefaultGroup(
  entries: Array<BookmarkEntry>,
  defaultOrder: number,
): BookmarkEntry | undefined {
  return entries.find(
    (entry) => !entry.parentUUID && entry.order === defaultOrder,
  );
}

/**
 * Находит ссылку с адресом внутри группы.
 * @param entries - все записи
 * @param url - адрес страницы
 * @param groupUUID - группа
 */
export function findItemInGroup(
  entries: Array<BookmarkEntry>,
  url: string,
  groupUUID: string,
): BookmarkItem | undefined {
  const categories = new Set(
    entries
      .filter((entry) => entry.parentUUID === groupUUID && !entry.url)
      .map((entry) => entry.uuid),
  );

  return entries.find(
    (entry): entry is BookmarkItem =>
      isBookmarkItem(entry)
      && entry.url === url
      && categories.has(entry.parentUUID),
  );
}

/**
 * Находит категорию с именем внутри группы.
 * @param entries - все записи
 * @param name - имя категории
 * @param groupUUID - группа
 */
export function findCategoryInGroup(
  entries: Array<BookmarkEntry>,
  name: string,
  groupUUID: string,
): BookmarkEntry | undefined {
  return entries.find(
    (entry) =>
      entry.parentUUID === groupUUID && !entry.url && entry.name === name,
  );
}

/**
 * Удаляет запись вместе со всеми вложенными; категория, оставшаяся без
 * ссылок, удаляется тоже, как в старом SPA.
 * @param entries - все записи
 * @param uuid - удаляемая запись
 */
export function removeBookmarkEntry(
  entries: Array<BookmarkEntry>,
  uuid: string,
): Array<BookmarkEntry> {
  const removed = new Set([uuid]);

  // Два уровня вложенности: группа → категории → ссылки.
  for (let depth = 0; depth < 2; depth++) {
    for (const entry of entries) {
      if (entry.parentUUID && removed.has(entry.parentUUID)) {
        removed.add(entry.uuid);
      }
    }
  }

  const rest = entries.filter((entry) => !removed.has(entry.uuid));
  const target = entries.find((entry) => entry.uuid === uuid);
  const parentUUID = target?.parentUUID;

  if (
    target
    && isBookmarkItem(target)
    && parentUUID
    && !rest.some((entry) => entry.parentUUID === parentUUID)
  ) {
    return rest.filter((entry) => entry.uuid !== parentUUID);
  }

  return rest;
}

/**
 * Считает ссылки в закладках.
 * @param entries - все записи
 */
export function countBookmarkItems(entries: Array<BookmarkEntry>): number {
  return entries.filter(isBookmarkItem).length;
}
