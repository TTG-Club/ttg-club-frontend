import type { MenuGroup, MenuLink, SiteMenuItem } from './types';

import { sortBy } from 'es-toolkit';

import {
  TOKENATOR_LEGACY_SUFFIX,
  TOKENATOR_LEGACY_URL,
  TOKENATOR_URL,
  TTG_ICON_PREFIX,
  VTTG_MENU_GROUP,
} from './constants';

/**
 * Превращает путь иконки из API (`menu/filled/wiki`) в имя иконки локальной
 * коллекции (`ttg:menu-filled-wiki`).
 * @param iconPath - путь иконки из старого спрайта
 */
export function toTtgIcon(iconPath: string | undefined): string | undefined {
  return iconPath
    ? `${TTG_ICON_PREFIX}${iconPath.replaceAll('/', '-')}`
    : undefined;
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
    external: !!item.external,
  };

  if (item.url !== TOKENATOR_LEGACY_URL) {
    return [link];
  }

  return [
    { ...link, url: TOKENATOR_URL, external: true },
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

  const groups = sortBy(items.filter(isVisible), ['order']).map((group) => ({
    label: group.name,
    icon: toTtgIcon(group.icon),
    links: sortBy((group.children ?? []).filter(isVisible), ['order']).flatMap(
      toMenuLinks,
    ),
  }));

  return [...groups, VTTG_MENU_GROUP];
}
