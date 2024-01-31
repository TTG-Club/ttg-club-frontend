import { AdminPage } from './admin';
import {
  BackgroundsPage,
  ClassesPage,
  OptionsPage,
  RacesPage,
  SpellsPage,
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
  TokenatorPage,
  TraderPage,
  TreasuryPage,
  WildMagicPage,
} from './tools';
import { ProfilePage, ResetPasswordPage } from './user';
import { BooksPage, GodsPage, RulesPage } from './wiki';
import { BestiaryPage, ScreensPage } from './workshop';

import type { RouteRecordRaw } from 'vue-router';

const customRoutes: Readonly<RouteRecordRaw[]> = [
  IndexPage,
  BackgroundsPage,
  ClassesPage,
  OptionsPage,
  RacesPage,
  SpellsPage,
  TraitsPage,
  WeaponsPage,
  ArmorsPage,
  ItemsPage,
  MagicItemsPage,
  TreasuresPage,
  BestiaryPage,
  ScreensPage,
  GodsPage,
  RulesPage,
  BooksPage,
  TraderPage,
  TreasuryPage,
  WildMagicPage,
  MadnessPage,
  TokenatorPage,
  EncountersPage,
  AbilityCalcPage,
  SearchPage,
  ProfilePage,
  ResetPasswordPage,
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
