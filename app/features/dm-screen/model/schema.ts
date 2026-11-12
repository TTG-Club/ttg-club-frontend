import { z } from 'zod';

/**
 * Окно ширмы, сохранённое в браузере: запись, место, размер, слой и
 * свёрнутость.
 */
export const dmScreenWindowSchema = z.object({
  id: z.string().min(1),
  /** Адрес записи на сайте, например `/spells/fireball`. */
  path: z.string().min(1),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Чем больше, тем выше окно среди остальных. */
  layer: z.number().int(),
  isMinimized: z.boolean(),
});

export type DmScreenWindow = z.infer<typeof dmScreenWindowSchema>;

export const dmScreenWindowListSchema = z.array(dmScreenWindowSchema);
