import type { RemovableRef } from '@vueuse/core';

import type { RollEntry } from '../model';

import {
  appendRollEntry,
  ROLL_HISTORY_LIMIT,
  ROLL_HISTORY_OPEN_STORAGE_KEY,
  ROLL_HISTORY_STORAGE_KEY,
  rollHistorySchema,
} from '../model';

/**
 * История бросков в localStorage. Другие вкладки видят новые броски
 * через событие `storage`, поэтому отдельный канал между вкладками
 * не нужен.
 */
export const useDiceHistory = createSharedComposable(() => {
  const entries: RemovableRef<Array<RollEntry>> = useLocalStorage<
    Array<RollEntry>
  >(ROLL_HISTORY_STORAGE_KEY, [], {
    serializer: {
      read: (raw) => {
        try {
          const parsed = rollHistorySchema.safeParse(JSON.parse(raw));

          return parsed.success ? parsed.data : [];
        } catch {
          return [];
        }
      },
      write: (value) => JSON.stringify(value),
    },
  });

  const isOpen = useLocalStorage(ROLL_HISTORY_OPEN_STORAGE_KEY, false);

  /**
   * Добавляет бросок в историю.
   * @param entry - бросок
   */
  function add(entry: RollEntry) {
    entries.value = appendRollEntry(entries.value, entry, ROLL_HISTORY_LIMIT);
  }

  function clear() {
    entries.value = [];
  }

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  return { entries, isOpen, add, clear, toggle };
});
