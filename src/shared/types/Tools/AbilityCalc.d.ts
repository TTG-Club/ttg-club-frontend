export enum AbilityName {
  STRENGTH = 'Сила',
  DEXTERITY = 'Ловкость',
  CONSTITUTION = 'Телосложение',
  INTELLIGENCE = 'Интеллект',
  WISDOM = 'Мудрость',
  CHARISMA = 'Харизма'
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

export type AbilityRoll = {
  key: AbilityKey | null;
  name: AbilityName | null;
  value: number;
  shortName: AbilityShortName | null;
  raceBonus?: number;
};

export type ChoiceDouble = {
  key: AbilityChoiceDoubleKey;
  label: AbilityChoiceDouble;
};
