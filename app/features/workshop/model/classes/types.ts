/** Умение класса или архетипа. */
export interface ClassTrait {
  id?: number;
  name: string;
  suffix: string;
  level: number;
  description: string;
  /** Опциональное умение: только у классов. */
  optional: boolean;
  child: string;
}

/** Колонка таблицы прогрессии: значения по двадцати уровням. */
export interface ClassTableColumn {
  id?: number;
  name: string;
  prefix: string;
  suffix: string;
  levels: Array<number | null>;
}

/** Класс из справочника, как его открывает редактор. */
export interface WorkshopClass {
  id: number;
  name: string;
  englishName: string;
  accusativeName: string;
  description: string;
  diceHp: number;
  armor: string;
  weapon: string;
  tools: string;
  savingThrows: string;
  archetypeName: string;
  equipment: string;
  /** Код характеристики заклинаний; пусто, если её нет. */
  spellAbility: string;
  spellcasterType: string;
  primaryAbilities: Array<string>;
  enabledArhitypeLevel: number;
  skillAvailableCount: number;
  availableSkills: Array<string>;
  /** Код особенностей класса; пусто, если их нет. */
  optionType: string;
  /** Код отдыха, после которого восстанавливаются ячейки. */
  slotsReset: string;
  sidekick: boolean;
  icon: string;
  page: number | null;
  classTraits: Array<ClassTrait>;
  tableColumns: Array<ClassTableColumn>;
  /** Аббревиатура книги-источника. */
  source?: string;
}

/** Архетип класса, как его отдаёт мастерская. */
export interface WorkshopArchetype {
  id: number;
  name: string;
  englishName: string;
  genitiveName: string;
  description: string;
  level: number;
  /** Тип заклинателя архетипа: форма его не меняет, но отправляет. */
  spellcasterType?: string;
  /** Особенности архетипа: форма их не меняет, но отправляет. */
  optionType?: string;
  spellLevelType: string;
  page: number | null;
  traits: Array<ClassTrait>;
  tableColumns: Array<ClassTableColumn>;
}
