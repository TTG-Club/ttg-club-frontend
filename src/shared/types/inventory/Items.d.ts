import type { TName, TSource } from '@/shared/types/BaseApiFields';

export enum ItemsFilterDefaults {
  dbName = 'items',
  url = '/filters/items',
}

export interface EquipmentItem {
  id: number;
  name: TName;
  price?: string;
  cost?: number;
  currency?: string;
  weight?: number;
  description?: string;
  altName?: string;
  /** Названия категорий по-русски, для отображения */
  categories?: Array<string>;
  /** Те же категории значениями enum, для редактора */
  categoriesRaw?: Array<string>;
  source: TSource;
}

export interface EquipmentSave {
  name: string;
  englishName: string;
  altName?: string;
  cost?: number;
  currency?: string;
  weight?: number;
  description?: string;
  categories: Array<string>;
  /** Аббревиатура книги-источника, например MM */
  source?: string;
}
