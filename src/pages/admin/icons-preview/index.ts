import type { RouteRecordRaw } from 'vue-router';

export const IconsPreviewPage: RouteRecordRaw = {
  name: 'icons-preview',
  path: 'icons-preview',
  component: () => import('./IconsPreview.vue')
};
