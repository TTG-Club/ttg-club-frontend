import type { SiteMenuItem } from './types';

import { z } from 'zod';

/** Проверка пунктов меню из API: дерево любой глубины. */
export const siteMenuItemSchema: z.ZodType<SiteMenuItem> = z.lazy(() =>
  z.object({
    name: z.string(),
    icon: z.string().optional(),
    url: z.string().optional(),
    onlyDev: z.boolean().optional(),
    external: z.boolean().optional(),
    order: z.number(),
    children: z.array(siteMenuItemSchema).optional(),
  }),
);

/** Ответ `GET /api/v1/menu`. */
export const siteMenuSchema = z.array(siteMenuItemSchema);
