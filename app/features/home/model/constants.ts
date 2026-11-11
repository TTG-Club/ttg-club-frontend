import type { HomePromoCardContent, HomeSocialLink } from './types';

import { TOKENATOR_URL } from '~infrastructure/sidebar/menu/model';

/* --- Общее -------------------------------------------------------------- */

/** Стрелка ссылок главной: плитки разделов, «Подробнее», «Перейти» */
export const HOME_LINK_ARROW_ICON = 'tabler:arrow-right';

/* --- Инструменты -------------------------------------------------------- */

/**
 * Группа инструментов в меню — та, где есть пункты с адресом внутри этого
 * раздела. Переехавшие на новый сайт инструменты лежат в той же группе, но
 * адрес у них внешний.
 */
export const HOME_TOOLS_PATH_PREFIX = '/tools';

/** Иконки инструментов по адресу; неизвестный инструмент получит общую */
export const HOME_TOOL_ICONS: Partial<Record<string, string>> = {
  [TOKENATOR_URL]: 'tabler:photo-circle',
  '/tools/ability-calc': 'tabler:calculator',
  '/tools/trader': 'tabler:coins',
  '/tools/encounters': 'tabler:dice-5',
  '/tools/treasury': 'tabler:diamond',
  '/tools/wildmagic': 'tabler:bolt',
  '/tools/madness': 'tabler:brain',
  '/tools/names': 'tabler:signature',
  '/tools/tavern': 'tabler:beer',
  '/tools/initiative': 'tabler:swords',
};

export const HOME_TOOL_DEFAULT_ICON = 'tabler:tool';

/* --- Разделы ------------------------------------------------------------ */

/**
 * Иконки разделов по адресу. Раздел в плите опознают иконка и подпись, а
 * картинка обесцвечена и работает фактурой — иначе двенадцать картинок спорят
 * друг с другом.
 */
export const HOME_SECTION_ICONS: Partial<Record<string, string>> = {
  '/classes': 'tabler:sword',
  '/races': 'tabler:users',
  '/feats': 'tabler:star',
  '/options': 'tabler:puzzle',
  '/backgrounds': 'tabler:writing',
  '/spells': 'tabler:sparkles',
  '/weapons': 'tabler:axe',
  '/armors': 'tabler:shield',
  '/items': 'tabler:backpack',
  '/items/magic': 'tabler:wand',
  '/bestiary': 'tabler:paw',
  '/screens': 'tabler:book-2',
};

export const HOME_SECTION_DEFAULT_ICON = 'tabler:book-2';

/**
 * Спрайт фактур разделов: кадры 220×56 стоят друг под другом в том же порядке,
 * что и разделы на главной (`indexOrder`).
 */
export const HOME_SECTION_TEXTURE = {
  url: '/img/bg_main_page_button_nav.webp',
  frames: 12,
} as const;

/* --- Промо-карточки ----------------------------------------------------- */

/**
 * Ссылка на сайт новой редакции — стоит рядом с плитой разделов. Адреса здесь
 * нет: он берётся из `runtimeConfig.public.newSiteUrl`, чтобы dev вёл на dev,
 * а прод — на прод.
 */
export const HOME_EDITION_CARD: Omit<HomePromoCardContent, 'to'> = {
  eyebrow: 'Новинка',
  title: 'Редакция D&D 2024',
  linkLabel: 'Перейти',
  image: '/img/banner_2024.webp',
  external: true,
};

export const HOME_VTTG_CARD: HomePromoCardContent = {
  eyebrow: 'Виртуальный стол для D&D 5e',
  title: 'Virtual TTG',
  description: 'Интерактивные карты, 3D-кубики и интеграция с ttg.club.',
  linkLabel: 'Подробнее',
  image: '/img/vttg-banner.webp',
  to: 'https://new.ttg.club/vttg',
  external: true,
};

/* --- Новости ------------------------------------------------------------ */

/** Новый сайт: там публикуются новости и живёт каталог игр */
export const HOME_NEW_SITE_URL = 'https://new.ttg.club';

export const HOME_NEWS_LABEL = 'Новости';

export const HOME_NEWS_ICON = 'tabler:news';

export const HOME_NEWS_DATA_KEY = 'home-news';

/** Обложка свежей новости и ряд из четырёх плиток под ней */
export const HOME_NEWS_COUNT = 5;

/** Плиток под обложкой: все новости, кроме самой свежей */
export const HOME_NEWS_TILE_COUNT = HOME_NEWS_COUNT - 1;

export const HOME_NEWS_ALL_LABEL = 'Все новости';

export const HOME_NEWS_EMPTY_TEXT = 'Новостей пока нет';

export const HOME_COMMUNITY_NEWS_LABEL = 'Новости сообщества';

export const HOME_COMMUNITY_NEWS_ICON = 'tabler:users-group';

export const HOME_COMMUNITY_NEWS_DATA_KEY = 'home-community-news';

/** Столбик из четырёх строк */
export const HOME_COMMUNITY_NEWS_COUNT = 4;

export const HOME_COMMUNITY_NEWS_ALL_LABEL = 'Все новости сообщества';

export const HOME_COMMUNITY_NEWS_EMPTY_TEXT = 'Новостей сообщества пока нет';

/* --- Новая игра --------------------------------------------------------- */

