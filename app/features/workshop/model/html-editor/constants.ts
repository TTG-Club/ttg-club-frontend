import type { DiceVariant, HtmlEditorCommand, HtmlEditorMode } from './types';

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

/** Жирный и курсив. */
export const HTML_EDITOR_INLINE_COMMANDS: ReadonlyArray<HtmlEditorCommand> = [
  { command: 'bold', icon: 'tabler:bold', title: 'Жирный (Ctrl+B)' },
  { command: 'italic', icon: 'tabler:italic', title: 'Курсив (Ctrl+I)' },
];

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
  dice: 'tabler:dice-5',
  roll: 'tabler:dice-6-filled',
  problems: 'tabler:alert-triangle',
  fix: 'tabler:wand',
} as const;
