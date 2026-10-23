import type { WorkshopFeat } from './types';

import { z } from 'zod';

import {
  workshopNameSchema,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import { getRequirementText } from '../utils';

const workshopFeatSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  level: z.number().nullish(),
  requirements: z.string().nullish(),
  description: z.string().nullish(),
  abilities: z.array(z.string()).nullish(),
  skills: z.array(z.string()).nullish(),
  source: workshopSourceSchema,
});

/**
 * Черта из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopFeat(input: unknown): WorkshopFeat {
  const feat = workshopFeatSchema.parse(input);

  return {
    id: feat.id,
    name: feat.name.rus,
    englishName: feat.name.eng,
    altName: feat.altName ?? '',
    level: feat.level ?? null,
    requirement: getRequirementText(feat.requirements),
    description: feat.description ?? '',
    abilities: feat.abilities ?? [],
    skills: feat.skills ?? [],
    source: feat.source?.shortName,
  };
}

/** Форма черты: те же поля, что принимает бэкенд. */
export const featFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  level: workshopOptionalPositive,
  requirement: z.string(),
  abilities: z.array(z.string()),
  skills: z.array(z.string()),
  description: workshopRequiredText,
});

export type FeatForm = z.infer<typeof featFormSchema>;
