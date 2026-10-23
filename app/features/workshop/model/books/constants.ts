import type { SelectOption } from '../types';

/** Ключ раздела источников в мастерской: и в адресе, и в ручках. */
export const BOOKS_WORKSHOP_KEY = 'books';

/** Типы источников, как их называет бэкенд. */
export const BOOK_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Базовые', value: 'OFFICAL' },
  { label: 'Приключения', value: 'MODULE' },
  { label: 'Сеттинги', value: 'SETTING' },
  { label: 'Unearthed Arcana', value: 'TEST' },
  { label: '3rd party', value: 'THIRD_PARTY' },
  { label: 'Homebrew', value: 'CUSTOM' },
];

/** Подписи редактора источников. */
export const BOOK_EDITOR_TEXT = {
  editTitle: 'Редактирование источника',
  source: 'Аббревиатура',
  sourceHelp: 'Ключ источника, на него ссылаются записи: не меняется',
  type: 'Тип',
  year: 'Год издания',
  saved: 'Источник обновлён',
  saveError: 'Не удалось сохранить источник',
} as const;

/** Строки описания источника в редакторе. */
export const BOOK_DESCRIPTION_ROWS = 18;
