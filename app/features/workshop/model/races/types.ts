/** Бонус характеристики расы. */
export interface RaceAbility {
  /** Код характеристики или варианта на выбор: `STRENGTH`, `CHOICE`. */
  ability: string;
  bonus: number | null;
}

/** Особенность расы. */
export interface RaceFeature {
  id?: number;
  name: string;
  englishName: string;
  description: string;
  /** Открывать особенность в карточке по умолчанию. */
  feature: boolean;
  /** Особенность родительской расы, которую заменяет эта. */
  replaceFeatureId: number | null;
}

/** Раса из справочника, как её открывает редактор. */
export interface WorkshopRace {
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
  description: string;
  /** Аббревиатура книги-источника. */
  source?: string;
}
