/** Черта из справочника, как её открывает редактор. */
export interface WorkshopFeat {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  level: number | null;
  /** Требования; пусто, если их нет. */
  requirement: string;
  description: string;
  /** Коды характеристик. */
  abilities: Array<string>;
  /** Коды навыков. */
  skills: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
}
