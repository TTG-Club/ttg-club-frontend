import type { WorkshopBook } from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import { workshopOptionalPositive, workshopRequiredText } from '../schemas';

const workshopBookSchema = z.object({
  source: z.string().min(1),
  name: z.string().nullish(),
  englishName: z.string().nullish(),
  altName: z.string().nullish(),
  type: z.string().nullish(),
  year: z.number().nullish(),
  description: z.string().nullish(),
});

/**
 * Источник из ручки правки для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopBook(input: unknown): WorkshopBook {
  const book = workshopBookSchema.parse(input);

  return {
    source: book.source,
    name: book.name ?? '',
    englishName: book.englishName ?? '',
    altName: book.altName ?? '',
    type: book.type ?? '',
    year: book.year ?? null,
    description: book.description ?? '',
  };
}

/** Форма источника: те же поля, что принимает бэкенд. */
export const bookFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  type: z.string().min(1, WORKSHOP_VALIDATION.required),
  year: workshopOptionalPositive,
  description: z.string(),
});

export type BookForm = z.infer<typeof bookFormSchema>;
