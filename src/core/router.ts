import { createRouter, createWebHistory } from 'vue-router';

import { routes } from '@/pages';

import { useMeta } from '@/shared/composable/useMeta';
import { useMetrics } from '@/shared/composable/useMetrics';
import { useNavPopover } from '@/shared/composable/useNavPopover';
import { useRouterHelpers } from '@/shared/composable/useRouterHelpers';
import { useNavStore } from '@/shared/stores/NavStore';
import { useRollStore } from '@/shared/stores/RollStore';

import pinia from './store';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const { nextAvailable } = useRouterHelpers();
const { sendPageViewMetrics } = useMetrics();
const { closeSearch, closePopover } = useNavPopover();
const { updateMetaByURL } = useMeta();
const navStore = useNavStore(pinia);
const rollStore = useRollStore();

router.beforeEach(nextAvailable);

router.beforeEach(() => {
  rollStore.setFallbackSource();
});

router.beforeResolve(async () => {
  closeSearch();
  closePopover();

  await navStore.initNavItems();
});

router.afterEach((to, from) => {
  sendPageViewMetrics(to);

  updateMetaByURL(to, from).finally();
});

export default router;
