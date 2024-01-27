import { WorkshopBestiaryPage } from './bestiary';
import { WorkshopMainPage } from './main';

import type { RouteRecordRaw } from 'vue-router';

export const WorkshopPage: RouteRecordRaw = {
  name: 'workshop',
  path: '/workshop',
  children: [WorkshopMainPage, WorkshopBestiaryPage]
};