export const HOME_LATEST_GAME_LABEL = 'Новая игра';

export const HOME_LATEST_GAME_ICON = 'tabler:users';

export const HOME_LATEST_GAME_DATA_KEY = 'home-latest-game';

export const HOME_LATEST_GAME_SITE_URL = HOME_NEW_SITE_URL;

export const HOME_LATEST_GAME_CATALOG_URL = `${HOME_LATEST_GAME_SITE_URL}/games`;

/** Публичный каталог сервиса игр */
export const HOME_LATEST_GAME_API_URL =
  'https://nexus.api.ttg.club/api/v1/games';

/** Справочник игровых систем сервиса игр */
export const HOME_LATEST_GAME_SYSTEMS_API_URL =
  'https://nexus.api.ttg.club/api/v1/game-systems';

/**
 * Имена мастеров отдаёт core-api: сервис игр знает только идентификатор.
 * Ходим к нему напрямую — прокси new.ttg.club не пускает запросы с чужих
 * сайтов, а core-api разрешает любой источник.
 */
export const HOME_LATEST_GAME_NAMES_API_URL =
  'https://api.ttg.club/api/user/display-names/by-ids';

/** Сколько свежих объявлений смотреть: поднятые игры стоят выше новых */
export const HOME_LATEST_GAME_LOOKUP_SIZE = 20;

export const HOME_LATEST_GAME_EMPTY_TEXT = 'Игр в каталоге пока нет';

export const HOME_LATEST_GAME_ERROR_TEXT = 'Не удалось загрузить игры';

export const HOME_LATEST_GAME_LOADING_LABEL = 'Загрузка игры';

export const HOME_LATEST_GAME_ALL_LABEL = 'Все игры';

export const HOME_LATEST_GAME_TYPE_LABELS = {
  ONLINE: 'Онлайн',
  TEXT: 'Текстовая',
  OFFLINE: 'Вживую',
} as const;

/** Значок формата игры в строке поверх обложки */
export const HOME_LATEST_GAME_TYPE_ICONS = {
  ONLINE: 'tabler:device-desktop',
  TEXT: 'tabler:message-2',
  OFFLINE: 'tabler:users',
} as const;

export const HOME_LATEST_GAME_DURATION_LABELS = {
  ONE_SHOT: 'Ваншот',
  CAMPAIGN: 'Кампания',
} as const;

export const HOME_LATEST_GAME_COST_LABELS = {
  FREE: 'Бесплатно',
  PAID: 'Платно',
} as const;

export const HOME_LATEST_GAME_MASTER_LABEL = 'Мастер';

/** Имя мастера не пришло — сырой идентификатор посетителю ничего не скажет */
export const HOME_LATEST_GAME_UNKNOWN_MASTER = 'Без имени';

export const HOME_LATEST_GAME_NEXT_SESSION_LABEL = 'Ближайшая встреча';

export const HOME_LATEST_GAME_NEXT_SESSION_ICON = 'tabler:calendar-event';

/** Своей даты у игры нет — время назначается встречам */
export const HOME_LATEST_GAME_NEXT_SESSION_EMPTY = 'Дата не назначена';

/** Дата встречи без года: он почти всегда текущий, а строка в карточке тесная */
export const HOME_LATEST_GAME_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

export const HOME_LATEST_GAME_DATE_LOCALE = 'ru-RU';

export const HOME_LATEST_GAME_SEATS_LABEL = 'Места';

export const HOME_LATEST_GAME_SEATS_ICON = 'tabler:user';

export const HOME_LATEST_GAME_GENRES_SEPARATOR = ', ';

/* --- Соцсети ------------------------------------------------------------ */

export const HOME_SOCIAL_LABEL = 'Мы в сети';

export const HOME_SOCIAL_ICON = 'tabler:brand-hipchat';

export const HOME_SOCIAL_LINKS: Array<HomeSocialLink> = [
  {
    name: 'Telegram',
    url: 'https://t.me/ttgclubnews',
    icon: 'ttg:telegram',
    color: 'var(--telegram-base)',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'ttg:discord',
    color: 'var(--discord-base)',
  },
  {
    name: 'ВКонтакте',
    url: 'https://vk.com/ttg.club',
    icon: 'ttg:vk',
    color: 'var(--vk-base)',
  },
  {
    name: 'Boosty',
    url: 'https://boosty.to/dnd5club',
    icon: 'ttg:boosty',
    color: 'var(--boosty-base)',
  },
];

/* --- Друзья ------------------------------------------------------------- */

export const HOME_PARTNERS_LABEL = 'Наши друзья';

export const HOME_PARTNERS_ICON = 'tabler:heart-handshake';

export const HOME_PARTNERS_DATA_KEY = 'home-partners';

export const HOME_PARTNERS_PATH = '/api/v1/partners';

/* --- Обсуждения --------------------------------------------------------- */

export const HOME_COMMENTS_LABEL = 'Обсуждения';

export const HOME_COMMENTS_ICON = 'tabler:message-circle';

export const HOME_COMMENTS_DATA_KEY = 'home-comments';

/** Сколько последних комментариев показывает блок */
export const HOME_COMMENTS_COUNT = 10;

export const HOME_COMMENTS_EMPTY_TEXT = 'Комментариев пока нет';
