import type { DiceToken, DiceVariant } from './types';

/** Тег, которым бросок хранится в описании. */
export const DICE_TAG = 'dice-roller';

/** Класс плейсхолдера броска внутри contenteditable. */
export const TOKEN_CLASS = 'html-editor-dice';

const VARIANT_ATTRS = {
  'advantage': ['is-advantage', 'isadvantage'],
  'disadvantage': ['is-disadvantage', 'isdisadvantage'],
  'saving-throw': ['is-saving-throw', 'issavingthrow'],
};

/**
 * Самозакрывающиеся кастомные теги (`<dice-roller formula="2к6"/>`) валидны
 * для компилятора шаблонов Vue, но не для HTML-парсера: он считает такой тег
 * открывающим и складывает в него весь последующий текст. Поэтому перед
 * разбором приводим их к парному виду.
 */
const SELF_CLOSING_TAG =
  /<([a-z][a-z\d]*-[a-z\d-]*)((?:"[^"]*"|'[^']*'|[^"'>])*?)\/>/gi;

/** Формула кубика: `к6`, `2к6`, `1d20 + 5`. */
const FORMULA = /\d*\s*[кkdд]\s*\d+(?:\s*[+-]\s*\d+)?/i;

const INLINE_REPLACEMENTS = [
  ['b', 'strong'],
  ['i', 'em'],
];

/** Атрибуты, с которыми `<div>` всё ещё считается обычным абзацем. */
const BLOCK_KEEP_ATTRS = ['style', 'align'];

/**
 * Блочные теги: пробелы и переносы рядом с ними на отображение не влияют,
 * поэтому при сжатии их можно убирать полностью. Между инлайновыми тегами
 * пробел значим (`<strong>а</strong> <em>б</em>`) — там оставляем один.
 */
const BLOCK_TAGS = [
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

/**
 * Блоки, которые не могут лежать внутри `<p>`. `BR` из `BLOCK_TAGS` сюда
 * не входит: для абзаца это обычный перенос строки.
 */
const NESTED_BLOCK_SELECTOR = [
  ...BLOCK_TAGS.filter((tag) => tag !== 'BR'),
  'DL',
  'PRE',
]
  .map((tag) => tag.toLowerCase())
  .join(', ');

/** Теги, внутри которых пробелы значимы и сжимать их нельзя. */
const PRESERVE_WHITESPACE = 'pre, code, textarea';

/**
 * Пробельные символы, кроме неразрывного: `&nbsp;` в описаниях ставят
 * намеренно (`СЛ&nbsp;15`, `10&nbsp;футов`), схлопывать его нельзя.
 */
const COLLAPSIBLE_SPACE = /[^\S\u00A0]+/g;

const expandSelfClosingTags = (html: string) =>
  html.replace(
    SELF_CLOSING_TAG,
    (_match, tag: string, attrs: string) => `<${tag}${attrs}></${tag}>`,
  );

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(expandSelfClosingTags(html), 'text/html');

const getAttr = (element: Element, name: string) =>
  element.getAttribute(name) || '';

const hasAnyAttribute = (element: Element, names: Array<string>) =>
  names.some((name) => element.hasAttribute(name));

const getVariant = (element: Element): DiceVariant => {
  if (hasAnyAttribute(element, VARIANT_ATTRS.advantage)) {
    return 'advantage';
  }

  if (hasAnyAttribute(element, VARIANT_ATTRS.disadvantage)) {
    return 'disadvantage';
  }

  if (hasAnyAttribute(element, VARIANT_ATTRS['saving-throw'])) {
    return 'saving-throw';
  }

  return 'dice';
};

const parseVariant = (value: string | undefined): DiceVariant => {
  if (
    value === 'advantage' ||
    value === 'disadvantage' ||
    value === 'saving-throw'
  ) {
    return value;
  }

  return 'dice';
};

const renameElement = (element: Element, tagName: string, doc: Document) => {
  const replacement = doc.createElement(tagName);

  for (const attribute of Array.from(element.attributes)) {
    replacement.setAttribute(attribute.name, attribute.value);
  }

  replacement.append(...Array.from(element.childNodes));
  element.replaceWith(replacement);
};

/** `<b>`/`<i>` от `execCommand` приводим к принятым в описаниях тегам. */
const normalizeInlineTags = (root: HTMLElement, doc: Document) => {
  for (const [from, to] of INLINE_REPLACEMENTS) {
    for (const element of Array.from(root.querySelectorAll(from))) {
      renameElement(element, to, doc);
    }
  }
};

/**
 * Перенос строки в contenteditable — это `<div>`, в описаниях — `<p>`.
 * Переименовываем только «служебные» блоки: свои `<div>` с классами
 * (`table-responsive` и подобные) трогать нельзя, а `style` от выравнивания
 * нужно сохранить.
 *
 * `<div>` с блоками внутри (`<div><table>`, выравнивание по центру вокруг
 * заголовка) тоже оставляем: `<p>` не может содержать блоки, и бэкенд
 * отклоняет такую разметку как некорректный HTML.
 */
const normalizeBlocks = (root: HTMLElement, doc: Document) => {
  for (const child of Array.from(root.children)) {
    const onlyLayoutAttrs = Array.from(child.attributes).every((attr) =>
      BLOCK_KEEP_ATTRS.includes(attr.name),
    );

    if (
      child.tagName === 'DIV' &&
      onlyLayoutAttrs &&
      !child.querySelector(NESTED_BLOCK_SELECTOR)
    ) {
      renameElement(child, 'p', doc);
    }
  }
};

/**
 * `execCommand` при вставке списков и заголовков оставляет вокруг них
 * полностью пустые `<p></p>`. Пустую строку, набранную вручную, браузер
 * сохраняет как `<p><br></p>` — её не трогаем.
 */
const removeEmptyParagraphs = (root: HTMLElement) => {
  for (const element of Array.from(root.querySelectorAll('p'))) {
    if (!element.childNodes.length) {
      element.remove();
    }
  }
};

const isBlockNode = (node: Node | null) =>
  !!node &&
  node.nodeType === Node.ELEMENT_NODE &&
  BLOCK_TAGS.includes(node.nodeName);

/**
 * Схлопывает отступы и переносы строк: браузер их всё равно не отображает,
 * а в базе они раздувают описание. Пробел между инлайновыми тегами значим,
 * поэтому он сохраняется — убираются только «оформительские» пробелы
 * на границах блоков.
 */
const collapseWhitespace = (root: HTMLElement, doc: Document) => {
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Array<Text> = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node instanceof Text) {
      nodes.push(node);
    }
  }

  for (const node of nodes) {
    if (node.parentElement?.closest(PRESERVE_WHITESPACE)) {
      continue;
    }

    let text = node.data.replace(COLLAPSIBLE_SPACE, ' ');

    if (isBlockNode(node.previousSibling) || !node.previousSibling) {
      text = text.replace(/^ /, '');
    }

    if (isBlockNode(node.nextSibling) || !node.nextSibling) {
      text = text.replace(/ $/, '');
    }

    if (text) {
      node.data = text;
    } else {
      node.remove();
    }
  }
};

