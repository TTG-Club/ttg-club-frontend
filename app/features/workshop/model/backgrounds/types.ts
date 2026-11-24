import type { WorkshopMechanicsFields } from '../mechanics';

/** Таблица персонализации: тип и строки по порядку броска. */
export interface PersonalizationTable {
  /** Код типа таблицы: `TRAIT`, `IDEAL`. */
  type: string;
  values: Array<string>;
}

/** Предыстория из справочника, как её открывает редактор. */
export interface WorkshopBackground extends WorkshopMechanicsFields {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Коды навыков. */
  skills: Array<string>;
  /** Навыки, которых нет в списке: «один на ваш выбор». */
  otherSkills: string;
  /** Блоки разметки core-api. */
  toolOwnership: Array<string>;
  /** Снаряжение: блоки разметки core-api, перечисление через запятую. */
  equipments: Array<string>;
  startGold: number | null;
  /** Блоки разметки core-api. */
  description: Array<string>;
  skillName: string;
  /** Блоки разметки core-api. */
  skillDescription: Array<string>;
  /** Блоки разметки core-api. */
  personalization: Array<string>;
  personalizationTables: Array<PersonalizationTable>;
  language: string;
  /** Языки через запятую. */
  languages: string;
  /** Код образа жизни; пусто, если не задан. */
  lifeStyle: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
