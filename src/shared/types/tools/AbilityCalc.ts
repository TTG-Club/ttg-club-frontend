import type { TRaceAbility, TRaceLink } from '@/shared/types/character/Races';

import type { SelectOption } from 'naive-ui';

export enum AbilityName {
  STRENGTH = 'Сила',
  DEXTERITY = 'Ловкость',
  CONSTITUTION = 'Телосложение',
  INTELLIGENCE = 'Интеллект',
  WISDOM = 'Мудрость',
  CHARISMA = 'Харизма',
}

export enum AbilityShortName {
  STRENGTH = 'сил',
  DEXTERITY = 'лов',
  CONSTITUTION = 'тел',
  INTELLIGENCE = 'инт',
  WISDOM = 'мдр',
  CHARISMA = 'хар',
}

export enum AbilityKey {
  STRENGTH = 'STRENGTH',
  DEXTERITY = 'DEXTERITY',
  CONSTITUTION = 'CONSTITUTION',
  INTELLIGENCE = 'INTELLIGENCE',
  WISDOM = 'WISDOM',
  CHARISMA = 'CHARISMA',
}

export enum AbilityShortKey {
  STRENGTH = 'str',
  DEXTERITY = 'dex',
  CONSTITUTION = 'con',
  INTELLIGENCE = 'int',
  WISDOM = 'wis',
  CHARISMA = 'cha',
}

export enum AbilityType {
  ONE = 'к одной',
  CHOICE = 'к другой',
  CHOICE_UNIQUE = 'к 2 другим',
  CHOICE_DOUBLE = '+2 и +1 / +1 к трем',
}

export enum AbilityTypeKey {
  ONE = 'ONE',
  CHOICE = 'CHOICE',
  CHOICE_UNIQUE = 'CHOICE_UNIQUE',
  CHOICE_DOUBLE = 'CHOICE_DOUBLE',
}

export enum AbilityChoiceDouble {
  FOR_THREE = '+1 к трем',
  FOR_TWO = '+2 и +1',
}

export enum AbilityChoiceDoubleKey {
  FOR_THREE = 'FOR_THREE',
  FOR_TWO = 'FOR_TWO',
}

export type AbilityRoll = {
  key: AbilityKey;
  name: AbilityName;
  value: number;
  shortName: AbilityShortName;
  raceBonus?: number;
};

export type ChoiceDouble = {
  value: AbilityChoiceDoubleKey;
  label: AbilityChoiceDouble;
};

export interface CustomizableAbility {
  key: AbilityTypeKey;
  name: AbilityType;
  value: number;
  shortName: AbilityType;
}

export interface AbilityRaceItem extends SelectOption {
  raw: TRaceLink;
  abilities: Array<TRaceAbility>;
  subraces?: Array<AbilityRaceItem>;
}

export const isCustomizableAbility = (
  ability: TRaceAbility,
): ability is CustomizableAbility => {
  switch (ability.key) {
    case AbilityTypeKey.ONE:
    case AbilityTypeKey.CHOICE:
    case AbilityTypeKey.CHOICE_UNIQUE:
    case AbilityTypeKey.CHOICE_DOUBLE:
      return true;

    default:
      return false;
  }
};

export const isDefaultAbility = (
  ability: TRaceAbility,
): ability is AbilityRoll => {
  switch (ability.key) {
    case AbilityKey.STRENGTH:
    case AbilityKey.DEXTERITY:
    case AbilityKey.CONSTITUTION:
    case AbilityKey.INTELLIGENCE:
    case AbilityKey.WISDOM:
    case AbilityKey.CHARISMA:
      return true;

    default:
      return false;
  }
};

export const POINT_BUY_COST = [
  {
    value: 8,
    cost: 0,
  },
  {
    value: 9,
    cost: 1,
  },
  {
    value: 10,
    cost: 2,
  },
  {
    value: 11,
    cost: 3,
  },
  {
    value: 12,
    cost: 4,
  },
  {
    value: 13,
    cost: 5,
  },
  {
    value: 14,
    cost: 7,
  },
  {
    value: 15,
    cost: 9,
  },
] as const;
