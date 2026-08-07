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
 */
const normalizeBlocks = (root: HTMLElement, doc: Document) => {
  for (const child of Array.from(root.children)) {
    const onlyLayoutAttrs = Array.from(child.attributes).every((attr) =>
      BLOCK_KEEP_ATTRS.includes(attr.name),
    );

    if (child.tagName === 'DIV' && onlyLayoutAttrs) {
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

  return doc.body.innerHTML.trim();
};

/** Достаёт формулу из выделенного текста, например `урон 2к6 + 1` → `2к6 + 1`. */
export const extractFormula = (text: string): string => {
  const match = text.match(FORMULA);

  return match ? match[0].replace(/\s+/g, ' ').trim() : '';
};
