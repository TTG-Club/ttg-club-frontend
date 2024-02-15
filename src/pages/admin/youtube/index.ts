import type { RouteRecordRaw } from 'vue-router';

export const AdminYoutubePage: RouteRecordRaw = {
  name: 'youtube',
  path: 'youtube',
  component: () => import('./YoutubeView.vue'),
};
