import type { EntrySource } from '~section/model';

/** Запись раздела в окне выбора и в поле мастерской. */
export interface CatalogPickerEntry {
  /** Адрес страницы записи без раздела: `longsword`. Он же значение поля. */
  slug: string;
  /** Русское название — по нему и выбирают. */
  name: string;
  /** Английское название; пусто — неизвестно. */
  nameEng: string;
  /** Источник; нет — неизвестен. */
  source?: EntrySource | null;
}
