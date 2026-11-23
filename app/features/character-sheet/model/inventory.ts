import type { DetailType } from '~content/model';

import type { SheetCurrency, SheetDocument, SheetItem } from './schema';
import type {
  AbilityKey,
  AttunementBreakdown,
  CarryingBreakdown,
  EncumbranceLevel,
  SheetSize,
} from './types';

import {
  ARMORS_SECTION,
  MAGIC_ITEMS_SECTION,
  WEAPONS_SECTION,
} from '~inventory/model';

import {
  ARMOR_STRENGTH_SPEED_PENALTY,
  ATTUNEMENT_LIMIT,
  CARRYING_CAPACITY_MULTIPLIER,
  CARRYING_SIZE_MULTIPLIER,
  COINS_PER_POUND,
  CURRENCY_COPPER_VALUE,
  CURRENCY_KEYS,
  ENCUMBRANCE_MULTIPLIER,
  ENCUMBRANCE_SPEED_PENALTY,
  HEAVY_WEAPON_HINDERED_SIZES,
} from './constants';

/** Размер по умолчанию, если в листе он не задан. */
const DEFAULT_SIZE: SheetSize = 'MEDIUM';

/** Медяков в золотой монете. */
const COPPER_PER_GOLD = CURRENCY_COPPER_VALUE.gp;

/**
 * Округляет вес до сотых: дробные веса предметов копят хвосты.
 * @param value - вес
 */
function roundWeight(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Вес монет: 50 монет — фунт.
 * @param currency - монеты листа
 */
export function getCoinWeight(currency: SheetCurrency): number {
  const coins = CURRENCY_KEYS.reduce((sum, key) => sum + currency[key], 0);

  return roundWeight(coins / COINS_PER_POUND);
}

/**
 * Монеты, пересчитанные в золото.
 * @param currency - монеты листа
 */
export function getCurrencyInGold(currency: SheetCurrency): number {
  const copper = CURRENCY_KEYS.reduce(
    (sum, key) => sum + currency[key] * CURRENCY_COPPER_VALUE[key],
    0,
  );

  return roundWeight(copper / COPPER_PER_GOLD);
}

/**
 * Вес предметов: отсутствующие (количество 0) не весят.
 * @param inventory - предметы листа
 */
export function getItemsWeight(inventory: ReadonlyArray<SheetItem>): number {
  return roundWeight(
    inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0),
  );
}

/**
 * Переносимый вес: предметы и монеты.
 * @param document - лист персонажа
 */
export function getCarriedWeight(
  document: Pick<SheetDocument, 'inventory' | 'currency'>,
): number {
  return roundWeight(
    getItemsWeight(document.inventory) + getCoinWeight(document.currency),
  );
}

/**
 * Размер, по которому считается грузоподъёмность.
 * @param document - лист персонажа
 */
export function getCarryingSize(
  document: Pick<SheetDocument, 'carrying' | 'size'>,
): SheetSize {
  return document.carrying.size ?? document.size ?? DEFAULT_SIZE;
}

/**
 * Грузоподъёмность: Сила × 15 × множитель размера и бонус, либо своё
 * значение; пороги варианта «Нагрузка» — от Силы с тем же множителем.
 * @param document - лист персонажа
 * @param strength - Сила с прибавками
 */
export function getCarryingBreakdown(
  document: Pick<SheetDocument, 'carrying' | 'size'>,
  strength: number,
): CarryingBreakdown {
  const multiplier = CARRYING_SIZE_MULTIPLIER[getCarryingSize(document)];
  const base = Math.floor(strength * CARRYING_CAPACITY_MULTIPLIER * multiplier);
  const { bonus, custom } = document.carrying;

  return {
    strength,
    multiplier,
    base,
    bonus,
    custom,
    value: Math.max(0, custom ?? base + bonus),
    encumberedAt: Math.floor(
      strength * ENCUMBRANCE_MULTIPLIER.encumbered * multiplier,
    ),
    heavyAt: Math.floor(strength * ENCUMBRANCE_MULTIPLIER.heavy * multiplier),
  };
}

