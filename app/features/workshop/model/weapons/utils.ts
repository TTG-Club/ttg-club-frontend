import type { WeaponForm } from './schemas';
import type { WorkshopWeapon } from './types';

import { WORKSHOP_DEFAULT_CURRENCY } from '../constants';
import { toOptionalAmount, toOptionalNumber, toOptionalText } from '../utils';
import { WEAPON_DEFAULT } from './constants';

/**
 * Форма оружия: значения старого SPA для создания или заполненная записью.
 * @param weapon - запись справочника
 */
export function createWeaponForm(weapon?: WorkshopWeapon): WeaponForm {
  if (!weapon) {
    return {
      name: '',
      englishName: '',
      type: WEAPON_DEFAULT.type,
      damageType: WEAPON_DEFAULT.damageType,
      numberDice: WEAPON_DEFAULT.numberDice,
      damageDice: WEAPON_DEFAULT.damageDice,
      twoHandDamageDice: undefined,
      cost: null,
      currency: WORKSHOP_DEFAULT_CURRENCY,
      weight: null,
      minDistance: null,
      maxDistance: null,
      ammo: null,
      properties: [],
      description: '',
      special: '',
    };
  }

  return {
    name: weapon.name,
    englishName: weapon.englishName,
    type: weapon.type,
    damageType: weapon.damageType,
    numberDice: weapon.numberDice,
    damageDice: weapon.damageDice || undefined,
    twoHandDamageDice: weapon.twoHandDamageDice || undefined,
    cost: weapon.cost,
    currency: weapon.currency || undefined,
    weight: weapon.weight,
    minDistance: weapon.minDistance,
    maxDistance: weapon.maxDistance,
    ammo: weapon.ammo,
    properties: [...weapon.properties],
    description: weapon.description,
    special: weapon.special,
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются,
 * свойства уходят числами.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getWeaponPayload(
  form: WeaponForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    numberDice: toOptionalNumber(form.numberDice),
    damageDice: toOptionalText(form.damageDice),
    twoHandDamageDice: toOptionalText(form.twoHandDamageDice),
    cost: toOptionalAmount(form.cost),
    currency: toOptionalText(form.currency),
    weight: toOptionalAmount(form.weight),
    minDistance: toOptionalNumber(form.minDistance),
    maxDistance: toOptionalNumber(form.maxDistance),
    ammo: toOptionalNumber(form.ammo),
    properties: form.properties.map(Number),
    description: toOptionalText(form.description),
    special: toOptionalText(form.special),
  };
}
