import type { TrackerSlot } from '../model';

import { INITIATIVE_SLOT_STORAGE_KEY, parseTrackerSlot } from '../model';

/** Слот пишется JSON, читается через проверку схемы. */
const slotSerializer = {
  read: parseTrackerSlot,
  write: (value: TrackerSlot | null): string => JSON.stringify(value),
};

/**
 * Единственный трекер гостя: его id и ключ доступа в localStorage, как в
 * старом SPA. Ключ уходит в заголовке во все запросы к этому трекеру.
 */
export function useTrackerSlot() {
  const slot = useLocalStorage<TrackerSlot | null>(
    INITIATIVE_SLOT_STORAGE_KEY,
    null,
    { serializer: slotSerializer },
  );

  /**
   * Запоминает трекер гостя вместо прежнего.
   * @param trackerId - идентификатор трекера
   * @param accessKey - ключ из ответа на создание
   */
  function saveSlot(trackerId: string, accessKey: string): void {
    slot.value = { trackerId, accessKey };
  }

  function clearSlot(): void {
    slot.value = null;
  }

  /**
   * Ключ доступа, если трекер принадлежит гостю.
   * @param trackerId - идентификатор трекера
   */
  function getAccessKey(trackerId: string): string | undefined {
    return slot.value?.trackerId === trackerId
      ? slot.value.accessKey
      : undefined;
  }

  return { slot, saveSlot, clearSlot, getAccessKey };
}
