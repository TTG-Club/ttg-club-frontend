import type { ArmorForm } from './schemas';
import type { WorkshopArmor } from './types';

import { toOptionalAmount, toOptionalNumber, toOptionalText } from '../utils';
import { ARMOR_DEFAULT } from './constants';

/**
 * Форма доспеха: значения старого SPA для создания или заполненная записью.
 * @param armor - запись справочника
 */
export function createArmorForm(armor?: WorkshopArmor): ArmorForm {
  return {
    name: armor?.name ?? '',
    englishName: armor?.englishName ?? '',
    type: armor?.type || ARMOR_DEFAULT.type,
    armorClass: armor ? armor.armorClass : ARMOR_DEFAULT.armorClass,
    cost: armor?.cost ?? null,
    weight: armor?.weight ?? null,
    forceRequirements: armor?.forceRequirements ?? null,
    stealthHindrance: armor?.stealthHindrance ?? false,
    description: armor?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getArmorPayload(
  form: ArmorForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    armorClass: toOptionalAmount(form.armorClass),
    cost: toOptionalAmount(form.cost),
    weight: toOptionalAmount(form.weight),
    forceRequirements: toOptionalNumber(form.forceRequirements),
    description: toOptionalText(form.description),
  };
}
