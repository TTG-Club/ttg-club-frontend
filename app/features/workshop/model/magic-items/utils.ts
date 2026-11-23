import type { MagicItemForm } from './schemas';
import type { WorkshopMagicItem } from './types';

import {
  createMagicItemMechanicsForm,
  getMagicItemEffectContext,
  getMagicItemMechanicsPayload,
  magicItemMechanicsFormSchema,
} from '../mechanics';
import {
  toOptionalAmount,
  toOptionalMarkup,
  toOptionalNumber,
  toOptionalText,
} from '../utils';
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
    special: [...(item?.special ?? [])],
    customization: item?.customization ?? false,
    custSpecial: [...(item?.custSpecial ?? [])],
    consumed: item?.consumed ?? false,
    curse: item?.curse ?? false,
    charge: item?.charge ?? null,
    cost: item?.cost ?? null,
    bonus: item?.bonus ?? null,
    description: [...(item?.description ?? [])],
    // Разбор схемой формы — копия: правка формы не меняет открытую запись
    mechanics: item
      ? magicItemMechanicsFormSchema.parse(item.mechanics)
      : createMagicItemMechanicsForm(),
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
    special: toOptionalMarkup(form.special),
    custSpecial: toOptionalMarkup(form.custSpecial),
    charge: toOptionalNumber(form.charge),
    cost: toOptionalAmount(form.cost),
    bonus: toOptionalNumber(form.bonus),
    // Механика уходит всегда: отсутствие бэкенд понимает как «оставить
    // сохранённое», а снятая модератором уходит пустым объектом
    mechanics: getMagicItemMechanicsPayload(
      form.mechanics,
      getMagicItemEffectContext(form.type),
    ),
  };
}
