import type { MenuGroup, MenuLink, SiteMenuItem } from './types';

import { sortBy } from 'es-toolkit';

import {
  MENU_DEFAULT_ICON,
  MENU_LINK_ICONS,
  MENU_TOOLS_PATH_PREFIX,
  TOKENATOR_LEGACY_SUFFIX,
  TOKENATOR_LEGACY_URL,
  TOKENATOR_URL,
  VTTG_MENU_GROUP,
} from './constants';

/**
 * Адрес пункта без косой черты в конце: в меню из API встречается и
 * `/dm-screen/`, а иконки записаны по адресу без неё.
 * @param url - адрес пункта
 */
export function getMenuIconKey(url: string): string {
  return url.length > 1 ? url.replace(/\/+$/, '') : url;
}

/**
 * Иконка пункта меню по его адресу.
 * @param url - адрес пункта
 */
export function getMenuLinkIcon(url: string | undefined): string {
  return (url && MENU_LINK_ICONS[getMenuIconKey(url)]) || MENU_DEFAULT_ICON;
}

/**
 * Пункт токенатора ведёт на новый сайт, а сразу за ним встаёт ссылка на
 * здешнюю старую версию, как в старом SPA.
 * @param item - пункт меню из API
 */
function toMenuLinks(item: SiteMenuItem): Array<MenuLink> {
  const link: MenuLink = {
    label: item.name,
    url: item.url,
    icon: getMenuLinkIcon(item.url),
    external: !!item.external,
  };

  if (item.url !== TOKENATOR_LEGACY_URL) {
    return [link];
  }

  return [
    {
      ...link,
      url: TOKENATOR_URL,
      icon: getMenuLinkIcon(TOKENATOR_URL),
      external: true,
    },
    { ...link, label: `${item.name}${TOKENATOR_LEGACY_SUFFIX}` },
  ];
}

/**
 * Собирает группы меню из ответа API: прячет пункты только для разработки,
 * сортирует по `order` и добавляет раздел Virtual TTG.
 * @param items - группы меню из API
 * @param isDevelopment - показывать ли пункты только для разработки
 */
export function buildMenuGroups(
  items: Array<SiteMenuItem>,
  isDevelopment: boolean,
): Array<MenuGroup> {
  const isVisible = (item: SiteMenuItem) => isDevelopment || !item.onlyDev;

  const groups = sortBy(items.filter(isVisible), ['order']).map((group) => {
    const children = sortBy((group.children ?? []).filter(isVisible), [
      'order',
    ]);

    return {
      label: group.name,
      links: children.flatMap(toMenuLinks),
      isTools: children.some((item) =>
        item.url?.startsWith(MENU_TOOLS_PATH_PREFIX),
      ),
    };
  });

  return [...groups, VTTG_MENU_GROUP];
}
