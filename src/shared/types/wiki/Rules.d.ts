export enum RulesFilterDefaults {
  dbName = 'rules',
  url = '/filters/rules',
}

interface RuleName {
  rus: string;
  eng: string;
}

interface RuleSource {
  shortName: string;
  name: string;
  page?: number;
}

export interface RuleDetail {
  id: number;
  name: RuleName;
  altName?: string;
  description: string;
  type: string;
  source: RuleSource;
}

export interface RuleSave {
  name: string;
  englishName: string;
  altName?: string;
  description: string;
  type: string;
  source?: string;
  page?: number;
}
