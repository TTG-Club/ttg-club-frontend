import type { HomeMapPlacement, HomeMapPoint, HomeMapSize } from './types';

/** Первая строка заголовка главной — светлая, несёт суть сайта */
export const HOME_HERO_TITLE = 'Справочник и инструменты D&D 2014';

/**
 * Вторая строка заголовка — приглушённая, про происхождение проекта.
 * Неразрывный пробел держит тире на строке с предыдущим словом: при переносе
 * строка не начнётся с тире.
 */
export const HOME_HERO_SUBTITLE = 'Создан сообществом — для сообщества';

/* --- Живой фон карты ---------------------------------------------------- */

/**
 * Когда на карте шапки едет повозка и дымят трубы: устройство с мышью и без
 * системной просьбы «меньше движения». На телефонах и планшетах живого фона
 * нет — там он греет слабую графику и садит батарею.
 */
export const HOME_HERO_MOTION_QUERY =
  '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

/**
 * Ключ localStorage: посетитель выключил повозку и дым кнопкой в углу шапки.
 * По умолчанию живой фон включён. Ключ тот же, что в старом SPA, поэтому выбор
 * посетителя переезжает вместе с ним.
 */
export const HOME_HERO_MOTION_STORAGE_KEY = 'home:hero-motion';

export const HOME_HERO_MOTION_PLAY_ICON = 'tabler:player-play-filled';

export const HOME_HERO_MOTION_PAUSE_ICON = 'tabler:player-pause-filled';

export const HOME_HERO_MOTION_PLAY_LABEL = 'Запустить анимацию фона';

export const HOME_HERO_MOTION_PAUSE_LABEL = 'Остановить анимацию фона';

/** Холст карты — `viewBox` рисунка, из которого собраны `public/img/<тема>/hero-map.webp` */
export const HOME_HERO_MAP_VIEWBOX: HomeMapPoint & HomeMapSize = {
  x: 0,
  y: -100,
  width: 3200,
  height: 1100,
};

/** Дорога повозки: идёт между колеями, начало и конец скрыты за холстом */
export const HOME_HERO_WAGON_ROUTE =
  'M-130 504C120 495 350 470 550 475S800 494 930 487S1160 466 1300 471S1510 487 1630 484S1900 459 2010 462S2200 473 2330 470S2530 467 2660 469S2920 499 3080 494S3260 490 3330 486';

/**
 * Шаг ключевых кадров вдоль дороги, единицы карты. Между кадрами фигура идёт
 * по прямой, а на таком шаге хорда от кривой дороги не отходит и на пиксель.
 */
export const HOME_HERO_ROUTE_SAMPLE_STEP = 20;

/** Один проезд повозки по дороге, мс */
export const HOME_HERO_WAGON_LAP = 65_000;

/** Лошадь опережает телегу на длину упряжи, единицы карты */
export const HOME_HERO_HORSE_LEAD = 74;

/** Телега: слой с запасом под оглобли и обводку */
export const HOME_HERO_WAGON_SIZE: HomeMapSize = { width: 132, height: 52 };

export const HOME_HERO_HORSE_SIZE: HomeMapSize = { width: 72, height: 24 };

/** Где телега стоит, пока анимация выключена, — там же, где на исходной карте */
export const HOME_HERO_WAGON_PARKING: HomeMapPlacement = {
  x: 1150,
  y: 486,
  angle: -4,
};

export const HOME_HERO_HORSE_PARKING: HomeMapPlacement = {
  x: 1223.82,
  y: 480.84,
  angle: -4,
};

/** Устья труб в координатах карты: ветер не зависит от поворота крыши */
export const HOME_HERO_CHIMNEYS: Array<HomeMapPoint> = [
  { x: 349.36, y: 249.57 },
  { x: 2781.95, y: 329.98 },
  { x: 2688, y: 732 },
];

/** Клуб дыма: слой с запасом под сдвиг формы от устья трубы */
export const HOME_HERO_SMOKE_PUFF_SIZE: HomeMapSize = { width: 40, height: 40 };

/** Клубов на трубу: они идут друг за другом со сдвигом в треть цикла */
export const HOME_HERO_SMOKE_PUFFS_PER_CHIMNEY = 3;

/* --- Строка поиска ------------------------------------------------------ */

export const HOME_SEARCH_ICON = 'tabler:search';

/**
 * Страница поиска. Её ещё отдаёт старое SPA, поэтому переход на неё — полная
 * загрузка страницы.
 */
export const HOME_SEARCH_PATH = '/search';

/**
 * Подсказка в строке поиска целиком — уходит в `aria-label` ссылки. Видимая
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

/** Ширина экрана, с которой в подсказке крутятся все разделы */
export const HOME_SEARCH_HINT_WIDE_QUERY = '(min-width: 576px)';

/** Сколько набранный раздел держится на экране до стирания, мс */
export const HOME_SEARCH_HINT_HOLD = 2200;

/** Шаг стирания одной буквы, мс — назад машинка идёт быстрее, чем печатает */
export const HOME_SEARCH_HINT_ERASE_STEP = 38;

/** Пауза с пустой строкой между стиранием и набором, мс */
export const HOME_SEARCH_HINT_SWITCH_PAUSE = 280;

/** Шаг набора одной буквы, мс */
export const HOME_SEARCH_HINT_TYPE_STEP = 72;

/** Горячая клавиша открытия поиска на подсказке в строке */
export const HOME_SEARCH_SHORTCUT = '\\';

/** Все горячие клавиши поиска, как в старом SPA */
export const HOME_SEARCH_SHORTCUT_KEYS = ['/', '\\', 'Find'];

/** Поля ввода: в них горячие клавиши поиска печатаются как обычно */
export const HOME_SEARCH_TYPING_TAGS = ['INPUT', 'TEXTAREA'];

/* --- Инструменты -------------------------------------------------------- */

/** Подпись ленты инструментов (используется как aria-label навигации) */
export const HOME_TOOLS_LABEL = 'Инструменты';
