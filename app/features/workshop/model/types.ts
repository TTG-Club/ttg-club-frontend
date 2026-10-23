import type { RevisionOperation } from './constants';

/** Ревизия записи. */
export interface RevisionInfo {
  revision: number;
  operation: RevisionOperation;
  username: string;
  /** Дата ревизии строкой ISO. */
  createdAt: string;
}

/** Книга в выборе источника: подпись и аббревиатура. */
export interface BookSourceOption {
  label: string;
  /** Аббревиатура книги (`MM`): по ней бэкенд ищет источник. */
  value: string;
}

/** Ответ мастерской после сохранения: адрес записи строится из него. */
export interface SavedEntry {
  englishName: string;
}
