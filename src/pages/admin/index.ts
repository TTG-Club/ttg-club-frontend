import { EUserRoles, useUserStore } from '@/shared/stores/UserStore';

import { IconsPreviewPage } from './icons-preview';
import { AdminYoutubePage } from './youtube';

import type { RouteRecordRaw } from 'vue-router';

export const AdminPage: RouteRecordRaw = {
  name: 'admin',
  path: '/admin',
  children: [AdminYoutubePage, IconsPreviewPage],
  beforeEnter: async () => {
    const userStore = useUserStore();

    try {
      const user = await userStore.getUserInfo();

      if (!user) {
        return { name: 'unauthorized' };
      }

      if (
        user.roles.includes(EUserRoles.MODERATOR) ||
        user.roles.includes(EUserRoles.ADMIN)
      ) {
        return true;
      }

      return { name: 'forbidden' };
    } catch (err) {
      return { name: 'internal-server' };
    }
  }
};
