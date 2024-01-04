import { EUserRoles, useUserStore } from '@/shared/stores/UserStore';

import type { RouteRecordRaw } from 'vue-router';

export const AdminYoutubePage: RouteRecordRaw = {
  name: 'youtube',
  path: 'youtube',
  component: () => import('./YoutubeView.vue'),
  beforeEnter: async () => {
    const userStore = useUserStore();

    try {
      const user = await userStore.getUserInfo();

      if (!user) {
        return 'unauthorized';
      }

      if (
        user.roles.includes(EUserRoles.MODERATOR) ||
        user.roles.includes(EUserRoles.ADMIN)
      ) {
        return true;
      }

      return 'forbidden';
    } catch (err) {
      return 'internal-server';
    }
  }
};
