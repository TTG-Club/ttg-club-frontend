import { createRouter, createWebHistory } from 'vue-router';
import { routes } from '@/router/routes';
import { useNavStore } from '@/store/UI/NavStore';
import { useRouterHelpers } from '@/router/composition/useRouterHelpers';
import pinia from '@/store';

const router = createRouter({
    history: createWebHistory(),
    routes
});

const { nextAvailable } = useRouterHelpers();
const navStore = useNavStore(pinia);

router.beforeEach(async (to, from, next) => {
    await nextAvailable(to, next);
});

router.beforeResolve(async () => {
    navStore.hidePopovers();

    await navStore.initNavItems();
});

router.afterEach(async (to, from) => {
    await navStore.updateMetaByURL(to, from);
});

export default router;
