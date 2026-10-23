import type { GodForm } from './schemas';
import type { WorkshopGod } from './types';

import { toOptionalNumber, toOptionalText } from '../utils';

/**
 * Форма божества, заполненная записью.
 * @param god - запись из ручки правки
 */
export function createGodForm(god: WorkshopGod): GodForm {
  return {
    name: god.name,
    englishName: god.englishName,
    altName: god.altName,
    commitment: god.commitment,
    sex: god.sex,
    rank: god.rank,
    alignment: god.alignment,
    pantheonId: god.pantheonId,
    domains: [...god.domains],
    symbol: god.symbol,
    nicknames: god.nicknames,
    page: god.page,
    description: god.description,
    alternativeDescription: god.alternativeDescription,
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются,
 * пантеон уходит числом.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getGodPayload(
  form: GodForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    commitment: toOptionalText(form.commitment),
    symbol: toOptionalText(form.symbol),
    nicknames: toOptionalText(form.nicknames),
    page: toOptionalNumber(form.page),
    description: toOptionalText(form.description),
    alternativeDescription: toOptionalText(form.alternativeDescription),
    pantheonId: Number(form.pantheonId),
  };
}
