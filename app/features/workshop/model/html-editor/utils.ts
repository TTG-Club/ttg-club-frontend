import type {
  DiceToken,
  DiceVariant,
  HtmlFieldError,
  HtmlProblem,
  OpenTag,
} from './types';

import {
  BLOCK_TAGS,
  COLLAPSIBLE_SPACE,
  DICE_FORMULA,
  DICE_TAG,
  DICE_TOKEN_CLASS,
  DICE_VARIANT_ATTRIBUTES,
  HTML_EDITOR_TEXT,
  IMPLICITLY_CLOSED_BY,
  INLINE_TAG_REPLACEMENTS,
  MARKUP_TOKEN,
  MAX_LINK_NESTING,
  NESTED_BLOCK_SELECTOR,
  OPTIONAL_END_TAGS,
  PARAGRAPH_CLOSERS,
  PARAGRAPH_LAYOUT_ATTRIBUTES,
  PRESERVE_WHITESPACE_SELECTOR,
  PROBLEM_CONTEXT_LENGTH,
  PROBLEM_CONTEXT_SOURCE_LENGTH,
  SELF_CLOSING_CUSTOM_TAG,
  SELF_CLOSING_STANDARD_TAG,
  VOID_TAGS,
  WRAPPED_LINKS,
} from './constants';

/**
 * Приводит самозакрывающиеся кастомные теги к парному виду, чтобы
 * HTML-парсер не сложил в них весь последующий текст.
 * @param html - разметка
 */
function expandSelfClosingCustomTags(html: string): string {
  return html.replace(
    SELF_CLOSING_CUSTOM_TAG,
    (_match, tag: string, attributes: string | undefined) =>
      `<${tag}${attributes ?? ''}></${tag}>`,
  );
}

/**
 * Разбирает разметку в документ.
 * @param html - разметка
 */
function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(
    expandSelfClosingCustomTags(html),
    'text/html',
  );
}

/**
 * Вид броска по атрибутам тега `dice-roller`.
 * @param element - тег броска
 */
function getDiceVariant(element: Element): DiceVariant {
  const hasAny = (names: ReadonlyArray<string>) =>
    names.some((name) => element.hasAttribute(name));

  if (hasAny(DICE_VARIANT_ATTRIBUTES.advantage)) {
    return 'advantage';
  }

  if (hasAny(DICE_VARIANT_ATTRIBUTES.disadvantage)) {
    return 'disadvantage';
  }

  if (hasAny(DICE_VARIANT_ATTRIBUTES['saving-throw'])) {
    return 'saving-throw';
  }

  return 'dice';
}

/**
 * Вид броска из data-атрибута плейсхолдера.
 * @param value - значение атрибута
 */
function parseDiceVariant(value: string | undefined): DiceVariant {
  if (
    value === 'advantage'
    || value === 'disadvantage'
    || value === 'saving-throw'
  ) {
    return value;
  }

  return 'dice';
}

/**
 * Заменяет тег элемента, сохраняя атрибуты и содержимое.
 * @param element - элемент
 * @param tagName - новый тег
 * @param doc - документ элемента
 */
function renameElement(element: Element, tagName: string, doc: Document): void {
  const replacement = doc.createElement(tagName);

  for (const attribute of Array.from(element.attributes)) {
    replacement.setAttribute(attribute.name, attribute.value);
  }

  replacement.append(...Array.from(element.childNodes));
  element.replaceWith(replacement);
}

/**
 * `b` и `i` от `execCommand` приводит к принятым в описаниях тегам.
 * @param root - корень разметки
 * @param doc - документ
 */
function normalizeInlineTags(root: HTMLElement, doc: Document): void {
  for (const [from, to] of INLINE_TAG_REPLACEMENTS) {
    for (const element of Array.from(root.querySelectorAll(from))) {
      renameElement(element, to, doc);
    }
  }
}

/**
 * Перенос строки в визуальном режиме — `div`, в описаниях — `p`.
 * Переименовываются только служебные блоки: свои `div` с классами и блоки
 * с таблицами и заголовками внутри остаются, иначе бэкенд отклонит
 * разметку как некорректный HTML.
 * @param root - корень разметки
 * @param doc - документ
 */
