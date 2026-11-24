/** Правило или термин из справочника, как его открывает редактор. */
export interface WorkshopRule {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Категория: «Бой», «Состояния». */
  type: string;
  /** Блоки разметки core-api. */
  description: Array<string>;
  page: number | null;
  /** Аббревиатура книги-источника. */
  source?: string;
}
