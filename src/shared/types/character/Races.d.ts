import type {
  AbilityName,
  AbilityShortName,
  AbilityType,
} from '../tools/AbilityCalc';

export type TRaceAbility = {
  id?: number;
  key: RaceAbilityKey;
  name: AbilityName | AbilityType;
  shortName: AbilityShortName | AbilityType;
  value: number;
};

export type TRaceName = {
  rus: string;
  eng: string;
};

export type TRaceSource = {
  shortName: string;
  name: string;
};

export type TRaceType = {
  name: string;
  order: number;
};

export type TRaceGroup = {
  name: string;
  order: number;
};

export type TRaceLink = {
  id?: number;
  name: TRaceName;
  image: string;
  source: TRaceSource;
  type: TRaceType;
  url: string;
  abilities: Array<TRaceAbility>;
  subraces?: Array<TRaceLink>;
  group?: TRaceGroup;
};

export type TRaceFeature = {
  id?: number;
  name: string;
  englishName?: string;
  description: string;
  feature: boolean;
  replaceFeatureId?: number;
};

export type TRaceDetail = TRaceLink & {
  altName?: string;
  minAge?: number;
  maxAge?: number;
  description?: string;
  size?: string;
  sizeRaw?: RaceSize;
  typeRaw?: RaceCreatureType;
  speed?: Array<{ name?: string; value: number }>;
  darkvision?: number;
  fly?: number;
  climb?: number;
  swim?: number;
  origin?: boolean;
  view: boolean;
  icon?: string;
  page?: number;
  parentId?: number;
  features?: TRaceFeature[];
};

export type RaceAbilitySave = {
  id?: number;
  ability: RaceAbilityKey;
  bonus?: number;
};

export type RaceSave = {
  name: string;
  altName?: string;
  englishName: string;
  minAge?: number;
  maxAge?: number;
  description: string;
  parentId?: number;
  size: RaceSize;
  type: RaceCreatureType;
  darkvision?: number;
  speed: number;
  fly?: number;
  climb?: number;
  swim?: number;
  origin?: boolean;
  view: boolean;
  icon?: string;
  page?: number;
  abilities: RaceAbilitySave[];
  features: TRaceFeature[];
  /** Аббревиатура книги-источника, например MM */
  source?: string;
};

export type RaceAbilityKey =
  | 'STRENGTH'
  | 'DEXTERITY'
  | 'CONSTITUTION'
  | 'INTELLIGENCE'
  | 'WISDOM'
  | 'CHARISMA'
  | 'ONE'
  | 'CHOICE'
  | 'CHOICE_UNIQUE'
  | 'CHOICE_DOUBLE';

export type RaceSize =
  | 'TINY'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'HUGE'
  | 'GARGANTUAN'
  | 'SMALL_MEDIUM';

export type RaceCreatureType =
  | 'ABERRATION'
  | 'BEAST'
  | 'CELESTIAL'
  | 'CONSTRUCT'
  | 'DRAGON'
  | 'ELEMENTAL'
  | 'FEY'
  | 'FIEND'
  | 'GIANT'
  | 'HUMANOID'
  | 'MONSTROSITY'
  | 'OOZE'
  | 'OUTSIDER'
  | 'PLANT'
  | 'DEVIL'
  | 'UNDEAD'
  | 'VERMIN'
  | 'SLIME'
  | 'SMALL_BEAST'
  | 'SWARM';

export type TRaceList = {
  list: Array<TRaceLink>;
  group?: TRaceGroup;
};

export enum RacesFilterDefaults {
  dbName = 'races',
  url = '/filters/races',
}
