import type { DetailType } from '~content/model';

import type {
  DiceVariant,
  HtmlEditorCommand,
  HtmlEditorMode,
  HtmlEditorWrapTag,
  HtmlTableAction,
} from './types';

/** Тег, которым бросок хранится в описании. */
export const DICE_TAG = 'dice-roller';

/** Класс плейсхолдера броска внутри визуального редактора. */
export const DICE_TOKEN_CLASS = 'html-editor-dice';

/** Атрибуты вида броска: с дефисом и в старом написании без него. */
export const DICE_VARIANT_ATTRIBUTES: Record<
  Exclude<DiceVariant, 'dice'>,
  ReadonlyArray<string>
> = {
  'advantage': ['is-advantage', 'isadvantage'],
  'disadvantage': ['is-disadvantage', 'isdisadvantage'],
  'saving-throw': ['is-saving-throw', 'issavingthrow'],
};

/**
 * Самозакрывающиеся кастомные теги (`<dice-roller formula="2к6"/>`) валидны
 * для компилятора шаблонов Vue, но не для HTML-парсера: он считает такой тег
 * открывающим и складывает в него весь последующий текст.
 */
export const SELF_CLOSING_CUSTOM_TAG =
  /<([a-z][a-z\d]*-[a-z\d-]*)(\s(?:"[^"]*"|'[^']*'|[^"'>])*?)?\/>/gi;

/** Самозакрывающийся обычный тег без дефиса: `<p/>`, `<div class="x" />`. */
export const SELF_CLOSING_STANDARD_TAG =
  /<([a-z][a-z\d]*)(\s(?:"[^"]*"|'[^']*'|[^"'>])*?)?\/>/gi;

/** Формула кубика: `к6`, `2к6`, `1d20 + 5`. */
export const DICE_FORMULA = /\d*\s*[кkdд]\s*\d+(?:\s*[+-]\s*\d+)?/i;

/** Теги `execCommand`, которые в описаниях пишутся иначе. */
export const INLINE_TAG_REPLACEMENTS: ReadonlyArray<[string, string]> = [
  ['b', 'strong'],
  ['i', 'em'],
  // Зачёркивание `execCommand` пишет устаревшим `strike`, а сайт его не выводит
  ['strike', 's'],
];

/** Атрибуты, с которыми `div` всё ещё считается обычным абзацем. */
export const PARAGRAPH_LAYOUT_ATTRIBUTES: ReadonlyArray<string> = [
  'style',
  'align',
];

/**
 * Блочные теги: пробелы рядом с ними на отображение не влияют, поэтому
 * при сжатии их можно убирать полностью.
 */
export const BLOCK_TAGS: ReadonlyArray<string> = [
  'ARTICLE',
  'BLOCKQUOTE',
  'BR',
  'CAPTION',
  'COL',
  'COLGROUP',
  'DIV',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'LI',
  'OL',
  'P',
  'SECTION',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'UL',
];

/** Блоки, которые не могут лежать внутри абзаца; `br` для абзаца — перенос. */
export const NESTED_BLOCK_SELECTOR = [
  ...BLOCK_TAGS.filter((tag) => tag !== 'BR'),
  'DL',
  'PRE',
]
  .map((tag) => tag.toLowerCase())
  .join(', ');

/** Теги, внутри которых пробелы значимы и сжимать их нельзя. */
export const PRESERVE_WHITESPACE_SELECTOR = 'pre, code, textarea';

/**
 * Пробельные символы, кроме неразрывного: `&nbsp;` в описаниях ставят
 * намеренно (`СЛ&nbsp;15`), схлопывать его нельзя.
 */
export const COLLAPSIBLE_SPACE = /[^\S\xA0]+/g;

/** Комментарий или тег: `<!-- … -->`, `<a href="…">`, `</p>`, `<br/>`. */
export const MARKUP_TOKEN =
  /<!--[\s\S]*?-->|<(\/?)([a-z][a-z\d-]*)((?:[\s/](?:"[^"]*"|'[^']*'|[^"'>])*)?)>/gi;

/** Теги без закрывающей пары. */
export const VOID_TAGS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Теги, закрывающий тег которых по стандарту можно опустить. */
export const OPTIONAL_END_TAGS: ReadonlySet<string> = new Set([
  'li',
  'dt',
  'dd',
  'p',
  'rt',
  'rp',
  'optgroup',
  'option',
  'colgroup',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
]);

const TABLE_SECTION_SIBLINGS = ['thead', 'tbody', 'tfoot', 'tr', 'td', 'th'];

/** Какие открытые теги неявно закрывает новый тег того же уровня. */
export const IMPLICITLY_CLOSED_BY: Readonly<
  Record<string, ReadonlyArray<string>>
> = {
  li: ['li'],
  dt: ['dt', 'dd'],
  dd: ['dt', 'dd'],
  option: ['option'],
  td: ['td', 'th'],
  th: ['td', 'th'],
  tr: ['tr', 'td', 'th'],
  thead: TABLE_SECTION_SIBLINGS,
  tbody: TABLE_SECTION_SIBLINGS,
  tfoot: TABLE_SECTION_SIBLINGS,
};

/** Блоки, перед которыми браузер закрывает открытый абзац. */
export const PARAGRAPH_CLOSERS: ReadonlySet<string> = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

/** Сколько символов видимого текста показывать рядом с ошибкой. */
export const PROBLEM_CONTEXT_LENGTH = 60;

/** Сколько символов разметки брать для цитаты: в ней есть теги. */
export const PROBLEM_CONTEXT_SOURCE_LENGTH = PROBLEM_CONTEXT_LENGTH * 4;

/** Глубина вложенности ссылок, которую разворачиваем (встречалась тройная). */
export const MAX_LINK_NESTING = 5;

/** Ссылка без вложенных ссылок, с подсказкой-обёрткой или без неё. */
const PLAIN_LINK =
  '(?:<detail-tooltip\\b[^>]*>\\s*)?<a\\b[^>]*>(?:(?!<\\/?a\\b)[\\s\\S])*<\\/a>(?:\\s*<\\/detail-tooltip>)?';

/**
 * Ссылка, по ошибке обёрнутая в ещё одну ссылку — с подсказкой или без неё.
 * Внешнюю обёртку снимаем, внутреннюю ссылку оставляем.
 */
export const WRAPPED_LINKS: ReadonlyArray<RegExp> = [
  new RegExp(
    `<detail-tooltip\\b[^>]*>\\s*<a\\b[^>]*>\\s*(${PLAIN_LINK})\\s*<\\/a>\\s*<\\/detail-tooltip>`,
    'gi',
  ),
  new RegExp(`<a\\b[^>]*>\\s*(${PLAIN_LINK})\\s*<\\/a>`, 'gi'),
];

/** Сколько ошибок разметки перечислять, остальные — числом. */
export const MAX_VISIBLE_PROBLEMS = 5;

/** Высота строки визуального режима: из неё и числа строк — высота поля. */
export const HTML_EDITOR_ROW_HEIGHT = 24;

/** Вид кнопки режима: выбранный и остальные. */
export const HTML_EDITOR_MODE_VARIANT = {
  active: 'soft',
  inactive: 'ghost',
} as const;

/** Режимы редактора. */
export const HTML_EDITOR_MODES: ReadonlyArray<{
  label: string;
  value: HtmlEditorMode;
}> = [
  { label: 'HTML', value: 'html' },
  { label: 'Исходный код', value: 'source' },
];

/** Виды броска в окне броска. */
export const DICE_VARIANT_OPTIONS: Array<{
  label: string;
  value: DiceVariant;
}> = [
  { label: 'Обычный', value: 'dice' },
  { label: 'Преимущество', value: 'advantage' },
  { label: 'Помеха', value: 'disadvantage' },
  { label: 'Спасбросок', value: 'saving-throw' },
];

/** Подписи броска на выбор; можно ввести и свою. */
export const DICE_LABEL_OPTIONS: Array<string> = [
  'Бросок',
  'Атака',
  'Урон',
  'Восстановление хитов',
  'Проверка',
  'Спасбросок',
];

/** Подпись расширенного броска по умолчанию. */
export const DICE_DEFAULT_LABEL = 'Бросок';

/** Абзац и заголовки для `formatBlock`. */
export const HTML_EDITOR_BLOCKS: ReadonlyArray<{ label: string; tag: string }> =
  [
    { label: 'Обычный текст', tag: 'p' },
    { label: 'Заголовок 1', tag: 'h1' },
    { label: 'Заголовок 2', tag: 'h2' },
    { label: 'Заголовок 3', tag: 'h3' },
    { label: 'Заголовок 4', tag: 'h4' },
    { label: 'Заголовок 5', tag: 'h5' },
  ];

/** Оформление текста: тот же набор и порядок, что на новом сайте. */
export const HTML_EDITOR_INLINE_COMMANDS: ReadonlyArray<HtmlEditorCommand> = [
  { command: 'bold', icon: 'tabler:bold', title: 'Жирный (Ctrl+B)' },
  { command: 'italic', icon: 'tabler:italic', title: 'Курсив (Ctrl+I)' },
  {
    command: 'underline',
    icon: 'tabler:underline',
    title: 'Подчёркнутый (Ctrl+U)',
  },
  {
    command: 'strikeThrough',
    icon: 'tabler:strikethrough',
    title: 'Зачёркнутый',
  },
  {
    command: 'superscript',
    icon: 'tabler:superscript',
    title: 'Верхний индекс',
  },
  { command: 'subscript', icon: 'tabler:subscript', title: 'Нижний индекс' },
];

/** Выделение маркером: `execCommand` такого тега не знает. */
export const HTML_EDITOR_HIGHLIGHT: HtmlEditorWrapTag = {
  tag: 'mark',
  icon: 'tabler:highlight',
  title: 'Выделение',
  placeholder: 'текст',
};

/** Клавиша: `<kbd>Ctrl</kbd>`. */
export const HTML_EDITOR_KBD: HtmlEditorWrapTag = {
  tag: 'kbd',
  icon: 'tabler:keyboard',
  title: 'Клавиша',
  placeholder: 'Ctrl',
};

/** Пункты меню таблицы; вне таблицы доступна только вставка. */
export const HTML_EDITOR_TABLE_ACTIONS: ReadonlyArray<{
  action: HtmlTableAction;
  label: string;
  icon: string;
}> = [
  { action: 'caption', label: 'Подпись таблицы', icon: 'tabler:text-caption' },
  { action: 'row-before', label: 'Строку выше', icon: 'tabler:row-insert-top' },
  {
    action: 'row-after',
    label: 'Строку ниже',
    icon: 'tabler:row-insert-bottom',
  },
  { action: 'row-delete', label: 'Удалить строку', icon: 'tabler:row-remove' },
  {
    action: 'column-before',
    label: 'Столбец слева',
    icon: 'tabler:column-insert-left',
  },
  {
    action: 'column-after',
    label: 'Столбец справа',
    icon: 'tabler:column-insert-right',
  },
  {
    action: 'column-delete',
    label: 'Удалить столбец',
    icon: 'tabler:column-remove',
  },
  {
    action: 'header-toggle',
    label: 'Строка-заголовок',
    icon: 'tabler:heading',
  },
  { action: 'table-delete', label: 'Удалить таблицу', icon: 'tabler:trash' },
];

/** Размер новой таблицы: строка-заголовок и строки тела. */
export const HTML_EDITOR_TABLE_SIZE = { rows: 2, columns: 3 } as const;

/** Подпись новой таблицы. */
export const HTML_EDITOR_TABLE_CAPTION = 'Подпись';

/**
 * Начало адреса записи → тип `detail-tooltip`: по нему ссылка открывает
 * карточку дровером. `/items/magic/` проверяется раньше `/items/`.
 */
export const DETAIL_TYPE_BY_PATH: ReadonlyArray<[string, DetailType]> = [
  ['/spells/', 'spell'],
  ['/bestiary/', 'creature'],
  ['/feats/', 'feat'],
  ['/traits/', 'trait'],
  ['/options/', 'option'],
  ['/armors/', 'armor'],
  ['/weapons/', 'weapon'],
  ['/items/magic/', 'magic-item'],
  ['/items/', 'item'],
  ['/screens/', 'screen'],
  ['/gods/', 'god'],
];

/** Схема, которую получает адрес без неё: `ttg.club` → `https://ttg.club`. */
export const DEFAULT_URL_SCHEME = 'https://';

/** Сколько результатов поиска показывать в окне ссылки на раздел. */
export const SECTION_SEARCH_SIZE = 8;

/** Задержка поиска в окне ссылки на раздел. */
export const SECTION_SEARCH_DEBOUNCE_MS = 300;

/** Списки. */
export const HTML_EDITOR_LIST_COMMANDS: ReadonlyArray<HtmlEditorCommand> = [
  {
    command: 'insertUnorderedList',
    icon: 'tabler:list',
    title: 'Маркированный список',
  },
  {
    command: 'insertOrderedList',
    icon: 'tabler:list-numbers',
    title: 'Нумерованный список',
  },
];

/** Выравнивание. */
export const HTML_EDITOR_ALIGN_COMMANDS: ReadonlyArray<HtmlEditorCommand> = [
  {
    command: 'justifyLeft',
    icon: 'tabler:align-left',
    title: 'По левому краю',
    isStyled: true,
  },
  {
    command: 'justifyCenter',
    icon: 'tabler:align-center',
    title: 'По центру',
    isStyled: true,
  },
  {
    command: 'justifyRight',
    icon: 'tabler:align-right',
    title: 'По правому краю',
    isStyled: true,
  },
];

/** Подписи HTML-редактора. */
export const HTML_EDITOR_TEXT = {
  placeholder: 'Описание в формате HTML',
  heading: 'Заголовок (H1–H5)',
  quote: 'Цитата',
  separator: 'Разделитель',
  table: 'Таблица',
  insertTable: 'Вставить таблицу',
  lineBreak: 'Перенос строки',
  link: 'Ссылка',
  linkTitle: 'Ссылка',
  linkEditTitle: 'Редактирование ссылки',
  linkUrl: 'Адрес',
  linkUrlPlaceholder: 'https://… или /spells/…',
  linkText: 'Текст',
  linkTextPlaceholder: 'Совпадает с адресом',
  section: 'Ссылка на раздел — заклинание, существо, предмет…',
  sectionTitle: 'Ссылка на раздел',
  sectionSearch: 'Поиск',
  sectionSearchPlaceholder: 'Название записи',
  sectionStart: 'Введите название, чтобы найти запись',
  sectionLoading: 'Ищем…',
  sectionEmpty: 'Ничего не нашлось',
  sectionError: 'Не удалось выполнить поиск, попробуйте ещё раз',
  sectionText: 'Текст ссылки',
  sectionTextPlaceholder: 'Название записи',
  dice: 'Дайс — кликабельная формула, например 2к6',
  roll: 'Бросок — формула с подписью, преимуществом или спасброском',
  problemsTitle: 'Ошибка в разметке — сервер не примет этот текст',
  showProblem: 'Показать в коде',
  moreProblems: 'И ещё',
  fixProblems: 'Исправить автоматически',
  fixProblemsHint:
    'Браузер перестроит разметку по правилам HTML — проверьте результат',
  validityPrefix: 'Ошибка в разметке описания: ',
  validitySuffix: '. Исправьте её, иначе сервер не примет текст.',
  problemContextPrefix: ' — рядом с «',
  problemContextSuffix: '»',
  required: 'Заполните описание',
  diceTitle: 'Дайс',
  rollTitle: 'Бросок',
  editTitle: 'Редактирование броска',
  formula: 'Формула',
  formulaPlaceholder: '2к6 + 3',
  text: 'Текст',
  textPlaceholder: 'Совпадает с формулой',
  label: 'Подпись',
  variant: 'Тип',
  source: 'Источник',
  sourcePlaceholder: 'Необязательно',
  remove: 'Удалить',
  cancel: 'Отмена',
  insert: 'Вставить',
  save: 'Сохранить',
} as const;

/** Иконки HTML-редактора. */
export const HTML_EDITOR_ICON = {
  heading: 'tabler:heading',
  quote: 'tabler:quote',
  separator: 'tabler:separator-horizontal',
  table: 'tabler:table',
  insertTable: 'tabler:table-plus',
  lineBreak: 'tabler:corner-down-left',
  link: 'tabler:link',
  section: 'tabler:external-link',
  dice: 'tabler:dice-5',
  roll: 'tabler:dice-6-filled',
  problems: 'tabler:alert-triangle',
  fix: 'tabler:wand',
} as const;
