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
  /** HTML заметки мастера; есть только у окон-заметок. */
  content: z.string().nullish(),
});

export type DmScreenWindow = z.infer<typeof dmScreenWindowSchema>;

export const dmScreenWindowListSchema = z.array(dmScreenWindowSchema);

/**
 * Где показывать панель раскладок, пока окно тащат: у верха холста, у низа
 * или не показывать совсем.
 */
export const dmScreenSnapPickerPositionSchema = z.enum([
  'top',
  'bottom',
  'hidden',
]);

export type DmScreenSnapPickerPosition = z.infer<
  typeof dmScreenSnapPickerPositionSchema
>;

/** Ширма в списке пользователя. */
export const dmScreenSummarySchema = z.object({
  id: z.coerce.string().min(1),
  name: z.string(),
  windowCount: z.number().int().nonnegative(),
  updatedAt: z.string().nullish(),
});

export type DmScreenSummary = z.infer<typeof dmScreenSummarySchema>;

/** Ответ списка ширм: сами ширмы, сколько создано и сколько можно. */
export const dmScreenListSchema = z.object({
  items: z.array(dmScreenSummarySchema),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
});

export type DmScreenList = z.infer<typeof dmScreenListSchema>;

/** Ширма целиком: имя и окна. */
export const dmScreenDetailSchema = z.object({
  id: z.coerce.string().min(1),
  name: z.string(),
  windows: dmScreenWindowListSchema,
  updatedAt: z.string().nullish(),
});

export type DmScreenDetail = z.infer<typeof dmScreenDetailSchema>;

/**
 * Копия ширмы из аккаунта в браузере: с неё ширма открывается сразу, не
 * дожидаясь ответа сервера.
 */
export const dmScreenCacheSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  windows: dmScreenWindowListSchema,
});

export type DmScreenCache = z.infer<typeof dmScreenCacheSchema>;
