import type { RenderNode } from '../markup';
import type { NewsKind, NewsShort } from './types';

import { getMarkupText, parseStoredMarkup } from '../markup';
import { getVideoPoster } from '../video/utils';
import {
  NEWS_DATE_FORMAT,
  NEWS_DATE_LOCALE,
  NEWS_FALLBACK_IMAGE,
  NEWS_KINDS,
  NEWS_META_SEPARATOR,
  NEWS_SEARCH_PATH,
} from './constants';

/**
 * Приводит поле описания новости (`preview`/`content`) к виду для отрисовки.
 *
 * @param value - Поле описания из ответа API
 * @returns Описание для MarkupRender
 */
export function toNewsMarkup(
  value: RenderNode,
): RenderNode | Array<RenderNode> {
  return parseStoredMarkup(value);
}

/**
 * Читаемый текст анонса для карточек: без маркеров и JSON-обёртки.
 *
 * @param value - Анонс из ответа API
 * @returns Текст анонса
 */
export function getNewsPreviewText(value: RenderNode): string {
  return getMarkupText(parseStoredMarkup(value));
}

/**
 * Обложка новости: своя картинка, превью ролика или заглушка.
 *
 * @param news - Новость
 * @returns Адрес картинки
 */
export function getNewsCover(
  news: Pick<NewsShort, 'previewImageUrl' | 'videoUrl'>,
): string {
  return (
    getVideoPoster(news.videoUrl, news.previewImageUrl) ?? NEWS_FALLBACK_IMAGE
  );
}

/**
 * Дата публикации по-русски.
 *
 * @param dateTime - Дата из ответа API
 * @returns Дата вида «10 ноября 2026 г.» или пустая строка
 */
export function formatNewsDate(dateTime: string | null): string {
  if (!dateTime) {
    return '';
  }

  const date = new Date(dateTime);

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(NEWS_DATE_LOCALE, NEWS_DATE_FORMAT);
}

/**
 * Подпись над заголовком: автор (у новостей сообщества) и дата.
 *
 * @param news - Новость
 * @returns Строка подписи или пустая строка
 */
export function getNewsMeta(
  news: Pick<NewsShort, 'authorName' | 'publishDateTime'>,
): string {
  return [news.authorName, formatNewsDate(news.publishDateTime)]
    .filter(Boolean)
    .join(NEWS_META_SEPARATOR);
}

/**
 * Адрес страницы новости на новом сайте.
 *
 * @param kind - Вид новости
 * @param url - Слаг новости
 * @param newSiteUrl - Origin нового сайта
 * @returns Полный адрес страницы
 */
export function getNewsPageUrl(
  kind: NewsKind,
  url: string,
  newSiteUrl: string,
): string {
  return `${newSiteUrl}${NEWS_KINDS[kind].pagePath}/${encodeURIComponent(url)}`;
}

/**
 * Путь API свежих новостей этого вида.
 *
 * @param kind - Вид новости
 * @returns Путь поиска в core-api
 */
export function getNewsSearchPath(kind: NewsKind): string {
  return `${NEWS_KINDS[kind].apiPath}${NEWS_SEARCH_PATH}`;
}

/**
 * Путь API полной новости.
 *
 * @param kind - Вид новости
 * @param url - Слаг новости
 * @returns Путь новости в core-api
 */
export function getNewsDetailPath(kind: NewsKind, url: string): string {
  return `${NEWS_KINDS[kind].apiPath}/${encodeURIComponent(url)}`;
}

/**
 * Подпись над заголовком обложки: тип записи, автор и дата.
 *
 * @param news - Новость
 * @returns Строка подписи или пустая строка
 */
export function getNewsHeroMeta(
  news: Pick<NewsShort, 'typeName' | 'authorName' | 'publishDateTime'>,
): string {
  return [news.typeName, getNewsMeta(news)]
    .filter(Boolean)
    .join(NEWS_META_SEPARATOR);
}

/**
 * Адрес списка всех новостей этого вида на новом сайте.
 *
 * @param kind - Вид новости
 * @param newSiteUrl - Origin нового сайта
 * @returns Полный адрес списка
 */
export function getNewsListUrl(kind: NewsKind, newSiteUrl: string): string {
  return `${newSiteUrl}${NEWS_KINDS[kind].listPath}`;
}
