import { useNavStore } from '@/shared/stores/NavStore';

import type { RouteRecordRaw } from 'vue-router';

export const IndexPage: RouteRecordRaw = {
  name: 'index',
  path: '/',
  component: () => import('./IndexView.vue'),
  beforeEnter: async () => {
    const navStore = useNavStore();

    await navStore.initPartners();
  },
};
