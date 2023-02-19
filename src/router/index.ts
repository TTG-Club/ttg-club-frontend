import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import { useNavStore } from '@/store/UI/NavStore';
import { useUserStore } from '@/store/UI/UserStore';
import { useAxios } from '@/common/composition/useAxios';

/* eslint-disable max-len,vue/max-len */
const routes: Readonly<RouteRecordRaw[]> = [
    {
        name: 'index',
        path: '/',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Main' */ '@/views/IndexView.vue')
    },
    {
        name: 'classes',
        path: '/classes',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Classes/ClassesView.vue'),
        children: [
            {
                name: 'classDetail',
                path: ':className/:classArchetype?',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Classes/ClassDetail.vue')
            }
        ]
    },
    {
        name: 'races',
        path: '/races',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Races/RacesView.vue'),
        children: [
            {
                name: 'raceDetail',
                path: ':raceName/:subrace?',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Races/RaceDetail.vue')
            }
        ]
    },
    {
        name: 'traits',
        path: '/traits',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Traits/TraitsView.vue'),
        children: [
            {
                name: 'traitDetail',
                path: ':traitName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Traits/TraitDetail.vue')
            }
        ]
    },
    {
        name: 'backgrounds',
        path: '/backgrounds',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Backgrounds/BackgroundsView.vue'),
        children: [
            {
                name: 'backgroundDetail',
                path: ':backgroundName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Backgrounds/BackgroundDetail.vue')
            }
        ]
    },
    {
        name: 'options',
        path: '/options',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Options/OptionsView.vue'),
        children: [
            {
                name: 'optionDetail',
                path: ':optionName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Options/OptionDetail.vue')
            }
        ]
    },
    {
        name: 'spells',
        path: '/spells',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Spells/SpellsView.vue'),
        children: [
            {
                name: 'spellDetail',
                path: ':spellName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Spells/SpellDetail.vue')
            }
        ]
    },
    {
        name: 'weapons',
        path: '/weapons',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Weapons/WeaponsView.vue'),
        children: [
            {
                name: 'weaponDetail',
                path: ':weaponName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Weapons/WeaponDetail.vue')
            }
        ]
    },
    {
        name: 'armors',
        path: '/armors',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Armors/ArmorsView.vue'),
        children: [
            {
                name: 'armorDetail',
                path: ':armorName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Armors/ArmorDetail.vue')
            }
        ]
    },
    {
        name: 'magicItems',
        path: '/items/magic',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/MagicItems/MagicItemsView.vue'),
        children: [
            {
                name: 'magicItemDetail',
                path: ':magicItemName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/MagicItems/MagicItemDetail.vue')
            }
        ]
    },
    {
        name: 'items',
        path: '/items',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Items/ItemsView.vue'),
        children: [
            {
                name: 'itemDetail',
                path: ':itemName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Items/ItemDetail.vue')
            }
        ]
    },
    {
        name: 'treasures',
        path: '/treasures',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Treasures/TreasuresView.vue')
    },
    {
        name: 'bestiary',
        path: '/bestiary',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Workshop' */ '@/views/Workshop/Bestiary/BestiaryView.vue'),
        children: [
            {
                name: 'creatureDetail',
                path: ':creatureName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Workshop' */ '@/views/Workshop/Bestiary/CreatureDetail.vue')
            }
        ]
    },
    {
        name: 'screens',
        path: '/screens',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Workshop' */ '@/views/Workshop/Screens/ScreensView.vue'),
        children: [
            {
                name: 'screenDetail',
                path: ':screenName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Workshop' */ '@/views/Workshop/Screens/ScreenDetail.vue')
            }
        ]
    },
    {
        name: 'gods',
        path: '/gods',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Gods/GodsView.vue'),
        children: [
            {
                name: 'godDetail',
                path: ':godName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Gods/GodDetail.vue')
            }
        ]
    },
    {
        name: 'rules',
        path: '/rules',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Rules/RulesView.vue'),
        children: [
            {
                name: 'ruleDetail',
                path: ':ruleName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Rules/RuleDetail.vue')
            }
        ]
    },
    {
        name: 'books',
        path: '/books',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Books/BooksView.vue'),
        children: [
            {
                name: 'bookDetail',
                path: ':bookName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Books/BookDetail.vue')
            }
        ]
    },
    {
        name: 'trader',
        path: '/tools/trader',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/TraderView.vue')
    },
    {
        name: 'treasury',
        path: '/tools/treasury',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/TreasuryView.vue')
    },
    {
        name: 'wild-magic',
        path: '/tools/wildmagic',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/WildMagicView.vue')
    },
    {
        name: 'madness',
        path: '/tools/madness',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/MadnessView.vue')
    },
    {
        name: 'encounters',
        path: '/tools/encounters',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/EncountersView.vue')
    },
    {
        name: 'ability-calc',
        path: '/tools/ability-calc',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/AbilityCalc/AbilityCalcView.vue')
    },
    {
        name: 'search-page',
        path: '/search',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Search' */ '@/views/Search/SearchView.vue')
    },
    {
        name: 'profile',
        path: '/profile/:username',
        alias: '/profile',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Account' */ '@/views/User/Profile/ProfileView.vue'),
        beforeEnter: async (to, from, next) => {
            const userStore = useUserStore();

            try {
                if (!(await userStore.getUserStatus())) {
                    next({ name: 'index' });

                    return;
                }
            } catch (err) {
                next({ name: 'index' });

                return;
            }

            next();
        }
    },
    {
        name: 'info-page',
        path: '/info/:path',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'InfoPage' */ '@/views/InfoPageView.vue'),
        beforeEnter: async (to, from, next) => {
            const http = useAxios();

            try {
                const resp = await http.post({ url: to.path });

                if (resp.status !== 200) {
                    next({ name: 'index' });

                    return;
                }

                next();
            } catch (err) {
                next({ name: 'index' });
            }
        }
    },
    {
        name: 'unknown-error',
        path: '/error',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'ErrorPages' */ '@/views/Errors/UnknownView.vue')
    },
    {
        name: 'not-found',
        path: '/404',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'ErrorPages' */ '@/views/Errors/NotFoundView.vue')
    },
    {
        name: 'unauthorized',
        path: '/401',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'ErrorPages' */ '@/views/Errors/UnauthorizedView.vue')
    },
    {
        name: 'forbidden',
        path: '/403',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'ErrorPages' */ '@/views/Errors/ForbiddenView.vue')
    },
    {
        name: 'internal-server',
        path: '/500',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'ErrorPages' */ '@/views/Errors/InternalServerView.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: {
            path: '/404'
        }
    }
];
/* eslint-enable max-len,vue/max-len */

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const navStore = useNavStore();

    navStore.isShowMenu = false;

    if (from.path !== to.path) {
        navStore.updateMetaByURL(to.path).then();
    }

    next();
});

export default router;
