/** Магический предмет из справочника, как его открывает редактор. */
export interface WorkshopMagicItem {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Код редкости. */
  rarity: string;
  /** Код типа предмета. */
  type: string;
  /** Уточнение типа: «любой меч». */
  special: string;
  customization: boolean;
  /** Условие настройки: «волшебником». */
  custSpecial: string;
  consumed: boolean;
  curse: boolean;
  charge: number | null;
  /** Цена в золотых. */
  cost: number | null;
  bonus: number | null;
  description: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
