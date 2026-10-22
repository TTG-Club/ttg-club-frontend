/**
 * Адрес страницы из параметра маршрута `/info/[slug]`.
 * @param param - параметр маршрута
 */
export function getInfoSlug(param: string | Array<string> | undefined): string {
  return (Array.isArray(param) ? param[0] : param) ?? '';
}
