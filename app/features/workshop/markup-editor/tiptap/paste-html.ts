import {
  BLOCK_MARKER_ATTR,
  FORMAT_MARK_ATTR,
  HORIZONTAL_RULE_TAG,
  SECTION_LINK_ATTR,
  SECTION_LINK_KIND_ATTR,
  SECTION_LINK_URL_ATTR,
  SEPARATOR_MARKER,
} from './constants';
import { FORMAT_SPECS } from './marks';
import { HEADING_LEVELS } from './ttg-heading';

/**
 * Тег → тип форматирующего маркера (`strong` → `bold`). Собирается из
 * `FORMAT_SPECS`, поэтому новый формат достаточно описать там одним местом.
 */
const FORMAT_TYPE_BY_TAG = new Map(
  FORMAT_SPECS.flatMap((spec) => spec.htmlTags.map((tag) => [tag, spec.type])),
);

/** Самый глубокий уровень заголовка, который знает редактор (см. `ttg-heading.ts`). */
const MAX_HEADING_LEVEL = Math.max(...HEADING_LEVELS);

/** Заголовок любого уровня в HTML: `<h1>`…`<h6>`. */
const HEADING_TAG_REGEXP = /^h([1-6])$/;

/** Вид ссылки для вставки: адрес из буфера — всегда внешний, не раздел сайта. */
const EXTERNAL_LINK_KIND = 'link';

/** Селектор всего, что вырезается из вставки вместе с содержимым. */
const DROPPED_SELECTOR =
  'img, picture, svg, video, audio, iframe, script, style';

/**
 * Переносит детей элемента на его место и убирает сам элемент (тег теряется,
 * текст и вложенное оформление остаются).
 *
 * @param element - Элемент, который нужно развернуть
 */
function unwrap(element: Element): void {
  element.replaceWith(...element.childNodes);
}

/**
 * Заменяет элемент новым тегом, перенося в него содержимое и заданные атрибуты.
 *
 * @param element - Исходный элемент
 * @param tagName - Тег замены
 * @param attributes - Атрибуты, которые нужно проставить новому элементу
 */
function replaceTag(
  element: Element,
  tagName: string,
  attributes: Record<string, string> = {},
): void {
  const replacement = element.ownerDocument.createElement(tagName);

  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    replacement.setAttribute(attributeName, attributeValue);
  }

  replacement.append(...element.childNodes);
  element.replaceWith(replacement);
}

/**
 * Блок кода: каждая строка становится отдельным абзацем обычного текста.
 * Моноширинного маркера в разметке нет, а тройные бэктики из штатной
 * сериализации TipTap вышли бы на страницу текстом — так хотя бы сам листинг
 * доезжает построчно и читаемо.
 *
 * @param element - Элемент `<pre>`
 */
function replaceCodeBlock(element: Element): void {
  const ownerDocument = element.ownerDocument;
  const fragment = ownerDocument.createDocumentFragment();

  for (const line of (element.textContent ?? '').split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const paragraph = ownerDocument.createElement('p');

    paragraph.textContent = line;
    fragment.append(paragraph);
  }

  element.replaceWith(fragment);
}

/**
 * Ссылка: наш редактируемый узел с подписью-текстом и адресом в атрибуте.
 * Ссылка без адреса смысла не несёт — от неё остаётся только текст.
 *
 * @param element - Элемент `<a>`
 */
function replaceLink(element: Element): void {
  const url = element.getAttribute('href')?.trim();

  if (!url) {
    unwrap(element);

    return;
  }

  const link = element.ownerDocument.createElement('span');

  link.setAttribute(SECTION_LINK_ATTR, '');
  link.setAttribute(SECTION_LINK_KIND_ATTR, EXTERNAL_LINK_KIND);
  link.setAttribute(SECTION_LINK_URL_ATTR, url);
  // Подпись узла — простой текст (`marks: ''` в TtgSectionLink), поэтому
  // вложенное оформление всё равно было бы отброшено схемой.
  link.textContent = element.textContent ?? url;
  element.replaceWith(link);
}

/**
 * Приводит один элемент вставки к нашей разметке. Собственные элементы
 * редактора (`data-ttg-*`) не трогаем — иначе сломался бы copy-paste внутри
 * самого редактора.
 *
 * @param element - Обрабатываемый элемент
 */
function normalizeElement(element: Element): void {
  const tagName = element.tagName.toLowerCase();
  const formatType = FORMAT_TYPE_BY_TAG.get(tagName);

  if (formatType) {
    replaceTag(element, 'span', { [FORMAT_MARK_ATTR]: formatType });

    return;
  }

  if (tagName === HORIZONTAL_RULE_TAG) {
    const marker = element.ownerDocument.createElement('div');

    marker.setAttribute(BLOCK_MARKER_ATTR, '');
    marker.textContent = SEPARATOR_MARKER;
    element.replaceWith(marker);

    return;
  }

  if (tagName === 'a') {
    replaceLink(element);

    return;
  }

  if (tagName === 'pre') {
    replaceCodeBlock(element);

    return;
  }

  if (tagName === 'code') {
    // Внутри <pre> код обработает сам блок — там текст собирается построчно.
    if (!element.closest('pre')) {
      unwrap(element);
    }

    return;
  }

  const headingLevel = HEADING_TAG_REGEXP.exec(tagName)?.[1];

  if (headingLevel && Number(headingLevel) > MAX_HEADING_LEVEL) {
    replaceTag(element, `h${MAX_HEADING_LEVEL}`);
  }
}

/**
 * Приводит HTML из буфера обмена к тому, что умеет разметка `{@...}`.
 *
 * Схема редактора беднее HTML: жирный/курсив/ссылка живут у нас своими марками
 * и узлами (`data-ttg-*`), а картинок и блоков кода нет вовсе. Без этой
 * нормализации ProseMirror молча выбрасывает `<strong>`/`<em>`/`<a>` (текст
 * остаётся, оформление и адрес пропадают), а `<hr>`, `<code>` и `<img>`
 * доживают до сохранения чужими узлами и выходят на страницу мусорным текстом
 * («---», бэктики, `![альт](url)`). Моноширинного маркера в разметке нет,
 * поэтому код теряет только оформление, но не текст.
 *
 * @param html - HTML из буфера обмена
 * @returns HTML, разбираемый схемой редактора без потерь
 */
export function transformPastedMarkupHtml(html: string): string {
  if (!html.trim()) {
    return html;
  }

  const pasted = new DOMParser().parseFromString(html, 'text/html');

  for (const unsupported of pasted.body.querySelectorAll(DROPPED_SELECTOR)) {
    unsupported.remove();
  }

  // Обходим СНИЗУ ВВЕРХ: замена родителя пересобирает поддерево, и заранее
  // собранный сверху вниз список указывал бы на уже отсоединённые узлы.
  const elements = [...pasted.body.querySelectorAll('*')].reverse();

  for (const element of elements) {
    normalizeElement(element);
  }

  return pasted.body.innerHTML;
}
