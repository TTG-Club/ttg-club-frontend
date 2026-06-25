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

export const WorkshopBestiaryPage: RouteRecordRaw = {
  name: 'workshop-bestiary',
  path: '/workshop/bestiary',
  component: () => import('./bestiary/WorkshopBestiaryView.vue'),
};

export const WorkshopCreatureCreatePage: RouteRecordRaw = {
  name: 'workshop-creature-create',
  path: '/workshop/bestiary/create',
  component: () => import('./bestiary/CreatureCreateView.vue'),
};

export const WorkshopCreatureEditPage: RouteRecordRaw = {
  name: 'workshop-creature-edit',
  path: '/workshop/bestiary/:creatureName/edit',
  component: () => import('./bestiary/CreatureEditView.vue'),
};

export * from './bestiary';

export * from './screens';
