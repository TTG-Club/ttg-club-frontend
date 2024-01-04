import { createRouter, createWebHistory } from 'vue-router';

import pinia from '@/core/store';
import { routes } from '@/pages';

import { useMetrics } from '@/shared/composables/useMetrics';
import { useRouterHelpers } from '@/shared/composables/useRouterHelpers';
import { useNavStore } from '@/shared/stores/NavStore';

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
