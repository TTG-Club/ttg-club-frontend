import { createRouter, createWebHistory } from 'vue-router';
import { storeToRefs } from 'pinia';
import { routes } from '@/router/routes';
import { useNavStore } from '@/store/UI/NavStore';
import { useRouterHelpers } from '@/router/composition/useRouterHelpers';

const router = createRouter({
    history: createWebHistory(),
    routes
});

const { nextAvailable } = useRouterHelpers();

router.beforeResolve(async () => {
    const navStore = useNavStore();

    const {
        isShowPopover, isShowSearch, navItems
    } = storeToRefs(navStore);

    isShowPopover.value = false;
    isShowSearch.value = false;

    if (!navItems.value.length) {
        await navStore.initNavItems();
    }
});

router.beforeEach(async (to, from, next) => {
    await nextAvailable(to, next);
});

router.afterEach((to, from) => {
    const navStore = useNavStore();

    if (to.path !== from.path) {
        navStore.updateMetaByURL(to.path)
            .then();
    }
});

export default router;
