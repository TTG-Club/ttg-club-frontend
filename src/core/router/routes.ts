import IndexView from '@/pages/IndexView.vue';

import { useNavStore } from '@/shared/stores/NavStore';
import { EUserRoles, useUserStore } from '@/shared/stores/UserStore';

import type { RouteRecordRaw } from 'vue-router';

/* eslint-disable max-len,vue/max-len */
export const routes: Readonly<RouteRecordRaw[]> = [
  {
    name: 'index',
    path: '/',
    component: IndexView,
    beforeEnter: (to, from, next) => {
      const navStore = useNavStore();

      navStore.initPartners().then(() => {
        next();
      });
    }
  },
  {
    name: 'classes',
    path: '/classes',
    component: () => import('@/pages/Character/Classes/ClassesView.vue'),
    children: [
      {
        name: 'classDetail',
        path: ':className/:classArchetype?',
        component: () => import('@/pages/Character/Classes/ClassDetail.vue')
      }
    ]
  },
  {
    name: 'races',
    path: '/races',
    component: () => import('@/pages/Character/Races/RacesView.vue'),
    children: [
      {
        name: 'raceDetail',
        path: ':raceName/:subrace?',
        component: () => import('@/pages/Character/Races/RaceDetail.vue')
      }
    ]
  },
  {
    name: 'traits',
    path: '/traits',
    component: () => import('@/pages/Character/Traits/TraitsView.vue'),
    children: [
      {
        name: 'traitDetail',
        path: ':traitName',
        component: () => import('@/pages/Character/Traits/TraitDetail.vue')
      }
    ]
  },
  {
    name: 'backgrounds',
    path: '/backgrounds',
    component: () =>
      import('@/pages/Character/Backgrounds/BackgroundsView.vue'),
    children: [
      {
        name: 'backgroundDetail',
        path: ':backgroundName',
        component: () =>
          import('@/pages/Character/Backgrounds/BackgroundDetail.vue')
      }
    ]
  },
  {
    name: 'options',
    path: '/options',
    component: () => import('@/pages/Character/Options/OptionsView.vue'),
    children: [
      {
        name: 'optionDetail',
        path: ':optionName',
        component: () => import('@/pages/Character/Options/OptionDetail.vue')
      }
    ]
  },
  {
    name: 'spells',
    path: '/spells',
    component: () => import('@/pages/Character/Spells/SpellsView.vue'),
    children: [
      {
        name: 'spellDetail',
        path: ':spellName',
        component: () => import('@/pages/Character/Spells/SpellDetail.vue')
      }
    ]
  },
  {
    name: 'weapons',
    path: '/weapons',
    component: () => import('@/pages/Inventory/Weapons/WeaponsView.vue'),
    children: [
      {
        name: 'weaponDetail',
        path: ':weaponName',
        component: () => import('@/pages/Inventory/Weapons/WeaponDetail.vue')
      }
    ]
  },
  {
    name: 'armors',
    path: '/armors',
    component: () => import('@/pages/Inventory/Armors/ArmorsView.vue'),
    children: [
      {
        name: 'armorDetail',
        path: ':armorName',
        component: () => import('@/pages/Inventory/Armors/ArmorDetail.vue')
      }
    ]
  },
  {
    name: 'magicItems',
    path: '/items/magic',
    component: () => import('@/pages/Inventory/MagicItems/MagicItemsView.vue'),
    children: [
      {
        name: 'magicItemDetail',
        path: ':magicItemName',
        component: () =>
          import('@/pages/Inventory/MagicItems/MagicItemDetail.vue')
      }
    ]
  },
  {
    name: 'items',
    path: '/items',
    component: () => import('@/pages/Inventory/Items/ItemsView.vue'),
    children: [
      {
        name: 'itemDetail',
        path: ':itemName',
        component: () => import('@/pages/Inventory/Items/ItemDetail.vue')
      }
    ]
  },
  {
    name: 'treasures',
    path: '/treasures',
    component: () => import('@/pages/Inventory/Treasures/TreasuresView.vue')
  },
  {
    name: 'bestiary',
    path: '/bestiary',
    component: () => import('@/pages/Workshop/Bestiary/BestiaryView.vue'),
    children: [
      {
        name: 'creatureDetail',
        path: ':creatureName',
        component: () => import('@/pages/Workshop/Bestiary/CreatureDetail.vue')
      }
    ]
  },
  {
    name: 'screens',
    path: '/screens',
    component: () => import('@/pages/Workshop/Screens/ScreensView.vue'),
    children: [
      {
        name: 'screenDetail',
        path: ':screenName',
        component: () => import('@/pages/Workshop/Screens/ScreenDetail.vue')
      }
    ]
  },
  {
    name: 'gods',
    path: '/gods',
    component: () => import('@/pages/Wiki/Gods/GodsView.vue'),
    children: [
      {
        name: 'godDetail',
        path: ':godName',
        component: () => import('@/pages/Wiki/Gods/GodDetail.vue')
      }
    ]
  },
  {
    name: 'rules',
    path: '/rules',
    component: () => import('@/pages/Wiki/Rules/RulesView.vue'),
    children: [
      {
        name: 'ruleDetail',
        path: ':ruleName',
        component: () => import('@/pages/Wiki/Rules/RuleDetail.vue')
      }
    ]
  },
  {
    name: 'books',
    path: '/books',
    component: () => import('@/pages/Wiki/Books/BooksView.vue'),
    children: [
      {
        name: 'bookDetail',
        path: ':bookName',
        component: () => import('@/pages/Wiki/Books/BookDetail.vue')
      }
    ]
  },
  {
    name: 'trader',
    path: '/tools/trader',
    component: () => import('@/pages/Tools/TraderView.vue')
  },
  {
    name: 'treasury',
    path: '/tools/treasury',
    component: () => import('@/pages/Tools/TreasuryView.vue')
  },
  {
    name: 'wild-magic',
    path: '/tools/wildmagic',
    component: () => import('@/pages/Tools/WildMagicView.vue')
  },
  {
    name: 'madness',
    path: '/tools/madness',
    component: () => import('@/pages/Tools/MadnessView.vue')
  },
  {
    name: 'tokenator',
    path: '/tools/tokenator',
    component: () => import('@/pages/Tools/Tokenator/TokenView.vue')
  },
  {
    name: 'encounters',
    path: '/tools/encounters',
    component: () => import('@/pages/Tools/EncountersView.vue')
  },
  {
    name: 'ability-calc',
    path: '/tools/ability-calc',
    component: () => import('@/pages/Tools/AbilityCalc/AbilityCalcView.vue')
  },
  {
    name: 'search-page',
    path: '/search',
    component: () => import('@/pages/Search/SearchView.vue')
  },
  {
    name: 'profile',
    path: '/profile',
    children: [
      {
        name: 'profile-index',
        path: '',
        component: () => import('@/pages/User/Profile/ProfileView.vue'),
        beforeEnter: async (to, from, next) => {
          const userStore = useUserStore();

          try {
            const user = await userStore.getUserInfo();

            if (!user) {
              next({ name: 'unauthorized' });

              return;
            }

            next();
          } catch (err) {
            next({ name: 'internal-server' });
          }
        }
      }
    ]
  },
  {
    name: 'admin',
    path: '/admin',
    children: [
      {
        name: 'youtube',
        path: 'youtube',
        component: () => import('@/features/youtube/views/YoutubeView.vue'),
        beforeEnter: async (to, from, next) => {
          const userStore = useUserStore();

          try {
            const user = await userStore.getUserInfo();

            if (!user) {
              next({ name: 'unauthorized' });

              return;
            }

            if (
              user.roles.includes(EUserRoles.MODERATOR) ||
              user.roles.includes(EUserRoles.ADMIN)
            ) {
              next();

              return;
            }

            next({ name: 'forbidden' });
          } catch (err) {
            next({ name: 'internal-server' });
          }
        }
      }
    ]
  },
  {
    name: 'reset-password',
    path: '/reset/password',
    component: () => import('@/pages/User/ResetPasswordView.vue'),
    beforeEnter: async (to, from, next) => {
      const userStore = useUserStore();

      try {
        if (await userStore.getUserStatus()) {
          next({ name: 'forbidden' });
        }

        await userStore.getUserInfo();

        next();
      } catch (err) {
        next();
      }
    }
  },
  {
    name: 'tokens',
    path: '/tokens',
    component: () => import('@/features/tokens/TokensPage.vue')
  },
  {
    name: 'info-page',
    path: '/info/:path',
    component: () => import('@/pages/InfoPageView.vue')
  },
  {
    name: 'unknown-error',
    path: '/error',
    children: [
      {
        name: 'unknown-error',
        path: '',
        component: () => import('@/pages/Errors/UnknownView.vue')
      },
      {
        name: 'not-found',
        path: '/404',
        component: () => import('@/pages/Errors/NotFoundView.vue')
      },
      {
        name: 'unauthorized',
        path: '/401',
        component: () => import('@/pages/Errors/UnauthorizedView.vue')
      },
      {
        name: 'forbidden',
        path: '/403',
        component: () => import('@/pages/Errors/ForbiddenView.vue')
      },
      {
        name: 'internal-server',
        path: '/500',
        component: () => import('@/pages/Errors/InternalServerView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: {
      name: 'not-found',
      params: {}
    }
  }
];
/* eslint-enable max-len,vue/max-len */
