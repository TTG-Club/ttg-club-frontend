import {
  ROUTE_CATCH_ALL_SUFFIX,
  ROUTE_PARAM_PREFIX,
  ROUTE_PATH_END,
} from './constants';

/**
 * Проверяет, подходит ли сегмент адреса под сегмент пути маршрута.
 * @param routeSegment - сегмент пути маршрута, например `:slug`
 * @param segment - сегмент адреса
 */
function matchesSegment(routeSegment: string, segment: string): boolean {
  return routeSegment.startsWith(ROUTE_PARAM_PREFIX)
    ? segment.length > 0
    : routeSegment === segment;
}

/**
 * Проверяет, есть ли страница с таким адресом среди маршрутов Nuxt.
 * Без `router.resolve`, который шумит предупреждениями на каждую ссылку
 * в разделы, ещё не перенесённые со старого SPA.
 * @param href - внутренний адрес из контента
 * @param routePaths - пути маршрутов роутера
 */
export function isKnownRoute(href: string, routePaths: Array<string>): boolean {
  const [pathname = ''] = href.split(ROUTE_PATH_END);
  const segments = pathname.split('/').filter(Boolean);

  return routePaths.some((routePath) => {
    const routeSegments = routePath.split('/').filter(Boolean);
    const last = routeSegments.at(-1);

    if (last?.endsWith(ROUTE_CATCH_ALL_SUFFIX)) {
      const prefix = routeSegments.slice(0, -1);

      return (
        segments.length >= prefix.length
        && prefix.every((part, index) =>
          matchesSegment(part, segments[index] ?? ''),
        )
      );
    }

    return (
      routeSegments.length === segments.length
      && routeSegments.every((part, index) =>
        matchesSegment(part, segments[index] ?? ''),
      )
    );
  });
}
