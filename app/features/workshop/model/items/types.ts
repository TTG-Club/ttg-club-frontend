/** Снаряжение из справочника, как его открывает редактор. */
export interface WorkshopItem {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Коды категорий. */
  categories: Array<string>;
  cost: number | null;
  currency: string;
  weight: number | null;
  description: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
