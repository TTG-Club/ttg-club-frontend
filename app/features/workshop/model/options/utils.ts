import type { OptionForm } from './schemas';
import type { WorkshopOption } from './types';

import { toOptionalNumber, toOptionalText } from '../utils';

/**
 * Форма особенности: пустая для создания или заполненная записью.
 * @param option - запись справочника
 */
export function createOptionForm(option?: WorkshopOption): OptionForm {
  return {
    name: option?.name ?? '',
    englishName: option?.englishName ?? '',
    altName: option?.altName ?? '',
    level: option?.level ?? null,
    prerequisite: option?.prerequisite ?? '',
    optionTypes: [...(option?.optionTypes ?? [])],
    description: option?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getOptionPayload(
  form: OptionForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    level: toOptionalNumber(form.level),
    prerequisite: toOptionalText(form.prerequisite),
  };
}
