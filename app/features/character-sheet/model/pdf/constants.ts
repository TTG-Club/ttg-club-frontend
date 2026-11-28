import type { SheetPdfVariant } from './types';

import { rgb } from 'pdf-lib';

/** Ширина страницы A4 в пунктах PDF. */
export const PDF_PAGE_WIDTH = 595.28;

/** Высота страницы A4 в пунктах PDF. */
export const PDF_PAGE_HEIGHT = 841.89;

/** Поля страницы. */
export const PDF_PAGE_MARGIN = 22;

/** Ширина области содержимого. */
export const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2;

/** Высота колонтитула с номером страницы. */
export const PDF_FOOTER_HEIGHT = 16;

/**
 * Нижняя граница содержимого, считая от верха страницы: ниже начинается
 * колонтитул.
 */
export const PDF_CONTENT_BOTTOM =
  PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN - PDF_FOOTER_HEIGHT;

/** Зазор между колонками и панелями. */
export const PDF_GAP = 7;

/** Внутренние отступы панели. */
export const PDF_PANEL_PADDING = 5;

/** Высота полосы заголовка панели. */
export const PDF_PANEL_TITLE_HEIGHT = 12;

/** Ширины колонок первой страницы. */
export const PDF_MAIN_COLUMN_WIDTHS = {
  left: 190,
  center: 176,
  right: PDF_CONTENT_WIDTH - 190 - 176 - PDF_GAP * 2,
};

/** Ширина бокса характеристики в левой колонке. */
export const PDF_ABILITY_BOX_WIDTH = 52;

/** Минимальная высота бокса характеристики. */
export const PDF_ABILITY_BOX_HEIGHT = 50;

/** Высота строки списка (навык, владение, предмет). */
export const PDF_ROW_HEIGHT = 12;

/** Высота строки плотного списка (описания, таблицы). */
export const PDF_DENSE_ROW_HEIGHT = 10;

/** Радиус кружка владения и ячейки заклинаний. */
export const PDF_MARK_RADIUS = 3.2;

/** Толщина линий рамок. */
export const PDF_LINE_WIDTH = 0.7;

/** Толщина тонких разделителей. */
export const PDF_THIN_LINE_WIDTH = 0.4;

/** Размеры шрифтов. */
export const PDF_FONT_SIZES = {
  /** Имя персонажа. */
  title: 19,

  /** Строка «раса · класс · предыстория». */
  subtitle: 9,

  /** Заголовок панели. */
  panelTitle: 7,

  /** Подпись внутри бокса. */
  label: 6,

  /** Значение в строке списка. */
  value: 8,

  /** Крупное значение (характеристика, класс доспеха). */
  bigValue: 17,

  /** Модификатор под крупным значением. */
  mediumValue: 10,

  /** Текст описаний. */
  body: 8,

  /** Мелкая приписка. */
  small: 6,

  /** Колонтитул. */
  footer: 6.5,
};

/**
 * Доля ширины под значение в строке «подпись — значение». Значения на листе
 * короткие («+9», «60 фт», «1/2»), поэтому подписи отдана большая часть строки.
 */
export const PDF_VALUE_WIDTH_RATIO = 0.34;

/** Межстрочный коэффициент текста описаний. */
export const PDF_LINE_HEIGHT_RATIO = 1.28;

/** Цвета документа. */
export const PDF_COLORS = {
  /** Основной текст. */
  ink: rgb(0.09, 0.09, 0.11),

  /** Второстепенный текст (подписи). */
  muted: rgb(0.42, 0.42, 0.45),

  /** Рамка панели. */
  panelLine: rgb(0.16, 0.16, 0.2),

  /** Тонкий разделитель внутри панели. */
  innerLine: rgb(0.62, 0.62, 0.65),

  /** Заливка полосы заголовка. */
  titleFill: rgb(0.9, 0.9, 0.92),

  /** Заливка бокса значения. */
  boxFill: rgb(0.96, 0.96, 0.97),

  /** Белый — заливка незакрашенных кружков. */
  blank: rgb(1, 1, 1),
};

/** Начало сообщения о неудачной загрузке файла шрифта. */
export const PDF_FONT_LOAD_ERROR = 'Не удалось загрузить шрифт';

/** Файлы шрифтов документа (лежат в `public/fonts/character-sheet`). */
export const PDF_FONT_URLS = {
  regular: '/fonts/character-sheet/PT_Sans-Web-Regular.ttf',
  bold: '/fonts/character-sheet/PT_Sans-Web-Bold.ttf',
  italic: '/fonts/character-sheet/PT_Sans-Web-Italic.ttf',
  display: '/fonts/character-sheet/PT_Serif-Web-Bold.ttf',
};

/** Разрядка заголовков панелей (доля от размера шрифта). */
export const PDF_TITLE_LETTER_SPACING_RATIO = 0.12;

/** Символ обрезки строки, не влезающей в ширину. */
export const PDF_ELLIPSIS = '…';