/**
 * Ступень нагрузки по варианту «Нагрузка»; вариант выключен — `none`.
 * @param document - лист персонажа
 * @param carrying - разбор грузоподъёмности
 * @param weight - переносимый вес
 */
export function getEncumbrance(
  document: Pick<SheetDocument, 'carrying'>,
  carrying: CarryingBreakdown,
  weight: number,
): EncumbranceLevel {
  if (!document.carrying.encumbrance) {
    return 'none';
  }

  if (weight > carrying.heavyAt) {
    return 'heavy';
  }

  return weight > carrying.encumberedAt ? 'encumbered' : 'none';
}

/**
 * Надет доспех, которому не хватает Силы (PHB 2014): скорость −10 фт.
 * @param document - лист персонажа
 * @param strength - Сила с прибавками
 */
export function isArmorTooHeavy(
  document: Pick<SheetDocument, 'inventory'>,
  strength: number,
): boolean {
  return document.inventory.some(
    (item) =>
      item.isEquipped
      && item.quantity > 0
      && item.armor !== null
      && item.armor.category !== 'SHIELD'
      && (item.armor.strengthRequirement ?? 0) > strength,
  );
}

/**
 * Насколько снижена скорость: нагрузка и тяжёлый для Силы доспех.
 * @param encumbrance - ступень нагрузки
 * @param isArmorHeavy - доспеху не хватает Силы
 */
export function getCarryingSpeedPenalty(
  encumbrance: EncumbranceLevel,
  isArmorHeavy: boolean,
): number {
  const fromLoad =
    encumbrance === 'none' ? 0 : ENCUMBRANCE_SPEED_PENALTY[encumbrance];

  return fromLoad + (isArmorHeavy ? ARMOR_STRENGTH_SPEED_PENALTY : 0);
}

/**
 * Предел настройки: правило «три» или модификатор характеристики (не меньше
 * нуля), плюс бонус; своё число заменяет всё.
 * @param document - лист персонажа
 * @param getModifier - модификатор характеристики с прибавками
 */
export function getAttunementBreakdown(
  document: Pick<SheetDocument, 'attunement'>,
  getModifier: (ability: AbilityKey) => number,
): AttunementBreakdown {
  const { ability, bonus, custom } = document.attunement;
  const base = ability ? Math.max(0, getModifier(ability)) : ATTUNEMENT_LIMIT;

  return {
    base,
    bonus,
    custom,
    value: Math.max(0, custom ?? base + bonus),
  };
}

/**
 * Тяжёлое оружие мешает Маленькому и Крошечному: атака с помехой.
 * @param item - предмет
 * @param size - размер персонажа
 */
export function isHeavyWeaponHindered(
  item: Pick<SheetItem, 'weapon'>,
  size: SheetSize | null,
): boolean {
  return (
    Boolean(item.weapon?.isHeavy)
    && HEAVY_WEAPON_HINDERED_SIZES.includes(size ?? '')
  );
}

/**
 * Вид карточки справочника для предпросмотра предмета; null — свой предмет.
 * Магические предметы лежат внутри раздела снаряжения, поэтому проверяются
 * первыми.
 * @param url - адрес записи справочника
 */
export function getItemPreviewType(url: string | null): DetailType | null {
  if (!url) {
    return null;
  }

  if (url.startsWith(MAGIC_ITEMS_SECTION.path)) {
    return 'magic-item';
  }

  if (url.startsWith(WEAPONS_SECTION.path)) {
    return 'weapon';
  }

  return url.startsWith(ARMORS_SECTION.path) ? 'armor' : 'item';
}

/**
 * Копия предмета справочника как своего: её можно править целиком.
 * @param item - предмет
 * @param id - идентификатор копии
 */
export function copyItemAsCustom(item: SheetItem, id: string): SheetItem {
  return {
    ...item,
    id,
    url: null,
    isEquipped: false,
    isAttuned: false,
  };
}

/**
 * Предметы группы по алфавиту.
 * @param items - предметы
 */
export function sortItemsByName<Item extends Pick<SheetItem, 'name'>>(
  items: ReadonlyArray<Item>,
): Array<Item> {
  return [...items].sort((left, right) =>
    left.name.localeCompare(right.name, 'ru'),
  );
}
