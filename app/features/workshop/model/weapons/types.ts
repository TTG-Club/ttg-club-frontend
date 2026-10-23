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
  description: string;
  special: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
