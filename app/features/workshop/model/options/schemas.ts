import type { WorkshopOption } from './types';

import { z } from 'zod';

import { markupBlocksSchema } from '~content/model';

import { WORKSHOP_VALIDATION } from '../constants';
import { mechanicsFieldsFormSchema, parseMechanicsFields } from '../mechanics';
import {
  workshopNameSchema,
  workshopOptionalPositive,
  workshopRequiredMarkup,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import { getRequirementText } from '../utils';

const workshopOptionSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  level: z.number().nullish(),
  prerequisite: z.string().nullish(),
  description: markupBlocksSchema.nullish(),
  optionTypes: z.array(z.string()).nullish(),
  mechanics: z.unknown().optional(),
  activeEffects: z.unknown().optional(),
  source: workshopSourceSchema,
  featureUrl: z.string().nullish(),
  featureName: z.string().nullish(),
});

/**
 * Особенность класса из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopOption(input: unknown): WorkshopOption {
  const option = workshopOptionSchema.parse(input);

  return {
    id: option.id,
    name: option.name.rus,
    englishName: option.name.eng,
    altName: option.altName ?? '',
    level: option.level ?? null,
    prerequisite: getRequirementText(option.prerequisite),
    description: option.description ?? [],
    optionTypes: option.optionTypes ?? [],
    ...parseMechanicsFields(option),
    source: option.source?.shortName,
    feature: option.featureUrl
      ? { url: option.featureUrl, name: option.featureName ?? '' }
      : null,
  };
}

/** Форма особенности: те же поля, что принимает бэкенд. */
export const optionFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  level: workshopOptionalPositive,
  prerequisite: z.string(),
  optionTypes: z.array(z.string()).min(1, WORKSHOP_VALIDATION.chooseOne),
  description: workshopRequiredMarkup,
  ...mechanicsFieldsFormSchema,
});

export type OptionForm = z.infer<typeof optionFormSchema>;
