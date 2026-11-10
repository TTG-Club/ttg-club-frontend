import type { SiteMenuItem } from '../types';

import { MENU_HIDDEN_URLS } from '../consts';

/**
 * Убирает из меню скрытые пункты (`MENU_HIDDEN_URLS`) на любой глубине.
 *
 * @param items - меню из API
 * @returns меню без скрытых пунктов
 */
export function withoutHiddenMenuItems(
  items: Array<SiteMenuItem>,
): Array<SiteMenuItem> {
  return items
    .filter((item) => !item.url || !MENU_HIDDEN_URLS.has(item.url))
    .map((item) =>
      item.children
        ? { ...item, children: withoutHiddenMenuItems(item.children) }
        : item,
    );
}
