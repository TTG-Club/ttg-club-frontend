import { WorkshopCreatureEditPage } from './creature-edit';
import { WorkshopCreatureNewPage } from './creature-new';
import { WorkshopCreaturesPage } from './creatures';

import type { RouteRecordRaw } from 'vue-router';

export const WorkshopBestiaryPage: RouteRecordRaw = {
  name: 'workshop-bestiary',
  path: 'bestiary',
  children: [
    WorkshopCreatureNewPage,
    WorkshopCreatureEditPage,
    WorkshopCreaturesPage,
  ],
};
