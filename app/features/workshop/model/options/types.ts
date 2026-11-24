import type { WorkshopMechanicsFields } from '../mechanics';

/** Особенность класса из справочника, как её открывает редактор. */
export interface WorkshopOption extends WorkshopMechanicsFields {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  level: number | null;
  /** Требования; пусто, если их нет. */
  prerequisite: string;
  /** Блоки разметки core-api. */
  description: Array<string>;
  /** Коды типов особенности. */
  optionTypes: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
  /**
   * Умение класса, в котором правится этот вариант; null — особенность
   * правится здесь. Раздел — копия вариантов умений.
   */
  feature: { url: string; name: string } | null;
}
