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
  // Прокрутка полностью на стороне компонентов: страница скроллит #container,
  // а не window, поэтому нативный переход к якорю только мешает — он двигает
  // сразу все прокручиваемые контейнеры-предки.
  scrollBehavior: () => false,
});

const { nextAvailable } = useRouterHelpers();
const { sendPageViewMetrics, sendYandexPageView } = useMetrics();
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
  sendYandexPageView(to, from);

  updateMetaByURL(to, from).finally();
});

export default router;
