import type { BookSourceOption, RevisionInfo, SavedEntry } from './types';

import { z } from 'zod';

import { RevisionOperation } from './constants';

const revisionSchema = z.object({
  revision: z.number(),
  operation: z.enum(RevisionOperation),
  username: z.string().catch(''),
  createdAt: z.string().catch(''),
});

const bookSchema = z.object({
  name: z.object({ rus: z.string() }),
  source: z.object({ shortName: z.string().min(1) }),
});

const savedEntrySchema = z.object({
  name: z.object({ eng: z.string().min(1) }),
});

/**
 * Ревизии записи. Битые отбрасываются поштучно, чтобы одна запись не
 * прятала всю историю.
 * @param input - ответ сервера
 */
export function parseRevisions(input: unknown): Array<RevisionInfo> {
  return z
    .array(z.unknown())
    .catch([])
    .parse(input)
    .flatMap((item) => {
      const parsed = revisionSchema.safeParse(item);

      return parsed.success ? [parsed.data] : [];
    });
}

/**
 * Книги для выбора источника: «Название [MM]».
 * @param input - ответ сервера
 */
export function parseBookSources(input: unknown): Array<BookSourceOption> {
  return z
    .array(z.unknown())
    .catch([])
    .parse(input)
    .flatMap((item) => {
      const parsed = bookSchema.safeParse(item);

      if (!parsed.success) {
        return [];
      }

      const { name, source } = parsed.data;

      return [
        { label: `${name.rus} [${source.shortName}]`, value: source.shortName },
      ];
    });
}

/**
 * Сохранённая запись: из английского названия строится адрес её правки.
 * @param input - ответ сервера
 */
export function parseSavedEntry(input: unknown): SavedEntry {
  return { englishName: savedEntrySchema.parse(input).name.eng };
}
