import type { SectionConfig, SectionGroupingOption } from '~section/model';

import { SECTION_PAGE_SIZE_ALL } from '~section/model';

/* --- Оружие ------------------------------------------------------------- */

/** Оружия немного, поэтому список грузится целиком, как в старом SPA */
export const WEAPONS_SECTION: SectionConfig = {
  key: 'weapons',
  title: 'Оружие',
  path: '/weapons',
  listUrl: '/api/v1/weapons',
  filterUrl: '/api/v1/filters/weapons',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const WEAPON_TEXT = {
  price: 'Стоимость',
  damage: 'Урон',
  damageType: 'Тип урона',
  weight: 'Вес (в фунтах)',
  properties: 'Свойства',
  twoHanded: 'При атаке двумя руками',
  distance: 'дис.',
  special: 'Особое свойство:',
} as const;

/* --- Доспехи ------------------------------------------------------------ */

export const ARMORS_SECTION: SectionConfig = {
  key: 'armors',
  title: 'Доспехи',
  path: '/armors',
  listUrl: '/api/v1/armors',
  filterUrl: '/api/v1/filters/armors',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const ARMOR_TEXT = {
  armorClass: 'Класс Доспеха (AC)',
  armorClassHint: 'Класс доспеха (АС)',
  price: 'Стоимость',
  weight: 'Вес (в фунтах)',
  stealth: 'Помеха на Скрытность',
  strength: 'Требование к Силе',
  duration: 'Надевание / Снятие',
  yes: 'Есть',
  no: 'Нет',
} as const;

/* --- Снаряжение --------------------------------------------------------- */

export const ITEMS_SECTION: SectionConfig = {
  key: 'items',
  title: 'Снаряжение',
  path: '/items',
  listUrl: '/api/v1/items',
  filterUrl: '/api/v1/filters/items',
  order: [{ field: 'name', direction: 'asc' }],
  // Список грузится целиком: иначе группы по категориям дополнялись бы
  // при прокрутке
  pageSize: SECTION_PAGE_SIZE_ALL,
};

/** Как сгруппирован список снаряжения: по категориям или по алфавиту. */
export const ITEMS_GROUPINGS = ['category', 'alphabet'] as const;

export const ITEMS_GROUPING_DEFAULT = 'category';

/** Выбранная группировка запоминается в cookie, чтобы сервер отдал её же. */
export const ITEMS_GROUPING_COOKIE = 'ttg_items_grouping';

/** Срок хранения выбранной группировки: год. */
export const ITEMS_GROUPING_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const ITEMS_GROUPING_OPTIONS: Array<SectionGroupingOption> = [
  { value: 'category', label: 'По категориям', icon: 'tabler:category' },
  { value: 'alphabet', label: 'По алфавиту', icon: 'tabler:sort-a-z' },
];

/** Снаряжение без категорий идёт последней группой. */
export const ITEM_NO_CATEGORY_ORDER = Number.MAX_SAFE_INTEGER;

export const ITEM_TEXT = {
  noCategory: 'Без категории',
  category: 'Категория:',
  categories: 'Категории:',
  price: 'Стоимость:',
  weight: 'Вес (в фунтах):',
} as const;

/* --- Магические предметы ------------------------------------------------ */

export const MAGIC_ITEMS_SECTION: SectionConfig = {
  key: 'magic-items',
  title: 'Магические предметы',
  path: '/items/magic',
  listUrl: '/api/v1/items/magic',
  filterUrl: '/api/v1/filters/items/magic',
  order: [
    { field: 'rarity', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
};

/** Правка магических предметов в мастерской живёт по своему адресу */
export const MAGIC_ITEMS_WORKSHOP_PATH = '/workshop/magic-items';

export const MAGIC_ITEM_TEXT = {
  attunement: 'Настройка:',
  attunementRequired: 'требуется настройка',
  attunementNone: 'нет',
  attunementShort: 'Н',
  attunementHint: 'Требуется настройка',
  costBy: 'Стоимость по',
  dmg: 'DMG',
  dmgHint: 'Руководство Мастера',
  xge: 'XGE',
  xgeHint: 'Руководство Занатара обо всём',
  xgeRollLabel: 'Стоимость предмета по XGE',
  detailOpen: ' (',
  detailClose: ')',
} as const;

/** Редкость артефакта: его цену по XGE не бросают, она задана текстом */
export const ARTIFACT_RARITY = 'artifact';

/* --- Драгоценности ------------------------------------------------------ */

export const TREASURES_SECTION: SectionConfig = {
  key: 'treasures',
  title: 'Драгоценности',
  path: '/treasures',
  listUrl: '/api/v1/treasures',
  filterUrl: '/api/v1/filters/treasures',
  order: [
    { field: 'cost', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
};

/** Цена драгоценностей всегда в золотых */
export const TREASURE_CURRENCY = 'зм';

/* --- Общее -------------------------------------------------------------- */

/** Нет значения в таблице характеристик */
export const INVENTORY_EMPTY_VALUE = '—';

export const INVENTORY_LIST_SEPARATOR = ', ';
