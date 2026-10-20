import { ProfileMainPage } from './main';

import type { RouteRecordRaw } from 'vue-router';

export const ProfilePage: RouteRecordRaw = {
  name: 'profile',
  path: '/profile',
  children: [ProfileMainPage],
};
