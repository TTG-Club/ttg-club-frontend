import type {
  TName,
  TSource,
  IAbilitiesValue,
} from '@/shared/types/BaseApiFields';

export enum BestiaryFilterDefaults {
  dbName = 'bestiary',
  url = '/filters/bestiary',
}

export interface ICreatureAction {
  name: string;
  englishName?: string;
  value: string;
  markdown?: boolean;
  sharedUsageCount?: number;
}

export interface ICreatureFeat {
  name: string;
  englishName?: string;
  value?: string;
  markdown?: boolean;
}

export interface ICreatureHits {
  average: number;
  text?: string;
  formula?: string;
  sign?: ' + ' | ' - ';
  bonus?: number;
}

export interface ICreatureLair {
  action?: string;
  effect?: string;
  description?: string;
}

export interface ICreatureLegendary {
  list: ICreatureAction[];
  count: number;
  description?: string;
}

export interface ICreatureSavingThrow {
  name: string;
  shortName: string;
  value: number;
  additional?: string;
}

export interface ICreatureSense {
  name: string;
  value: number;
  additional?: string;
}

export interface ICreatureSenses {
  passivePerception: string;
  senses?: ICreatureSense[];
}

export interface ICreatureSize {
  rus: string;
  eng: string;
  cell: string;
}

export interface ICreatureSkill {
  name: string;
  value: number;
  additional?: string;
}

export interface ICreatureSpeed {
  value: number | string;
  name?: string;
  additional?: string;
}

export interface ICreatureTag {
  name: string;
  description: string;
}

interface ICreatureType {
  name: string;
  tags?: string[];
}

export interface IBestiaryLink {
  name: TName;
  type: string;
  challengeRating: string;
  url: string;
  source: TSource;
}

export interface ICreatureArmor {
  name: string;
  type: string;
  url: string;
}

export interface ICreature {
  name: TName;
  size: ICreatureSize;
  type: ICreatureType;
  challengeRating: string;
  url: string;
  source: TSource;
  id: number;
  alignment: string;
  armorClass: number;
  armors?: ICreatureArmor[];
  armorText?: string;
  hits: ICreatureHits;
  speed: ICreatureSpeed[];
  ability: IAbilitiesValue;
  savingThrows?: ICreatureSavingThrow[];
  senses: ICreatureSenses;
  languages?: string[];
  feats?: ICreatureFeat[];
  actions?: ICreatureAction[];
  reactions?: ICreatureAction[];
  reaction?: string;
  images?: string[];
  damageImmunities?: string[];
  description?: string;
  damageResistances?: string[];
  conditionImmunities?: string[];
  tags?: ICreatureTag[];
  bonusActions?: ICreatureAction[];
  skills?: ICreatureSkill[];
  experience?: number;
  environment?: string[];
  damageVulnerabilities?: string[];
  lair?: ICreatureLair;
  legendary?: ICreatureLegendary;
  mysticalActions?: ICreatureAction[];
}

export interface ICreatureSaveName {
  rus: string;
  eng: string;
  alt?: string;
}

export interface ICreatureSaveNameValue {
  key?: string;
  name?: string;
  value: number | string;
  additional?: string;
}

export interface ICreatureSaveDescription {
  name: ICreatureSaveName;
  description?: string;
  markdown?: boolean;
}

export interface ICreatureSave {
  id?: number;
  name: ICreatureSaveName;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  armors?: string[];
  hits: {
    average: number;
    diceCount?: number;
    hitDice?: string;
    bonus?: number;
    text?: string;
  };
  speed: ICreatureSaveNameValue[];
  ability: IAbilitiesValue;
  savingThrows?: ICreatureSaveNameValue[];
  skills?: ICreatureSaveNameValue[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses: {
    passivePerception: string;
    senses?: ICreatureSaveNameValue[];
  };
  languages?: string[];
  challengeRating: string;
  feats?: ICreatureSaveDescription[];
  actions?: ICreatureSaveDescription[];
  reactions?: ICreatureSaveDescription[];
  reaction?: string;
  bonusActions?: ICreatureSaveDescription[];
  legendary?: {
    list: ICreatureSaveNameValue[];
    count: number;
    description?: string;
  };
  mysticalActions?: ICreatureSaveDescription[];
  description?: string;
  tags?: string[];
  environment?: string[];
  npc: boolean;
  source?: string;
}
