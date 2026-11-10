import { z } from 'zod';

/** Пункт меню в том виде, в каком его отдаёт `GET /api/v1/menu`. */
export interface SiteMenuItem {
  name: string;
  icon?: string;
  url?: string;
  onlyDev?: boolean;
  external?: boolean;
  order: number;
  /** Пункт стоит плиткой на главной. */
  onIndex?: boolean;
  /** Порядок плитки на главной. */
  indexOrder?: number;
  children?: Array<SiteMenuItem>;
}

/** Проверка пунктов меню из API: дерево любой глубины. */
export const siteMenuItemSchema: z.ZodType<SiteMenuItem> = z.lazy(() =>
  z.object({
    name: z.string(),
    icon: z.string().optional(),
    url: z.string().optional(),
    onlyDev: z.boolean().optional(),
    external: z.boolean().optional(),
    order: z.number(),
    onIndex: z.boolean().optional(),
    indexOrder: z.number().optional(),
    children: z.array(siteMenuItemSchema).optional(),
  }),
);

/** Ответ `GET /api/v1/menu`. */
export const siteMenuSchema = z.array(siteMenuItemSchema);
