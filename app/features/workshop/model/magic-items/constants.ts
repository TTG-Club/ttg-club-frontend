import type { SelectOption } from '../types';

import { ARMORS_SECTION, WEAPONS_SECTION } from '~inventory/model';

/** Ключ раздела магических предметов в адресе мастерской. */
export const MAGIC_ITEMS_WORKSHOP_KEY = 'magic-items';

/** Раздел магических предметов в ручках мастерской. */
export const MAGIC_ITEMS_API_SECTION = 'items/magic';

/** Раздел справочника с магическими предметами. */
export const MAGIC_ITEMS_REFERENCE_PATH = '/items/magic';

/**
 * Разделы немагической основы: адрес оружия или доспеха в запросе — хвост
 * адреса его страницы после `path/`.
 */
export const MAGIC_ITEM_BASE_SECTIONS = {
  weapons: WEAPONS_SECTION,
  armors: ARMORS_SECTION,
} as const;

/** Редкость магического предмета. */
export const MAGIC_ITEM_RARITY_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Обычный', value: 'COMMON' },
  { label: 'Необычный', value: 'UNCOMMON' },
  { label: 'Редкий', value: 'RARE' },
  { label: 'Очень редкий', value: 'VERY_RARE' },
  { label: 'Легендарный', value: 'LEGENDARY' },
  { label: 'Артефакт', value: 'ARTIFACT' },
  { label: 'Редкость не определена', value: 'UNKNOWN' },
  { label: 'Редкость варьируется', value: 'VARIES' },
];

/** Тип магического предмета. */
export const MAGIC_ITEM_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Рукопашное оружие', value: 'MELE_WEAPON' },
  { label: 'Доспех', value: 'ARMOR' },
  { label: 'Волшебная палочка', value: 'WAND' },
  { label: 'Жезл', value: 'ROD' },
  { label: 'Посох', value: 'STAFF' },
  { label: 'Зелье', value: 'POTION' },
  { label: 'Кольцо', value: 'RING' },
  { label: 'Свиток', value: 'SCROLL' },
  { label: 'Чудесный предмет', value: 'SUBJECT' },
  { label: 'Дальнобойное оружие', value: 'RANGED_WEAPON' },
  { label: 'Щит', value: 'SHIELD' },
  { label: 'Аммуниция', value: 'AMMUNITION' },
  { label: 'Оружие', value: 'WEAPON' },
];

/** Значения нового магического предмета, как в старом SPA. */
export const MAGIC_ITEM_DEFAULT = {
  rarity: 'UNCOMMON',
  type: 'SUBJECT',
} as const;

/** Подписи редактора магических предметов. */
export const MAGIC_ITEM_EDITOR_TEXT = {
  createTitle: 'Создание магического предмета',
  editTitle: 'Редактирование магического предмета',
  rarity: 'Редкость',
  type: 'Тип предмета',
  special: 'Уточнение типа',
  specialHelp: 'Например, «любой меч»',
  baseWeapons: 'Основа: оружие',
  baseArmors: 'Основа: доспехи',
  baseHelp:
    'Обычные предметы, на которых построен магический: на странице предмета они встают ссылками в строку типа. Можно выбрать несколько; «любой меч» пишется в уточнении типа',
  basePlaceholder: 'Не выбрана',
  charge: 'Заряды',
  cost: 'Цена, зм',
  bonus: 'Бонус',
  customization: 'Требует настройки',
  custSpecial: 'Условие настройки',
  custSpecialHelp: 'Например, «волшебником»',
  consumed: 'Расходуемый',
  curse: 'Проклятие',
  created: 'Магический предмет создан',
  saved: 'Магический предмет обновлён',
  saveError: 'Не удалось сохранить магический предмет',
} as const;
