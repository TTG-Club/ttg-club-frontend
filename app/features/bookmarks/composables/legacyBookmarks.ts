import { LEGACY_BOOKMARKS_DB } from '../model';

/**
 * Читает гостевые закладки старого SPA из IndexedDB, куда их клал
 * localforage. Базы может не быть: тогда ничего не создаётся.
 * @returns сохранённое значение или `undefined`
 */
export function readLegacyBookmarks(): Promise<unknown> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(undefined);

      return;
    }

    const request = indexedDB.open(LEGACY_BOOKMARKS_DB.name);

    // Базы не было: открытие создало пустую, отменяем его.
    request.onupgradeneeded = () => {
      request.transaction?.abort();
      resolve(undefined);
    };

    request.onerror = () => resolve(undefined);

    request.onsuccess = () => {
      const database = request.result;

      try {
        if (!database.objectStoreNames.contains(LEGACY_BOOKMARKS_DB.store)) {
          resolve(undefined);

          return;
        }

        const read = database
          .transaction(LEGACY_BOOKMARKS_DB.store, 'readonly')
          .objectStore(LEGACY_BOOKMARKS_DB.store)
          .get(LEGACY_BOOKMARKS_DB.key);

        read.onsuccess = () => resolve(read.result);
        read.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      } finally {
        database.close();
      }
    };
  });
}
