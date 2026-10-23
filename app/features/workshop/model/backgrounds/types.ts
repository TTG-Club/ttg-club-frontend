/** Таблица персонализации: тип и строки по порядку броска. */
export interface PersonalizationTable {
  /** Код типа таблицы: `TRAIT`, `IDEAL`. */
  type: string;
  values: Array<string>;
}

/** Предыстория из справочника, как её открывает редактор. */
export interface WorkshopBackground {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Коды навыков. */
  skills: Array<string>;
  /** Навыки, которых нет в списке: «один на ваш выбор». */
  otherSkills: string;
  toolOwnership: string;
  /** Снаряжение через запятую. */
  equipments: string;
  startGold: number | null;
  description: string;
  skillName: string;
  skillDescription: string;
  personalization: string;
  personalizationTables: Array<PersonalizationTable>;
  language: string;
  /** Языки через запятую. */
  languages: string;
  /** Код образа жизни; пусто, если не задан. */
  lifeStyle: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
