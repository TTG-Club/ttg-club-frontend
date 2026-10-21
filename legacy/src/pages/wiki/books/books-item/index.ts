import type { RouteRecordRaw } from 'vue-router';

export const BooksItemPage: RouteRecordRaw = {
  name: 'bookDetail',
  path: ':bookName',
  component: () => import('./BookDetail.vue'),
};
