import type {
    AbilityName, AbilityShortName, AbilityType, AbilityKey, AbilityTypeKey
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

export type TRaceLink = {
    name: TRaceName
    image: string
    source: TRaceSource
    type: TRaceType
    url: string
    abilities: Array<TRaceAbility>
    subraces?: Array<TRaceLink>
}

export enum RacesFilterDefaults {
    dbName = 'races',
    url = '/filters/races'
}
