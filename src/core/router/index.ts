import { createRouter, createWebHistory } from 'vue-router';

import { useMetrics } from '@/shared/compositions/useMetrics';
import { useNavStore } from '@/shared/stores/NavStore';

import { useRouterHelpers } from './composition/useRouterHelpers';
import { routes } from './routes';

import pinia from '@/core/store';

const router = createRouter({
  history: createWebHistory(),
  routes
});

const { nextAvailable } = useRouterHelpers();
const { sendPageViewMetrics } = useMetrics();
const navStore = useNavStore(pinia);

router.beforeEach(async (to, from, next) => {
  await nextAvailable(to, next);
});

router.beforeResolve(async () => {
  navStore.hidePopovers();

  await navStore.initNavItems();
});

router.afterEach((to, from) => {
  sendPageViewMetrics(to);

  navStore.updateMetaByURL(to, from).finally();
});

export default router;
