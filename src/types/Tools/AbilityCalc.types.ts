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

export type Ability = {
    key: AbilityKey;
    shortKey: AbilityShortKey;
    name: AbilityName;
    shortName: AbilityShortName;
}