/** Комментарий или тег: `<!-- … -->`, `<a href="…">`, `</p>`, `<br/>`. */
const MARKUP_TOKEN =
  /<!--[\s\S]*?-->|<(\/?)([a-z][a-z\d-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/gi;

/** Теги без закрывающей пары. */
const VOID_TAGS = new Set([
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
const OPTIONAL_END_TAGS = new Set([
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
const IMPLICITLY_CLOSED_BY: Record<string, Array<string>> = {
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

/** Блоки, перед которыми браузер закрывает открытый абзац `<p>`. */
const PARAGRAPH_CLOSERS = new Set([
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
const PROBLEM_CONTEXT_LENGTH = 60;

/**
 * Сколько символов разметки брать для цитаты: в ней есть теги, поэтому
 * видимого текста там заметно меньше, чем символов.
 */
const PROBLEM_CONTEXT_SOURCE_LENGTH = PROBLEM_CONTEXT_LENGTH * 4;

export type HtmlProblem = {
  /** Что не так — простыми словами. */
  message: string;
  /** Начало проблемного тега в исходной разметке. */
  start: number;
  /** Конец проблемного тега в исходной разметке. */
  end: number;
  /** Текст рядом с ошибкой, чтобы её было легко найти глазами. */
  context: string;
};

type OpenTag = {
  name: string;
  start: number;
  end: number;
};

const fragmentToText = (fragment: string) =>
  (parseHtml(fragment).body.textContent || '').replace(/\s+/g, ' ').trim();

/** Обрезает текст по границе слова и отмечает обрезку многоточием. */
const truncateWords = (text: string, fromEnd: boolean) => {
  if (text.length <= PROBLEM_CONTEXT_LENGTH) {
    return text;
  }

  if (fromEnd) {
    const tail = text.slice(-PROBLEM_CONTEXT_LENGTH);

    return `…${tail.slice(tail.indexOf(' ') + 1)}`;
  }

  const head = text.slice(0, PROBLEM_CONTEXT_LENGTH);
  const lastSpace = head.lastIndexOf(' ');

  return `${lastSpace > 0 ? head.slice(0, lastSpace) : head}…`;
};

/**
 * Стандартный HTML-тег (`p`, `div`), а не кастомный (`dice-roller`)
 * и не элемент SVG (`path`): неизвестные теги браузер создаёт как
 * `HTMLUnknownElement`.
 */
const isKnownHtmlTag = (name: string) =>
  !name.includes('-') &&
  !(document.createElement(name) instanceof HTMLUnknownElement);

/** Видимый текст рядом с тегом: сначала после него, иначе — перед ним. */
const getProblemContext = (html: string, start: number, end: number) => {
  const after = fragmentToText(
    html.slice(end, end + PROBLEM_CONTEXT_SOURCE_LENGTH),
  );

  if (after) {
    return truncateWords(after, false);
  }

  return truncateWords(
    fragmentToText(
      html.slice(Math.max(0, start - PROBLEM_CONTEXT_SOURCE_LENGTH), start),
    ),
    true,
  );
};

/**
 * Ищет в разметке ошибки, из-за которых бэкенд отклоняет описание
 * («Некорректный HTML»): ссылку внутри ссылки, блок внутри абзаца,
 * незакрытые и лишние закрывающие теги.
 *
 * Разбор упрощённый и повторяет правила HTML только в той мере, в какой
 * они встречаются в описаниях. Место ошибки — позиции тега в исходной
 * строке, по ним редактор выделяет его в режиме исходного кода.
 */
export const findHtmlProblems = (html: string): Array<HtmlProblem> => {
  const problems: Array<HtmlProblem> = [];
  const stack: Array<OpenTag> = [];

  // Блок, перед которым браузер неявно закрыл абзац. Если потом встретится
  // `</p>`, ошибка именно в нём: абзац не может содержать блоки.
  let paragraphCloser: OpenTag | null = null;

  const addProblem = (message: string, tag: OpenTag) => {
    problems.push({
      message,
      start: tag.start,
      end: tag.end,
      context: getProblemContext(html, tag.start, tag.end),
    });
  };

  const hasOpen = (name: string) => stack.some((tag) => tag.name === name);

  /** Закрывает теги до `name` включительно; незакрытые по пути — ошибки. */
  const closeUntil = (name: string) => {
    while (stack.length) {
      const tag = stack.pop();

      if (!tag || tag.name === name) {
        return;
      }

      if (!OPTIONAL_END_TAGS.has(tag.name)) {
        addProblem(`Тег <${tag.name}> не закрыт`, tag);
      }
    }
  };

  for (const match of html.matchAll(MARKUP_TOKEN)) {
    const [token, slash, rawName, attributes] = match;

    if (!rawName) {
      continue;
    }

    const name = rawName.toLowerCase();
    const start = match.index || 0;
    const tag: OpenTag = { name, start, end: start + token.length };

    if (slash) {
      if (VOID_TAGS.has(name)) {
        continue;
      }

      if (hasOpen(name)) {
        closeUntil(name);
      } else if (name === 'p' && paragraphCloser) {
        addProblem(
          `Блок <${paragraphCloser.name}> внутри абзаца <p>`,
          paragraphCloser,
        );

        paragraphCloser = null;
      } else {
        addProblem(`Лишний закрывающий тег </${name}>`, tag);
      }

      continue;
    }

    if (name === 'a' && hasOpen('a')) {
      addProblem('Ссылка внутри ссылки', tag);
    }

    const siblings = IMPLICITLY_CLOSED_BY[name] || [];

    while (stack.length && siblings.includes(stack[stack.length - 1].name)) {
      stack.pop();
    }

    if (PARAGRAPH_CLOSERS.has(name)) {
      if (hasOpen('p')) {
        closeUntil('p');
        paragraphCloser = tag;
      } else if (name === 'p') {
        paragraphCloser = null;
      }
    }

    const selfClosing = attributes.trim().endsWith('/');

    // `<dice-roller/>` и `<path/>` в SVG допустимы, а `<p/>` — нет:
    // для известных HTML-тегов бэкенд считает это ошибкой.
    if (selfClosing && !VOID_TAGS.has(name) && isKnownHtmlTag(name)) {
      addProblem(`Тег <${name}/> не может быть самозакрывающимся`, tag);
    }

    if (!VOID_TAGS.has(name) && !selfClosing) {
      stack.push(tag);
    }
  }

  for (const tag of stack) {
    if (!OPTIONAL_END_TAGS.has(tag.name)) {
      addProblem(`Тег <${tag.name}> не закрыт`, tag);
    }
  }

  return problems.sort((first, second) => first.start - second.start);
};

/** Ошибка разметки одной строкой: что не так и рядом с каким текстом. */
export const describeHtmlProblem = (problem: HtmlProblem): string =>
  problem.context
    ? `${problem.message} — рядом с «${problem.context}»`
    : problem.message;

/**
 * Подсказка браузера при попытке отправить форму с ошибкой разметки.
 * Пустая строка — ошибок нет, отправку не блокируем.
 */
export const getHtmlValidityMessage = (problems: Array<HtmlProblem>): string =>
  problems.length
    ? `Ошибка в разметке описания: ${problems[0].message.toLowerCase()}. Исправьте её, иначе сервер не примет текст.`
    : '';

/** Ссылка без вложенных ссылок, с подсказкой-обёрткой или без неё. */
const PLAIN_LINK =
  '(?:<detail-tooltip\\b[^>]*>\\s*)?<a\\b[^>]*>(?:(?!<\\/?a\\b)[\\s\\S])*<\\/a>(?:\\s*<\\/detail-tooltip>)?';

/**
 * Ссылка, по ошибке обёрнутая в ещё одну ссылку — с подсказкой
 * (`<detail-tooltip><a> <detail-tooltip><a>текст</a></detail-tooltip></a></detail-tooltip>`)
 * или без неё (`<a> <detail-tooltip><a>текст</a></detail-tooltip></a>`).
 * Внешнюю обёртку снимаем, внутреннюю ссылку оставляем.
 */
const WRAPPED_LINKS = [
  new RegExp(
    `<detail-tooltip\\b[^>]*>\\s*<a\\b[^>]*>\\s*(${PLAIN_LINK})\\s*<\\/a>\\s*<\\/detail-tooltip>`,
    'gi',
  ),
  new RegExp(`<a\\b[^>]*>\\s*(${PLAIN_LINK})\\s*<\\/a>`, 'gi'),
];

/** Глубина вложенности ссылок, которую разворачиваем (встречалась тройная). */
const MAX_LINK_NESTING = 5;

/** Снимает лишние обёртки со ссылок — от внутренних к внешним. */
const unwrapNestedLinks = (html: string): string => {
  let result = html;

  for (let depth = 0; depth < MAX_LINK_NESTING; depth++) {
    const next = WRAPPED_LINKS.reduce(
      (current, pattern) => current.replace(pattern, '$1'),
      result,
    );

    if (next === result) {
      break;
    }

    result = next;
  }

  return result;
};

/**
 * Приводит разметку к компактному виду. Идемпотентна: сжатый HTML
 * проходит через неё без изменений.
 */
export const compressHtml = (html: string): string => {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  collapseWhitespace(doc.body, doc);

  return doc.body.innerHTML.trim();
};

/** Самозакрывающийся обычный тег без дефиса в имени: `<p/>`, `<div class="x" />`. */
const STANDARD_SELF_CLOSING_TAG =
  /<([a-z][a-z\d]*)((?:"[^"]*"|'[^']*'|[^"'>])*?)\s*\/>/gi;

/**
 * `<p/>` браузер читает как открывающий тег и складывает в него следующий
 * текст, поэтому до разбора приводим такие теги к пустой паре `<p></p>`.
 * Пустые теги вроде `<br/>` и элементы SVG вроде `<path/>` не трогаем.
 */
const expandStandardSelfClosingTags = (html: string) =>
  html.replace(
    STANDARD_SELF_CLOSING_TAG,
    (match, tag: string, attrs: string) => {
      const name = tag.toLowerCase();

      return VOID_TAGS.has(name) || !isKnownHtmlTag(name)
        ? match
        : `<${tag}${attrs}></${tag}>`;
    },
  );

/**
 * Исправляет ошибки разметки, которые находит `findHtmlProblems`.
 *
 * Частые случаи чиним точечно: снимаем лишнюю обёртку со ссылки внутри
 * такой же ссылки и превращаем `<p/>` в пустую пару. Остальное перестраивает
 * браузер по правилам HTML; результат стоит проверить глазами.
 */
export const fixHtmlProblems = (html: string): string =>
  compressHtml(expandStandardSelfClosingTags(unwrapNestedLinks(html)));

const cleanupAttributes = (root: HTMLElement) => {
  for (const element of Array.from(
    root.querySelectorAll('[contenteditable]'),
  )) {
    element.removeAttribute('contenteditable');
  }
};

export const createDiceToken = (token: Partial<DiceToken> = {}): DiceToken => ({
  formula: '',
  text: '',
  label: '',
  source: '',
  variant: 'dice',
  ...token,
});

const tokenFromDiceRoller = (element: Element): DiceToken => {
  const formula = getAttr(element, 'formula');

  return createDiceToken({
    formula,
    text: element.textContent?.trim() || formula,
    label: getAttr(element, 'label'),
    source: getAttr(element, 'source'),
    variant: getVariant(element),
  });
};

export const tokenFromElement = (element: HTMLElement): DiceToken => {
  const formula = element.dataset.formula || '';

  return createDiceToken({
    formula,
    text: element.textContent?.trim() || formula,
    label: element.dataset.label || '',
    source: element.dataset.source || '',
    variant: parseVariant(element.dataset.variant),
  });
};

/** Плейсхолдер броска для визуального режима — неделимый и некликабельный. */
export const createTokenElement = (
  token: DiceToken,
  doc: Document = document,
): HTMLElement => {
  const element = doc.createElement('span');

  element.className = `${TOKEN_CLASS} is-${token.variant}`;
  element.contentEditable = 'false';
  element.dataset.formula = token.formula;
  element.dataset.variant = token.variant;
  element.dataset.label = token.label;
  element.dataset.source = token.source;

  element.title = token.label
    ? `${token.label}: ${token.formula}`
    : token.formula;
  element.textContent = token.text || token.formula;

  return element;
};

const createDiceRollerElement = (token: DiceToken, doc: Document): Element => {
  const element = doc.createElement(DICE_TAG);

  if (token.label) {
    element.setAttribute('label', token.label);
  }

  element.setAttribute('formula', token.formula);

  if (token.source) {
    element.setAttribute('source', token.source);
  }

  if (token.variant !== 'dice') {
    element.setAttribute(`is-${token.variant}`, '');
  }

  element.textContent = token.text || token.formula;

  return element;
};

/** Разметка описания → разметка визуального редактора. */
export const htmlToEditable = (html: string): string => {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  for (const element of Array.from(doc.body.querySelectorAll(DICE_TAG))) {
    element.replaceWith(createTokenElement(tokenFromDiceRoller(element), doc));
  }

  return doc.body.innerHTML;
};

/** Разметка визуального редактора → разметка описания. */
export const editableToHtml = (html: string): string => {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  for (const element of Array.from(
    doc.body.querySelectorAll(`.${TOKEN_CLASS}`),
  )) {
    if (element instanceof HTMLElement) {
      element.replaceWith(
        createDiceRollerElement(tokenFromElement(element), doc),
      );
    }
  }

  normalizeInlineTags(doc.body, doc);
  normalizeBlocks(doc.body, doc);
  removeEmptyParagraphs(doc.body);
  cleanupAttributes(doc.body);
  collapseWhitespace(doc.body, doc);

  return doc.body.innerHTML.trim();
};

/** Достаёт формулу из выделенного текста, например `урон 2к6 + 1` → `2к6 + 1`. */
export const extractFormula = (text: string): string => {
  const match = text.match(FORMULA);

  return match ? match[0].replace(/\s+/g, ' ').trim() : '';
};
