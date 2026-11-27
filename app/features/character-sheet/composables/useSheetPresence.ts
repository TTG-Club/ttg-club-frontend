import type { MaybeRefOrGetter, Ref } from 'vue';

import type { SheetPresenceUser } from '../model';

import { getErrorStatus } from '~user/model';

import {
  getPresenceInterval,
  isEditAccessLostStatus,
  leaveSheetPresence,
  sendSheetPresence,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/** Возвращаемое значение useSheetPresence. */
export interface UseSheetPresenceReturn {
  /** Другие пользователи, у которых лист сейчас открыт. */
  otherUsers: Ref<Array<SheetPresenceUser>>;

  /** Сервер отказал в отметке: права на правку больше нет или лист удалён. */
  isAccessLost: Ref<boolean>;
}

/**
 * Совместная правка открытого листа: пока лист открыт на правку (владельцем
 * или редактором), он отмечается на сервере и узнаёт, у кого ещё он открыт и
 * какая версия листа сейчас на сервере. Обогнавшая версия подтягивается
 * слиянием в автосохранении (`syncRemote`).
 *
 * Побочные эффекты: отметка сразу и затем по таймеру; при смене листа и при
 * уходе отметка снимается запросом, переживающим закрытие страницы.
 * @param sheetId - идентификатор открытого листа; пустая строка — отмечать
 *   нечего (лист не загружен или открыт только на просмотр)
 * @param isEditor - лист чужой и открыт по праву редактора
 * @returns кто ещё на листе и признак, что править лист больше нельзя
 */
export function useSheetPresence(
  sheetId: MaybeRefOrGetter<string>,
  isEditor: MaybeRefOrGetter<boolean>,
): UseSheetPresenceReturn {
  const { syncRemote } = useCharacterSheet();

  const otherUsers = ref<Array<SheetPresenceUser>>([]);
  const isAccessLost = ref(false);

  const interval = computed(() =>
    getPresenceInterval(otherUsers.value.length, toValue(isEditor)),
  );

  /** Отмечается сам и обновляет список остальных и версию листа. */
  async function heartbeat(): Promise<void> {
    const requestedSheetId = toValue(sheetId);

    if (!requestedSheetId || isAccessLost.value) {
      return;
    }

    try {
      const presence = await sendSheetPresence(requestedSheetId);

      // Пока шёл запрос, могли открыть другой лист — чужой ответ не применяем
      if (toValue(sheetId) !== requestedSheetId) {
        return;
      }

      otherUsers.value = presence.users;

      if (presence.version !== null) {
        syncRemote(presence.version);
      }
    } catch (error) {
      if (
        toValue(sheetId) === requestedSheetId
        && isEditAccessLostStatus(getErrorStatus(error))
      ) {
        isAccessLost.value = true;
      }
    }
  }

  useIntervalFn(() => {
    void heartbeat();
  }, interval);

  watch(
    () => toValue(sheetId),
    (currentSheetId, previousSheetId) => {
      otherUsers.value = [];
      isAccessLost.value = false;

      if (previousSheetId) {
        leaveSheetPresence(previousSheetId);
      }

      if (currentSheetId) {
        void heartbeat();
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    const currentSheetId = toValue(sheetId);

    if (currentSheetId && !isAccessLost.value) {
      leaveSheetPresence(currentSheetId);
    }
  });

  return { otherUsers, isAccessLost };
}
