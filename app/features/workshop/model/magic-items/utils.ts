import type { MagicItemForm } from './schemas';
import type { WorkshopMagicItem } from './types';

import { toOptionalAmount, toOptionalNumber, toOptionalText } from '../utils';
import { MAGIC_ITEM_DEFAULT } from './constants';

/**
 * Форма магического предмета: значения старого SPA для создания или
 * заполненная записью.
 * @param item - запись справочника
 */
export function createMagicItemForm(item?: WorkshopMagicItem): MagicItemForm {
  return {
    name: item?.name ?? '',
    englishName: item?.englishName ?? '',
    altName: item?.altName ?? '',
    rarity: item?.rarity || MAGIC_ITEM_DEFAULT.rarity,
    type: item?.type || MAGIC_ITEM_DEFAULT.type,
    special: item?.special ?? '',
    customization: item?.customization ?? false,
    custSpecial: item?.custSpecial ?? '',
    consumed: item?.consumed ?? false,
    curse: item?.curse ?? false,
    charge: item?.charge ?? null,
    cost: item?.cost ?? null,
    bonus: item?.bonus ?? null,
    description: item?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getMagicItemPayload(
  form: MagicItemForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    special: toOptionalText(form.special),
    custSpecial: toOptionalText(form.custSpecial),
    charge: toOptionalNumber(form.charge),
    cost: toOptionalAmount(form.cost),
    bonus: toOptionalNumber(form.bonus),
  };
}
