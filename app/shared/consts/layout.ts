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

/** Пункт меню ширины раздела. */
export interface LayoutWidthOption {
  label: string;
  icon: string;
}

export const LAYOUT_WIDTH_OPTIONS: Readonly<
  Record<LayoutWidth, LayoutWidthOption>
> = {
  default: { label: 'Обычная', icon: 'tabler:layout-sidebar-right-expand' },
  wide: { label: 'Широкая', icon: 'tabler:columns-2' },
};
