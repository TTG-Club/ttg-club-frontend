import type { ParticipantValues, TrackerParticipant } from '../model';

import { parseParticipantValues } from '../model';

/** Значения пишутся JSON, читаются через проверку схемы. */
const valuesSerializer = {
  read: parseParticipantValues,
  write: (value: ParticipantValues): string => JSON.stringify(value),
};

/**
 * Числа участников в localStorage ведущего, по трекерам: на бэкенде их нет,
 * поэтому на другом устройстве они начнутся заново. Записи убранных
 * участников вычищаются.
 * @param storageKey - ключ хранилища
 * @param getTrackerId - идентификатор трекера
 * @param getParticipants - текущие участники
 */
export function useParticipantValues(
  storageKey: string,
  getTrackerId: () => string,
  getParticipants: () => ReadonlyArray<TrackerParticipant>,
) {
  const store = useLocalStorage<ParticipantValues>(
    storageKey,
    {},
    { serializer: valuesSerializer },
  );

  /** Значения участников этого трекера; нет записи — значение по умолчанию. */
  const values = computed<Record<string, number>>(
    () => store.value[getTrackerId()] ?? {},
  );

  /**
   * Записывает значение участника.
   * @param participantId - идентификатор участника
   * @param value - новое значение
   */
  function setValue(participantId: string, value: number): void {
    const trackerId = getTrackerId();

    store.value = {
      ...store.value,
      [trackerId]: { ...store.value[trackerId], [participantId]: value },
    };
  }

  // Пустой список пропускаем: пока трекер грузится, участников ещё нет, и
  // записи стёрлись бы до прихода данных
  watch(
    () => getParticipants().map((participant) => participant.id),
    (ids) => {
      const bucket = store.value[getTrackerId()];

      if (!ids.length || !bucket) {
        return;
      }

      const activeIds = new Set(ids);

      const kept = Object.entries(bucket).filter(([participantId]) =>
        activeIds.has(participantId),
      );

      if (kept.length !== Object.keys(bucket).length) {
        store.value = {
          ...store.value,
          [getTrackerId()]: Object.fromEntries(kept),
        };
      }
    },
  );

  return { values, setValue };
}
