import type {
  ArmorLink,
  ItemDetail,
  ItemLink,
  MagicItemDetail,
  MagicItemLink,
  Treasure,
  WeaponLink,
} from './schema';
import type { ItemsGrouping, MagicItemTypePart } from './types';

import { capitalize } from 'es-toolkit';

import { WORKSHOP_EDIT_SUFFIX } from '~section/model';

import {
  INVENTORY_LIST_SEPARATOR,
  ITEM_NO_CATEGORY_ORDER,
  ITEM_TEXT,
  ITEMS_GROUPINGS,
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
 * Порядок группы оружия или доспеха: ручка отдаёт записи по названию, а
 * группы идут по порядку типа, как в старом SPA.
 * @param entry - оружие или доспех из списка
 */
export function getTypeOrder(entry: WeaponLink | ArmorLink): number {
  return entry.type.order;
}

/**
 * Группа магического предмета — редкость с заглавной буквы.
 * @param item - предмет из списка
 */
export function getRarityGroup(item: MagicItemLink): string {
  return capitalize(item.rarity.name);
}

const ITEMS_GROUPING_SET: ReadonlySet<string> = new Set(ITEMS_GROUPINGS);

/**
 * Проверяет, что значение из cookie — известная группировка снаряжения.
 * @param value - значение cookie
 */
export function isItemsGrouping(value: unknown): value is ItemsGrouping {
  return typeof value === 'string' && ITEMS_GROUPING_SET.has(value);
}

/**
 * Группы снаряжения по категориям: предмет из нескольких категорий есть в
 * каждой, без категорий — в «Без категории».
 * @param item - снаряжение из списка
 */
export function getItemCategoryGroups(item: ItemLink): Array<string> {
  const groups = item.categoryGroups ?? [];

  return groups.length
    ? groups.map(({ name }) => name)
    : [ITEM_TEXT.noCategory];
}

/**
 * Порядок категории снаряжения — как в справочнике категорий.
 * @param item - снаряжение из списка
 * @param group - категория, в которую попал предмет
 */
export function getItemCategoryOrder(item: ItemLink, group: string): number {
  return (
    item.categoryGroups?.find(({ name }) => name === group)?.order
    ?? ITEM_NO_CATEGORY_ORDER
  );
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
