import type { WorkshopImageType } from './constants';
import type { WorkshopCover } from './types';

import {
  WORKSHOP_IMAGES_API_PATH,
  WORKSHOP_IMAGES_COVER_SEGMENT,
} from './constants';
import { parseWorkshopCover, parseWorkshopGallery } from './schemas';

/**
 * Адрес ручки картинок записи: `/api/v1/workshop/images/CREATURE/12`.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 */
function getEntryImagesPath(type: WorkshopImageType, entryId: number): string {
  return `${WORKSHOP_IMAGES_API_PATH}/${type}/${entryId}`;
}

/**
 * Тело multipart-запроса с одним файлом в поле `file`.
 * @param file - выбранный файл
 */
function createFileBody(file: File): FormData {
  const body = new FormData();

  body.append('file', file);

  return body;
}

/**
 * Галерея записи.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 */
export async function fetchWorkshopGallery(
  type: WorkshopImageType,
  entryId: number,
): Promise<Array<string>> {
  return parseWorkshopGallery(
    await $fetch<unknown>(getEntryImagesPath(type, entryId)),
  );
}

/**
 * Заменяет галерею записи: порядок списка становится порядком картинок.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 * @param images - адреса картинок
 */
export async function saveWorkshopGallery(
  type: WorkshopImageType,
  entryId: number,
  images: ReadonlyArray<string>,
): Promise<Array<string>> {
  return parseWorkshopGallery(
    await $fetch<unknown>(getEntryImagesPath(type, entryId), {
      method: 'PUT',
      body: { images },
    }),
  );
}

/**
 * Загружает картинку в конец галереи записи.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 * @param file - выбранный файл
 */
export async function uploadWorkshopGalleryImage(
  type: WorkshopImageType,
  entryId: number,
  file: File,
): Promise<Array<string>> {
  return parseWorkshopGallery(
    await $fetch<unknown>(getEntryImagesPath(type, entryId), {
      method: 'POST',
      body: createFileBody(file),
    }),
  );
}

/**
 * Обложка класса или расы.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 */
export async function fetchWorkshopCover(
  type: WorkshopImageType,
  entryId: number,
): Promise<WorkshopCover> {
  return parseWorkshopCover(
    await $fetch<unknown>(
      `${getEntryImagesPath(type, entryId)}/${WORKSHOP_IMAGES_COVER_SEGMENT}`,
    ),
  );
}

/**
 * Загружает обложку класса или основной расы вместо прежней.
 * @param type - раздел записи
 * @param entryId - идентификатор записи
 * @param file - выбранный файл
 */
export async function uploadWorkshopCover(
  type: WorkshopImageType,
  entryId: number,
  file: File,
): Promise<WorkshopCover> {
  return parseWorkshopCover(
    await $fetch<unknown>(
      `${getEntryImagesPath(type, entryId)}/${WORKSHOP_IMAGES_COVER_SEGMENT}`,
      { method: 'POST', body: createFileBody(file) },
    ),
  );
}
