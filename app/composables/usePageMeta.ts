import { z } from 'zod';

const pageMetaSchema = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  image: z.string().nullish(),
});

/** Метаданные страницы из `/api/v1/meta`. */
export type PageMeta = z.infer<typeof pageMetaSchema>;

/** Пометка редакции в заголовке, как в серверном title старого сайта. */
const EDITION_SUFFIX = ' (2014)';

/**
 * Разбирает ответ `/api/v1/meta`; при неожиданной форме возвращает `null`.
 *
 * @param response - Ответ API
 * @returns Метаданные или `null`
 */
function parsePageMeta(response: unknown): PageMeta | null {
  const result = pageMetaSchema.safeParse(response);

  return result.success ? result.data : null;
}

/**
 * Убирает завершающий слэш у пути, кроме корня — как в canonical старого сайта.
 *
 * @param path - Путь страницы
 * @returns Путь без завершающего слэша
 */
function toCanonicalPath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Подставляет title, description и canonical страницы на сервере.
 *
 * Title и description берутся из `/api/v1/meta` — того же источника, что у
 * серверной подстановки в `SpaController` бэкенда и у `useMeta` старого SPA,
 * поэтому для поисковиков заголовки не меняются. Canonical указывает на
 * адрес страницы на каноничном домене без query-строки.
 */
export function usePageMeta() {
  const route = useRoute();
  const siteConfig = useSiteConfig();

  const { data } = useAsyncData(
    () => `page-meta:${route.path}`,
    () =>
      $fetch<unknown>(`/api/v1/meta${route.path}`)
        .then(parsePageMeta)
        .catch(() => null),
    {
      watch: [() => route.path],
    },
  );

  useSeoMeta({
    title: () =>
      data.value?.title ? `${data.value.title}${EDITION_SUFFIX}` : undefined,
    description: () => data.value?.description ?? undefined,
    ogImage: () => data.value?.image ?? undefined,
  });

  useHead({
    link: [
      {
        rel: 'canonical',
        href: () => `${siteConfig.url}${toCanonicalPath(route.path)}`,
      },
    ],
  });
}
