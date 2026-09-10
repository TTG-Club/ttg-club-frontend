import type { IOrderItem } from '@/shared/types/BaseApiFields';

import type { HomePromoCardContent, HomeSocialLink } from './types';

/* --- Общее ------------------------------------------------------------- */

/** Стрелка ссылок главной: плитки разделов, «Подробнее», «Перейти» */
export const HOME_LINK_ARROW_ICON = 'arrow/line/right';

/* --- Шапка ------------------------------------------------------------- */

/** Первая строка заголовка главной — светлая, несёт суть сайта */
export const HOME_HERO_TITLE = 'Справочник и инструменты D&D 2014';

/**
 * Вторая строка заголовка — приглушённая, про происхождение проекта.
 * Неразрывный пробел держит тире на строке с предыдущим словом: при переносе
 * строка не начнётся с тире.
 */
export const HOME_HERO_SUBTITLE = 'Создан сообществом\u00A0— для сообщества';

/* --- Строка поиска ----------------------------------------------------- */

export const HOME_SEARCH_ICON = 'search';

/**
 * Подсказка в строке поиска целиком — уходит в `aria-label` кнопки. Видимая
 * строка собирается по частям и меняется, поэтому скринридерам нужна отдельная
 * неподвижная формулировка.
 */
export const HOME_SEARCH_PLACEHOLDER =
  'Поиск по заклинаниям, существам, предметам и правилам';

/** Неизменное начало видимой подсказки — дальше подставляется раздел */
export const HOME_SEARCH_HINT_PREFIX = 'Поиск по';

/** Разделы, которые по кругу подставляются после «Поиск по» */
export const HOME_SEARCH_HINT_WORDS: Array<string> = [
  'заклинаниям',
  'существам',
  'магическим предметам',
  'классам',
  'снаряжению',
  'расам',
  'предысториям',
  'чертам',
  'оружию',
  'доспехам',
  'правилам',
  'богам',
];

/** Сколько букв раздела влезает в строку поиска на самом узком телефоне */
const HINT_WORD_MOBILE_LIMIT = 13;

/**
 * Разделы для телефона: строка поиска там вдвое уже, и длинные названия
 * упираются в край поля. Список выводится из общего, чтобы новый раздел не
 * пришлось добавлять дважды.
 */
export const HOME_SEARCH_HINT_WORDS_COMPACT: Array<string> =
  HOME_SEARCH_HINT_WORDS.filter(
    (word) => word.length <= HINT_WORD_MOBILE_LIMIT,
  );

/** Сколько набранный раздел держится на экране до стирания, мс */
export const HOME_SEARCH_HINT_HOLD = 2200;

/** Шаг стирания одной буквы, мс — назад машинка идёт быстрее, чем печатает */
export const HOME_SEARCH_HINT_ERASE_STEP = 38;

/** Пауза с пустой строкой между стиранием и набором, мс */
export const HOME_SEARCH_HINT_SWITCH_PAUSE = 280;

/** Шаг набора одной буквы, мс */
export const HOME_SEARCH_HINT_TYPE_STEP = 72;

/** Горячая клавиша открытия поиска (см. `onKeyStroke` в NavSearch) */
export const HOME_SEARCH_SHORTCUT = '\\';

/* --- Инструменты ------------------------------------------------------- */

/** Подпись ленты инструментов (используется как aria-label навигации) */
export const HOME_TOOLS_LABEL = 'Инструменты';

/** Инструментами считаются пункты меню с адресом внутри этого раздела */
export const HOME_TOOLS_PATH_PREFIX = '/tools';

/** Иконки инструментов по адресу; неизвестный инструмент получит общую */
export const HOME_TOOL_ICONS: Partial<Record<string, string>> = {
  '/tools/ability-calc': 'home/calculator',
  '/tools/trader': 'home/coins',
  '/tools/encounters': 'home/dice-5',
  '/tools/treasury': 'home/diamond',
  '/tools/wildmagic': 'home/bolt',
  '/tools/madness': 'home/brain',
  '/tools/tokenator': 'home/photo-circle',
  '/tools/names': 'home/signature',
  '/tools/tavern': 'home/beer',
  '/tools/initiative': 'home/swords',
};