function normalizeBlocks(root: HTMLElement, doc: Document): void {
  for (const child of Array.from(root.children)) {
    const hasOnlyLayoutAttributes = Array.from(child.attributes).every(
      (attribute) => PARAGRAPH_LAYOUT_ATTRIBUTES.includes(attribute.name),
    );

    if (
      child.tagName === 'DIV'
      && hasOnlyLayoutAttributes
      && !child.querySelector(NESTED_BLOCK_SELECTOR)
    ) {
      renameElement(child, 'p', doc);
    }
  }
}

/**
 * Убирает полностью пустые абзацы, которые `execCommand` оставляет вокруг
 * списков и заголовков. Набранная вручную пустая строка — `<p><br></p>` —
 * остаётся.
 * @param root - корень разметки
 */
function removeEmptyParagraphs(root: HTMLElement): void {
  for (const element of Array.from(root.querySelectorAll('p'))) {
    if (!element.childNodes.length) {
      element.remove();
    }
  }
}

/**
 * Блочный ли узел.
 * @param node - узел
 */
function isBlockNode(node: Node | null): boolean {
  return (
    !!node
    && node.nodeType === Node.ELEMENT_NODE
    && BLOCK_TAGS.includes(node.nodeName)
  );
}

/**
 * Схлопывает отступы и переносы строк: браузер их не отображает, а в базе
 * они раздувают описание. Пробел между инлайновыми тегами значим и
 * сохраняется.
 * @param root - корень разметки
 * @param doc - документ
 */
