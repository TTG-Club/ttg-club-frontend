import type { SavedEntry } from '../types';
import type { BookForm } from './schemas';
import type { WorkshopBook } from './types';

import { WORKSHOP_API_PATH } from '../constants';
import { parseSavedEntry } from '../schemas';
import { toOptionalNumber, toOptionalText } from '../utils';
import { BOOKS_WORKSHOP_KEY } from './constants';

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
    description: book.description,
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
    description: toOptionalText(form.description),
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
  return parseSavedEntry(
    await $fetch<unknown>(
      `${WORKSHOP_API_PATH}/${BOOKS_WORKSHOP_KEY}/${encodeURIComponent(source)}`,
      { method: 'PATCH', body: payload },
    ),
  );
}
