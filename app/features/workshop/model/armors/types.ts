/** Доспех из справочника, как его открывает редактор. */
export interface WorkshopArmor {
  id: number;
  name: string;
  englishName: string;
  /** Код категории доспеха. */
  type: string;
  armorClass: number | null;
  /** Цена в золотых. */
  cost: number | null;
  weight: number | null;
  forceRequirements: number | null;
  stealthHindrance: boolean;
  /** Блоки разметки core-api; пусто — описания нет. */
  description: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
}
