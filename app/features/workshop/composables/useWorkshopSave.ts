import type { Ref } from 'vue';

import type { SavedEntry } from '../model';

import { getApiErrorMessage } from '~user/model';

import {
  createWorkshopEntry,
  updateWorkshopEntry,
  WORKSHOP_ICON,
} from '../model';

/** Подписи уведомлений о сохранении. */
export interface WorkshopSaveTexts {
  created: string;
  saved: string;
  error: string;
}

/** Возвращаемое значение useWorkshopSave. */
export interface UseWorkshopSaveReturn {
  isSaving: Ref<boolean>;
  /**
   * Создаёт или обновляет запись и сообщает об итоге.
   * @returns сохранённая запись или `undefined` при ошибке
   */
  save: (payload: Record<string, unknown>) => Promise<SavedEntry | undefined>;
}

/**
 * HTML-страница ошибки (ответ прокси) в причину не выводится.
 * @param error - пойманная ошибка
 */
function getErrorReason(error: unknown): string | undefined {
  const reason = getApiErrorMessage(error, '').trim();

  return reason && !reason.startsWith('<') ? reason : undefined;
}

/**
 * Сохранение записи мастерской: без идентификатора — создание.
 * @param sectionKey - раздел мастерской
 * @param entryId - идентификатор записи при правке
 * @param texts - подписи уведомлений
 */
export function useWorkshopSave(
  sectionKey: string,
  entryId: () => number | undefined,
  texts: WorkshopSaveTexts,
): UseWorkshopSaveReturn {
  const toast = useToast();
  const isSaving = ref(false);

  async function save(
    payload: Record<string, unknown>,
  ): Promise<SavedEntry | undefined> {
    const id = entryId();

    isSaving.value = true;

    try {
      const saved =
        id === undefined
          ? await createWorkshopEntry(sectionKey, payload)
          : await updateWorkshopEntry(sectionKey, id, payload);

      toast.add({
        title: id === undefined ? texts.created : texts.saved,
        color: 'success',
        icon: WORKSHOP_ICON.success,
      });

      return saved;
    } catch (error) {
      toast.add({
        title: texts.error,
        description: getErrorReason(error),
        color: 'error',
        icon: WORKSHOP_ICON.error,
      });

      return undefined;
    } finally {
      isSaving.value = false;
    }
  }

  return { isSaving, save };
}
