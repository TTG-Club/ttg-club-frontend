/** Источник (книга), как его открывает редактор. */
export interface WorkshopBook {
  /** Аббревиатура: ключ книги, не меняется. */
  source: string;
  name: string;
  englishName: string;
  altName: string;
  /** Тип книги из перечисления бэкенда: `OFFICAL`, `SETTING`… */
  type: string;
  year: number | null;
  description: string;
}
