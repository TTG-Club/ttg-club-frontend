import type { CSSProperties } from 'vue';
import type { SiteMenuItem } from '~infrastructure/sidebar/menu/model';

import type { HomeGame } from './schema';
import type {
  HomeFeedEntry,
  HomeNavLink,
  HomeNews,
  HomeSectionLink,
  HomeVideo,
} from './types';

import { sortBy } from 'es-toolkit';

import {
  TOKENATOR_LEGACY_URL,
  TOKENATOR_URL,
} from '~infrastructure/sidebar/menu/model';

import {
  HOME_LATEST_GAME_DATE_FORMAT,
  HOME_LATEST_GAME_DATE_LOCALE,
  HOME_LATEST_GAME_DURATION_LABELS,
  HOME_LATEST_GAME_GENRES_SEPARATOR,
  HOME_LATEST_GAME_SITE_URL,
  HOME_LATEST_GAME_TYPE_LABELS,
  HOME_NEWS_ARTICLE_URL,
  HOME_SECTION_DEFAULT_ICON,
  HOME_SECTION_ICONS,
  HOME_SECTION_TEXTURE,
  HOME_TOOL_DEFAULT_ICON,
  HOME_TOOL_ICONS,
  HOME_TOOLS_PATH_PREFIX,
  HOME_VIDEO_SHORT_URL,
} from './constants';

/** Пункт меню, у которого точно есть адрес */
type LinkedMenuItem = SiteMenuItem & { url: string };

/**
 * Проверяет, что у пункта меню есть непустой адрес.
 *
 * @param menuItem - пункт меню
 * @returns есть ли адрес
 */
function hasUrl(menuItem: SiteMenuItem): menuItem is LinkedMenuItem {
  return typeof menuItem.url === 'string' && menuItem.url.length > 0;
}

/**
 * Проверяет, виден ли пункт меню: пункты только для разработки видны лишь в
 * режиме разработки.
 *
 * @param menuItem - пункт меню
 * @param isDevelopment - режим разработки
 * @returns виден ли пункт
 */
function isVisibleItem(
  menuItem: SiteMenuItem,
  isDevelopment: boolean,
): boolean {
  return isDevelopment || !menuItem.onlyDev;
}

/**
 * Собирает пункты меню, отмеченные для главной, со всех уровней вложенности.
 *
 * @param menuItems - пункты меню (группы со вложенными пунктами)
 * @param isDevelopment - режим разработки
 * @returns плоский список пунктов с адресом и флагом `onIndex`
 */
function collectIndexItems(
  menuItems: Array<SiteMenuItem>,
  isDevelopment: boolean,
): Array<LinkedMenuItem> {
  return menuItems
    .filter((menuItem) => isVisibleItem(menuItem, isDevelopment))
    .flatMap((menuItem) => [
      ...collectIndexItems(menuItem.children ?? [], isDevelopment),
      ...(menuItem.onIndex && hasUrl(menuItem) ? [menuItem] : []),
    ]);
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
 * Разделы для плиты главной: пункты меню с флагом `onIndex` в порядке
 * `indexOrder`, с иконкой и кадром фактуры.
 *
 * @param menuItems - группы меню сайта
 * @param isDevelopment - режим разработки
 * @returns плитки разделов
 */
export function getHomeSections(
  menuItems: Array<SiteMenuItem>,
  isDevelopment: boolean,
): Array<HomeSectionLink> {
  const sections = sortBy(collectIndexItems(menuItems, isDevelopment), [
    'indexOrder',
  ]);

  return sections.map((section, index) => ({
    name: section.name,
    url: section.url,
    icon: HOME_SECTION_ICONS[section.url] ?? HOME_SECTION_DEFAULT_ICON,
    external: !!section.external,
    textureStyle: getSectionTextureStyle(index),
  }));
}

/**
 * Проверяет, что пункт меню ведёт внутрь раздела инструментов.
 *
 * @param menuItem - пункт меню
 * @returns ведёт ли пункт в инструменты
 */
function isToolItem(menuItem: SiteMenuItem): boolean {
  return hasUrl(menuItem) && menuItem.url.startsWith(HOME_TOOLS_PATH_PREFIX);
}

/**
 * Пункт инструмента: здешний токенатор заменяется переехавшим на новый сайт,
 * его старая версия остаётся только в меню.
 *
 * @param menuItem - пункт меню с адресом
 * @returns ссылка на инструмент
 */
function toToolLink(menuItem: LinkedMenuItem): HomeNavLink {
  const isTokenator = menuItem.url === TOKENATOR_LEGACY_URL;
  const url = isTokenator ? TOKENATOR_URL : menuItem.url;

  return {
    name: menuItem.name,
    url,
    icon: HOME_TOOL_ICONS[url] ?? HOME_TOOL_DEFAULT_ICON,
    external: isTokenator || !!menuItem.external,
  };
}

/**
 * Инструменты для ленты под поиском: пункты группы инструментов в порядке
 * меню — и здешние, и переехавшие на новый сайт.
 *
 * @param menuItems - группы меню сайта
 * @param isDevelopment - режим разработки
 * @returns ссылки на инструменты
 */
export function getHomeTools(
  menuItems: Array<SiteMenuItem>,
  isDevelopment: boolean,
): Array<HomeNavLink> {
  const tools = menuItems
    .filter((group) => group.children?.some(isToolItem))
    .flatMap((group) => group.children ?? [])
    .filter(
      (menuItem): menuItem is LinkedMenuItem =>
        hasUrl(menuItem) && isVisibleItem(menuItem, isDevelopment),
    );

  return sortBy(tools, ['order']).map(toToolLink);
}

/**
 * Короткая ссылка на ролик YouTube.
 *
 * @param videoId - идентификатор ролика
 * @returns адрес ролика
 */
export function getHomeVideoUrl(videoId: string): string {
  return `${HOME_VIDEO_SHORT_URL}${encodeURIComponent(videoId)}`;
}

/**
 * Адрес новости на новом сайте.
 *
 * @param newsUrl - слаг новости
 * @returns адрес страницы новости
 */
export function getHomeNewsUrl(newsUrl: string): string {
  return `${HOME_NEWS_ARTICLE_URL}/${encodeURIComponent(newsUrl)}`;
}

/**
 * Собирает ленту под плеером: новости и ролики строго чередуются, начиная с
 * новости, — свежий ролик уже стоит в плеере. Когда одного вида не хватает,
 * хвост другого идёт подряд, в своём порядке.
 *
 * @param videos - ролики без того, что в плеере, свежие первыми
 * @param newsList - новости, свежие первыми
 * @returns записи ленты с адресами
 */
export function getHomeFeed(
  videos: ReadonlyArray<HomeVideo>,
  newsList: ReadonlyArray<HomeNews>,
): Array<HomeFeedEntry> {
  const length = Math.max(videos.length, newsList.length);

  return Array.from({ length }, (_, index) => index).flatMap((index) => {
    const entries: Array<HomeFeedEntry> = [];
    const news = newsList[index];
    const video = videos[index];

    if (news) {
      entries.push({ kind: 'news', news, url: getHomeNewsUrl(news.url) });
    }

    if (video) {
      entries.push({ kind: 'video', video, url: getHomeVideoUrl(video.id) });
    }

    return entries;
  });
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
