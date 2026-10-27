import type { z } from 'zod';

import type { Ref, ShallowRef } from 'vue';

import {
  fetchWorkshopPreview,
  getWorkshopErrorReason,
  WORKSHOP_ICON,
  WORKSHOP_TEXT,
} from '../model';

/** Возвращаемое значение useWorkshopPreview. */
export interface UseWorkshopPreviewReturn<T> {
  isPreviewOpen: Ref<boolean>;
  previewEntry: ShallowRef<T | undefined>;
  isPreviewLoading: Ref<boolean>;
  isPreviewError: Ref<boolean>;
  /**
   * Открывает дровер и собирает карточку по данным формы.
   * @param payload - данные формы, как при сохранении
   */
  showPreview: (payload: Record<string, unknown>) => Promise<void>;
}

/**
 * Предпросмотр записи мастерской, как на new.ttg.club: бэкенд собирает
 * карточку по данным формы без сохранения, она показывается в дровере.
 * @param apiSection - раздел в ручках мастерской
 * @param entryId - идентификатор записи при правке
 * @param schema - проверка карточки раздела
 */
export function useWorkshopPreview<T>(
  apiSection: string,
  entryId: () => number | undefined,
  schema: z.ZodType<T>,
): UseWorkshopPreviewReturn<T> {
  const toast = useToast();

  const isPreviewOpen = ref(false);
  const previewEntry = shallowRef<T>();
  const isPreviewLoading = ref(false);
  const isPreviewError = ref(false);

  async function showPreview(payload: Record<string, unknown>): Promise<void> {
    isPreviewOpen.value = true;
    isPreviewLoading.value = true;
    isPreviewError.value = false;
    previewEntry.value = undefined;

    try {
      previewEntry.value = schema.parse(
        await fetchWorkshopPreview(apiSection, payload, entryId()),
      );
    } catch (error) {
      isPreviewError.value = true;

      toast.add({
        title: WORKSHOP_TEXT.previewError,
        description: getWorkshopErrorReason(error),
        color: 'error',
        icon: WORKSHOP_ICON.error,
      });
    } finally {
      isPreviewLoading.value = false;
    }
  }

  return {
    isPreviewOpen,
    previewEntry,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  };
}
