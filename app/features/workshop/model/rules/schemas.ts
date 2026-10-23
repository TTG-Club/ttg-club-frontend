import type { WorkshopRule } from './types';

import { z } from 'zod';

import {
  workshopNameSchema,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';

const workshopRuleSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  type: z.string().nullish(),
  description: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Правило из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopRule(input: unknown): WorkshopRule {
  const rule = workshopRuleSchema.parse(input);

  return {
    id: rule.id,
    name: rule.name.rus,
    englishName: rule.name.eng,
    altName: rule.altName ?? '',
    type: rule.type ?? '',
    description: rule.description ?? '',
    page: rule.source?.page ?? null,
    source: rule.source?.shortName,
  };
}

/** Форма правила: те же поля, что принимает бэкенд. */
export const ruleFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  type: workshopRequiredText,
  page: workshopOptionalPositive,
  description: workshopRequiredText,
});

export type RuleForm = z.infer<typeof ruleFormSchema>;
