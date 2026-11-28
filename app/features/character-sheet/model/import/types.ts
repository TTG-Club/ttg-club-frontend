import type { SheetImportData } from '../transfer';

/** Оружие из списка атак Long Story Short. */
export interface LssWeapon {
  name: string;
  /** Формула урона, как её хранит LSS («1к8+[str]»); '' — не задана. */
  damage: string;
  /** Тип урона прозой («рубящий»); '' — не указан. */
  damageType: string;
  /** Персонаж владеет этим оружием. */
  isProficient: boolean;
}

/** Счётчик (ресурс) Long Story Short. */
export interface LssResource {
  name: string;
  current: number;
  max: number;
  /** Восстанавливается коротким отдыхом. */
  shortRest: boolean;
  /** Восстанавливается продолжительным отдыхом. */
  longRest: boolean;
}

/** Текстовый блок листа LSS: ключ шаблона и документ редактора (TipTap). */
export interface LssTextBlock {
  /** Ключ блока в шаблоне LSS (`traits`, `notes-1`). */
  key: string;
  /** Документ TipTap как он лежит в файле. */
  doc: unknown;
}

/** Ячейки заклинаний одного круга. */
export interface LssSpellSlot {
  level: number;
  used: number;
  /** Всего ячеек круга по данным LSS. */
  max: number;
}

/** Подпись из шапки LSS (возраст, рост, мировоззрение). */
export interface LssDetailRow {
  /** Ключ поля в шапке LSS (`alignment`, `age`). */
  key: string;
  label: string;
  value: string;
}

/**
 * Персонаж из файла Long Story Short, приведённый к плоскому виду. Ключи
 * характеристик, навыков и владений остаются «родными» для LSS — в ключи
 * листа их переводит `convert.ts` по картам из `constants.ts`.
 */
export interface LssCharacter {
  name: string;
  className: string;
  /** Название подкласса; '' — не выбран. */
  subclassName: string;
  /** Название расы как его записал LSS («Дварф (горный)»). */
  speciesName: string;
  backgroundName: string;
  /** Ключ размера LSS (`medium`); '' — не указан. */
  size: string;
  level: number;
  experience: number;
  /** Подписи шапки: приметы, мировоззрение, имя игрока. */
  details: Array<LssDetailRow>;
  /** Значения характеристик по кодам LSS (`str`). */
  abilities: Record<string, number>;
  /** Коды характеристик, спасбросками которых персонаж владеет. */
  saves: Array<string>;
  /** Владение навыками: ключ LSS → уровень (1 — владение, 2 — компетентность). */
  skills: Record<string, number>;
  health: { current: number; max: number; temporary: number };
  /** Кость хитов: номинал и остаток. */
  hitDice: { die: number; current: number };
  /** Итоговый класс доспеха с учётом щита. */
  armorClass: number;
  speed: number;
  darkvision: number;
  inspiration: boolean;
  /** Код заклинательной характеристики LSS (`wis`); '' — не задан. */
  spellcastingAbility: string;
  spellSlots: Array<LssSpellSlot>;
  /** Ячейки договора колдуна: у LSS они лежат отдельным блоком. */
  pactSpellSlots: Array<LssSpellSlot>;
  weapons: Array<LssWeapon>;
  resources: Array<LssResource>;
  /** Флаги владений LSS (`armor-light`, `weapon-simple`). */
  proficiencyFlags: Array<string>;
  /** Монеты по кодам LSS (`gp`). */
  coins: Record<string, number>;
  texts: Array<LssTextBlock>;
  /** В файле есть пользовательские бонусы — перенести их некуда. */
  hasBonuses: boolean;
  /** В файле есть настроенные магические предметы. */
  hasAttunements: boolean;
}

/** Итог импорта листа из чужого формата. */
export interface ExternalImportResult {
  /** Лист для создания: имя и документ. */
  sheet: SheetImportData;
  /** Название формата-источника («Long Story Short»). */
  sourceLabel: string;
  /** Что перенести не удалось — показывается тостом после импорта. */
  warnings: Array<string>;
}
