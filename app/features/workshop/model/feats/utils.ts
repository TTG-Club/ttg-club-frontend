import type { FeatForm } from './schemas';
import type { WorkshopFeat } from './types';

import { toOptionalNumber, toOptionalText } from '../utils';

/**
 * Форма черты: пустая для создания или заполненная записью.
 * @param feat - запись справочника
 */
export function createFeatForm(feat?: WorkshopFeat): FeatForm {
  return {
    name: feat?.name ?? '',
    englishName: feat?.englishName ?? '',
    altName: feat?.altName ?? '',
    level: feat?.level ?? null,
    requirement: feat?.requirement ?? '',
    abilities: [...(feat?.abilities ?? [])],
    skills: [...(feat?.skills ?? [])],
    description: feat?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getFeatPayload(
  form: FeatForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    level: toOptionalNumber(form.level),
    requirement: toOptionalText(form.requirement),
  };
}
