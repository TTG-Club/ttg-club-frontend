import { orderBy } from 'lodash-es';

import type { TNavItem } from '@/shared/stores/NavStore';

import {
  HOME_HERO_MAP_VIEWBOX,
  HOME_SECTION_DEFAULT_ICON,
  HOME_SECTION_ICONS,
  HOME_SECTION_TEXTURE,
  HOME_TOOL_DEFAULT_ICON,
  HOME_TOOL_ICONS,
  HOME_TOOLS_PATH_PREFIX,
  HOME_VIDEO_SHORT_URL,
} from './constants';

import type {
  HomeMapPlacement,
  HomeMapPoint,
  HomeMapSize,
  HomeNavLink,
  HomeSectionLink,
} from './types';
import type { CSSProperties, StyleValue } from 'vue';

/** Пункт меню, у которого точно есть адрес */
type LinkedNavItem = TNavItem & { url: string };

/**
 * Проверяет, что у пункта меню есть непустой адрес.
 * @param navItem - пункт меню
 */
function hasUrl(navItem: TNavItem): navItem is LinkedNavItem {
  return typeof navItem.url === 'string' && navItem.url.length > 0;
}

/**
 * Собирает пункты меню, отмеченные для главной, со всех уровней вложенности.
 * @param navItems - пункты меню (группы со вложенными пунктами)
 * @returns плоский список пунктов с адресом и флагом `onIndex`
 */
function collectIndexNavItems(navItems: Array<TNavItem>): Array<LinkedNavItem> {
  return navItems.flatMap((navItem) => [
    ...collectIndexNavItems(navItem.children ?? []),
    ...(navItem.onIndex && hasUrl(navItem) ? [navItem] : []),
  ]);
}

/**
 * Кадр спрайта фактуры для раздела. Кадры идут в том же порядке, что и
 * разделы; кадр ровно по высоте плитки и прижат к её правому краю.
 * @param index - порядковый номер раздела на главной
 * @returns стиль слоя фактуры или `undefined`, если кадра для раздела нет
 */
function getSectionTextureStyle(index: number): StyleValue | undefined {
  if (index >= HOME_SECTION_TEXTURE.frames) {
    return undefined;
  }

  return {
    backgroundImage: `url(${HOME_SECTION_TEXTURE.url})`,
    backgroundSize: `auto ${HOME_SECTION_TEXTURE.frames * 100}%`,
    backgroundPositionY: `${(index / (HOME_SECTION_TEXTURE.frames - 1)) * 100}%`,
  };
}

/**
 * Разделы для плиты главной: пункты меню с флагом `onIndex` в порядке
 * `indexOrder`, с иконкой и кадром фактуры.
 * @param navItems - группы меню сайта
 */
export function getHomeSections(
  navItems: Array<TNavItem>,
): Array<HomeSectionLink> {
  const sections = orderBy(
    collectIndexNavItems(navItems),
    ['indexOrder'],
    ['asc'],
  );

  return sections.map((section, index) => ({
    name: section.name,
    url: section.url,
    icon: HOME_SECTION_ICONS[section.url] ?? HOME_SECTION_DEFAULT_ICON,
    textureStyle: getSectionTextureStyle(index),
  }));
}

/**
 * Проверяет, что пункт меню ведёт внутрь раздела инструментов.
 * @param navItem - пункт меню
 */
function isToolPath(navItem: TNavItem): boolean {
  return hasUrl(navItem) && navItem.url.startsWith(HOME_TOOLS_PATH_PREFIX);
}

/**
 * Инструменты для ленты под поиском: пункты группы инструментов в порядке
 * меню — и здешние, и переехавшие на новый сайт. Старые версии переехавших
 * инструментов остаются только в меню.
 * @param navItems - группы меню сайта
 */
export function getHomeTools(navItems: Array<TNavItem>): Array<HomeNavLink> {
  const tools = navItems
    .filter((group) => group.children?.some(isToolPath))
    .flatMap((group) => group.children ?? [])
    .filter(
      (navItem): navItem is LinkedNavItem => hasUrl(navItem) && !navItem.legacy,
    );

  return orderBy(tools, ['order'], ['asc']).map((tool) => ({
    name: tool.name,
    url: tool.url,
    icon: HOME_TOOL_ICONS[tool.url] ?? HOME_TOOL_DEFAULT_ICON,
    external: tool.external,
  }));
}

/**
 * Длина в единицах карты. Фигуры карты шапки стоят на сцене, где единица карты
 * — ровно пиксель, а под ширину холста масштабируется сцена целиком.
 * @param units - единицы карты
 */
function toMapPixels(units: number): string {
  return `${Number(units.toFixed(3))}px`;
}

/**
 * Прямоугольник на сцене карты шапки.
 * @param point - левый верхний угол, единицы карты
 * @param size - размер, единицы карты
 */
export function getHomeMapBoxStyle(
  point: HomeMapPoint,
  size: HomeMapSize,
): CSSProperties {
  return {
    left: toMapPixels(point.x - HOME_HERO_MAP_VIEWBOX.x),
    top: toMapPixels(point.y - HOME_HERO_MAP_VIEWBOX.y),
    width: toMapPixels(size.width),
    height: toMapPixels(size.height),
  };
}

/**
 * Сдвиг и поворот фигуры, которая стоит на карте в точке `placement`, — для
 * слоя фигуры в левом верхнем углу сцены. Сдвиг в пикселях, а не в процентах
 * от фигуры: анимацию `transform`, зависящую от размера элемента, браузер не
 * отдаёт композитору и ведёт в основном потоке.
 * @param placement - точка привязки (центр фигуры) и поворот
 * @param size - размер слоя фигуры, единицы карты
 */
export function getHomeMapFigureTransform(
  placement: HomeMapPlacement,
  size: HomeMapSize,
): { translate: string; rotate: string } {
  const left = placement.x - HOME_HERO_MAP_VIEWBOX.x - size.width / 2;
  const top = placement.y - HOME_HERO_MAP_VIEWBOX.y - size.height / 2;

  return {
    translate: `${toMapPixels(left)} ${toMapPixels(top)}`,
    rotate: `${Number(placement.angle.toFixed(3))}deg`,
  };
}

/**
 * Короткая ссылка на ролик YouTube.
 * @param videoId - идентификатор ролика
 */
export function getHomeVideoUrl(videoId: string): string {
  return `${HOME_VIDEO_SHORT_URL}${encodeURIComponent(videoId)}`;
}
