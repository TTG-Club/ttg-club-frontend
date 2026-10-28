import type { EntryName } from '~section/model';

import type { TypedLink } from './schema';

/** Компонент заклинания в карточке: подпись и подсказка с правилом. */
export interface SpellComponentLabel {
  key: string;
  label: string;
  hint: string;
}

/** Ссылки одного типа книги: основные, UA, хомбрю. */
export interface TypedLinkGroup {
  name: string;
  items: Array<TypedLink>;
}

/** Свойство расы в колонке слева: подпись и значение. */
export interface RaceStat {
  key: string;
  label: string;
  value: string;
}

/** Раса или класс в списке: основные без группы, остальные в группах. */
export interface GroupedLink {
  name: EntryName;
  group?: { name: string; order: number } | null;
}

/** Вкладка страницы класса после разбора ответа API. */
export interface ClassTab {
  /** Ключ вкладки: тип и порядок, у двух вкладок особенностей типы совпадают. */
  key: string;
  name: string;
  /** Ручка фильтра, в которой скрыто выбран сам класс. */
  filterUrl: string;
}
