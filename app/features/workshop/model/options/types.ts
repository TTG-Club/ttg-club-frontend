/** Особенность класса из справочника, как её открывает редактор. */
export interface WorkshopOption {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  level: number | null;
  /** Требования; пусто, если их нет. */
  prerequisite: string;
  description: string;
  /** Коды типов особенности. */
  optionTypes: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
}
