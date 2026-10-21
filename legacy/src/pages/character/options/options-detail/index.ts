import type { RouteRecordRaw } from 'vue-router';

export const OptionsDetailPage: RouteRecordRaw = {
  name: 'optionDetail',
  path: ':optionName',
  component: () => import('./OptionDetail.vue'),
};