/** Маркер элемента списка в описаниях. */
export const PDF_LIST_BULLET = '•';

/** Отступ элемента списка в описаниях. */
export const PDF_LIST_INDENT = 10;

/** Отступ цитаты в описаниях. */
export const PDF_QUOTE_INDENT = 8;

/** Метаданные документа. */
export const PDF_META = {
  creator: 'TTG Club',
  producer: 'TTG Club — 5e14.ttg.club',
  subject: 'Лист персонажа D&D 5e (2014)',
};

/** Подпись сайта в колонтитуле. */
export const PDF_FOOTER_SITE = '5e14.ttg.club';

/** Шаблон номера страницы в колонтитуле. */
export const PDF_FOOTER_PAGE_LABEL = 'Стр.';

/** Количество кружков спасбросков от смерти (успехи и провалы). */
export const PDF_DEATH_SAVE_COUNT = 3;

/** Высота шапки первой страницы и боксов уровня/опыта/вдохновения в ней. */
export const PDF_HEADER_HEIGHT = 40;

/** Ширина бокса в шапке первой страницы. */
export const PDF_HEADER_BOX_WIDTH = 64;

/** Высота плитки боевого показателя. */
export const PDF_TILE_HEIGHT = 42;

/**
 * Доли ширины второго ряда боевых плиток (без зазоров): в равные трети колонки
 * «Бонус мастерства» подписью и размер значением не влезают и обрезались бы,
 * а истощению хватает узкой плитки — там однозначное число.
 */
export const PDF_COMBAT_TILE_RATIOS = {
  proficiencyBonus: 0.375,
  size: 0.365,
  exhaustion: 0.26,
};

/** Высота бокса хитов. */
export const PDF_HEALTH_BOX_HEIGHT = 34;

/** Высота бокса монеты на странице снаряжения. */
export const PDF_COIN_BOX_HEIGHT = 32;

/** Высота бокса приметы на странице личности. */
export const PDF_PERSONALITY_BOX_HEIGHT = 30;

/**
 * Боксов примет в ряду. Четыре, а не все семь: подписи полные, а значения вроде
 * «Хаотично-нейтральный» в бокс шириной с седьмую часть страницы не влезают —
 * их пришлось бы обрезать.
 */
export const PDF_PERSONALITY_COLUMNS = 4;

/** Ширина столбца с кружком подготовки заклинания. */
export const PDF_SPELL_MARK_COLUMN_WIDTH = 14;

/** Ширина подписи уровня в ряду ячеек заклинаний: «1-й уровень» помещается. */
export const PDF_SPELL_SLOT_LEVEL_WIDTH = 64;

/** Отступ кружков ячеек от левого края ряда: подпись уровня и зазор за ней. */
export const PDF_SPELL_SLOT_MARKS_LEFT = 72;

/** Отметка надетого предмета в таблице снаряжения. */
export const PDF_EQUIPPED_MARK = '+';

/**
 * Пометки настройки в названии предмета: в столбце «Надето» им места нет — он
 * отвечает за другое, а на бумаге настройку важно видеть рядом с названием.
 */
export const PDF_ATTUNEMENT_MARKS = {
  attuned: 'настроен',
  required: 'нужна настройка',
};

/**
 * Доли ширины панели под столбцы таблицы оружия: урон с типом требует места
 * больше названия.
 */
export const PDF_WEAPON_COLUMN_RATIOS = {
  name: 0.38,
  attack: 0.16,
  damage: 0.46,
};

/** Доли ширины страницы под столбцы таблицы снаряжения. */
export const PDF_EQUIPMENT_COLUMN_RATIOS = {
  name: 0.48,
  quantity: 0.12,
  weight: 0.13,
  cost: 0.17,
  equipped: 0.1,
};

/**
 * Доли ширины страницы под столбцы таблицы заклинаний. Столбец свойств получает
 * остаток ширины, поэтому своей доли не имеет.
 */
export const PDF_SPELL_COLUMN_RATIOS = {
  name: 0.42,
  school: 0.24,
};

/**
 * Сколько деталей каталога тянуть одновременно при дозагрузке описаний. Книга на
 * пять десятков заклинаний иначе открыла бы столько же соединений разом.
 */
export const PDF_CATALOG_REQUEST_BATCH_SIZE = 6;

/** Минимальное количество строк в таблице оружия (пустые — под запись от руки). */
export const PDF_WEAPON_MIN_ROWS = 4;

/** Минимальное количество строк в таблице снаряжения. */
export const PDF_EQUIPMENT_MIN_ROWS = 6;

/** Заголовки панелей и секций. */
export const PDF_TITLES = {
  abilities: 'Характеристики',
  health: 'Хиты',
  weapons: 'Оружие и атаки',
  classResources: 'Ресурсы',
  spellcasting: 'Заклинательство',
  proficiencies: 'Владения',
  senses: 'Зрение и передвижение',
  features: 'Особенности',
  personality: 'Личность',
  personalityDescription: 'Подробное описание',
  equipment: 'Снаряжение',
  coins: 'Монеты',
  notes: 'Заметки',
  spellSlots: 'Ячейки заклинаний',
  spells: 'Заклинания',
  reference: 'Справочник',
};

