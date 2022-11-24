export enum AbilityName {
    STRENGTH = 'сила',
    DEXTERITY = 'ловкость',
    CONSTITUTION = 'телосложение',
    INTELLIGENCE = 'интеллект',
    WISDOM = 'мудрость',
    CHARISMA = 'харизма'
}

export enum AbilityShortName {
    STRENGTH = 'сил',
    DEXTERITY = 'лов',
    CONSTITUTION = 'тел',
    INTELLIGENCE = 'инт',
    WISDOM = 'мдр',
    CHARISMA = 'хар'
}

export enum AbilityKey {
    STRENGTH = 'STRENGTH',
    DEXTERITY = 'DEXTERITY',
    CONSTITUTION = 'CONSTITUTION',
    INTELLIGENCE = 'INTELLIGENCE',
    WISDOM = 'WISDOM',
    CHARISMA = 'CHARISMA'
}

export enum AbilityShortKey {
    STRENGTH = 'str',
    DEXTERITY = 'dex',
    CONSTITUTION = 'con',
    INTELLIGENCE = 'int',
    WISDOM = 'wis',
    CHARISMA = 'cha'
}

export enum AbilityType {
    CHOICE = 'к другой',
    ONE = 'к одной',
    CHOICE_UNIQUE = 'к 2 другим',
    CHOICE_DOUBLE = '+2 и +1 / +1 к трем',
    ALL = '+1 к каждой'
}

export enum AbilityTypeKey {
    CHOICE = 'CHOICE',
    ONE = 'ONE',
    CHOICE_UNIQUE = 'CHOICE_UNIQUE',
    CHOICE_DOUBLE = 'CHOICE_DOUBLE',
    ALL = 'ALL'
}

export enum AbilityChoiceDouble {
    FOR_THREE = '+1 к трем',
    FOR_TWO = '+2 и +1'
}

export enum AbilityChoiceDoubleKey {
    FOR_THREE = 'FOR_THREE',
    FOR_TWO = 'FOR_TWO'
}

export type Ability = {
    key: AbilityKey;
    shortKey: AbilityShortKey;
    name: AbilityName;
    shortName: AbilityShortName;
}