export const HOME_TOOL_DEFAULT_ICON = 'home/tool';

/* --- Разделы ----------------------------------------------------------- */

/**
 * Иконки разделов по адресу. Раздел в плите опознают иконка и подпись, а
 * картинка обесцвечена и работает фактурой — иначе двенадцать картинок спорят
 * друг с другом.
 */
export const HOME_SECTION_ICONS: Partial<Record<string, string>> = {
  '/classes': 'home/sword',
  '/races': 'home/users',
  '/feats': 'home/star',
  '/options': 'home/puzzle',
  '/backgrounds': 'home/writing',
  '/spells': 'home/sparkles',
  '/weapons': 'home/axe',
  '/armors': 'home/shield',
  '/items': 'home/backpack',
  '/items/magic': 'home/wand',
  '/bestiary': 'home/paw',
  '/screens': 'home/book-2',
};

export const HOME_SECTION_DEFAULT_ICON = 'home/book-2';

/**
 * Спрайт фактур разделов: кадры 220×56 стоят друг под другом в том же порядке,
 * что и разделы на главной (`indexOrder`).
 */
export const HOME_SECTION_TEXTURE = {
  url: '/img/bg_main_page_button_nav.webp',
  frames: 12,
} as const;

/* --- Промо-карточки ---------------------------------------------------- */

/** Ссылка на сайт новой редакции — стоит рядом с плитой разделов */
export const HOME_EDITION_CARD: HomePromoCardContent = {
  eyebrow: 'Новинка',
  title: 'Редакция D&D 2024',
  linkLabel: 'Перейти',
  image: '/img/banner-2024.webp',
  to: '//new.ttg.club',
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

export const HOME_TOKENATOR_CARD: HomePromoCardContent = {
  eyebrow: 'Всегда под рукой!',
  title: 'Токенатор',
  image: '/img/bg_token_library.webp?v=1',
  to: '/tools/tokenator',
};

export const HOME_DISCORD_BOT_CARD: HomePromoCardContent = {
  eyebrow: 'Весь сайт у вас на сервере!',
  title: 'Discord Bot',
  image: '/img/bg_discord_bot.webp?v=2',
  to: '/info/discord_bot',
};

/* --- Видео ------------------------------------------------------------- */

export const HOME_VIDEOS_LABEL = 'Видео';

export const HOME_VIDEOS_ICON = 'home/brand-youtube';

/** Свежие ролики сверху; при одной дате — по названию */
const HOME_VIDEOS_ORDER: Array<IOrderItem> = [
  {
    field: 'created',
    direction: 'desc',
  },
  {
    field: 'name',
    direction: 'asc',
  },
];

/**
 * Запрос роликов для главной: первая страница из пяти активных — первый
 * ролик уходит в плеер, остальные списком под ним.
 */
export const HOME_VIDEOS_QUERY = {
  page: 0,
  size: 5,
  activeStatus: true,
  order: HOME_VIDEOS_ORDER,
};

/** Короткая ссылка на ролик — для ctrl+click и средней кнопки мыши */
export const HOME_VIDEO_SHORT_URL = '//youtu.be/';

/* --- Соцсети ----------------------------------------------------------- */

export const HOME_SOCIAL_LABEL = 'Мы в сети';

export const HOME_SOCIAL_ICON = 'home/brand-hipchat';

export const HOME_SOCIAL_LINKS: Array<HomeSocialLink> = [
  {
    name: 'Telegram',
    url: 'https://t.me/ttgclubnews',
    icon: 'telegram',
    brand: 'telegram',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'discord',
    brand: 'discord',
  },
  {
    name: 'ВКонтакте',
    url: 'https://vk.com/ttg.club',
    icon: 'vk',
    brand: 'vk',
  },
  {
    name: 'Boosty',
    url: 'https://boosty.to/dnd5club',
    icon: 'boosty',
    brand: 'boosty',
  },
];

/* --- Друзья ------------------------------------------------------------ */

export const HOME_PARTNERS_LABEL = 'Наши друзья';

export const HOME_PARTNERS_ICON = 'home/heart-handshake';

export const HOME_PARTNERS_API_URL = '/partners';
