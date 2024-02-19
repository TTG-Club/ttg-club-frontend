import { useUserStore } from '@/shared/stores/UserStore';

import type { RouteRecordRaw } from 'vue-router';

export const ResetPasswordPage: RouteRecordRaw = {
  name: 'reset-password',
  path: '/reset/password',
  component: () => import('./ResetPasswordView.vue'),
  beforeEnter: async (to, from, next) => {
    const userStore = useUserStore();

    try {
      if (await userStore.getUserStatus()) {
        next({ name: 'forbidden' });
      }

      await userStore.getUserInfo();

      next();
    } catch (err) {
      next();
    }
  },
};
