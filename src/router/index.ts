import { createRouter, createWebHistory } from 'vue-router';

import { useMetrics } from '@/shared/composition/useMetrics';

import { useRouterHelpers } from '@/router/composition/useRouterHelpers';
import { routes } from '@/router/routes';
import pinia from '@/store';
import { useNavStore } from '@/store/UI/NavStore';

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