function collapseWhitespace(root: HTMLElement, doc: Document): void {
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Array<Text> = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node instanceof Text) {
      nodes.push(node);
    }
  }

  for (const node of nodes) {
    if (node.parentElement?.closest(PRESERVE_WHITESPACE_SELECTOR)) {
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
}

/**
 * Видимый текст фрагмента одной строкой.
 * @param fragment - кусок разметки
 */
function fragmentToText(fragment: string): string {
  return (parseHtml(fragment).body.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Обрезает текст по границе слова и отмечает обрезку многоточием.
 * @param text - текст
 * @param isFromEnd - оставить конец, а не начало
 */
function truncateWords(text: string, isFromEnd: boolean): string {
  if (text.length <= PROBLEM_CONTEXT_LENGTH) {
    return text;
  }

  if (isFromEnd) {
    const tail = text.slice(-PROBLEM_CONTEXT_LENGTH);

    return `…${tail.slice(tail.indexOf(' ') + 1)}`;
  }

  const head = text.slice(0, PROBLEM_CONTEXT_LENGTH);
  const lastSpace = head.lastIndexOf(' ');

  return `${lastSpace > 0 ? head.slice(0, lastSpace) : head}…`;
}

/**
 * Стандартный HTML-тег, а не кастомный (`dice-roller`) и не элемент SVG:
 * неизвестные теги браузер создаёт как `HTMLUnknownElement`.
 * @param name - имя тега
 */
function isKnownHtmlTag(name: string): boolean {
  return (
    !name.includes('-')
    && !(document.createElement(name) instanceof HTMLUnknownElement)
  );
}

/**
 * Видимый текст рядом с тегом: сначала после него, иначе — перед ним.
 * @param html - разметка
 * @param start - начало тега
 * @param end - конец тега
 */
function getProblemContext(html: string, start: number, end: number): string {
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
}

/**
 * Ищет в разметке ошибки, из-за которых бэкенд отклоняет описание
 * («Некорректный HTML»): ссылку внутри ссылки, блок внутри абзаца,
 * незакрытые и лишние закрывающие теги.
 *
 * Разбор упрощённый и повторяет правила HTML в той мере, в какой они
 * встречаются в описаниях. Место ошибки — позиции тега в исходной строке.
 * @param html - разметка описания
 */
export function findHtmlProblems(html: string): Array<HtmlProblem> {
  const problems: Array<HtmlProblem> = [];
  const stack: Array<OpenTag> = [];

  // Блок, перед которым браузер неявно закрыл абзац. Если потом встретится
  // `</p>`, ошибка именно в нём: абзац не может содержать блоки.
  let paragraphCloser: OpenTag | null = null;

  const addProblem = (message: string, tag: OpenTag): void => {
    problems.push({
      message,
      start: tag.start,
      end: tag.end,
      context: getProblemContext(html, tag.start, tag.end),
    });
  };

  const hasOpen = (name: string): boolean =>
    stack.some((tag) => tag.name === name);

  // Закрывает теги до `name` включительно; незакрытые по пути — ошибки
  const closeUntil = (name: string): void => {
    let tag = stack.pop();

    while (tag && tag.name !== name) {
      if (!OPTIONAL_END_TAGS.has(tag.name)) {
        addProblem(`Тег <${tag.name}> не закрыт`, tag);
      }

      tag = stack.pop();
    }
  };

  for (const match of html.matchAll(MARKUP_TOKEN)) {
    const [token, slash, rawName, attributes = ''] = match;

    if (!rawName) {
      continue;
    }

    const name = rawName.toLowerCase();
    const start = match.index;
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

    const siblings = IMPLICITLY_CLOSED_BY[name] ?? [];

    while (siblings.includes(stack.at(-1)?.name ?? '')) {
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

    const isSelfClosing = attributes.trim().endsWith('/');

    // `<dice-roller/>` и `<path/>` допустимы, а `<p/>` бэкенд считает ошибкой
    if (isSelfClosing && !VOID_TAGS.has(name) && isKnownHtmlTag(name)) {
      addProblem(`Тег <${name}/> не может быть самозакрывающимся`, tag);
    }

    if (!VOID_TAGS.has(name) && !isSelfClosing) {
      stack.push(tag);
    }
  }

  for (const tag of stack) {
    if (!OPTIONAL_END_TAGS.has(tag.name)) {
      addProblem(`Тег <${tag.name}> не закрыт`, tag);
    }
  }

  return problems.sort((first, second) => first.start - second.start);
}

/**
 * Ошибка разметки одной строкой: что не так и рядом с каким текстом.
 * @param problem - ошибка
 */
export function describeHtmlProblem(problem: HtmlProblem): string {
  return problem.context
    ? `${problem.message}${HTML_EDITOR_TEXT.problemContextPrefix}${problem.context}${HTML_EDITOR_TEXT.problemContextSuffix}`
    : problem.message;
}

/**
 * Текст ошибки для формы; пустая строка — ошибок нет.
 * @param problems - ошибки разметки
 */
export function getHtmlValidityMessage(
  problems: ReadonlyArray<HtmlProblem>,
): string {
  const [first] = problems;

  return first
    ? `${HTML_EDITOR_TEXT.validityPrefix}${first.message.toLowerCase()}${HTML_EDITOR_TEXT.validitySuffix}`
    : '';
}

/**
 * Снимает лишние обёртки со ссылок — от внутренних к внешним.
 * @param html - разметка
 */
function unwrapNestedLinks(html: string): string {
  let result = html;

  for (let i = 0; i < MAX_LINK_NESTING; i++) {
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
}

/**
 * Приводит разметку к компактному виду. Идемпотентна: сжатый HTML проходит
 * через неё без изменений.
 * @param html - разметка
 */
export function compressHtml(html: string): string {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  collapseWhitespace(doc.body, doc);

  return doc.body.innerHTML.trim();
}

/**
 * `<p/>` браузер читает как открывающий тег, поэтому до разбора такие теги
 * становятся пустой парой. Пустые теги вроде `<br/>` и элементы SVG не
 * трогаются.
 * @param html - разметка
 */
function expandSelfClosingStandardTags(html: string): string {
  return html.replace(
    SELF_CLOSING_STANDARD_TAG,
    (match, tag: string, attributes: string | undefined) => {
      const name = tag.toLowerCase();

      return VOID_TAGS.has(name) || !isKnownHtmlTag(name)
        ? match
        : `<${tag}${attributes ?? ''}></${tag}>`;
    },
  );
}

/**
 * Исправляет ошибки, которые находит `findHtmlProblems`: снимает лишнюю
 * обёртку со ссылки, превращает `<p/>` в пустую пару, остальное
 * перестраивает браузер. Результат стоит проверить глазами.
 * @param html - разметка
 */
export function fixHtmlProblems(html: string): string {
  return compressHtml(expandSelfClosingStandardTags(unwrapNestedLinks(html)));
}

/**
 * Убирает служебные атрибуты визуального режима.
 * @param root - корень разметки
 */
function cleanupAttributes(root: HTMLElement): void {
  for (const element of Array.from(
    root.querySelectorAll('[contenteditable]'),
  )) {
    element.removeAttribute('contenteditable');
  }
}

/**
 * Бросок с пустыми полями, дополненный переданными.
 * @param token - известные поля
 */
export function createDiceToken(token: Partial<DiceToken> = {}): DiceToken {
  return {
    formula: '',
    text: '',
    label: '',
    source: '',
    variant: 'dice',
    ...token,
  };
}

/**
 * Бросок из тега `dice-roller`.
 * @param element - тег броска
 */
function tokenFromDiceRoller(element: Element): DiceToken {
  const formula = element.getAttribute('formula') ?? '';

  return createDiceToken({
    formula,
    text: element.textContent.trim() || formula,
    label: element.getAttribute('label') ?? '',
    source: element.getAttribute('source') ?? '',
    variant: getDiceVariant(element),
  });
}

/**
 * Бросок из плейсхолдера визуального режима.
 * @param element - плейсхолдер
 */
export function tokenFromElement(element: HTMLElement): DiceToken {
  const formula = element.dataset.formula ?? '';

  return createDiceToken({
    formula,
    text: element.textContent.trim() || formula,
    label: element.dataset.label ?? '',
    source: element.dataset.source ?? '',
    variant: parseDiceVariant(element.dataset.variant),
  });
}

/**
 * Плейсхолдер броска для визуального режима — неделимый.
 * @param token - бросок
 * @param doc - документ, где создаётся элемент
 */
export function createTokenElement(
  token: DiceToken,
  doc: Document = document,
): HTMLElement {
  const element = doc.createElement('span');

  element.className = `${DICE_TOKEN_CLASS} is-${token.variant}`;
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
}

/**
 * Тег `dice-roller` из броска.
 * @param token - бросок
 * @param doc - документ
 */
function createDiceRollerElement(token: DiceToken, doc: Document): Element {
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
}

/**
 * Разметка описания → разметка визуального редактора.
 * @param html - разметка описания
 */
export function htmlToEditable(html: string): string {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  for (const element of Array.from(doc.body.querySelectorAll(DICE_TAG))) {
    element.replaceWith(createTokenElement(tokenFromDiceRoller(element), doc));
  }

  return doc.body.innerHTML;
}

/**
 * Разметка визуального редактора → разметка описания.
 * @param html - разметка визуального режима
 */
export function editableToHtml(html: string): string {
  if (!html.trim()) {
    return '';
  }

  const doc = parseHtml(html);

  for (const element of Array.from(
    doc.body.querySelectorAll(`.${DICE_TOKEN_CLASS}`),
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
}

/**
 * Формула из выделенного текста: `урон 2к6 + 1` → `2к6 + 1`.
 * @param text - выделенный текст
 */
export function extractFormula(text: string): string {
  const match = DICE_FORMULA.exec(text);

  return match ? match[0].replace(/\s+/g, ' ').trim() : '';
}

/**
 * Ошибки разметки HTML-полей формы: бэкенд не примет такой текст, поэтому
 * форма не отправляется, пока они есть.
 * @param fields - имя поля и его разметка
 */
export function getHtmlFieldErrors(
  fields: Record<string, string>,
): Array<HtmlFieldError> {
  return Object.entries(fields).flatMap(([name, html]) => {
    const message = getHtmlValidityMessage(findHtmlProblems(html));

    return message ? [{ name, message }] : [];
  });
}
