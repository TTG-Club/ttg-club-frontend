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

export const WorkshopFeatsPage: RouteRecordRaw = {
  name: 'workshop-feats',
  path: '/workshop/feats',
  component: () => import('./feats/WorkshopFeatsView.vue'),
};

export const WorkshopFeatCreatePage: RouteRecordRaw = {
  name: 'workshop-feat-create',
  path: '/workshop/feats/create',
  component: () => import('./feats/FeatCreateView.vue'),
};

export const WorkshopFeatEditPage: RouteRecordRaw = {
  name: 'workshop-feat-edit',
  path: '/workshop/feats/:featName/edit',
  component: () => import('./feats/FeatEditView.vue'),
};

export const WorkshopBackgroundsPage: RouteRecordRaw = {
  name: 'workshop-backgrounds',
  path: '/workshop/backgrounds',
  component: () => import('./backgrounds/WorkshopBackgroundsView.vue'),
};

export const WorkshopBackgroundCreatePage: RouteRecordRaw = {
  name: 'workshop-background-create',
  path: '/workshop/backgrounds/create',
  component: () => import('./backgrounds/BackgroundCreateView.vue'),
};

export const WorkshopBackgroundEditPage: RouteRecordRaw = {
  name: 'workshop-background-edit',
  path: '/workshop/backgrounds/:backgroundName/edit',
  component: () => import('./backgrounds/BackgroundEditView.vue'),
};

export const WorkshopClassesPage: RouteRecordRaw = {
  name: 'workshop-classes',
  path: '/workshop/classes',
  component: () => import('./classes/WorkshopClassesView.vue'),
};

export const WorkshopClassCreatePage: RouteRecordRaw = {
  name: 'workshop-class-create',
  path: '/workshop/classes/create',
  component: () => import('./classes/ClassCreateView.vue'),
};

export const WorkshopClassEditPage: RouteRecordRaw = {
  name: 'workshop-class-edit',
  path: '/workshop/classes/:className/edit',
  component: () => import('./classes/ClassEditView.vue'),
};

export const WorkshopArchetypeEditPage: RouteRecordRaw = {
  name: 'workshop-archetype-edit',
  path: '/workshop/classes/:className/:archetypeName/edit',
  component: () => import('./classes/ArchetypeEditView.vue'),
};

export const WorkshopRacesPage: RouteRecordRaw = {
  name: 'workshop-races',
  path: '/workshop/races',
  component: () => import('./races/WorkshopRacesView.vue'),
};

export const WorkshopRaceCreatePage: RouteRecordRaw = {
  name: 'workshop-race-create',
  path: '/workshop/races/create',
  component: () => import('./races/RaceCreateView.vue'),
};

export const WorkshopRaceEditPage: RouteRecordRaw = {
  name: 'workshop-race-edit',
  path: '/workshop/races/:raceName/edit',
  component: () => import('./races/RaceEditView.vue'),
};

export const WorkshopWeaponsPage: RouteRecordRaw = {
  name: 'workshop-weapons',
  path: '/workshop/weapons',
  component: () => import('./weapons/WorkshopWeaponsView.vue'),
};

export const WorkshopWeaponCreatePage: RouteRecordRaw = {
  name: 'workshop-weapon-create',
  path: '/workshop/weapons/create',
  component: () => import('./weapons/WeaponCreateView.vue'),
};

export const WorkshopWeaponEditPage: RouteRecordRaw = {
  name: 'workshop-weapon-edit',
  path: '/workshop/weapons/:weaponName/edit',
  component: () => import('./weapons/WeaponEditView.vue'),
};

export const WorkshopArmorsPage: RouteRecordRaw = {
  name: 'workshop-armors',
  path: '/workshop/armors',
  component: () => import('./armors/WorkshopArmorsView.vue'),
};

export const WorkshopArmorCreatePage: RouteRecordRaw = {
  name: 'workshop-armor-create',
  path: '/workshop/armors/create',
  component: () => import('./armors/ArmorCreateView.vue'),
};

export const WorkshopArmorEditPage: RouteRecordRaw = {
  name: 'workshop-armor-edit',
  path: '/workshop/armors/:armorName/edit',
  component: () => import('./armors/ArmorEditView.vue'),
};

export * from './bestiary';

export * from './screens';
