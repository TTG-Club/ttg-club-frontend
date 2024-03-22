import type { RouteRecordRaw } from 'vue-router';

export const FeatsDetailPage: RouteRecordRaw = {
  name: 'featDetail',
  path: ':featName',
  component: () => import('./FeatDetail.vue'),
};

export const TraitsDetailPage: RouteRecordRaw = {
  path: ':traitName',
  redirect: (to) => ({
    name: 'featDetail',
    params: {
      featName: to.params.traitName,
    },
  }),
};
