import type { CSSProperties } from 'vue';
import type { MenuItem, MenuSection } from '~infrastructure/sidebar/menu/model';

import type { HomeGame } from './schema';
import type { HomeNavLink, HomeSectionLink } from './types';

import {
  HOME_COUNTERS_NUMBER_LOCALE,
  HOME_LATEST_GAME_DATE_FORMAT,
  HOME_LATEST_GAME_DATE_LOCALE,
  HOME_LATEST_GAME_DURATION_LABELS,
  HOME_LATEST_GAME_GENRES_SEPARATOR,
  HOME_LATEST_GAME_SITE_URL,
  HOME_LATEST_GAME_TYPE_LABELS,
  HOME_SECTION_DEFAULT_ICON,
  HOME_SECTION_ICONS,
  HOME_SECTION_TEXTURE,
  HOME_TOOL_DEFAULT_ICON,
  HOME_TOOL_ICONS,
} from './constants';

/**
 * Пункты меню, отмеченные для главной, в порядке меню.
 *
 * @param menuSections - разделы меню сайта
 * @param isTools - брать инструменты (`true`) или остальные разделы (`false`)
 * @returns пункты с флагом `onHome`
 */
function collectHomeItems(
  menuSections: Array<MenuSection>,
  isTools: boolean,
): Array<MenuItem> {
  return menuSections
    .filter((menuSection) => !!menuSection.isTools === isTools)
    .flatMap((menuSection) => menuSection.items)
    .filter((menuItem) => menuItem.onHome);
}

/**
 * Кадр спрайта фактуры для раздела. Кадры идут в том же порядке, что и
 * разделы; кадр ровно по высоте плитки и прижат к её правому краю.
 *
 * @param index - порядковый номер раздела на главной
 * @returns стиль слоя фактуры или `undefined`, если кадра для раздела нет
 */
function getSectionTextureStyle(index: number): CSSProperties | undefined {
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
 * Разделы для плиты главной: отмеченные для главной пункты меню, кроме
 * инструментов, с иконкой и кадром фактуры.
 *
 * @param menuSections - разделы меню сайта
 * @returns плитки разделов
 */
export function getHomeSections(
  menuSections: Array<MenuSection>,
): Array<HomeSectionLink> {
  return collectHomeItems(menuSections, false).map((menuItem, index) => ({
    name: menuItem.label,
    url: menuItem.href,
    icon: HOME_SECTION_ICONS[menuItem.href] ?? HOME_SECTION_DEFAULT_ICON,
    external: !!menuItem.external,
    textureStyle: getSectionTextureStyle(index),
  }));
}

/**
 * Инструменты для ленты под поиском: отмеченные для главной пункты раздела
 * инструментов — и здешние, и переехавшие на новый сайт.
 *
 * @param menuSections - разделы меню сайта
 * @returns ссылки на инструменты
 */
export function getHomeTools(
  menuSections: Array<MenuSection>,
): Array<HomeNavLink> {
  return collectHomeItems(menuSections, true).map((menuItem) => ({
    name: menuItem.label,
    url: menuItem.href,
    icon: HOME_TOOL_ICONS[menuItem.href] ?? HOME_TOOL_DEFAULT_ICON,
    external: !!menuItem.external,
  }));
}

/**
 * Число для счётчика шапки с разделителями разрядов: `3389` → «3 389».
 *
 * @param value - число
 * @returns число строкой по правилам русской локали
 */
export function formatHomeCount(value: number): string {
  return value.toLocaleString(HOME_COUNTERS_NUMBER_LOCALE);
}

/**
 * Адрес картинки с new.ttg.club: сервисы отдают путь от корня того сайта,
 * а главная живёт на другом домене.
 *
 * @param imageUrl - путь от корня new.ttg.club или полный адрес
 * @returns полный адрес; `undefined` — картинки нет или адрес не похож на ссылку
 */
export function getHomeSiteImageUrl(
  imageUrl: string | null | undefined,
): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith('/')) {
    return `${HOME_LATEST_GAME_SITE_URL}${imageUrl}`;
  }

  return /^https?:\/\//.test(imageUrl) ? imageUrl : undefined;
}

/**
 * Условия игры одной строкой: формат (с городом у офлайна) и длительность.
 *
 * @param game - игра
 * @returns строка вида «Вживую, Москва · Ваншот»
 */
export function getHomeGameFormatSummary(
  game: Pick<HomeGame, 'type' | 'city' | 'durationType'>,
): string {
  const format = HOME_LATEST_GAME_TYPE_LABELS[game.type];

  const place =
    game.type === 'OFFLINE' && game.city ? `${format}, ${game.city}` : format;

  return `${place} · ${HOME_LATEST_GAME_DURATION_LABELS[game.durationType]}`;
}

/**
 * Жанры игры через запятую, вместе с жанром, который мастер вписал сам.
 *
 * @param game - игра
 * @returns строка жанров; пустая — жанров нет
 */
export function getHomeGameGenresLabel(
  game: Pick<HomeGame, 'genres' | 'customGenre'>,
): string {
  const genres = game.genres ?? [];

  return (game.customGenre ? [...genres, game.customGenre] : genres).join(
    HOME_LATEST_GAME_GENRES_SEPARATOR,
  );
}

/**
 * Самая свежая игра по дате создания: поднятые объявления стоят в каталоге
 * выше новых, поэтому первая игра страницы не обязательно самая новая.
 *
 * @param games - игры первой страницы каталога
 * @returns самая новая игра или `undefined`, если игр нет
 */
export function findLatestGame(games: Array<HomeGame>): HomeGame | undefined {
  return games.reduce<HomeGame | undefined>(
    (latest, game) =>
      !latest || Date.parse(game.createdAt) > Date.parse(latest.createdAt)
        ? game
        : latest,
    undefined,
  );
}

/**
 * Дата ближайшей встречи без года.
 *
 * @param startsAt - начало встречи в ISO 8601
 * @returns дата вида «5 нояб., 19:00»
 */
export function formatHomeGameSession(startsAt: string): string {
  return new Date(startsAt).toLocaleString(
    HOME_LATEST_GAME_DATE_LOCALE,
    HOME_LATEST_GAME_DATE_FORMAT,
  );
}