/** Подписи полей на первой странице. */
export const PDF_LABELS = {
  level: 'Уровень',
  experience: 'Опыт',
  inspiration: 'Вдохновение',
  armorClass: 'Класс доспеха',
  initiative: 'Инициатива',
  speed: 'Скорость',
  proficiencyBonus: 'Бонус мастерства',
  size: 'Размер',
  exhaustion: 'Истощение',
  savingThrow: 'Спасбросок',
  currentHits: 'Текущие',
  maxHits: 'Максимум',
  temporaryHits: 'Временные',
  hitDice: 'Кости хитов',
  deathSaves: 'Спасброски от смерти',
  deathSuccesses: 'Успехи',
  deathFailures: 'Провалы',
  spellAbility: 'Характеристика',
  spellSaveDc: 'СЛ спасброска',
  spellAttack: 'Бонус атаки',
  armorProficiency: 'Доспехи',
  weaponProficiency: 'Оружие',
  toolProficiency: 'Инструменты',
  languageProficiency: 'Языки',
  carried: 'Несёт',
  capacity: 'Предел',
  passivePerception: 'Пассивная внимательность',
  telepathy: 'Телепатия',
  pactSlots: 'Договор',
};

/** Заголовки столбцов таблицы оружия. */
export const PDF_WEAPON_COLUMNS = {
  name: 'Название',
  attack: 'Атака',
  damage: 'Урон',
};

/** Заголовки столбцов таблицы снаряжения. */
export const PDF_EQUIPMENT_COLUMNS = {
  name: 'Название',
  quantity: 'Количество',
  weight: 'Вес',
  cost: 'Стоимость',
  equipped: 'Надето',
};

/** Заголовки столбцов таблицы заклинаний. */
export const PDF_SPELL_COLUMNS = {
  name: 'Название',
  school: 'Школа',
  notes: 'Свойства',
};

/** Подписи списка заклинаний. */
export const PDF_SPELL_LABELS = {
  concentration: 'Конц.',
  ritual: 'Ритуал',
  /** Подпись круга заклинания: «3 круг». */
  level: (level: number): string => `${level} круг`,
};

/** Пометка продолжения секции на следующей странице. */
export const PDF_CONTINUED_SUFFIX = ' (продолжение)';

/** Отсылка к разделу с полными описаниями. */
export const PDF_REFERENCE_HINT = 'Полные описания — в конце листа';

/** Подпись строки о свёрнутых особенностях: перед ней идёт их количество. */
export const PDF_HIDDEN_FEATURES_LABEL = '… и ещё';

/** Разделитель частей приписки (подзаголовок листа, характеристики записи). */
export const PDF_NOTE_SEPARATOR = ' · ';

/** Заглушка на месте пустого значения. */
export const PDF_EMPTY_VALUE = '—';

/**
 * Геометрия и кегли карточек справочника: записи идут карточками в две колонки,
 * мельче основного листа — справочник читают выборочно, а места он занимает
 * больше всего.
 */
export const PDF_REFERENCE_CARD = {
  /** Зазор между колонками. */
  columnGap: 10,

  /** Внутренний отступ карточки. */
  padding: 6,

  /** Зазор между карточками по вертикали. */
  gap: 6,

  /** Срез углов рамки. */
  chamfer: 4,

  /** Кегль названия. */
  titleSize: 8.5,

  /** Кегль бейджа (источник, круг и школа, тип предмета). */
  badgeSize: 6.3,

  /** Доля ширины, которую бейдж может занять рядом с названием. */
  badgeMaxRatio: 0.45,

  /** Кегль подписи параметра заклинания. */
  statLabelSize: 5.3,

  /** Кегль значения параметра заклинания. */
  statValueSize: 6.8,

  /** Строк значения параметра до обрезки. */
  statMaxLines: 3,

  /** Кегль описания. */
  bodySize: 7,

  /**
   * Меньше этого места в колонке карточку, которая не влезает целиком, не
   * начинаем — переносим в следующую колонку, а не режем на огрызок.
   */
  minSplitHeight: 70,

  /**
   * Карточка не выше этой доли колонки не режется: целиком переносится в
   * следующую колонку. Длинные режутся — иначе за ними оставалась бы пустота.
   */
  keepWholeRatio: 0.35,

  /** Кегль заголовка раздела в колонке. */
  sectionSize: 8,
};

/** Заголовки разделов справочника. */
export const PDF_REFERENCE_SECTIONS = {
  features: 'Особенности',
  spells: 'Заклинания',
  items: 'Предметы',
};

/** Вид листа PDF по умолчанию. */
export const PDF_DEFAULT_VARIANT: SheetPdfVariant = 'ttg';
