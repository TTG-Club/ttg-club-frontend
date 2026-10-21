import type {
  ArmorLink,
  ItemDetail,
  MagicItemDetail,
  MagicItemLink,
  Treasure,
  WeaponLink,
} from './schema';
import type { MagicItemTypePart } from './types';

import { capitalize } from 'es-toolkit';

import { WORKSHOP_EDIT_SUFFIX } from '~section/model';

import {
  INVENTORY_LIST_SEPARATOR,
  ITEM_TEXT,
  MAGIC_ITEM_TEXT,
  MAGIC_ITEMS_WORKSHOP_PATH,
  TREASURE_CURRENCY,
} from './constants';

/**
 * Группа оружия или доспеха в списке — его тип: простое, воинское, лёгкий
 * доспех и так далее.
 * @param entry - оружие или доспех из списка
 */
export function getTypeGroup(entry: WeaponLink | ArmorLink): string {
  return entry.type.name;
}

/**
 * Группа магического предмета — редкость с заглавной буквы.
 * @param item - предмет из списка
 */
export function getRarityGroup(item: MagicItemLink): string {
  return capitalize(item.rarity.name);
}

/**
 * Подпись категорий снаряжения: «Категория:» для одной, «Категории:» для
 * нескольких, пустая строка без категорий.
 * @param item - снаряжение
 */
export function getItemCategoriesLabel(item: ItemDetail): string {
  const categories = item.categories ?? [];

  if (!categories.length) {
    return '';
  }

  const label =
    categories.length === 1 ? ITEM_TEXT.category : ITEM_TEXT.categories;

  return `${label} ${categories.join(INVENTORY_LIST_SEPARATOR)}`;
}

/**
 * Ключ драгоценности: адреса у неё нет, а одно название встречается в
 * разных типах.
 * @param treasure - драгоценность
 */
export function getTreasureKey(treasure: Treasure): string {
  return `${treasure.name.eng || treasure.name.rus} ${treasure.type.name}`;
}

/**
 * Цена драгоценности в золотых; без цены — ноль, как в старом SPA.
 * @param treasure - драгоценность
 */
export function getTreasurePrice(treasure: Treasure): string {
  return `${treasure.price ?? 0} ${TREASURE_CURRENCY}`;
}

/**
 * Страница правки магического предмета: в мастерской у них свой раздел,
 * `/items/magic/Bag_of_Holding` правится на
 * `/workshop/magic-items/Bag_of_Holding/edit`.
 * @param path - адрес предмета на сайте
 */
export function getMagicItemEditPath(path: string): string {
  const slug = path.split('/').at(-1) ?? '';

  return `${MAGIC_ITEMS_WORKSHOP_PATH}/${slug}${WORKSHOP_EDIT_SUFFIX}`;
}

/**
 * Подпись типа магического предмета для плашки источника, разбитая на части:
 * тип, уточнения в скобках (могут быть ссылками) и редкость.
 * @param item - магический предмет
 */
export function getMagicItemTypeParts(
  item: MagicItemDetail,
): MagicItemTypePart[] {
  const parts: MagicItemTypePart[] = [{ key: 'type', text: item.type.name }];
  const details = item.detailType ?? [];

  details.forEach((detail, index) => {
    const prefix = index === 0 ? MAGIC_ITEM_TEXT.detailOpen : '';

    if (prefix) {
      parts.push({ key: 'open', text: prefix });
    }

    parts.push({
      key: `detail-${index}`,
      text: detail.name,
      url: detail.url ?? undefined,
    });

    parts.push({
      key: `separator-${index}`,
      text:
        index < details.length - 1
          ? INVENTORY_LIST_SEPARATOR
          : MAGIC_ITEM_TEXT.detailClose,
    });
  });

  parts.push({
    key: 'rarity',
    text: `${INVENTORY_LIST_SEPARATOR}${item.rarity.name}`,
  });

  return parts;
}
