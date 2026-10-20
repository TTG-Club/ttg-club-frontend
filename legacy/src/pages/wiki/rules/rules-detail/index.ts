import type { RouteRecordRaw } from 'vue-router';

export const RulesDetailPage: RouteRecordRaw = {
  name: 'ruleDetail',
  path: ':ruleName',
  component: () => import('./RuleDetail.vue'),
};
