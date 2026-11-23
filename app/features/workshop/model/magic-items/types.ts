import type { MagicItemMechanicsForm } from '../mechanics';

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
  /** Уточнение типа: «любой меч», блоки разметки core-api. */
  special: Array<string>;
  customization: boolean;
  /** Условие настройки: «волшебником», блоки разметки core-api. */
  custSpecial: Array<string>;
  consumed: boolean;
  curse: boolean;
  charge: number | null;
  /** Цена в золотых. */
  cost: number | null;
  bonus: number | null;
  /** Блоки разметки core-api. */
  description: Array<string>;
  /** Механика для листа персонажа; эффекты предмета лежат в ней. */
  mechanics: MagicItemMechanicsForm;
  /** Аббревиатура книги-источника. */
  source?: string;
}
