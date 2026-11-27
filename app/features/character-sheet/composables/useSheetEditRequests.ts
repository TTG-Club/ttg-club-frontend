import type { Ref } from 'vue';

import {
  fetchEditRequestCount,
  SHEET_EDIT_REQUESTS_POLL_INTERVAL_MS,
} from '../model';

/** Возвращаемое значение useSheetEditRequests. */
export interface UseSheetEditRequestsReturn {
  /** Неотвеченные запросы на редактирование листов пользователя. */
  count: Ref<number>;

  /** Перечитывает сводку сразу — после решения владельца по запросу. */
  refresh: () => Promise<void>;
}

/**
 * Сводка входящих запросов на редактирование листов: для открытого листа и
 * списка — сигнал «пора перечитать запросы». Опрашивается фоном, пока
 * смонтирован хоть один потребитель, а таймер у всех один. Анониму сводку не
 * запрашиваем: ручка закрыта авторизацией.
 *
 * Побочные эффекты: запрос сводки сразу и затем по таймеру.
 */
export const useSheetEditRequests = createSharedComposable(
  (): UseSheetEditRequestsReturn => {
    const { isLoggedIn } = useUser();

    const count = ref(0);

    async function refresh(): Promise<void> {
      if (!isLoggedIn.value) {
        count.value = 0;

        return;
      }

      try {
        count.value = await fetchEditRequestCount();
      } catch {
        // Сводка необязательна: метки и баннер обновит следующий опрос
      }
    }

    useIntervalFn(() => {
      void refresh();
    }, SHEET_EDIT_REQUESTS_POLL_INTERVAL_MS);

    // Вход и выход перечитывают сводку сразу, не дожидаясь опроса
    watch(
      isLoggedIn,
      () => {
        void refresh();
      },
      { immediate: true },
    );

    return { count, refresh };
  },
);
