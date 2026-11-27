import type { SelectOption } from '../types';

import { z } from 'zod';

const baseItemLinkSchema = z.object({
  name: z.object({ rus: z.string() }),
  url: z.string(),
});

/**
 * Адрес основы в запросе: хвост адреса страницы после `sectionPath/`.
 * Чужой адрес (другой раздел, пустой) не подходит.
 * @param pageUrl - адрес страницы оружия или доспеха: `/weapons/longsword`
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function getBaseItemUrl(
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
 * Адреса основы одного раздела из ссылок `detailType` карточки предмета, в
 * их порядке.
 * @param links - ссылки на оружие и доспехи предмета
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function getBaseItemUrls(
  links: ReadonlyArray<{ url?: string | null }> | null | undefined,
  sectionPath: string,
): Array<string> {
  return (links ?? []).flatMap((link) => {
    const url = getBaseItemUrl(link.url, sectionPath);

    return url ? [url] : [];
  });
}

/**
 * Пункты выбора основы из списка раздела оружия или доспехов: подпись —
 * русское название, значение — адрес для запроса.
 * @param input - ответ ручки списка раздела
 * @param sectionPath - адрес раздела: `/weapons`
 */
export function parseBaseItemOptions(
  input: unknown,
  sectionPath: string,
): Array<SelectOption> {
  return z
    .array(baseItemLinkSchema)
    .parse(input)
    .flatMap((link) => {
      const value = getBaseItemUrl(link.url, sectionPath);

      return value ? [{ label: link.name.rus, value }] : [];
    });
}
