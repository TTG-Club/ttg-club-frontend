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

/** Последний сегмент ручки обложки источника. */
export const BOOK_COVER_SEGMENT = 'cover';

/** Подписи обложки источника в редакторе. */
export const BOOK_COVER_TEXT = {
  title: 'Обложка',
  description:
    'Показывается в списке источников и в карточке. Файл перекодируется в WebP, новый заменяет прежний. Изменения сохраняются сразу.',
  missing: 'Обложки пока нет',
  upload: 'Загрузить обложку',
  remove: 'Удалить',
  uploaded: 'Обложка обновлена',
  removed: 'Обложка удалена',
  uploadError: 'Не удалось загрузить обложку',
  removeError: 'Не удалось удалить обложку',
  removeTitle: 'Удалить обложку?',
  removeDescription: 'Файл обложки удалится из хранилища.',
  alt: 'Обложка источника',
} as const;
