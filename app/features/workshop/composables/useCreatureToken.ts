import type { Ref } from 'vue';

import {
  fetchCreatureToken,
  getWorkshopErrorReason,
  isWorkshopImageTooLarge,
  removeCreatureToken,
  uploadCreatureToken,
  WORKSHOP_ICON,
  WORKSHOP_IMAGE_ACCEPT,
  WORKSHOP_IMAGE_TEXT,
  WORKSHOP_TOKEN_TEXT,
} from '../model';

/** Возвращаемое значение useCreatureToken. */
export interface UseCreatureTokenReturn {
  /** Адрес токена или `undefined`, если его нет. */
  token: Ref<string | undefined>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  /** Идёт загрузка или удаление: кнопки блокируются. */
  isBusy: Ref<boolean>;
  load: () => Promise<void>;
  /** Открывает выбор файла токена. */
  pickFile: () => void;
  remove: () => Promise<void>;
}

/**
 * Круглый токен существа в мастерской: карточка существа показывает его
 * первой картинкой. Загрузка и удаление уходят на бэкенд сразу, отдельно
 * от формы существа.
 * @param creatureId - идентификатор существа
 */
export function useCreatureToken(
  creatureId: () => number,
): UseCreatureTokenReturn {
  const toast = useToast();

  const token = ref<string>();
  const isLoading = ref(true);
  const isError = ref(false);
  const isBusy = ref(false);

  const dialog = useFileDialog({
    accept: WORKSHOP_IMAGE_ACCEPT,
    multiple: false,
    reset: true,
  });

  /**
   * Уведомление об ошибке с причиной от бэкенда.
   * @param title - заголовок уведомления
   * @param error - пойманная ошибка или своя причина
   */
  function notifyError(title: string, error: unknown): void {
    toast.add({
      title,
      description:
        typeof error === 'string' ? error : getWorkshopErrorReason(error),
      color: 'error',
      icon: WORKSHOP_ICON.error,
    });
  }

  /**
   * Уведомление об успехе.
   * @param title - заголовок уведомления
   */
  function notifySuccess(title: string): void {
    toast.add({ title, color: 'success', icon: WORKSHOP_ICON.success });
  }

  async function load(): Promise<void> {
    isLoading.value = true;
    isError.value = false;

    try {
      token.value = await fetchCreatureToken(creatureId());
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загружает токен вместо прежнего.
   * @param file - выбранный файл
   */
  async function upload(file: File): Promise<void> {
    if (isWorkshopImageTooLarge(file)) {
      notifyError(
        WORKSHOP_TOKEN_TEXT.uploadError,
        WORKSHOP_IMAGE_TEXT.tooLarge,
      );

      return;
    }

    isBusy.value = true;

    try {
      token.value = await uploadCreatureToken(creatureId(), file);
      notifySuccess(WORKSHOP_TOKEN_TEXT.uploaded);
    } catch (error) {
      notifyError(WORKSHOP_TOKEN_TEXT.uploadError, error);
    } finally {
      isBusy.value = false;
    }
  }

  dialog.onChange((files) => {
    const file = files?.item(0);

    if (file) {
      void upload(file);
    }
  });

  function pickFile(): void {
    dialog.open();
  }

  async function remove(): Promise<void> {
    isBusy.value = true;

    try {
      await removeCreatureToken(creatureId());
      token.value = undefined;
      notifySuccess(WORKSHOP_TOKEN_TEXT.removed);
    } catch (error) {
      notifyError(WORKSHOP_TOKEN_TEXT.removeError, error);
    } finally {
      isBusy.value = false;
    }
  }

  return { token, isLoading, isError, isBusy, load, pickFile, remove };
}
