export enum OptionsFilterDefaults {
  dbName = 'options',
  url = '/filters/options',
}

interface OptionName {
  rus: string;
  eng: string;
}

interface OptionSource {
  shortName: string;
  name: string;
  homebrew: true;
  page: 0;
}

interface OptionClass {
  name: string;
  source: string;
  url: string;
  icon: string;
  class: string;
}

export interface OptionDetail {
  id: number;
  name: OptionName;
  url: string;
  homebrew: true;
  requirements: string;
  description: string;
  source: OptionSource;
  classes: Array<OptionClass>;
  altName?: string;
  level?: number;
  prerequisite?: string;
  optionTypes?: Array<string>;
}

export interface OptionSave {
  name: string;
  englishName: string;
  altName?: string;
  optionTypes: Array<string>;
  prerequisite?: string;
  level?: number;
  description: string;
  /** Аббревиатура книги-источника, например MM */
  source?: string;
}

export interface OptionLink {
  name: OptionName;
  url: string;
  homebrew: true;
}
