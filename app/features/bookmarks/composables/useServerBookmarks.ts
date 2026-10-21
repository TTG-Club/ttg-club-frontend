import type { BookmarkEntry } from '../model';

import {
  bookmarkEntrySchema,
  bookmarkListSchema,
  BOOKMARKS_PATH,
  DEFAULT_GROUP,
  findCategoryInGroup,
  findDefaultGroup,
  getGroups,
} from '../model';
import { fetchBookmarkCategory } from './useBookmarkCategory';

/** Закладки вошедшего пользователя: хранятся на бэкенде, с группами. */
export function useServerBookmarks() {
  const entries = useState<Array<BookmarkEntry>>('bookmarks-server', () => []);
  const isLoaded = useState('bookmarks-server-loaded', () => false);

  async function load() {
    const response: unknown = await $fetch(BOOKMARKS_PATH);

    entries.value = bookmarkListSchema.parse(response);
    isLoaded.value = true;
  }

  async function ensureLoaded() {
    if (!isLoaded.value) {
      await load();
    }
  }

  /**
   * Создаёт запись на бэкенде.
   * @param body - новая запись без uuid
   */
  async function create(body: Omit<Partial<BookmarkEntry>, 'uuid'>) {
    const response: unknown = await $fetch(BOOKMARKS_PATH, {
      method: 'POST',
      body,
    });

    const entry = bookmarkEntrySchema.parse(response);

    entries.value = [...entries.value, entry];

    return entry;
  }

  async function ensureDefaultGroup(): Promise<BookmarkEntry> {
    await ensureLoaded();

    return (
      findDefaultGroup(entries.value, DEFAULT_GROUP.order)
      ?? (await create({
        name: DEFAULT_GROUP.name,
        order: DEFAULT_GROUP.order,
      }))
    );
  }

  /**
   * Добавляет страницу в группу, создавая категорию раздела при нужде.
   * @param url - адрес страницы
   * @param name - название записи
   * @param groupUUID - группа; без неё — группа по умолчанию
   */
  async function add(url: string, name: string, groupUUID?: string) {
    const parentGroup = groupUUID ?? (await ensureDefaultGroup()).uuid;
    const info = await fetchBookmarkCategory(url);

    const category =
      findCategoryInGroup(entries.value, info.name, parentGroup)
      ?? (await create({ name: info.name, parentUUID: parentGroup }));

    await create({ name, url, parentUUID: category.uuid });
    await load();
  }

  /**
   * Удаляет запись; бэкенд удаляет и вложенные.
   * @param uuid - запись
   */
  async function remove(uuid: string) {
    await $fetch(`${BOOKMARKS_PATH}/${uuid}`, { method: 'DELETE' });
    await load();
  }

  /**
   * Создаёт группу в конце списка.
   * @param name - название группы
   */
  async function createGroup(name: string) {
    await create({ name, order: getGroups(entries.value).length });
  }

  /**
   * Переименовывает запись.
   * @param entry - запись
   * @param name - новое название
   */
  async function rename(entry: BookmarkEntry, name: string) {
    await $fetch(BOOKMARKS_PATH, { method: 'PUT', body: { ...entry, name } });
    await load();
  }

  function clear() {
    entries.value = [];
    isLoaded.value = false;
  }

  return {
    entries,
    isLoaded,
    load,
    ensureLoaded,
    add,
    remove,
    createGroup,
    rename,
    clear,
  };
}
