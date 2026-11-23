import type { WorkshopMechanicsFields } from '../mechanics';

/** Умение класса или архетипа. */
export interface ClassTrait extends WorkshopMechanicsFields {
  id?: number;
  name: string;
  suffix: string;
  level: number;
  /** Блоки разметки core-api. */
  description: Array<string>;
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
export interface WorkshopClass extends WorkshopMechanicsFields {
  id: number;
  name: string;
  englishName: string;
  accusativeName: string;
  /** Блоки разметки core-api. */
  description: Array<string>;
  diceHp: number;
  /** Блоки разметки core-api. */
  armor: Array<string>;
  /** Блоки разметки core-api. */
  weapon: Array<string>;
  /** Блоки разметки core-api. */
  tools: Array<string>;
  savingThrows: string;
  archetypeName: string;
  /** Блоки разметки core-api. */
  equipment: Array<string>;
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
export interface WorkshopArchetype extends WorkshopMechanicsFields {
  id: number;
  name: string;
  englishName: string;
  genitiveName: string;
  /** Блоки разметки core-api. */
  description: Array<string>;
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
