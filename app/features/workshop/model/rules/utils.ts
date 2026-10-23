import type { RuleForm } from './schemas';
import type { WorkshopRule } from './types';

import { toOptionalNumber, toOptionalText } from '../utils';

/**
 * Форма правила, заполненная записью.
 * @param rule - запись справочника
 */
export function createRuleForm(rule: WorkshopRule): RuleForm {
  return {
    name: rule.name,
    englishName: rule.englishName,
    altName: rule.altName,
    type: rule.type,
    page: rule.page,
    description: rule.description,
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getRulePayload(
  form: RuleForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    page: toOptionalNumber(form.page),
  };
}
