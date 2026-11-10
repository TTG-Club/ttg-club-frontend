import type { NewsKind, NewsKindConfig } from './types';

/** Источники новостей нового сайта по виду новости. */
export const NEWS_KINDS: Record<NewsKind, NewsKindConfig> = {
  site: {
    apiPath: '/api/v2/articles',
    searchQuery: { type: 'NEWS' },
    pagePath: '/articles',
    listPath: '/news',
  },
  community: {
    apiPath: '/api/v2/community-news',
    searchQuery: {},
    pagePath: '/community-news',
    listPath: '/community-news',
  },
};

/** Заглушка обложки новости без картинки и ролика. */
export const NEWS_FALLBACK_IMAGE = '/img/no-img.webp';

export const NEWS_DATE_LOCALE = 'ru-RU';

/** Дата публикации: «10 ноября 2026 г.» */
export const NEWS_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

/** Разделитель автора и даты в подписи плитки. */
export const NEWS_META_SEPARATOR = ' · ';

export const NEWS_TEXT = {
  openPage: 'Открыть на новом сайте',
  close: 'Закрыть',
  loadError:
    'Не удалось загрузить новость. Попробуйте открыть её на новом сайте.',
  source: 'Первоисточник',
} as const;

export const NEWS_ICON = {
  openPage: 'tabler:external-link',
  close: 'tabler:x',
  author: 'tabler:user-circle',
} as const;
