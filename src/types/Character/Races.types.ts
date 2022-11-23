import type {
    AbilityName, AbilityShortName, AbilityType
} from '@/types/Tools/AbilityCalc.types';

export type TRaceAbility = {
    key: AbilityType
    name: AbilityName
    shortName: AbilityShortName
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
