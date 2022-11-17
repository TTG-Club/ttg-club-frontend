import {
    createRouter, createWebHistory
} from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useNavStore } from '@/store/UI/NavStore';

/* eslint-disable max-len,vue/max-len */
const routes: Readonly<RouteRecordRaw[]> = [
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
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Spells' */ '@/views/Spells/SpellsView.vue'),
        children: [
            {
                name: 'spellDetail',
                path: ':spellName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Spells' */ '@/views/Spells/SpellDetail.vue')
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
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/MagicItems/MagicItemsView.vue'),
        children: [
            {
                name: 'magicItemDetail',
                path: ':magicItemName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/MagicItems/MagicItemDetail.vue')
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
        name: 'bestiary',
        path: '/bestiary',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Bestiary' */ '@/views/Bestiary/BestiaryView.vue'),
        children: [
            {
                name: 'creatureDetail',
                path: ':creatureName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Bestiary' */ '@/views/Bestiary/CreatureDetail.vue')
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
        name: 'screens',
        path: '/screens',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Screens' */ '@/views/Screens/ScreensView.vue'),
        children: [
            {
                name: 'screenDetail',
                path: ':screenName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Screens' */ '@/views/Screens/ScreenDetail.vue')
            }
        ]
    },
    {
        name: 'treasures',
        path: '/treasures',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/Treasures/TreasuresView.vue')
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
    }
];
/* eslint-enable max-len,vue/max-len */

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async to => {
    const navStore = useNavStore();

    await navStore.updateMetaByURL(to.path);
});

export default router;
