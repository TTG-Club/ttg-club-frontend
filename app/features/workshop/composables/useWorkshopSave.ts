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

/** Запрос сохранения: без идентификатора — создание. */
export type WorkshopSaveRequest = (
  payload: Record<string, unknown>,
  entryId: number | undefined,
) => Promise<SavedEntry>;

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
 * @param apiSection - раздел в ручках мастерской
 * @param entryId - идентификатор записи при правке
 * @param texts - подписи уведомлений
 * @param request - свой запрос, если раздел сохраняется не ручками мастерской
 */
export function useWorkshopSave(
  apiSection: string,
  entryId: () => number | undefined,
  texts: WorkshopSaveTexts,
  request?: WorkshopSaveRequest,
): UseWorkshopSaveReturn {
  const toast = useToast();
  const isSaving = ref(false);

  /**
   * Сохранение ручками мастерской.
   * @param payload - данные формы
   * @param id - идентификатор записи при правке
   */
  async function saveWorkshopEntry(
    payload: Record<string, unknown>,
    id: number | undefined,
  ): Promise<SavedEntry> {
    return id === undefined
      ? await createWorkshopEntry(apiSection, payload)
      : await updateWorkshopEntry(apiSection, id, payload);
  }

  async function save(
    payload: Record<string, unknown>,
  ): Promise<SavedEntry | undefined> {
    const id = entryId();

    isSaving.value = true;

    try {
      const saved = await (request ?? saveWorkshopEntry)(payload, id);

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
