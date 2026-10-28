import type { WorkshopGod } from './types';

import { z } from 'zod';

import { WORKSHOP_VALIDATION } from '../constants';
import { workshopOptionalPositive, workshopRequiredText } from '../schemas';

const workshopGodSchema = z.object({
  id: z.number(),
  name: z.string(),
  englishName: z.string(),
  altName: z.string().nullish(),
  commitment: z.string().nullish(),
  sex: z.string().nullish(),
  rank: z.string().nullish(),
  alignment: z.string().nullish(),
  description: z.string().nullish(),
  alternativeDescription: z.string().nullish(),
  symbol: z.string().nullish(),
  nicknames: z.string().nullish(),
  domains: z.array(z.string()).nullish(),
  pantheonId: z.number().nullish(),
  source: z.string().nullish(),
  page: z.number().nullish(),
});

/**
 * Божество из ручки правки для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopGod(input: unknown): WorkshopGod {
  const god = workshopGodSchema.parse(input);

  return {
    id: god.id,
    name: god.name,
    englishName: god.englishName,
    altName: god.altName ?? '',
    commitment: god.commitment ?? '',
    sex: god.sex ?? '',
    rank: god.rank ?? '',
    alignment: god.alignment ?? '',
    description: god.description ?? '',
    alternativeDescription: god.alternativeDescription ?? '',
    symbol: god.symbol ?? '',
    nicknames: god.nicknames ?? '',
    domains: god.domains ?? [],
    pantheonId: god.pantheonId?.toString() ?? '',
    page: god.page ?? null,
    source: god.source ?? undefined,
  };
}

const requiredChoice = z.string().min(1, WORKSHOP_VALIDATION.required);

/** Форма божества: те же поля, что принимает бэкенд. */
export const godFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  commitment: z.string(),
  sex: requiredChoice,
  rank: requiredChoice,
  alignment: requiredChoice,
  pantheonId: requiredChoice,
  domains: z.array(z.string()).min(1, WORKSHOP_VALIDATION.chooseOne),
  symbol: z.string(),
  nicknames: z.string(),
  page: workshopOptionalPositive,
  description: z.string(),
  alternativeDescription: z.string(),
});

export type GodForm = z.infer<typeof godFormSchema>;
