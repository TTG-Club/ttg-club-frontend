import type { ComputedRef, Ref } from 'vue';

import type { WorkshopCover, WorkshopImageType } from '../model';

import {
  fetchWorkshopCover,
  fetchWorkshopGallery,
  getWorkshopErrorReason,
  moveGalleryImage,
  removeGalleryImage,
  saveWorkshopGallery,
  uploadWorkshopCover,
  uploadWorkshopGalleryImage,
  WORKSHOP_COVER_IMAGE_TYPES,
  WORKSHOP_ICON,
  WORKSHOP_IMAGE_ACCEPT,
  WORKSHOP_IMAGE_LIMIT,
  WORKSHOP_IMAGE_TEXT,
} from '../model';

/** Возвращаемое значение useWorkshopImages. */
export interface UseWorkshopImagesReturn {
  gallery: Ref<Array<string>>;
  cover: Ref<WorkshopCover | undefined>;
  /** Есть ли у записей раздела обложка карточки. */
  hasCover: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  /** Идёт загрузка файла или сохранение галереи: кнопки блокируются. */
  isBusy: Ref<boolean>;
  isGalleryFull: ComputedRef<boolean>;
  load: () => Promise<void>;
  /** Открывает выбор файлов для галереи. */
  pickGalleryFiles: () => void;
  /** Открывает выбор файла обложки. */
  pickCoverFile: () => void;
  /**
   * Переставляет картинку на соседнее место и сохраняет галерею.
   * @param index - номер картинки
   * @param offset - `-1` — раньше, `1` — позже
   */
  move: (index: number, offset: -1 | 1) => Promise<void>;
  /**
   * Убирает картинку из галереи и сохраняет её.
   * @param index - номер картинки
   */
  remove: (index: number) => Promise<void>;
}

/**
 * Файл, который бэкенд точно не примет по размеру: о нём сообщаем сразу,
 * не отправляя запрос.
 * @param file - выбранный файл
 */
function isTooLarge(file: File): boolean {
  return file.size > WORKSHOP_IMAGE_LIMIT.maxBytes;
}

/**
 * Картинки записи мастерской: галерея (таблица `images`) и, у классов и
 * рас, обложка карточки. Всё сохраняется сразу, отдельно от формы записи.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 */
export function useWorkshopImages(
  type: () => WorkshopImageType,
  entryId: () => number,
): UseWorkshopImagesReturn {
  const toast = useToast();

  const gallery = ref<Array<string>>([]);
  const cover = ref<WorkshopCover>();
  const isLoading = ref(true);
  const isError = ref(false);
  const isBusy = ref(false);

  const hasCover = computed(() => WORKSHOP_COVER_IMAGE_TYPES.has(type()));

  const isGalleryFull = computed(
    () => gallery.value.length >= WORKSHOP_IMAGE_LIMIT.maxGallery,
  );

  const galleryDialog = useFileDialog({
    accept: WORKSHOP_IMAGE_ACCEPT,
    multiple: true,
    reset: true,
  });

  const coverDialog = useFileDialog({
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
      const [images, entryCover] = await Promise.all([
        fetchWorkshopGallery(type(), entryId()),
        hasCover.value
          ? fetchWorkshopCover(type(), entryId())
          : Promise.resolve(undefined),
      ]);

      gallery.value = images;
      cover.value = entryCover;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загружает выбранные файлы в галерею по одному: порядок файлов
   * сохраняется, ошибка одного файла не останавливает остальные.
   * @param files - выбранные файлы
   */
  async function uploadGalleryFiles(files: ReadonlyArray<File>): Promise<void> {
    isBusy.value = true;

    try {
      for (const file of files) {
        if (isGalleryFull.value) {
          notifyError(
            WORKSHOP_IMAGE_TEXT.uploadError,
            WORKSHOP_IMAGE_TEXT.galleryFull,
          );

          return;
        }

        if (isTooLarge(file)) {
          notifyError(
            `${WORKSHOP_IMAGE_TEXT.uploadError}: ${file.name}`,
            WORKSHOP_IMAGE_TEXT.tooLarge,
          );

          continue;
        }

        try {
          gallery.value = await uploadWorkshopGalleryImage(
            type(),
            entryId(),
            file,
          );

          notifySuccess(WORKSHOP_IMAGE_TEXT.uploaded);
        } catch (error) {
          notifyError(
            `${WORKSHOP_IMAGE_TEXT.uploadError}: ${file.name}`,
            error,
          );
        }
      }
    } finally {
      isBusy.value = false;
    }
  }

  /**
   * Загружает обложку вместо прежней.
   * @param file - выбранный файл
   */
  async function uploadCoverFile(file: File): Promise<void> {
    if (isTooLarge(file)) {
      notifyError(
        WORKSHOP_IMAGE_TEXT.uploadError,
        WORKSHOP_IMAGE_TEXT.tooLarge,
      );

      return;
    }

    isBusy.value = true;

    try {
      cover.value = await uploadWorkshopCover(type(), entryId(), file);
      notifySuccess(WORKSHOP_IMAGE_TEXT.coverUploaded);
    } catch (error) {
      notifyError(WORKSHOP_IMAGE_TEXT.uploadError, error);
    } finally {
      isBusy.value = false;
    }
  }

  galleryDialog.onChange((files) => {
    if (files?.length) {
      void uploadGalleryFiles(Array.from(files));
    }
  });

  coverDialog.onChange((files) => {
    const file = files?.item(0);

    if (file) {
      void uploadCoverFile(file);
    }
  });

  /**
   * Сохраняет новый порядок или состав галереи. При ошибке галерея
   * остаётся прежней.
   * @param images - адреса картинок
   * @param successTitle - подпись уведомления об успехе
   */
  async function saveGallery(
    images: Array<string>,
    successTitle: string,
  ): Promise<void> {
    isBusy.value = true;

    try {
      gallery.value = await saveWorkshopGallery(type(), entryId(), images);
      notifySuccess(successTitle);
    } catch (error) {
      notifyError(WORKSHOP_IMAGE_TEXT.saveError, error);
    } finally {
      isBusy.value = false;
    }
  }

  async function move(index: number, offset: -1 | 1): Promise<void> {
    await saveGallery(
      moveGalleryImage(gallery.value, index, offset),
      WORKSHOP_IMAGE_TEXT.saved,
    );
  }

  async function remove(index: number): Promise<void> {
    await saveGallery(
      removeGalleryImage(gallery.value, index),
      WORKSHOP_IMAGE_TEXT.removed,
    );
  }

  function pickGalleryFiles(): void {
    galleryDialog.open();
  }

  function pickCoverFile(): void {
    coverDialog.open();
  }

  return {
    gallery,
    cover,
    hasCover,
    isLoading,
    isError,
    isBusy,
    isGalleryFull,
    load,
    pickGalleryFiles,
    pickCoverFile,
    move,
    remove,
  };
}
