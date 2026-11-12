import type { Component } from 'vue';

import { BESTIARY_SECTION } from '~bestiary/model';
import {
  BACKGROUNDS_SECTION,
  CLASSES_SECTION,
  FEATS_SECTION,
  OPTIONS_SECTION,
  RACES_SECTION,
  SPELLS_SECTION,
} from '~character/model';
import {
  ARMORS_SECTION,
  ITEMS_SECTION,
  MAGIC_ITEMS_SECTION,
  WEAPONS_SECTION,
} from '~inventory/model';
import {
  BOOKS_SECTION,
  GODS_SECTION,
  RULES_SECTION,
  SCREENS_SECTION,
} from '~wiki/model';

import { DM_SCREEN_TRAITS_PATH } from '../model';

// Карточки всех разделов тяжёлые, а окно показывает одну: каждая
// подключается лениво, когда её запись впервые встаёт на ширму
const FeatEntry = defineAsyncComponent(() =>
  import('~character/feats').then((module) => module.FeatEntry),
);

/**
 * Карточка записи по адресу её раздела. Каждая карточка принимает `path` и
 * сама грузит запись, как поверх списка раздела.
 */
export const DM_SCREEN_ENTRIES: Readonly<Record<string, Component>> = {
  [SPELLS_SECTION.path]: defineAsyncComponent(() =>
    import('~character/spells').then((module) => module.SpellEntry),
  ),
  [FEATS_SECTION.path]: FeatEntry,
  [DM_SCREEN_TRAITS_PATH]: FeatEntry,
  [BACKGROUNDS_SECTION.path]: defineAsyncComponent(() =>
    import('~character/backgrounds').then((module) => module.BackgroundEntry),
  ),
  [OPTIONS_SECTION.path]: defineAsyncComponent(() =>
    import('~character/options').then((module) => module.OptionEntry),
  ),
  [RACES_SECTION.path]: defineAsyncComponent(() =>
    import('~character/races').then((module) => module.RaceEntry),
  ),
  [CLASSES_SECTION.path]: defineAsyncComponent(() =>
    import('~character/classes').then((module) => module.ClassEntry),
  ),
  [WEAPONS_SECTION.path]: defineAsyncComponent(() =>
    import('~inventory/weapons').then((module) => module.WeaponEntry),
  ),
  [ARMORS_SECTION.path]: defineAsyncComponent(() =>
    import('~inventory/armors').then((module) => module.ArmorEntry),
  ),
  [ITEMS_SECTION.path]: defineAsyncComponent(() =>
    import('~inventory/items').then((module) => module.ItemEntry),
  ),
  [MAGIC_ITEMS_SECTION.path]: defineAsyncComponent(() =>
    import('~inventory/magic-items').then((module) => module.MagicItemEntry),
  ),
  [BESTIARY_SECTION.path]: defineAsyncComponent(() =>
    import('~bestiary/creatures').then((module) => module.CreatureEntry),
  ),
  [GODS_SECTION.path]: defineAsyncComponent(() =>
    import('~wiki/gods').then((module) => module.GodEntry),
  ),
  [RULES_SECTION.path]: defineAsyncComponent(() =>
    import('~wiki/rules').then((module) => module.RuleEntry),
  ),
  [BOOKS_SECTION.path]: defineAsyncComponent(() =>
    import('~wiki/books').then((module) => module.BookEntry),
  ),
  [SCREENS_SECTION.path]: defineAsyncComponent(() =>
    import('~wiki/screens').then((module) => module.ScreenEntry),
  ),
};
