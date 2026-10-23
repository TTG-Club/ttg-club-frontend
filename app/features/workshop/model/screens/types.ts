/** Родительский раздел ширмы: форма показывает его ссылкой. */
export interface WorkshopScreenParent {
  id: number;
  name: string;
  /** Адрес страницы раздела. */
  url: string;
}

/** Раздел ширмы мастера из справочника, как его открывает редактор. */
export interface WorkshopScreen {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  category: string;
  description: string;
  icon: string;
  /** Порядок среди разделов ширмы. */
  order: number | null;
  /** Аббревиатура книги-источника. */
  source?: string;
  parent?: WorkshopScreenParent;
}
