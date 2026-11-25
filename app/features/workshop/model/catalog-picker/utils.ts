import type { CatalogPickerEntry } from './types';

import { z } from 'zod';

import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Запись списка раздела: поля, общие для всех разделов. */
export const catalogPickerLinkSchema = z.object({
  name: entryNameSchema,
  url: z.string(),
  source: entrySourceSchema.nullish(),
});

export type CatalogPickerLink = z.infer<typeof catalogPickerLinkSchema>;

/**
 * Адрес записи без раздела: хвост адреса страницы после `sectionPath/`.
 * Адрес другого раздела или пустой хвост не подходят.
 * @param pageUrl - адрес страницы записи: `/weapons/longsword`
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function getCatalogSlug(
  pageUrl: string | null | undefined,
  sectionPath: string,
): string | undefined {
  const prefix = `${sectionPath}/`;

  if (!pageUrl?.startsWith(prefix) || pageUrl.length === prefix.length) {
    return undefined;
  }

  return pageUrl.slice(prefix.length);
}

/**
 * Адреса записей одного раздела из ссылок, в их порядке; ссылки других
 * разделов и без адреса пропускаются.
 * @param links - ссылки на записи разных разделов
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function getCatalogSlugs(
  links: ReadonlyArray<{ url?: string | null }> | null | undefined,
  sectionPath: string,
): Array<string> {
  return (links ?? []).flatMap((link) => {
    const slug = getCatalogSlug(link.url, sectionPath);

    return slug ? [slug] : [];
  });
}

/**
 * Записи окна выбора из записей списка раздела; запись чужого раздела
 * пропускается.
 * @param links - записи списка раздела
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function toCatalogPickerEntries(
  links: ReadonlyArray<CatalogPickerLink>,
  sectionPath: string,
): Array<CatalogPickerEntry> {
  return links.flatMap((link) => {
    const slug = getCatalogSlug(link.url, sectionPath);

    return slug
      ? [
          {
            slug,
            name: link.name.rus,
            nameEng: link.name.eng,
            source: link.source,
          },
        ]
      : [];
  });
}

/**
 * Записи окна выбора из ответа ручки списка раздела.
 * @param input - ответ ручки списка
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function parseCatalogPickerEntries(
  input: unknown,
  sectionPath: string,
): Array<CatalogPickerEntry> {
  return toCatalogPickerEntries(
    z.array(catalogPickerLinkSchema).parse(input),
    sectionPath,
  );
}

/**
 * Отбирает записи по строке поиска в русском или английском названии, без
 * учёта регистра. Нужен вкладке «Выбранные»: серверный поиск ищет по
 * разделу, а не по отмеченному.
 * @param entries - записи
 * @param term - строка поиска
 */
export function searchCatalogPickerEntries(
  entries: ReadonlyArray<CatalogPickerEntry>,
  term: string,
): Array<CatalogPickerEntry> {
  const query = term.trim().toLowerCase();

  if (!query) {
    return [...entries];
  }

  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(query)
      || entry.nameEng.toLowerCase().includes(query),
  );
}
