import type { BookmarkEntry } from '../model';

import {
  bookmarkListSchema,
  DEFAULT_GROUP,
  findCategoryInGroup,
  findDefaultGroup,
  LOCAL_BOOKMARKS_STORAGE_KEY,
  removeBookmarkEntry,
} from '../model';
import { readLegacyBookmarks } from './legacyBookmarks';
import { fetchBookmarkCategory } from './useBookmarkCategory';

/**
 * Разбирает сохранённые закладки; испорченные данные дают пустой список.
 * @param raw - строка из localStorage
 */
function readEntries(raw: string): Array<BookmarkEntry> {
  try {
    const parsed = bookmarkListSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * Гостевые закладки в localStorage. При первом заходе переносит закладки,
 * сохранённые старым SPA в IndexedDB.
 */
export const useLocalBookmarks = createSharedComposable(() => {
  const entries = useLocalStorage<Array<BookmarkEntry>>(
    LOCAL_BOOKMARKS_STORAGE_KEY,
    [],
    {
      serializer: {
        read: readEntries,
        write: (value) => JSON.stringify(value),
      },
    },
  );

  const isMigrated = useLocalStorage(
    `${LOCAL_BOOKMARKS_STORAGE_KEY}-migrated`,
    false,
  );

  async function migrateLegacy() {
    if (isMigrated.value) {
      return;
    }

    isMigrated.value = true;

    const parsed = bookmarkListSchema.safeParse(await readLegacyBookmarks());

    if (parsed.success && parsed.data.length && !entries.value.length) {
      entries.value = parsed.data;
    }
  }

  function ensureDefaultGroup(): BookmarkEntry {
    const existing = findDefaultGroup(entries.value, DEFAULT_GROUP.order);

    if (existing) {
      return existing;
    }

    const group: BookmarkEntry = {
      uuid: crypto.randomUUID(),
      name: DEFAULT_GROUP.name,
      order: DEFAULT_GROUP.order,
    };

    entries.value = [...entries.value, group];

    return group;
  }

  /**
   * Добавляет страницу в закладки, раскладывая по категории раздела.
   * @param url - адрес страницы
   * @param name - название записи
   */
  async function add(url: string, name: string) {
    const info = await fetchBookmarkCategory(url);
    const group = ensureDefaultGroup();

    let category = findCategoryInGroup(entries.value, info.name, group.uuid);

    if (!category) {
      category = {
        uuid: crypto.randomUUID(),
        name: info.name,
        order: info.order,
        parentUUID: group.uuid,
      };

      entries.value = [...entries.value, category];
    }

    const parentUUID = category.uuid;

    entries.value = [
      ...entries.value,
      {
        uuid: crypto.randomUUID(),
        name,
        url,
        parentUUID,
        order: entries.value.filter((entry) => entry.parentUUID === parentUUID)
          .length,
      },
    ];
  }

  /**
   * Удаляет запись вместе с вложенными.
   * @param uuid - запись
   */
  function remove(uuid: string) {
    entries.value = removeBookmarkEntry(entries.value, uuid);
  }

  return { entries, add, remove, migrateLegacy };
});
