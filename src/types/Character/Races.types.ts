import type {
  AbilityKey,
  AbilityName,
  AbilityShortName,
  AbilityType,
  AbilityTypeKey
} from '@/types/Tools/AbilityCalc.types';

export type TRaceAbility = {
  key: AbilityKey | AbilityTypeKey
  name: AbilityName | AbilityType
  shortName: AbilityShortName | AbilityType
  value: number
};

export type TRaceName = {
  rus: string
  eng: string
};

export type TRaceSource = {
  shortName: string
  name: string
}

export type TRaceType = {
  name: string
  order: number
}

export type TRaceGroup = {
  name: string
  order: number
}

export type TRaceLink = {
  name: TRaceName
  image: string
  source: TRaceSource
  type: TRaceType
  url: string
  abilities: Array<TRaceAbility>
  subraces?: Array<TRaceLink>
  group?: TRaceGroup
}

export type TRaceList = {
  list: Array<TRaceLink>
  group?: TRaceGroup
}

export enum RacesFilterDefaults {
  dbName = 'races',
  url = '/filters/races'
}
