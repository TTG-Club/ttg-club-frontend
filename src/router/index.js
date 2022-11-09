import {
    createRouter, createWebHistory
} from 'vue-router';
import { useNavStore } from '@/store/UI/NavStore';

/* eslint-disable max-len,vue/max-len */
const routes = [
    {
        name: 'classes',
        path: '/classes',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Classes/ClassesView'),
        children: [
            {
                name: 'classDetail',
                path: ':className/:classArchetype?',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Classes/ClassDetail')
            }
        ]
    },
    {
        name: 'races',
        path: '/races',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Races/RacesView'),
        children: [
            {
                name: 'raceDetail',
                path: ':raceName/:subrace?',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Races/RaceDetail')
            }
        ]
    },
    {
        name: 'traits',
        path: '/traits',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Traits/TraitsView'),
        children: [
            {
                name: 'traitDetail',
                path: ':traitName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Traits/TraitDetail')
            }
        ]
    },
    {
        name: 'backgrounds',
        path: '/backgrounds',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Backgrounds/BackgroundsView'),
        children: [
            {
                name: 'backgroundDetail',
                path: ':backgroundName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Backgrounds/BackgroundDetail')
            }
        ]
    },
    {
        name: 'options',
        path: '/options',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Options/OptionsView'),
        children: [
            {
                name: 'optionDetail',
                path: ':optionName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Character' */ '@/views/Character/Options/OptionDetail')
            }
        ]
    },
    {
        name: 'spells',
        path: '/spells',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Spells' */ '@/views/Spells/SpellsView'),
        children: [
            {
                name: 'spellDetail',
                path: ':spellName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Spells' */ '@/views/Spells/SpellDetail')
            }
        ]
    },
    {
        name: 'weapons',
        path: '/weapons',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Weapons/WeaponsView'),
        children: [
            {
                name: 'weaponDetail',
                path: ':weaponName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Weapons/WeaponDetail')
            }
        ]
    },
    {
        name: 'armors',
        path: '/armors',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Armors/ArmorsView'),
        children: [
            {
                name: 'armorDetail',
                path: ':armorName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Armors/ArmorDetail')
            }
        ]
    },
    {
        name: 'magicItems',
        path: '/items/magic',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/MagicItems/MagicItemsView'),
        children: [
            {
                name: 'magicItemDetail',
                path: ':magicItemName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/MagicItems/MagicItemDetail')
            }
        ]
    },
    {
        name: 'items',
        path: '/items',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Items/ItemsView'),
        children: [
            {
                name: 'itemDetail',
                path: ':itemName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Inventory' */ '@/views/Inventory/Items/ItemDetail')
            }
        ]
    },
    {
        name: 'bestiary',
        path: '/bestiary',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Bestiary' */ '@/views/Bestiary/BestiaryView'),
        children: [
            {
                name: 'creatureDetail',
                path: ':creatureName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Bestiary' */ '@/views/Bestiary/CreatureDetail')
            }
        ]
    },
    {
        name: 'gods',
        path: '/gods',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Gods/GodsView'),
        children: [
            {
                name: 'godDetail',
                path: ':godName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Gods/GodDetail')
            }
        ]
    },
    {
        name: 'rules',
        path: '/rules',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Rules/RulesView'),
        children: [
            {
                name: 'ruleDetail',
                path: ':ruleName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Rules/RuleDetail')
            }
        ]
    },
    {
        name: 'books',
        path: '/books',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Books/BooksView'),
        children: [
            {
                name: 'bookDetail',
                path: ':bookName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Wiki' */ '@/views/Wiki/Books/BookDetail')
            }
        ]
    },
    {
        name: 'screens',
        path: '/screens',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Screens' */ '@/views/Screens/ScreensView'),
        children: [
            {
                name: 'screenDetail',
                path: ':screenName',
                component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Screens' */ '@/views/Screens/ScreenDetail')
            }
        ]
    },
    {
        name: 'treasures',
        path: '/treasures',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Treasures' */ '@/views/Treasures/Treasures/TreasuresView')
    },
    {
        name: 'trader',
        path: '/tools/trader',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/TraderView')
    },
    {
        name: 'treasury',
        path: '/tools/treasury',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/TreasuryView')
    },
    {
        name: 'wild-magic',
        path: '/tools/wildmagic',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/WildMagicView')
    },
    {
        name: 'madness',
        path: '/tools/madness',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/MadnessView')
    },
    {
        name: 'encounters',
        path: '/tools/encounters',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/EncountersView')
    },
    {
        name: 'ability-calc',
        path: '/tools/ability-calc',
        component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: 'Tools' */ '@/views/Tools/AbilityCalc/AbilityCalcView')
    }
];
/* eslint-enable max-len,vue/max-len */

const router = createRouter({
    history: createWebHistory(process.env.BUILD_TARGET === 'gh-pages'
        ? '/ttg-club-frontend/'
        : '/'),
    routes
});

router.beforeEach(async to => {
    const navStore = useNavStore();

    await navStore.updateMetaByURL(to.path);
});

export default router;
