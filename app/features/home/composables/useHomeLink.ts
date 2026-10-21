import { isKnownRoute } from '~content/model';

/**
 * Решает, как открывать ссылку главной. Разделы, которых ещё нет в Nuxt,
 * отдаёт старое SPA: переход на них — полная загрузка страницы, иначе роутер
 * Nuxt показал бы свою 404.
 *
 * @returns проверка «ссылка ведёт мимо роутера Nuxt»
 */
export function useHomeLink() {
  const router = useRouter();

  const routePaths = router.getRoutes().map((route) => route.path);

  /**
   * Ведёт ли ссылка мимо роутера Nuxt.
   *
   * @param url - адрес ссылки
   * @param external - ссылка заведомо на другой сайт
   * @returns нужна ли полная загрузка страницы
   */
  function isExternalLink(url: string, external = false): boolean {
    return external || !isKnownRoute(url, routePaths);
  }

  return { isExternalLink };
}
