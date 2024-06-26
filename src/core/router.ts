import { createRouter, createWebHistory } from 'vue-router';

import pinia from '@/core/store';
import { routes } from '@/pages';

import { useMeta } from '@/shared/composables/useMeta';
import { useMetrics } from '@/shared/composables/useMetrics';
import { useNavPopover } from '@/shared/composables/useNavPopover';
import { useRouterHelpers } from '@/shared/composables/useRouterHelpers';
import { useNavStore } from '@/shared/stores/NavStore';
import { useRollStore } from '@/shared/stores/RollStore';

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
