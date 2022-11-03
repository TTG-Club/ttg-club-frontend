import {
    createRouter, createWebHistory
} from 'vue-router';
import { useNavStore } from '@/store/UI/NavStore';

const routes = [
    {
        name: 'classes',
        path: '/classes',
        component: () => import('@/views/Character/Classes/ClassesView'),
        children: [
            {
                name: 'classDetail',
                path: ':className/:classArchetype?',
                component: () => import('@/views/Character/Classes/ClassDetail')
            }
        ]
    },
    {
        name: 'races',
        path: '/races',
        component: () => import('@/views/Character/Races/RacesView'),
        children: [
            {
                name: 'raceDetail',
                path: ':raceName/:subrace?',
                component: () => import('@/views/Character/Races/RaceDetail')
            }
        ]
    },
    {
        name: 'traits',
        path: '/traits',
        component: () => import('@/views/Character/Traits/TraitsView'),
        children: [
            {
                name: 'traitDetail',
                path: ':traitName',
                component: () => import('@/views/Character/Traits/TraitDetail')
            }
        ]
    },
    {
        name: 'backgrounds',
        path: '/backgrounds',
        component: () => import('@/views/Character/Backgrounds/BackgroundsView'),
        children: [
            {
                name: 'backgroundDetail',
                path: ':backgroundName',
                component: () => import('@/views/Character/Backgrounds/BackgroundDetail')
            }
        ]
    },
    {
        name: 'options',
        path: '/options',
        component: () => import('@/views/Character/Options/OptionsView'),
        children: [
            {
                name: 'optionDetail',
                path: ':optionName',
                component: () => import('@/views/Character/Options/OptionDetail')
            }
        ]
    },
    {
        name: 'spells',
        path: '/spells',
        component: () => import('@/views/Spells/SpellsView'),
        children: [
            {
                name: 'spellDetail',
                path: ':spellName',
                component: () => import('@/views/Spells/SpellDetail')
            }
        ]
    },
    {
        name: 'weapons',
        path: '/weapons',
        component: () => import('@/views/Inventory/Weapons/WeaponsView'),
        children: [
            {
                name: 'weaponDetail',
                path: ':weaponName',
                component: () => import('@/views/Inventory/Weapons/WeaponDetail')
            }
        ]
    },
    {
        name: 'armors',
        path: '/armors',
        component: () => import('@/views/Inventory/Armors/ArmorsView'),
        children: [
            {
                name: 'armorDetail',
                path: ':armorName',
                component: () => import('@/views/Inventory/Armors/ArmorDetail')
            }
        ]
    },
    {
        name: 'magicItems',
        path: '/items/magic',
        component: () => import('@/views/Treasures/MagicItems/MagicItemsView'),
        children: [
            {
                name: 'magicItemDetail',
                path: ':magicItemName',
                component: () => import('@/views/Treasures/MagicItems/MagicItemDetail')
            }
        ]
    },
    {
        name: 'items',
        path: '/items',
        component: () => import('@/views/Inventory/Items/ItemsView'),
        children: [
            {
                name: 'itemDetail',
                path: ':itemName',
                component: () => import('@/views/Inventory/Items/ItemDetail')
            }
        ]
    },
    {
        name: 'bestiary',
        path: '/bestiary',
        component: () => import('@/views/Bestiary/BestiaryView'),
        children: [
            {
                name: 'creatureDetail',
                path: ':creatureName',
                component: () => import('@/views/Bestiary/CreatureDetail')
            }
        ]
    },
    {
        name: 'gods',
        path: '/gods',
        component: () => import('@/views/Wiki/Gods/GodsView'),
        children: [
            {
                name: 'godDetail',
                path: ':godName',
                component: () => import('@/views/Wiki/Gods/GodDetail')
            }
        ]
    },
    {
        name: 'rules',
        path: '/rules',
        component: () => import('@/views/Wiki/Rules/RulesView'),
        children: [
            {
                name: 'ruleDetail',
                path: ':ruleName',
                component: () => import('@/views/Wiki/Rules/RuleDetail')
            }
        ]
    },
    {
        name: 'books',
        path: '/books',
        component: () => import('@/views/Wiki/Books/BooksView'),
        children: [
            {
                name: 'bookDetail',
                path: ':bookName',
                component: () => import('@/views/Wiki/Books/BookDetail')
            }
        ]
    },
    {
        name: 'screens',
        path: '/screens',
        component: () => import('@/views/Screens/ScreensView'),
        children: [
            {
                name: 'screenDetail',
                path: ':screenName',
                component: () => import('@/views/Screens/ScreenDetail')
            }
        ]
    },
    {
        name: 'treasures',
        path: '/treasures',
        component: () => import('@/views/Treasures/Treasures/TreasuresView')
    },
    {
        name: 'trader',
        path: '/tools/trader',
        component: () => import('@/views/Tools/TraderView')
    },
    {
        name: 'treasury',
        path: '/tools/treasury',
        component: () => import('@/views/Tools/TreasuryView')
    },
    {
        name: 'wild-magic',
        path: '/tools/wildmagic',
        component: () => import('@/views/Tools/WildMagicView')
    },
    {
        name: 'madness',
        path: '/tools/madness',
        component: () => import('@/views/Tools/MadnessView')
    },
    {
        name: 'encounters',
        path: '/tools/encounters',
        component: () => import('@/views/Tools/EncountersView')
    },
    {
        name: 'ability-calc',
        path: '/tools/ability-calc',
        component: () => import('@/views/Tools/AbilityCalc/AbilityCalcView')
    }
];

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
