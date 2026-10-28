import { useUser } from '~/composables/useUser';

import {
  buildBookmarkTree,
  countBookmarkItems,
  DEFAULT_GROUP,
  findDefaultGroup,
  findItemInGroup,
  getGroups,
} from '../model';
import { useLocalBookmarks } from './useLocalBookmarks';
import { useServerBookmarks } from './useServerBookmarks';

/**
 * Закладки текущего посетителя: у гостя — в браузере, у вошедшего —
 * на бэкенде с собственными группами, как в старом SPA.
 */
export function useBookmarks() {
  const { isLoggedIn } = useUser();
  const local = useLocalBookmarks();
  const server = useServerBookmarks();

  const entries = computed(() =>
    isLoggedIn.value ? server.entries.value : local.entries.value,
  );

  const tree = computed(() => buildBookmarkTree(entries.value));
  const count = computed(() => countBookmarkItems(entries.value));

  /** Свои группы пользователя, кроме группы по умолчанию. */
  const customGroups = computed(() =>
    getGroups(entries.value).filter(
      (group) => group.order !== DEFAULT_GROUP.order,
    ),
  );

  /** Загружает закладки, если ещё не загружены. */
  async function refresh() {
    if (isLoggedIn.value) {
      await server.ensureLoaded();
    } else {
      await local.migrateLegacy();
    }
  }

  /**
   * Проверяет, сохранена ли страница в группе.
   * @param url - адрес страницы
   * @param groupUUID - группа; без неё — группа по умолчанию
   */
  function isSaved(url: string, groupUUID?: string): boolean {
    const group =
      groupUUID ?? findDefaultGroup(entries.value, DEFAULT_GROUP.order)?.uuid;

    return !!group && !!findItemInGroup(entries.value, url, group);
  }

  /**
   * Добавляет страницу в группу или убирает её оттуда.
   * @param url - адрес страницы
   * @param name - название записи
   * @param groupUUID - группа; без неё — группа по умолчанию
   * @returns `true`, если закладка добавлена
   */
  async function toggle(
    url: string,
    name: string,
    groupUUID?: string,
  ): Promise<boolean> {
    await refresh();

    const group =
      groupUUID ?? findDefaultGroup(entries.value, DEFAULT_GROUP.order)?.uuid;

    const saved = group
      ? findItemInGroup(entries.value, url, group)
      : undefined;

    if (saved) {
      await remove(saved.uuid);

      return false;
    }

    if (isLoggedIn.value) {
      await server.add(url, name, groupUUID);
    } else {
      await local.add(url, name);
    }

    return true;
  }

  /**
   * Удаляет запись.
   * @param uuid - запись
   */
  async function remove(uuid: string) {
    if (isLoggedIn.value) {
      await server.remove(uuid);
    } else {
      local.remove(uuid);
    }
  }

  // Выход из аккаунта: серверные закладки другого пользователя не нужны.
  watch(isLoggedIn, (value) => {
    if (!value) {
      server.clear();
    }
  });

  return {
    tree,
    count,
    customGroups,
    isLoggedIn,
    refresh,
    isSaved,
    toggle,
    remove,
    createGroup: server.createGroup,
    rename: server.rename,
  };
}
