import { createRouter, createWebHistory } from 'vue-router';

import pinia from '@/core/store';
import { routes } from '@/pages';

import { useMeta } from '@/shared/composables/useMeta';
import { useMetrics } from '@/shared/composables/useMetrics';
import { useNavPopover } from '@/shared/composables/useNavPopover';
import { useRouterHelpers } from '@/shared/composables/useRouterHelpers';
import { useNavStore } from '@/shared/stores/NavStore';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const { nextAvailable } = useRouterHelpers();
const { sendPageViewMetrics } = useMetrics();
const { closeSearch, closePopover } = useNavPopover();
const { updateMetaByURL } = useMeta();
const navStore = useNavStore(pinia);

router.beforeEach(nextAvailable);

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
