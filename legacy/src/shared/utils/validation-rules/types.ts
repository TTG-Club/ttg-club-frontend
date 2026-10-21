import type { FormItemRule } from 'naive-ui';

export interface BaseRuleConfig {
  required?: boolean;
  trigger?: FormItemRule['trigger'];
}

export interface BaseWithLengthRuleConfig extends BaseRuleConfig {
  minLength?: number;
  maxLength?: number;
}

export interface UsernameOrEmailRuleConfig extends BaseWithLengthRuleConfig {
  checkExist?: boolean;
}
