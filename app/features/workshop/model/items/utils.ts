import type { ItemForm } from './schemas';
import type { WorkshopItem } from './types';

import { WORKSHOP_DEFAULT_CURRENCY } from '../constants';
import { toOptionalAmount, toOptionalText } from '../utils';

/**
 * Форма снаряжения: пустая для создания или заполненная записью.
 * @param item - запись справочника
 */
export function createItemForm(item?: WorkshopItem): ItemForm {
  return {
    name: item?.name ?? '',
    englishName: item?.englishName ?? '',
    altName: item?.altName ?? '',
    categories: [...(item?.categories ?? [])],
    cost: item?.cost ?? null,
    currency: item ? item.currency || undefined : WORKSHOP_DEFAULT_CURRENCY,
    weight: item?.weight ?? null,
    description: item?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getItemPayload(
  form: ItemForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    cost: toOptionalAmount(form.cost),
    currency: toOptionalText(form.currency),
    weight: toOptionalAmount(form.weight),
    description: toOptionalText(form.description),
  };
}
