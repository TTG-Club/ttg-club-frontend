import type { RouteRecordRaw } from 'vue-router';

export const SearchPage: RouteRecordRaw = {
  name: 'search-page',
  path: '/search',
  component: () => import('./SearchView.vue'),
};
