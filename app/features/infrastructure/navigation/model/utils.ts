import { MENU_DEFAULT_ICON, MENU_SECTIONS } from './constants';

/** Иконки пунктов меню по адресу. */
const MENU_ICONS_BY_HREF: ReadonlyMap<string, string> = new Map(
  MENU_SECTIONS.flatMap((section) => section.items).map((menuItem) => [
    menuItem.href,
    menuItem.icon,
  ]),
);

/**
 * Иконка раздела сайта — та же, что у его пункта в меню.
 *
 * @param href - адрес раздела
 * @returns иконка пункта; общая, если такого адреса в меню нет
 */
export function getMenuLinkIcon(href: string): string {
  return MENU_ICONS_BY_HREF.get(href) ?? MENU_DEFAULT_ICON;
}
