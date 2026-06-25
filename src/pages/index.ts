import { AdminPage } from './admin';
import {
  BackgroundsPage,
  ClassesPage,
  OptionsPage,
  RacesPage,
  SpellsPage,
  FeatsPage,
  TraitsPage,
} from './character';
import { ErrorPage } from './errors';
import { IndexPage } from './index-page';
import { InfoPage } from './info';
import {
  ArmorsPage,
  ItemsPage,
  MagicItemsPage,
  TreasuresPage,
  WeaponsPage,
} from './inventory';
import { SearchPage } from './search';
import {
  AbilityCalcPage,
  EncountersPage,
  MadnessPage,
  NameGeneratorPage,
  TavernPage,
  TokenatorPage,
  TraderPage,
  TreasuryPage,
  WildMagicPage,
} from './tools';
import { ProfilePage, ResetPasswordPage, VerifyEmailPage } from './user';
import { BooksPage, GodsPage, RulesPage } from './wiki';
import {
  BestiaryPage,
  ScreensPage,
  WorkshopPage,
  WorkshopBackgroundCreatePage,
  WorkshopBackgroundEditPage,
  WorkshopBackgroundsPage,
  WorkshopBestiaryPage,
  WorkshopCreatureCreatePage,
  WorkshopCreatureEditPage,
  WorkshopFeatCreatePage,
  WorkshopFeatEditPage,
  WorkshopFeatsPage,
  WorkshopSpellCreatePage,
  WorkshopSpellEditPage,
  WorkshopSpellsPage,
} from './workshop';

import type { RouteRecordRaw } from 'vue-router';

const customRoutes: Readonly<RouteRecordRaw[]> = [
  IndexPage,
  BackgroundsPage,
  ClassesPage,
  OptionsPage,
  RacesPage,
  SpellsPage,
  FeatsPage,
  TraitsPage, // TODO: Удалить редирект после индексации нового раздела `feats`
  WeaponsPage,
  ArmorsPage,
  ItemsPage,
  MagicItemsPage,
  TreasuresPage,
  BestiaryPage,
  ScreensPage,
  WorkshopPage,
  WorkshopSpellsPage,
  WorkshopSpellCreatePage,
  WorkshopSpellEditPage,
  WorkshopBestiaryPage,
  WorkshopCreatureCreatePage,
  WorkshopCreatureEditPage,
  WorkshopFeatsPage,
  WorkshopFeatCreatePage,
  WorkshopFeatEditPage,
  WorkshopBackgroundsPage,
  WorkshopBackgroundCreatePage,
  WorkshopBackgroundEditPage,
  GodsPage,
  RulesPage,
  BooksPage,
  TraderPage,
  TreasuryPage,
  WildMagicPage,
  MadnessPage,
  NameGeneratorPage,
  TavernPage,
  TokenatorPage,
  EncountersPage,
  AbilityCalcPage,
  SearchPage,
  ProfilePage,
  ResetPasswordPage,
  VerifyEmailPage,
  AdminPage,
  InfoPage,
  ErrorPage,
];

export const routes: Readonly<RouteRecordRaw[]> = [
  ...customRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: () => ({ name: 'not-found' }),
  },
];
