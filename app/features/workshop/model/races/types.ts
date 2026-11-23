import type { WorkshopMechanicsFields } from '../mechanics';

/** Бонус характеристики расы. */
export interface RaceAbility {
  /** Код характеристики или варианта на выбор: `STRENGTH`, `CHOICE`. */
  ability: string;
  bonus: number | null;
}

/** Особенность расы. */
export interface RaceFeature extends WorkshopMechanicsFields {
  id?: number;
  name: string;
  englishName: string;
  /** Блоки разметки core-api. */
  description: Array<string>;
  /** Открывать особенность в карточке по умолчанию. */
  feature: boolean;
  /** Особенность родительской расы, которую заменяет эта. */
  replaceFeatureId: number | null;
}

/** Раса из справочника, как её открывает редактор. */
export interface WorkshopRace extends WorkshopMechanicsFields {
  id: number;
  name: string;
  englishName: string;
  altName: string;
  /** Идентификатор родительской расы строкой, как в выборе. */
  parentId: string;
  /** Код размера. */
  size: string;
  /** Код типа существа. */
  type: string;
  minAge: number | null;
  maxAge: number | null;
  speed: number;
  darkvision: number | null;
  fly: number | null;
  climb: number | null;
  swim: number | null;
  origin: boolean;
  view: boolean;
  icon: string;
  page: number | null;
  abilities: Array<RaceAbility>;
  features: Array<RaceFeature>;
  /** Блоки разметки core-api. */
  description: Array<string>;
  /** Аббревиатура книги-источника. */
  source?: string;
}
