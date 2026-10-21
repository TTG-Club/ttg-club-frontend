import type { BookLink, GodLink } from './schema';

import { capitalize } from 'es-toolkit';

import { WIKI_LIST_SEPARATOR } from './constants';

/**
 * Группа бога в списке — его мировоззрение, как в старом SPA.
 * @param god - бог из списка
 */
export function getGodGroup(god: GodLink): string {
  return capitalize(god.alignment);
}

/**
 * Группа источника в списке — тип книги.
 * @param book - источник из списка
 */
export function getBookGroup(book: BookLink): string {
  return book.type.name;
}

/**
 * Собирает значения свойства в строку; пустой список — пустая строка.
 * @param values - значения свойства
 */
export function joinWikiList(values?: Array<string> | null): string {
  return values?.join(WIKI_LIST_SEPARATOR) ?? '';
}
