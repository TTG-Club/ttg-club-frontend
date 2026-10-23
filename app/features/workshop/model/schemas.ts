import type {
  BookSourceOption,
  RevisionInfo,
  SavedEntry,
  SelectOption,
} from './types';

import { z } from 'zod';

import { RevisionOperation, WORKSHOP_VALIDATION } from './constants';

/** Обязательный текст формы. */
export const workshopRequiredText = z
  .string()
  .trim()
  .min(1, WORKSHOP_VALIDATION.required);

/** Необязательное положительное целое: уровень, страница. */
export const workshopOptionalPositive = z
  .number(WORKSHOP_VALIDATION.positive)
  .int(WORKSHOP_VALIDATION.positive)
  .min(1, WORKSHOP_VALIDATION.positive)
  .nullable();

/** Название из карточки справочника. */
export const workshopNameSchema = z.object({
  rus: z.string(),
  eng: z.string(),
});

/** Источник из карточки справочника. */
export const workshopSourceSchema = z
  .object({ shortName: z.string(), page: z.number().nullish() })
  .nullish();

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

/** Ответ сохранения: справочник отдаёт `name.eng`, боги — `englishName`. */
const savedEntrySchema = z.union([
  z
    .object({ name: z.object({ eng: z.string().min(1) }) })
    .transform((entry) => entry.name.eng),
  z
    .object({ englishName: z.string().min(1) })
    .transform((entry) => entry.englishName),
]);

const filterSchema = z.object({
  other: z
    .array(
      z.object({
        key: z.string(),
        values: z.array(
          z.object({
            key: z.union([z.string(), z.number()]),
            label: z.string(),
          }),
        ),
      }),
    )
    .catch([]),
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
  return { englishName: savedEntrySchema.parse(input) };
}

/**
 * Группы фильтров раздела: из них редакторы берут списки, чтобы они не
 * расходились с перечислениями бэкенда.
 * @param input - ответ ручки фильтров
 */
export function parseFilterGroups(
  input: unknown,
): Map<string, Array<SelectOption>> {
  const groups = filterSchema.safeParse(input).data?.other ?? [];

  return new Map(
    groups.map(({ key, values }) => [
      key,
      values.map((value) => ({ label: value.label, value: String(value.key) })),
    ]),
  );
}
