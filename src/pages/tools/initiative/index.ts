import type { RouteRecordRaw } from 'vue-router';

export const InitiativeToolPage: RouteRecordRaw = {
  name: 'tools-initiative',
  path: '/tools/initiative',
  component: () => import('./InitiativeToolView.vue'),
};

export const InitiativeTrackerPage: RouteRecordRaw = {
  name: 'tools-initiative-tracker',
  path: '/tools/initiative/:id',
  component: () => import('./InitiativeTrackerView.vue'),
  // Приватные/эфемерные страницы конкретного трекера не индексируем.
  meta: { robots: 'noindex, nofollow' },
};
