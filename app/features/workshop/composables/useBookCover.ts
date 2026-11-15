import type { Ref } from 'vue';

import {
  BOOK_COVER_TEXT,
  getWorkshopErrorReason,
  isWorkshopImageTooLarge,
  removeBookCover,
  uploadBookCover,
  WORKSHOP_ICON,
  WORKSHOP_IMAGE_ACCEPT,
  WORKSHOP_IMAGE_TEXT,
} from '../model';

/** Возвращаемое значение useBookCover. */
export interface UseBookCoverReturn {
  /** Адрес обложки или `undefined`, если её нет. */
  cover: Ref<string | undefined>;
  /** Идёт загрузка или удаление: кнопки блокируются. */
  isBusy: Ref<boolean>;
  /** Открывает выбор файла обложки. */
  pickFile: () => void;
  remove: () => Promise<void>;
}

/**
 * Обложка источника в мастерской: загрузка и удаление уходят на бэкенд
 * сразу, отдельно от формы книги.
 * @param source - аббревиатура источника
 * @param initialCover - адрес обложки, с которым открыт редактор
 */
export function useBookCover(
  source: () => string,
  initialCover: string | null,
): UseBookCoverReturn {
  const toast = useToast();

  const cover = ref<string | undefined>(initialCover ?? undefined);
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

  /**
   * Загружает обложку вместо прежней.
   * @param file - выбранный файл
   */
  async function upload(file: File): Promise<void> {
    if (isWorkshopImageTooLarge(file)) {
      notifyError(BOOK_COVER_TEXT.uploadError, WORKSHOP_IMAGE_TEXT.tooLarge);

      return;
    }

    isBusy.value = true;

    try {
      cover.value = await uploadBookCover(source(), file);
      notifySuccess(BOOK_COVER_TEXT.uploaded);
    } catch (error) {
      notifyError(BOOK_COVER_TEXT.uploadError, error);
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
      await removeBookCover(source());
      cover.value = undefined;
      notifySuccess(BOOK_COVER_TEXT.removed);
    } catch (error) {
      notifyError(BOOK_COVER_TEXT.removeError, error);
    } finally {
      isBusy.value = false;
    }
  }

  return { cover, isBusy, pickFile, remove };
}
