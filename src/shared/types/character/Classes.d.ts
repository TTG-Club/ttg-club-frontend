export type TClassSource = {
  name: string;
  shortName: string;
  homebrew?: boolean;
};

export type TClassName = {
  rus: string;
  eng: string;
};

export type TClassGroup = {
  name: string;
  order: number;
};

export type TClassArchetype = {
  name: TClassName;
  type: TClassGroup;
  source: TClassSource;
  url: string;
};

export type TClassLink = {
  archetypeName?: string;
  archetypes: Array<TClassArchetype>;
  dice: 'к6' | 'к8' | 'к10' | 'к12';
  icon?: string;
  image: string;
  name: TClassName;
  sidekick: boolean;
  source: TClassSource;
  url: string;
  group?: TClassGroup;
};

export type TClassArchetypeList = {
  list: Array<TClassArchetype>;
  group?: TClassGroup;
};

export type TClassItem = Omit<TClassLink, 'archetypes'> & {
  id?: number;
  archetypes: Array<TClassArchetypeList>;
  description?: string;
  accusativeName?: string;
  spellAbility?: ClassAbility;
  spellcasterType?: ClassSpellcasterType;
  primaryAbilities?: ClassAbility[];
  availableSkillsRaw?: ClassSkill[];
  optionType?: string;
  slotsReset?: ClassRest;
  enabledArhitypeLevel?: number;
  page?: number;
  traits?: {
    diceHp: number;
    armor?: string;
    weapon?: string;
    tools?: string;
    savingThrows?: string;
    skillAvailableCount: number;
    availableSkills?: string[];
    equipment?: string;
  };
};

export type ClassAbility =
  | 'STRENGTH'
  | 'DEXTERITY'
  | 'CONSTITUTION'
  | 'INTELLIGENCE'
  | 'WISDOM'
  | 'CHARISMA';

export type ClassSkill =
  | 'ATHLETICS'
  | 'ACROBATICS'
  | 'SLEIGHT_OF_HAND'
  | 'STEALTH'
  | 'ARCANA'
  | 'HISTORY'
  | 'INVESTIGATION'
  | 'NATURE'
  | 'RELIGION'
  | 'ANIMAL_HANDLING'
  | 'INSIGHT'
  | 'MEDICINE'
  | 'PERCEPTION'
  | 'SURVIVAL'
  | 'DECEPTION'
  | 'INTIMIDATION'
  | 'PERFORMANCE'
  | 'PERSUASION';

export type ClassSpellcasterType = 'FULL' | 'HALF' | 'PARTLY' | 'NONE';

export type ClassRest = 'SHORT' | 'LONG' | 'FULL';

export type ClassSave = {
  name: string;
  englishName: string;
  accusativeName?: string;
  description: string;
  diceHp: number;
  armor?: string;
  weapon?: string;
  tools?: string;
  savingThrows?: string;
  archetypeName?: string;
  equipment?: string;
  spellAbility?: ClassAbility;
  spellcasterType?: ClassSpellcasterType;
  primaryAbilities: ClassAbility[];
  enabledArhitypeLevel: number;
  skillAvailableCount: number;
  availableSkills: ClassSkill[];
  optionType?: string;
  slotsReset?: ClassRest;
  sidekick: boolean;
  icon?: string;
  page?: number;
};

export type TClassList = {
  list: Array<TClassItem>;
  group?: TClassGroup;
};

export enum ClassesFilterDefaults {
  dbName = 'classes',
  url = '/filters/classes',
}
