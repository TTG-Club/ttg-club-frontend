import type { RouteRecordRaw } from 'vue-router';

export const VerifyEmailPage: RouteRecordRaw = {
  name: 'verify-email',
  path: '/verify-email',
  component: () => import('./VerifyEmailView.vue'),
};
