import { BooksItemPage } from './books-item';

import type { RouteRecordRaw } from 'vue-router';

export const BooksPage: RouteRecordRaw = {
  name: 'books',
  path: '/books',
  component: () => import('./BooksView.vue'),
  children: [BooksItemPage],
};
