import type { RouteRecordRaw } from 'vue-router';
import { EUserRoles, useUserStore } from '@/store/UI/UserStore';
import { useNavStore } from '@/store/UI/NavStore';
import IndexView from '@/views/IndexView.vue';

/* eslint-disable max-len,vue/max-len */
export const routes: Readonly<RouteRecordRaw[]> = [
  {
    name: 'index',
    path: '/',
    component: IndexView,
    beforeEnter: (to, from, next) => {
      const navStore = useNavStore();

      navStore.initPartners()
        .then(() => {
          next();
        });
    }
  },
  {
    name: 'classes',
    path: '/classes',
    component: () => import('@/views/Character/Classes/ClassesView.vue'),
    children: [
      {
        name: 'classDetail',
        path: ':className/:classArchetype?',
        component: () => import('@/views/Character/Classes/ClassDetail.vue')
      }
    ]
  },
  {
    name: 'races',
    path: '/races',
    component: () => import('@/views/Character/Races/RacesView.vue'),
    children: [
      {
        name: 'raceDetail',
        path: ':raceName/:subrace?',
        component: () => import('@/views/Character/Races/RaceDetail.vue')
      }
    ]
  },
  {
    name: 'traits',
    path: '/traits',
    component: () => import('@/views/Character/Traits/TraitsView.vue'),
    children: [
      {
        name: 'traitDetail',
        path: ':traitName',
        component: () => import('@/views/Character/Traits/TraitDetail.vue')
      }
    ]
  },
  {
    name: 'backgrounds',
    path: '/backgrounds',
    component: () => import('@/views/Character/Backgrounds/BackgroundsView.vue'),
    children: [
      {
        name: 'backgroundDetail',
        path: ':backgroundName',
        component: () => import('@/views/Character/Backgrounds/BackgroundDetail.vue')
      }
    ]
  },
  {
    name: 'options',
    path: '/options',
    component: () => import('@/views/Character/Options/OptionsView.vue'),
    children: [
      {
        name: 'optionDetail',
        path: ':optionName',
        component: () => import('@/views/Character/Options/OptionDetail.vue')
      }
    ]
  },
  {
    name: 'spells',
    path: '/spells',
    component: () => import('@/views/Character/Spells/SpellsView.vue'),
    children: [
      {
        name: 'spellDetail',
        path: ':spellName',
        component: () => import('@/views/Character/Spells/SpellDetail.vue')
      }
    ]
  },
  {
    name: 'weapons',
    path: '/weapons',
    component: () => import('@/views/Inventory/Weapons/WeaponsView.vue'),
    children: [
      {
        name: 'weaponDetail',
        path: ':weaponName',
        component: () => import('@/views/Inventory/Weapons/WeaponDetail.vue')
      }
    ]
  },
  {
    name: 'armors',
    path: '/armors',
    component: () => import('@/views/Inventory/Armors/ArmorsView.vue'),
    children: [
      {
        name: 'armorDetail',
        path: ':armorName',
        component: () => import('@/views/Inventory/Armors/ArmorDetail.vue')
      }
    ]
  },
  {
    name: 'magicItems',
    path: '/items/magic',
    component: () => import('@/views/Inventory/MagicItems/MagicItemsView.vue'),
    children: [
      {
        name: 'magicItemDetail',
        path: ':magicItemName',
        component: () => import('@/views/Inventory/MagicItems/MagicItemDetail.vue')
      }
    ]
  },
  {
    name: 'items',
    path: '/items',
    component: () => import('@/views/Inventory/Items/ItemsView.vue'),
    children: [
      {
        name: 'itemDetail',
        path: ':itemName',
        component: () => import('@/views/Inventory/Items/ItemDetail.vue')
      }
    ]
  },
  {
    name: 'treasures',
    path: '/treasures',
    component: () => import('@/views/Inventory/Treasures/TreasuresView.vue')
  },
  {
    name: 'bestiary',
    path: '/bestiary',
    component: () => import('@/views/Workshop/Bestiary/BestiaryView.vue'),
    children: [
      {
        name: 'creatureDetail',
        path: ':creatureName',
        component: () => import('@/views/Workshop/Bestiary/CreatureDetail.vue')
      }
    ]
  },
  {
    name: 'screens',
    path: '/screens',
    component: () => import('@/views/Workshop/Screens/ScreensView.vue'),
    children: [
      {
        name: 'screenDetail',
        path: ':screenName',
        component: () => import('@/views/Workshop/Screens/ScreenDetail.vue')
      }
    ]
  },
  {
    name: 'gods',
    path: '/gods',
    component: () => import('@/views/Wiki/Gods/GodsView.vue'),
    children: [
      {
        name: 'godDetail',
        path: ':godName',
        component: () => import('@/views/Wiki/Gods/GodDetail.vue')
      }
    ]
  },
  {
    name: 'rules',
    path: '/rules',
    component: () => import('@/views/Wiki/Rules/RulesView.vue'),
    children: [
      {
        name: 'ruleDetail',
        path: ':ruleName',
        component: () => import('@/views/Wiki/Rules/RuleDetail.vue')
      }
    ]
  },
  {
    name: 'books',
    path: '/books',
    component: () => import('@/views/Wiki/Books/BooksView.vue'),
    children: [
      {
        name: 'bookDetail',
        path: ':bookName',
        component: () => import('@/views/Wiki/Books/BookDetail.vue')
      }
    ]
  },
  {
    name: 'trader',
    path: '/tools/trader',
    component: () => import('@/views/Tools/TraderView.vue')
  },
  {
    name: 'treasury',
    path: '/tools/treasury',
    component: () => import('@/views/Tools/TreasuryView.vue')
  },
  {
    name: 'wild-magic',
    path: '/tools/wildmagic',
    component: () => import('@/views/Tools/WildMagicView.vue')
  },
  {
    name: 'madness',
    path: '/tools/madness',
    component: () => import('@/views/Tools/MadnessView.vue')
  },
  {
    name: 'encounters',
    path: '/tools/encounters',
    component: () => import('@/views/Tools/EncountersView.vue')
  },
  {
    name: 'ability-calc',
    path: '/tools/ability-calc',
    component: () => import('@/views/Tools/AbilityCalc/AbilityCalcView.vue')
  },
  {
    name: 'search-page',
    path: '/search',
    component: () => import('@/views/Search/SearchView.vue')
  },
  {
    name: 'profile',
    path: '/profile/:username?',
    component: () => import('@/views/User/Profile/ProfileView.vue'),
    beforeEnter: async (to, from, next) => {
      const userStore = useUserStore();

      try {
        const user = await userStore.getUserInfo();

        if (!user) {
          next({ name: 'unauthorized' });

          return;
        }

        if (user.roles.includes(EUserRoles.MODERATOR) || user.roles.includes(EUserRoles.ADMIN)) {
          next();

          return;
        }

        next({ name: 'forbidden' });
      } catch (err) {
        next({ name: 'internal-server' });
      }
    }
  },
  {
    name: 'reset-password',
    path: '/reset/password',
    component: () => import('@/views/User/ResetPasswordView.vue'),
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
    name: 'info-page',
    path: '/info/:path',
    component: () => import('@/views/InfoPageView.vue')
  },
  {
    name: 'unknown-error',
    path: '/error',
    children: [
      {
        name: 'unknown-error',
        path: '',
        component: () => import('@/views/Errors/UnknownView.vue')
      },
      {
        name: 'not-found',
        path: '/404',
        component: () => import('@/views/Errors/NotFoundView.vue')
      },
      {
        name: 'unauthorized',
        path: '/401',
        component: () => import('@/views/Errors/UnauthorizedView.vue')
      },
      {
        name: 'forbidden',
        path: '/403',
        component: () => import('@/views/Errors/ForbiddenView.vue')
      },
      {
        name: 'internal-server',
        path: '/500',
        component: () => import('@/views/Errors/InternalServerView.vue')
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
