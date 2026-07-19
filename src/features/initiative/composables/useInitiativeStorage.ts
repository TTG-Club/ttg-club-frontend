import type { AnonTrackerSlot } from '@/features/initiative/model';
import {
  ANON_SLOT_STORAGE_KEY,
  parseAnonTrackerSlot,
} from '@/features/initiative/model';

/**
 * Сериализатор слота: пишем JSON, читаем — через Zod-валидацию. Любое чужое или
 * повреждённое значение из localStorage превращаем в `null` (слота нет), не
 * доверяя его форме вслепую.
 */
const slotSerializer = {
  read: (raw: string): AnonTrackerSlot | null => {
    try {
      return parseAnonTrackerSlot(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  write: (value: AnonTrackerSlot | null): string => JSON.stringify(value),
};

/**
 * Управляет единственным слотом анонимного трекера в localStorage.
 *
 * Аноним может владеть лишь одним трекером — лимит держит фронт: один слот
 * `{ trackerId, accessKey }`. Ключ доступа передаётся в заголовке
 * `X-Tracker-Key` во все запросы к этому трекеру.
 */
export function useInitiativeStorage() {
  const slot = useLocalStorage<AnonTrackerSlot | null>(
    ANON_SLOT_STORAGE_KEY,
    null,
    { serializer: slotSerializer },
  );

  /**
   * Сохраняет слот анонимного трекера (перезаписывает предыдущий).
   * @param trackerId Идентификатор трекера.
   * @param accessKey Ключ доступа из ответа на создание.
   */
  function saveSlot(trackerId: string, accessKey: string): void {
    slot.value = { trackerId, accessKey };
  }

  /**
   * Очищает слот (при потере ключа/удалении трекера).
   */
  function clearSlot(): void {
    slot.value = null;
  }

  /**
   * Возвращает ключ доступа, если трекер принадлежит анонимному слоту.
   * @param trackerId Идентификатор трекера.
   */
  function keyForTracker(trackerId: string): string | undefined {
    return slot.value?.trackerId === trackerId
      ? slot.value.accessKey
      : undefined;
  }

  return {
    slot,
    saveSlot,
    clearSlot,
    keyForTracker,
  };
}
