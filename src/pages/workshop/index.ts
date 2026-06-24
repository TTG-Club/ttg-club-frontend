import type { RouteRecordRaw } from 'vue-router';

export const WorkshopPage: RouteRecordRaw = {
  name: 'workshop',
  path: '/workshop',
  component: () => import('./WorkshopView.vue'),
};

export const WorkshopSpellsPage: RouteRecordRaw = {
  name: 'workshop-spells',
  path: '/workshop/spells',
  component: () => import('./spells/WorkshopSpellsView.vue'),
};

export const WorkshopSpellCreatePage: RouteRecordRaw = {
  name: 'workshop-spell-create',
  path: '/workshop/spells/create',
  component: () => import('./spells/SpellCreateView.vue'),
};

export const WorkshopSpellEditPage: RouteRecordRaw = {
  name: 'workshop-spell-edit',
  path: '/workshop/spells/:spellName/edit',
  component: () => import('./spells/SpellEditView.vue'),
};

export * from './bestiary';

export * from './screens';
