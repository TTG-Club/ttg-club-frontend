import type { HomePromoCardContent, HomeSocialLink } from './types';

import { DM_SCREEN_PAGE_PATH, NEW_SITE_URL } from '~/shared/consts';
import {
  DM_SCREEN_MENU_ICON,
  TOKENATOR_URL,
} from '~infrastructure/sidebar/menu/model';

/* --- Общее -------------------------------------------------------------- */

/** Стрелка ссылок главной: плитки разделов, «Подробнее», «Перейти» */
export const HOME_LINK_ARROW_ICON = 'tabler:arrow-right';

/** Подпись места, оставленного под будущий блок */
export const HOME_RESERVED_LABEL = 'Зарезервировано';

export const HOME_RESERVED_ICON = 'tabler:lock';

/** Сколько строк ленты нарисовано в очертаниях запасного места */
export const HOME_RESERVED_ROW_COUNT = 3;

/* --- Счётчики шапки ----------------------------------------------------- */

/** Число материалов этого сайта: одно число в ответе бэкенда */
export const HOME_COUNTERS_MATERIALS_PATH = '/api/v1/statistics/count-all';

export const HOME_COUNTERS_MATERIALS_DATA_KEY = 'home-materials-count';

export const HOME_COUNTERS_MATERIALS_LABEL = 'Материалов';

export const HOME_COUNTERS_MATERIALS_ICON = 'tabler:books';

export const HOME_COUNTERS_FIXED_LABEL = 'Багов исправлено';

export const HOME_COUNTERS_FIXED_ICON = 'tabler:bug';

/** Разряды числа в счётчике разделяются по-русски: «3 389» */
export const HOME_COUNTERS_NUMBER_LOCALE = 'ru-RU';

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
  [DM_SCREEN_PAGE_PATH]: DM_SCREEN_MENU_ICON,
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
export const HOME_NEW_SITE_URL = NEW_SITE_URL;

export const HOME_NEWS_LABEL = 'Новости';

export const HOME_NEWS_ICON = 'tabler:news';

export const HOME_NEWS_DATA_KEY = 'home-news';

/** Сколько свежих новостей листается в блоке */
export const HOME_NEWS_COUNT = 5;

/** Сколько секунд новость стоит на месте до смены следующей */
export const HOME_NEWS_ROTATE_SECONDS = 8;

export const HOME_NEWS_ROTATION_TEXT = {
  switcher: 'Переключатель новостей',
  pause: 'Остановить смену новостей',
  play: 'Запустить смену новостей',
  previous: 'Предыдущая новость',
  next: 'Следующая новость',
  item: 'Новость',
} as const;

export const HOME_NEWS_ROTATION_ICON = {
  pause: 'tabler:player-pause-filled',
  play: 'tabler:player-play-filled',
  previous: 'tabler:chevron-left',
  next: 'tabler:chevron-right',
} as const;

export const HOME_NEWS_ALL_LABEL = 'Все новости';

export const HOME_NEWS_EMPTY_TEXT = 'Новостей пока нет';

export const HOME_COMMUNITY_NEWS_LABEL = 'Новости сообщества';

export const HOME_COMMUNITY_NEWS_ICON = 'tabler:users-group';

export const HOME_COMMUNITY_NEWS_DATA_KEY = 'home-community-news';

/** Сколько свежих новостей сообщества листается в блоке */
export const HOME_COMMUNITY_NEWS_COUNT = 4;

/** Коротко: в узкой панели подпись делит строку с переключателем */
export const HOME_COMMUNITY_NEWS_ALL_LABEL = 'Все новости';

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

/**
 * Сколько секунд бегущая строка тратит на одного друга: скорость не
 * зависит от того, сколько их в списке
 */
export const HOME_PARTNERS_MARQUEE_SECONDS_PER_ITEM = 5;

/* --- Охотники за багами ------------------------------------------------- */

export const HOME_BUG_HUNTERS_LABEL = 'Охотники за багами';

export const HOME_BUG_HUNTERS_ICON = 'tabler:bug';

export const HOME_BUG_HUNTERS_DATA_KEY = 'home-bug-hunters';

export const HOME_BUG_HUNTERS_TROPHY_ICON = 'tabler:trophy-filled';

export const HOME_BUG_HUNTERS_HELP_ICON = 'tabler:help-circle-filled';

/** Подсказка к рейтингу охотников */
export const HOME_BUG_HUNTERS_TOOLTIP =
  'В зачёт идут только те баги, которые мы отметили как исправленные, а не просто все ваши отправленные баги';

/** Периоды рейтинга в порядке показа; первый открыт по умолчанию */
export const HOME_BUG_HUNTERS_PERIODS = [
  { value: 'month', label: 'За текущий месяц' },
  { value: 'all', label: 'За всё время' },
] as const;

export const HOME_BUG_HUNTERS_PERIOD_DEFAULT =
  HOME_BUG_HUNTERS_PERIODS[0].value;

/** Заглушка, когда за текущий месяц ещё нет исправленных багов */
export const HOME_BUG_HUNTERS_EMPTY_MONTH_TEXT =
  'Пока никто не исправил багов в этом месяце';

/** Заглушка, когда рейтинг пуст за оба периода */
export const HOME_BUG_HUNTERS_EMPTY_TEXT =
  'Пока никто не исправил ни одного бага';

export const HOME_BUG_HUNTERS_ERROR_TEXT = 'Не удалось загрузить рейтинг';

/**
 * Размер рейтинга: приходит десятка, недостающие до неё места дорисовываются
 * строками-заглушками (в начале месяца охотников меньше)
 */
export const HOME_BUG_HUNTERS_TOP_SIZE = 10;

/** Сколько первых мест выделены цветом */
export const HOME_BUG_HUNTERS_PODIUM_SIZE = 3;

/**
 * Подписи свободных мест рейтинга. Раздаются по порядку среди пустых строк,
 * по кругу, если пустых больше, чем фраз
 */
export const HOME_BUG_HUNTERS_EMPTY_SLOT_TEXTS: ReadonlyArray<string> = [
  'Ждёт своего героя',
  'Здесь водятся драконы',
  'Проверка Восприятия провалена',
  'Ячейка заклинания свободна',
  'Кости ещё не брошены',
  'Квест пока никто не взял',
  'Ловушка не обезврежена',
  'Логово ещё не зачищено',
  'Стул у очага пустует',
  'Сокровище ждёт искателя',
];

/** Шаг задержки появления строк рейтинга, мс */
export const HOME_BUG_HUNTERS_ROW_STAGGER_MS = 80;

/** Задержка роста полосок: после того как строки начали появляться, мс */
export const HOME_BUG_HUNTERS_BAR_DELAY_MS = 300;

/* --- Обсуждения --------------------------------------------------------- */

export const HOME_COMMENTS_LABEL = 'Обсуждения';

export const HOME_COMMENTS_ICON = 'tabler:message-circle';

export const HOME_COMMENTS_DATA_KEY = 'home-comments';

/** Сколько последних комментариев показывает блок */
export const HOME_COMMENTS_COUNT = 10;

export const HOME_COMMENTS_EMPTY_TEXT = 'Комментариев пока нет';
