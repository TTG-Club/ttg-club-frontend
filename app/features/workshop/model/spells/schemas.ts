import type { WorkshopSpell } from './types';

import { z } from 'zod';

import { SPELL_MAX_LEVEL, SPELL_VALIDATION } from './constants';

const workshopSpellSchema = z.object({
  id: z.number(),
  name: z.object({ rus: z.string(), eng: z.string() }),
  level: z.number().catch(0),
  school: z.string().catch(''),
  additionalType: z.string().nullish(),
  ritual: z.boolean().nullish(),
  concentration: z.boolean().nullish(),
  components: z
    .object({
      v: z.boolean().nullish(),
      s: z.boolean().nullish(),
      m: z.union([z.boolean(), z.string()]).nullish(),
    })
    .nullish(),
  time: z.string().nullish(),
  range: z.string().nullish(),
  duration: z.string().nullish(),
  description: z.string().nullish(),
  upper: z.string().nullish(),
  source: z.object({ shortName: z.string() }).nullish(),
});

/**
 * Заклинание из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopSpell(input: unknown): WorkshopSpell {
  const spell = workshopSpellSchema.parse(input);
  const material = spell.components?.m;

  return {
    id: spell.id,
    name: spell.name.rus,
    englishName: spell.name.eng,
    level: spell.level,
    school: spell.school,
    additionalType: spell.additionalType ?? '',
    ritual: !!spell.ritual,
    concentration: !!spell.concentration,
    verbal: !!spell.components?.v,
    somatic: !!spell.components?.s,
    material: typeof material === 'string' ? material : '',
    time: spell.time ?? '',
    range: spell.range ?? '',
    duration: spell.duration ?? '',
    description: spell.description ?? '',
    upper: spell.upper ?? '',
    source: spell.source?.shortName,
  };
}

const requiredText = z.string().trim().min(1, SPELL_VALIDATION.required);

/** Форма заклинания: те же поля, что принимает бэкенд. */
export const spellFormSchema = z.object({
  name: requiredText,
  englishName: requiredText,
  level: z
    .number(SPELL_VALIDATION.level)
    .int(SPELL_VALIDATION.level)
    .min(0, SPELL_VALIDATION.level)
    .max(SPELL_MAX_LEVEL, SPELL_VALIDATION.level),
  school: z.string().min(1),
  additionalType: z.string(),
  ritual: z.boolean(),
  concentration: z.boolean(),
  verbalComponent: z.boolean(),
  somaticComponent: z.boolean(),
  consumable: z.boolean(),
  materialComponent: z.string(),
  timeNumber: z
    .number(SPELL_VALIDATION.timeNumber)
    .int(SPELL_VALIDATION.timeNumber)
    .min(1, SPELL_VALIDATION.timeNumber),
  timeUnit: z.string().min(1),
  timeCondition: z.string(),
  range: requiredText,
  duration: requiredText,
  description: requiredText,
  upper: z.string(),
});

export type SpellForm = z.infer<typeof spellFormSchema>;
