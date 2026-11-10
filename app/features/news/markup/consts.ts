// Предупреждение MarkupSectionLink: ссылка без адреса раздела или с незнакомым
// типом рисуется обычным текстом.
export const SECTION_LINK_PLAIN_TEXT_WARNING =
  '[Markup] Section link is rendered as plain text:';

// Наивысшая допустимая глубина вложенности.
export const MAX_DEPTH = 7;

// Максимальный размер строки.
export const MAX_STRING_LENGTH = 65536;

// Первый символ маркера
export const LEADING_CHARACTER = '@';

// Тип блочного маркера-разделителя. Вертикальную отбивку вокруг него задаёт сам
// MarkupSeparator (паддингом), поэтому MarkupRender гасит margin'ы и у него, и у
// соседних блоков — см. GROUP_SPACING_*.
export const SEPARATOR_BLOCK_TYPE = 'separator';

// Обычная отбивка блока описания от следующего.
export const GROUP_SPACING = 'mb-2';

// Отбивка вокруг разделителя: свои margin'ы группа не добавляет.
export const GROUP_SPACING_SEPARATOR = 'mb-0';

// Блок ПЕРЕД разделителем: нижний margin не нужен, зазор даёт сам разделитель.
export const GROUP_SPACING_BEFORE_SEPARATOR = 'mb-0';

// Блок ПОСЛЕ разделителя: верхний margin гасим принудительно — заголовок задаёт
// свой `mt-*` изнутри (MarkupHeading), и без этого зазор снизу линии оказывался
// шире, чем сверху.
export const GROUP_SPACING_AFTER_SEPARATOR = 'mt-0! mb-2';

// Атрибут с id якоря заголовка. Живёт только в дереве для рендера — в
// хранимую разметку не попадает.
export const HEADING_ANCHOR_ATTRIBUTE = 'anchor';

/**
 * Разделы нового сайта, на записи которых ссылаются маркеры `{@spell ...}`,
 * `{@class ...}` и т. п.: тип маркера → первый сегмент пути.
 */
export const SECTION_LINK_PATHS: ReadonlyMap<string, string> = new Map([
  ['class', 'classes'],
  ['species', 'species'],
  ['spell', 'spells'],
  ['feat', 'feats'],
  ['background', 'backgrounds'],
  ['magicItem', 'magic-items'],
  ['item', 'items'],
  ['creature', 'bestiary'],
  ['glossary', 'glossary'],
]);

/** Цвета Nuxt UI, которые можно задать маркеру атрибутом `color`. */
export const MARKUP_COLORS = [
  'error',
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'neutral',
] as const;

/** Варианты оформления Nuxt UI для атрибута `variant`. */
export const MARKUP_VARIANTS = ['solid', 'outline', 'soft', 'subtle'] as const;

/** Размеры Nuxt UI для атрибута `size`. */
export const MARKUP_SIZES = ['sm', 'md', 'lg'] as const;

export const MARKUP_DEFAULT_COLOR = 'neutral';

export const MARKUP_DEFAULT_VARIANT = 'soft';

export const MARKUP_DEFAULT_SIZE = 'md';

/**
 * Оформление цитаты по цвету. Классы выписаны целиком: Tailwind находит
 * классы по тексту исходников, и собранные из кусков строки не попали бы в
 * сборку.
 */
export const MARKUP_QUOTE_CLASSES = {
  error: 'text-error bg-error/10 border-error ring-error',
  primary: 'text-primary bg-primary/10 border-primary ring-primary',
  secondary: 'text-secondary bg-secondary/10 border-secondary ring-secondary',
  success: 'text-success bg-success/10 border-success ring-success',
  info: 'text-info bg-info/10 border-info ring-info',
  warning: 'text-warning bg-warning/10 border-warning ring-warning',
  neutral: 'text-neutral bg-neutral/10 border-neutral ring-neutral',
} as const;

/** Классы выравнивания абзаца и заголовка (`left` — по умолчанию, без класса). */
export const MARKUP_ALIGN_CLASSES: Readonly<Record<string, string>> = {
  center: 'text-center',
  right: 'text-right',
};

/** Уровень заголовка в разметке (1–4) → тег на странице (h3–h6). */
export const MARKUP_HEADING_TAGS = {
  1: 'h3',
  2: 'h4',
  3: 'h5',
  4: 'h6',
} as const;

/** Общие классы заголовков разметки. */
export const MARKUP_HEADING_BASE_CLASS =
  'scroll-mt-4 font-semibold text-default tracking-tight';

/** Классы заголовка по уровню: от главного в тексте до минимального. */
export const MARKUP_HEADING_LEVEL_CLASSES = {
  1: 'text-xl mt-6 mb-3 border-b border-default pb-2',
  2: 'text-lg mt-5 mb-2',
  3: 'text-base mt-4 mb-2',
  4: 'text-sm mt-3 mb-1 uppercase tracking-wide',
} as const;

/** Значение атрибута `type` нумерованного списка. */
export const MARKUP_ORDERED_LIST_TYPE = 'ordered';

/** Тип маркера вложенного списка. */
export const MARKUP_LIST_TYPE = 'list';

/** Подпись колонки таблицы без заголовка: «#1», «#2»… */
export const MARKUP_TABLE_COLUMN_PREFIX = '#';

/** Выравнивание заголовков таблицы по умолчанию — исторический вид. */
export const MARKUP_TABLE_HEADER_ALIGN_CLASS = 'text-center';

/** Классы выравнивания ячейки и заголовка таблицы по атрибуту `align`. */
export const MARKUP_TABLE_ALIGN_CLASSES: Readonly<Record<string, string>> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
