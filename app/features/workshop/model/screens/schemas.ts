import type { WorkshopScreen } from './types';

import { z } from 'zod';

import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';

const workshopScreenSchema = z.object({
  id: z.number(),
  name: workshopNameSchema,
  altName: z.string().nullish(),
  category: z.string().nullish(),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  order: z.number().nullish(),
  source: workshopSourceSchema,
  parent: z
    .object({
      id: z.number(),
      name: z.object({ rus: z.string() }),
      url: z.string(),
    })
    .nullish(),
});

/**
 * Раздел ширмы из справочника для редактора.
 * @param input - ответ сервера
 */
export function parseWorkshopScreen(input: unknown): WorkshopScreen {
  const screen = workshopScreenSchema.parse(input);

  return {
    id: screen.id,
    name: screen.name.rus,
    englishName: screen.name.eng,
    altName: screen.altName ?? '',
    category: screen.category ?? '',
    description: screen.description ?? '',
    icon: screen.icon ?? '',
    order: screen.order ?? null,
    source: screen.source?.shortName,
    parent: screen.parent
      ? {
          id: screen.parent.id,
          name: screen.parent.name.rus,
          url: screen.parent.url,
        }
      : undefined,
  };
}

/** Форма раздела ширмы: описание у раздела-группы бывает пустым. */
export const screenFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  category: z.string(),
  icon: z.string(),
  order: workshopOptionalNotNegative,
  description: z.string(),
});

export type ScreenForm = z.infer<typeof screenFormSchema>;
