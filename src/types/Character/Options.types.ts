export enum OptionsFilterDefaults {
  dbName = 'options',
  url = '/filters/options'
}

interface OptionName {
    rus: string,
    eng: string
}

interface OptionSource {
    shortName: string,
    name: string,
    homebrew: true,
    page: 0
}

interface OptionClass {
    name: string,
    source: string,
    url: string,
    icon: string,
    class: string
}

export interface OptionDetail {
    name: OptionName,
    url: string,
    homebrew: true,
    requirements: string,
    description: string,
    source: OptionSource,
    classes: Array<OptionClass>
}

export interface OptionLink {
    name: OptionName,
    url: string,
    homebrew: true
}
