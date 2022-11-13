import {
    AbilityName, AbilityShortName, AbilityType
} from '@/enums/Tools/AbilityCalcEnum';

type RaceAbility = {
    key: AbilityType
    name: AbilityName
    shortName: AbilityShortName
    value: number
};

type RaceName = {
    rus: string
    eng: string
};

type RaceSource = {
    shortName: string
    name: string
}

type RaceType = {
    name: string
    order: number
}

type RaceLink = {
    name: RaceName
    image: string
    source: RaceSource
    type: RaceType
    url: string
    abilities: Array<RaceAbility>
    subraces?: Array<RaceLink>
}
