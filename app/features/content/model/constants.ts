/** Тег броска кубиков в HTML из базы. */
export const DICE_ROLLER_TAG = 'dice-roller';

/** Тег подсказки со ссылкой на сущность в HTML из базы. */
export const DETAIL_TOOLTIP_TAG = 'detail-tooltip';

/** Ссылка vue-router, которая иногда встречается в старом контенте. */
export const ROUTER_LINK_TAG = 'router-link';

/** Обычные теги, которые выводятся как есть. */
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'a',
  'abbr',
  'article',
  'b',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

/** Теги без содержимого. */
export const VOID_TAGS: ReadonlySet<string> = new Set([
  'br',
  'col',
  'hr',
  'img',
]);

/** Теги таблицы, внутри которых браузер не допускает текст. */
export const TABLE_STRUCTURE_TAGS: ReadonlySet<string> = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
]);

/** Теги, которые выбрасываются вместе с содержимым. */
export const DROPPED_TAGS: ReadonlySet<string> = new Set([
  'base',
  'button',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'meta',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
]);

/** Атрибуты, разрешённые у обычных тегов. */
export const ALLOWED_ATTRIBUTES: ReadonlySet<string> = new Set([
  'align',
  'alt',
  'class',
  'colspan',
  'height',
  'href',
  'id',
  'open',
  'rowspan',
  'src',
  'style',
  'target',
  'title',
  'width',
]);

/** Атрибуты броска: имена в обоих написаниях, что встречаются в базе. */
export const DICE_ROLLER_ATTRIBUTES: ReadonlySet<string> = new Set([
  'formula',
  'label',
  'source',
  'is-advantage',
  'isadvantage',
  'is-disadvantage',
  'isdisadvantage',
  'is-saving-throw',
  'issavingthrow',
]);

/** Атрибуты подсказки сущности. */
export const DETAIL_TOOLTIP_ATTRIBUTES: ReadonlySet<string> = new Set([
  'type',
  'url',
]);

/** Атрибуты со ссылкой, которые проверяются на безопасную схему. */
export const URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'src']);

/** Безопасные ссылки: относительные, якоря, http(s) и почта. */
export const SAFE_URL = /^(?:\/(?!\/)|#|https?:\/\/|mailto:)/i;

/** Префиксы привязок Vue, из которых берётся только строковый литерал. */
export const VUE_BINDING_PREFIXES = [':', 'v-bind:'] as const;

/** Строковый литерал в значении привязки: `'2к6'`. */
export const QUOTED_LITERAL = /^\s*'([^']*)'\s*$/;

/** Типы подсказок старого SPA. */
export const DETAIL_TYPES: ReadonlySet<string> = new Set([
  'option',
  'trait',
  'feat',
  'armor',
  'weapon',
  'magic-item',
  'item',
  'screen',
  'creature',
  'spell',
  'god',
]);

/** Подсказки без типа подгружают HTML только с этих адресов API. */
export const RAW_TOOLTIP_PREFIX = '/api/';

/** Тексты подсказки сущности. */
export const DETAIL_TOOLTIP_TEXT = {
  loading: 'Загрузка...',
  error: 'Произошла непредвиденная ошибка',
} as const;

/** Сколько подсвечивается строка таблицы после броска. */
export const ROLL_TABLE_HIGHLIGHT_MS = 5000;

/** Разделитель диапазона результатов в первой колонке таблицы. */
export const ROLL_RANGE_SEPARATOR = '-';

/** Внешние ссылки из контента открываются в новой вкладке. */
export const EXTERNAL_LINK_TARGET = '_blank';

/** Внешние ссылки не получают доступ к окну сайта. */
export const EXTERNAL_LINK_REL = 'noopener noreferrer';

/** Внешняя ссылка из контента. */
export const EXTERNAL_URL = /^https?:\/\//i;

/** Иконка вместо диапазона в строке, на которую выпал бросок. */
export const ROLL_TABLE_HIT_ICON = 'tabler:dice-5';

/** Начало динамического сегмента в пути маршрута. */
export const ROUTE_PARAM_PREFIX = ':';

/** Окончание сегмента маршрута, который ловит любой хвост адреса. */
export const ROUTE_CATCH_ALL_SUFFIX = '*';

/** Конец пути в адресе: дальше идут параметры или якорь. */
export const ROUTE_PATH_END = /[?#]/;
