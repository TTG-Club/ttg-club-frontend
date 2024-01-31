import { useUserStore } from '@/shared/stores/UserStore';

import type { RouteRecordRaw } from 'vue-router';

export const ProfileMainPage: RouteRecordRaw = {
  name: 'profile-main',
  path: '',
  component: () => import('./ProfileView.vue'),
  beforeEnter: async (to, from, next) => {
    const userStore = useUserStore();

    try {
      const user = await userStore.getUserInfo();

      if (!user) {
        next({ name: 'unauthorized' });

        return;
      }

      next();
    } catch (err) {
      next({ name: 'internal-server' });
    }
  },
};
