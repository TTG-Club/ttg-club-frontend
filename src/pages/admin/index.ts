import { AdminYoutubePage } from './youtube';

import type { RouteRecordRaw } from 'vue-router';

export const AdminPage: RouteRecordRaw = {
  name: 'admin',
  path: '/admin',
  children: [AdminYoutubePage]
};
