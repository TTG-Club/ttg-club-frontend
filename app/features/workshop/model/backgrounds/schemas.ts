import type { WorkshopBackground } from './types';

import { z } from 'zod';

import { WORKSHOP_LIST_JOINER, WORKSHOP_VALIDATION } from '../constants';
import {
  workshopNameSchema,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import { getBackgroundSkills, getPersonalizationValues } from './utils';

const personalizationTableSchema = z.object({
  type: z.string(),
  tbody: z.array(z.array(z.string())).catch([]),
});

const workshopBackgroundSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  skills: z.array(z.string()).nullish(),
  toolOwnership: z.string().nullish(),
  equipments: z.array(z.string()).nullish(),
  startGold: z.number().nullish(),
  description: z.string().nullish(),
  skillName: z.string().nullish(),
  skillDescription: z.string().nullish(),
  personalization: z.string().nullish(),
  personalizationTables: z.array(personalizationTableSchema).nullish(),
  language: z.string().nullish(),
  languages: z.array(z.string()).nullish(),
  lifeStyle: z.string().nullish(),
  source: workshopSourceSchema,
});

/**
 * Предыстория из справочника для редактора. Карточка склеивает навыки
 * с «другими навыками» и отдаёт названия, а не коды, — они разбираются
 * обратно.
 * @param input - ответ сервера
 */
export function parseWorkshopBackground(input: unknown): WorkshopBackground {
  const background = workshopBackgroundSchema.parse(input);
  const skills = getBackgroundSkills(background.skills ?? []);

  return {
    id: background.id,
    name: background.name.rus,
    englishName: background.name.eng,
    altName: background.altName ?? '',
    skills: skills.values,
    otherSkills: skills.other,
    toolOwnership: background.toolOwnership ?? '',
    equipments: (background.equipments ?? []).join(WORKSHOP_LIST_JOINER),
    startGold: background.startGold ?? null,
    description: background.description ?? '',
    skillName: background.skillName ?? '',
    skillDescription: background.skillDescription ?? '',
    personalization: background.personalization ?? '',
    personalizationTables: (background.personalizationTables ?? []).map(
      (table) => ({
        type: table.type,
        values: getPersonalizationValues(table.tbody),
      }),
    ),
    language: background.language ?? '',
    languages: (background.languages ?? []).join(WORKSHOP_LIST_JOINER),
    lifeStyle: background.lifeStyle ?? '',
    source: background.source?.shortName,
  };
}

/** Форма предыстории: те же поля, что принимает бэкенд. */
export const backgroundFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  skills: z.array(z.string()),
  otherSkills: z.string(),
  toolOwnership: z.string(),
  equipments: z.string(),
  startGold: z
    .number(WORKSHOP_VALIDATION.notNegative)
    .int(WORKSHOP_VALIDATION.notNegative)
    .min(0, WORKSHOP_VALIDATION.notNegative)
    .nullable(),
  languages: z.string(),
  language: z.string(),
  lifeStyle: z.string().optional(),
  description: workshopRequiredText,
  skillName: z.string(),
  skillDescription: z.string(),
  personalization: z.string(),
  personalizationTables: z.array(
    z.object({
      type: z.string(),
      values: z.array(workshopRequiredText).min(1),
    }),
  ),
});

export type BackgroundForm = z.infer<typeof backgroundFormSchema>;
