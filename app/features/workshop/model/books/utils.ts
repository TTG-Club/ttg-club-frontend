import type { SavedEntry } from '../types';
import type { BookForm } from './schemas';
import type { WorkshopBook } from './types';

import { WORKSHOP_API_PATH } from '../constants';
import { WORKSHOP_IMAGES_API_PATH } from '../images';
import { parseSavedEntry } from '../schemas';
import { toOptionalMarkup, toOptionalNumber, toOptionalText } from '../utils';
import { BOOK_COVER_SEGMENT, BOOKS_WORKSHOP_KEY } from './constants';
import { parseBookCover } from './schemas';

/**
 * Форма источника, заполненная записью.
 * @param book - источник
 */
export function createBookForm(book: WorkshopBook): BookForm {
  return {
    name: book.name,
    englishName: book.englishName,
    altName: book.altName,
    type: book.type,
    year: book.year,
    description: [...book.description],
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 */
export function getBookPayload(form: BookForm): Record<string, unknown> {
  return {
    ...form,
    altName: toOptionalText(form.altName),
    year: toOptionalNumber(form.year),
    description: toOptionalMarkup(form.description),
  };
}

/**
 * Сохраняет правку источника. Ключ книги — аббревиатура, а не число,
 * поэтому общая ручка правки мастерской не подходит.
 * @param source - аббревиатура источника
 * @param payload - данные формы
 */
export async function updateWorkshopBook(
  source: string,
  payload: Record<string, unknown>,
): Promise<SavedEntry> {
  const api = useApi();

  return parseSavedEntry(
    await api<unknown>(
      `${WORKSHOP_API_PATH}/${BOOKS_WORKSHOP_KEY}/${encodeURIComponent(source)}`,
      { method: 'PATCH', body: payload },
    ),
  );
}

/**
 * Адрес ручки обложки: `/api/v1/workshop/images/books/PHB/cover`.
 * @param source - аббревиатура источника
 */
function getBookCoverPath(source: string): string {
  return `${WORKSHOP_IMAGES_API_PATH}/${BOOKS_WORKSHOP_KEY}/${encodeURIComponent(source)}/${BOOK_COVER_SEGMENT}`;
}

/**
 * Загружает обложку источника вместо прежней.
 * @param source - аббревиатура источника
 * @param file - выбранный файл
 * @returns адрес новой обложки с меткой версии
 */
export async function uploadBookCover(
  source: string,
  file: File,
): Promise<string> {
  const body = new FormData();

  body.append('file', file);

  return parseBookCover(
    await $fetch<unknown>(getBookCoverPath(source), { method: 'POST', body }),
  );
}

/**
 * Удаляет обложку источника.
 * @param source - аббревиатура источника
 */
export async function removeBookCover(source: string): Promise<void> {
  await $fetch(getBookCoverPath(source), { method: 'DELETE' });
}
