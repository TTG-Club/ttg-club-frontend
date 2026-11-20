/** Оружие из справочника, как его открывает редактор. */
export interface WorkshopWeapon {
  id: number;
  name: string;
  englishName: string;
  /** Код вида оружия. */
  type: string;
  /** Код типа урона. */
  damageType: string;
  numberDice: number | null;
  /** Кость урона: `d6`; пусто, если урона нет. */
  damageDice: string;
  twoHandDamageDice: string;
  cost: number | null;
  currency: string;
  weight: number | null;
  minDistance: number | null;
  maxDistance: number | null;
  ammo: number | null;
  /** Идентификаторы свойств строками, как их отдают фильтры. */
  properties: Array<string>;
  /** Блоки разметки core-api; пусто — нет. */
  description: Array<string>;
  /** Особое свойство — блоки разметки core-api; пусто — нет. */
  special: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
}
