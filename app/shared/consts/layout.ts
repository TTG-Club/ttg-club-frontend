/** Ширина раздела: обычная — карточка в дровере, широкая — рядом со списком. */
export const LAYOUT_WIDTHS = ['default', 'wide'] as const;

export type LayoutWidth = (typeof LAYOUT_WIDTHS)[number];

/** Cookie с выбранной шириной: её читает сервер, чтобы не было скачка. */
export const LAYOUT_WIDTH_COOKIE = 'ttg_layout_width';

/** Срок хранения выбранной ширины. */
export const LAYOUT_WIDTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Новым посетителям, как на new.ttg.club, сразу широкий режим. */
export const LAYOUT_WIDTH_DEFAULT: LayoutWidth = 'wide';

/** С этой ширины экрана список и карточка помещаются рядом. */
export const LAYOUT_SPLIT_QUERY = '(min-width: 1024px)';

/** Уже этой ширины карточка открывается своей страницей, а не дровером. */
export const LAYOUT_DRAWER_QUERY = '(min-width: 768px)';

/** Сторона колонки в широком режиме. */
export type SectionColumnSide = 'left' | 'right';

/** Срок хранения настроек раскладки разделов. */
export const SECTION_LAYOUT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Cookie: фильтры строкой над списком, а не колонкой. Пока выбора нет —
 * над списком, как было на этом сайте до настройки раскладки.
 */
export const SECTION_FILTERS_COLLAPSED_COOKIE = 'ttg_section_filters_collapsed';

/** Cookie: с какой стороны колонка фильтров. */
export const SECTION_FILTERS_SIDE_COOKIE = 'ttg_section_filters_side';

/** Cookie: с какой стороны от списка запись. */
export const SECTION_DETAIL_SIDE_COOKIE = 'ttg_section_detail_side';

/** Cookie: узкая раскладка — колонка по центру, список и запись рядом. */
export const SECTION_CENTERED_COOKIE = 'ttg_section_centered';

/**
 * Cookie с ширинами колонок широкого режима, в процентах: по ширине на
 * раскладку списка и на колонку фильтров.
 */
export const SECTION_SPLIT_SIZES_COOKIE = 'ttg_section_split_sizes';

/** Раскладка обычного списка. */
export const SECTION_SPLIT_ID = 'list';

/**
 * Раскладка раздела с широкой записью (класс): своя ширина, чтобы не сбивать
 * её остальным разделам.
 */
export const SECTION_WIDE_DETAIL_SPLIT_ID = 'wide-detail';

/** Под этим ключом запоминается ширина колонки фильтров. */
export const SECTION_FILTERS_SPLIT_ID = 'filters';

/** Приставка, под которой узкая раскладка запоминает свою ширину списка. */
export const SECTION_CENTERED_SPLIT_SUFFIX = 'centered';

/** Границы ширины колонки, в процентах. */
export interface SectionSplitBounds {
  default: number;
  min: number;
  max: number;
}

/** Ширина списка в широком режиме. */
export const SECTION_LIST_SIZE: SectionSplitBounds = {
  default: 50,
  min: 30,
  max: 70,
};

/**
 * Ширина списка у раздела с широкой записью: запись сразу встаёт в две
 * колонки — обложка и хиты слева, текст справа.
 */
export const SECTION_WIDE_DETAIL_LIST_SIZE: SectionSplitBounds = {
  default: 35,
  min: 25,
  max: 70,
};

/**
 * Ширина списка в узкой раскладке, как в старом SPA: список — треть
 * колонки, запись — остальное.
 */
export const SECTION_CENTERED_LIST_SIZE: SectionSplitBounds = {
  default: 36,
  min: 25,
  max: 60,
};

/** Ширина колонки фильтров, в процентах окна: около 300 px на экране 1440 px. */
export const SECTION_FILTERS_SIZE: SectionSplitBounds = {
  default: 21,
  min: 15,
  max: 35,
};

/** Разница ширин в процентах, меньше которой разделитель не считается сдвинутым. */
export const SECTION_SPLIT_SIZE_EPSILON = 0.1;

/** Линия между колонками: светлеет при наведении, при перетаскивании — цвет акцента. */
export const SECTION_SPLIT_HANDLE_CLASS =
  'w-px border-l border-default transition-colors data-[state=drag]:border-primary data-[state=hover]:border-accented';

/** Линия узкой раскладки: у записи своя рамка, поэтому линия видна только при наведении и перетаскивании. */
export const SECTION_SPLIT_HANDLE_SUBTLE_CLASS =
  'w-px border-l border-transparent transition-colors data-[state=drag]:border-primary data-[state=hover]:border-accented';
