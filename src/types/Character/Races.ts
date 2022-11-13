import type {
    AbilityName, AbilityShortName, AbilityType
} from '@/enums/Tools/AbilityCalcEnum';

export type RaceAbility = {
    key: AbilityType
    name: AbilityName
    shortName: AbilityShortName
    value: number
};

export type RaceName = {
    rus: string
    eng: string
};

export type RaceSource = {
    shortName: string
    name: string
}

export type RaceType = {
    name: string
    order: number
}

export type RaceLink = {
    name: RaceName
    image: string
    source: RaceSource
    type: RaceType
    url: string
    abilities: Array<RaceAbility>
    subraces?: Array<RaceLink>
}
