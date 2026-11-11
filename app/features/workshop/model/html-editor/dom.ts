import type { DetailType } from '~content/model';

import type { HtmlEditorLink, HtmlTableAction } from './types';

import { DETAIL_TOOLTIP_TAG, SAFE_URL } from '~content/model';

import {
  DEFAULT_URL_SCHEME,
  DETAIL_TYPE_BY_PATH,
  HTML_EDITOR_TABLE_CAPTION,
} from './constants';

/** Ячейка, которую создаёт редактор: шапки или тела таблицы. */
type CellTag = 'th' | 'td';

/**
 * Ближайший предок узла по селектору — только внутри редактора.
 * @param node - узел, от которого искать
 * @param selector - CSS-селектор
 * @param root - корень редактора
 */
export function closestInEditor(
  node: Node | null | undefined,
  selector: string,
  root: HTMLElement,
): HTMLElement | undefined {
  const element = node instanceof Element ? node : node?.parentElement;
  const found = element?.closest(selector);

  return found instanceof HTMLElement && found !== root && root.contains(found)
    ? found
    : undefined;
}

/**
 * Узел верхнего уровня редактора, в котором лежит переданный.
 * @param node - узел внутри редактора
 * @param root - корень редактора
 */
export function findTopLevelNode(
  node: Node | null | undefined,
  root: HTMLElement,
): ChildNode | undefined {
  let current: Node | null | undefined = node;

  while (current && current.parentNode !== root) {
    current = current.parentNode;
  }

  return current ? (current as ChildNode) : undefined;
}

/**
 * Пустой абзац, в который можно поставить каретку.
 * @param doc - документ
 */
function createEmptyParagraph(doc: Document): HTMLParagraphElement {
  const paragraph = doc.createElement('p');

  paragraph.append(doc.createElement('br'));

  return paragraph;
}

/**
 * Вставляет блок после абзаца с кареткой, а без каретки — в конец. За
 * последним блоком добавляется пустой абзац: иначе после таблицы или
 * разделителя нельзя было бы продолжить текст.
 * @param root - корень редактора
 * @param block - блок
 * @param range - выделение внутри редактора
 */
export function insertBlock(
  root: HTMLElement,
  block: HTMLElement,
  range: Range | undefined,
): void {
  const top = range ? findTopLevelNode(range.endContainer, root) : undefined;

  if (top) {
    top.after(block);
  } else {
    root.append(block);
  }

  if (!block.nextSibling) {
    block.after(createEmptyParagraph(block.ownerDocument));
  }
}

/**
 * Ставит каретку в начало узла или выделяет его содержимое.
 * @param node - узел
 * @param isSelect - выделить содержимое, а не поставить каретку
 */
export function placeCaret(node: Node, isSelect = false): Range {
  const range = node.ownerDocument?.createRange() ?? new Range();

  range.selectNodeContents(node);

  if (!isSelect) {
    range.collapse(true);
  }

  const selection = window.getSelection();

  selection?.removeAllRanges();
  selection?.addRange(range);

  return range;
}

/**
 * Снимает обёртку: содержимое остаётся на месте.
 * @param element - обёртка
 */
export function unwrapElement(element: HTMLElement): void {
  element.replaceWith(...Array.from(element.childNodes));
}

/**
 * Оборачивает выделение в тег. Выделение через несколько абзацев
 * оборачивается только текстом, иначе абзацы оказались бы внутри
 * инлайнового тега.
 * @param root - корень редактора
 * @param range - выделение
 * @param tag - тег обёртки
 * @param placeholder - текст при пустом выделении
 */
export function wrapRange(
  root: HTMLElement,
  range: Range,
  tag: string,
  placeholder: string,
): HTMLElement {
  const doc = root.ownerDocument;
  const wrapper = doc.createElement(tag);

  const isSameBlock =
    findTopLevelNode(range.startContainer, root)
    === findTopLevelNode(range.endContainer, root);

  if (range.collapsed) {
    wrapper.textContent = placeholder;
  } else if (isSameBlock) {
    wrapper.append(range.extractContents());
  } else {
    wrapper.textContent = range.toString();
    range.deleteContents();
  }

  range.insertNode(wrapper);

  return wrapper;
}

/**
 * Пустая ячейка таблицы.
 * @param doc - документ
 * @param tag - тег ячейки
 */
function createCell(doc: Document, tag: CellTag): HTMLTableCellElement {
  const cell = doc.createElement(tag);

  cell.append(doc.createElement('br'));

  return cell;
}

/**
 * Таблица со строкой-заголовком.
 * @param doc - документ
 * @param rows - строк тела
 * @param columns - столбцов
 */
export function createTable(
  doc: Document,
  rows: number,
  columns: number,
): HTMLTableElement {
  const table = doc.createElement('table');
  const head = table.createTHead().insertRow();

  for (let column = 0; column < columns; column++) {
    head.append(createCell(doc, 'th'));
  }

  const body = table.createTBody();

  for (let row = 0; row < rows; row++) {
    const line = body.insertRow();

    for (let column = 0; column < columns; column++) {
      line.append(createCell(doc, 'td'));
    }
  }

  return table;
}

/**
 * Тег ячеек строки: в шапке — `th`, в теле — `td`.
 * @param row - строка
 */
function getRowCellTag(row: HTMLTableRowElement): CellTag {
  return row.parentElement?.tagName === 'THEAD' ? 'th' : 'td';
}

/**
 * Номер столбца ячейки с учётом объединённых ячеек слева.
 * @param cell - ячейка
 */
function getColumnIndex(cell: HTMLTableCellElement): number {
  const row = cell.parentElement;

  if (!(row instanceof HTMLTableRowElement)) {
    return 0;
  }

  let index = 0;

  for (const current of Array.from(row.cells)) {
    if (current === cell) {
      return index;
    }

    index += current.colSpan;
  }

  return index;
}

/**
 * Ячейка строки, которая покрывает столбец.
 * @param row - строка
 * @param index - номер столбца
 */
function getCellAt(
  row: HTMLTableRowElement,
  index: number,
): HTMLTableCellElement | undefined {
  let start = 0;

  for (const cell of Array.from(row.cells)) {
    if (index < start + cell.colSpan) {
      return cell;
    }

    start += cell.colSpan;
  }

  return undefined;
}

/**
 * Ширина строки в столбцах.
 * @param row - строка
 */
function getRowWidth(row: HTMLTableRowElement): number {
  return Array.from(row.cells).reduce((sum, cell) => sum + cell.colSpan, 0);
}

/**
 * Меняет тег ячеек строки, сохраняя атрибуты и содержимое.
 * @param row - строка
 * @param tag - новый тег ячеек
 */
function convertRowCells(row: HTMLTableRowElement, tag: CellTag): void {
  const doc = row.ownerDocument;

  for (const cell of Array.from(row.cells)) {
    if (cell.tagName.toLowerCase() === tag) {
      continue;
    }

    const replacement = doc.createElement(tag);

    for (const attribute of Array.from(cell.attributes)) {
      replacement.setAttribute(attribute.name, attribute.value);
    }

    replacement.append(...Array.from(cell.childNodes));
    cell.replaceWith(replacement);
  }
}

/**
 * Удаляет пустые секции, а без строк — и всю таблицу.
 * @param table - таблица
 */
function removeEmptyParts(table: HTMLTableElement): void {
  for (const section of Array.from(
    table.querySelectorAll(':scope > thead, :scope > tbody, :scope > tfoot'),
  )) {
    if (section instanceof HTMLTableSectionElement && !section.rows.length) {
      section.remove();
    }
  }

  if (!table.rows.length) {
    table.remove();
  }
}

/**
 * Добавляет строку выше или ниже. Строка ниже шапки уходит в начало тела.
 * @param cell - ячейка с кареткой
 * @param isAfter - ниже, а не выше
 */
function insertRow(
  cell: HTMLTableCellElement,
  isAfter: boolean,
): HTMLElement | undefined {
  const row = cell.parentElement;
  const table = cell.closest('table');

  if (!(row instanceof HTMLTableRowElement) || !table) {
    return undefined;
  }

  const doc = cell.ownerDocument;
  const isHead = getRowCellTag(row) === 'th';
  const tag: CellTag = isHead && !isAfter ? 'th' : 'td';
  const line = doc.createElement('tr');

  for (let column = 0; column < getRowWidth(row); column++) {
    line.append(createCell(doc, tag));
  }

  if (isHead && isAfter) {
    const body = table.tBodies[0] ?? table.createTBody();

    body.prepend(line);
  } else if (isAfter) {
    row.after(line);
  } else {
    row.before(line);
  }

  return line.cells[0];
}

/**
 * Удаляет строку с кареткой.
 * @param cell - ячейка с кареткой
 */
function deleteRow(cell: HTMLTableCellElement): HTMLElement | undefined {
  const row = cell.parentElement;
  const table = cell.closest('table');

  if (!(row instanceof HTMLTableRowElement) || !table) {
    return undefined;
  }

  const next = row.nextElementSibling ?? row.previousElementSibling;

  row.remove();
  removeEmptyParts(table);

  return next instanceof HTMLTableRowElement
    ? next.cells[0]
    : table.rows[0]?.cells[0];
}

/**
 * Добавляет столбец слева или справа во все строки.
 * @param cell - ячейка с кареткой
 * @param isAfter - справа, а не слева
 */
function insertColumn(
  cell: HTMLTableCellElement,
  isAfter: boolean,
): HTMLElement | undefined {
  const table = cell.closest('table');

  if (!table) {
    return undefined;
  }

  const doc = cell.ownerDocument;
  const index = getColumnIndex(cell);

  let result: HTMLElement | undefined;

  for (const row of Array.from(table.rows)) {
    const created = createCell(doc, getRowCellTag(row));
    const target = row === cell.parentElement ? cell : getCellAt(row, index);

    if (!target) {
      row.append(created);
    } else if (isAfter) {
      target.after(created);
    } else {
      target.before(created);
    }

    if (row === cell.parentElement) {
      result = created;
    }
  }

  return result;
}

/**
 * Удаляет столбец с кареткой; объединённые ячейки сужаются.
 * @param cell - ячейка с кареткой
 */
function deleteColumn(cell: HTMLTableCellElement): HTMLElement | undefined {
  const table = cell.closest('table');
  const row = cell.parentElement;

  if (!table || !(row instanceof HTMLTableRowElement)) {
    return undefined;
  }

  const index = getColumnIndex(cell);

  for (const line of Array.from(table.rows)) {
    const target = getCellAt(line, index);

    if (!target) {
      continue;
    }

    if (target.colSpan > 1) {
      target.colSpan -= 1;
    } else {
      target.remove();
    }

    if (!line.cells.length) {
      line.remove();
    }
  }

  removeEmptyParts(table);

  return table.isConnected
    ? (getCellAt(row, Math.max(0, index - 1)) ?? table.rows[0]?.cells[0])
    : undefined;
}

/**
 * Включает и выключает строку-заголовок: первая строка тела переходит в
 * шапку и обратно.
 * @param cell - ячейка с кареткой
 */
function toggleHeaderRow(cell: HTMLTableCellElement): HTMLElement | undefined {
  const table = cell.closest('table');

  if (!table) {
    return undefined;
  }

  const head = table.tHead;

  if (head) {
    const body = table.tBodies[0] ?? table.createTBody();

    for (const row of Array.from(head.rows).reverse()) {
      convertRowCells(row, 'td');
      body.prepend(row);
    }

    head.remove();
  } else {
    const [first] = Array.from(table.rows);

    if (!first) {
      return undefined;
    }

    convertRowCells(first, 'th');
    table.createTHead().append(first);
    removeEmptyParts(table);
  }

  return table.rows[0]?.cells[0];
}

/**
 * Подпись таблицы: новая получает текст-заглушку.
 * @param cell - ячейка с кареткой
 */
function ensureCaption(cell: HTMLTableCellElement): HTMLElement | undefined {
  const table = cell.closest('table');

  if (!table) {
    return undefined;
  }

  const caption = table.caption ?? table.createCaption();

  if (!caption.textContent.trim()) {
    caption.textContent = HTML_EDITOR_TABLE_CAPTION;
  }

  return caption;
}

/**
 * Выполняет операцию над таблицей.
 * @param cell - ячейка с кареткой
 * @param action - операция
 * @returns куда поставить каретку; `undefined` — таблицы больше нет
 */
export function applyTableAction(
  cell: HTMLTableCellElement,
  action: HtmlTableAction,
): HTMLElement | undefined {
  switch (action) {
    case 'row-before':
      return insertRow(cell, false);
    case 'row-after':
      return insertRow(cell, true);
    case 'row-delete':
      return deleteRow(cell);
    case 'column-before':
      return insertColumn(cell, false);
    case 'column-after':
      return insertColumn(cell, true);
    case 'column-delete':
      return deleteColumn(cell);
    case 'header-toggle':
      return toggleHeaderRow(cell);
    case 'caption':
      return ensureCaption(cell);
    case 'table-delete':
      cell.closest('table')?.remove();

      return undefined;
  }
}

/**
 * Адрес ссылки: без схемы и не путь сайта — считается внешним.
 * @param url - введённый адрес
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed || SAFE_URL.test(trimmed)) {
    return trimmed;
  }

  return `${DEFAULT_URL_SCHEME}${trimmed}`;
}

/**
 * Тип карточки по адресу записи; адрес другого раздела — `undefined`.
 * @param url - путь записи
 */
export function getDetailType(url: string): DetailType | undefined {
  return DETAIL_TYPE_BY_PATH.find(([prefix]) => url.startsWith(prefix))?.[1];
}

/**
 * Ссылка для описания. Ссылка на запись раздела оборачивается в
 * `detail-tooltip`: на сайте она откроет карточку дровером.
 * @param link - текст и адрес
 * @param doc - документ
 */
export function createLinkElement(
  link: HtmlEditorLink,
  doc: Document = document,
): HTMLElement {
  const url = normalizeUrl(link.url);
  const anchor = doc.createElement('a');

  anchor.setAttribute('href', url);
  anchor.textContent = link.text.trim() || url;

  const type = getDetailType(url);

  if (!type) {
    return anchor;
  }

  const tooltip = doc.createElement(DETAIL_TOOLTIP_TAG);

  tooltip.setAttribute('type', type);
  tooltip.setAttribute('url', url);
  tooltip.append(anchor);

  return tooltip;
}

/**
 * Ссылка под кареткой: подсказка целиком или обычная ссылка.
 * @param node - узел с кареткой
 * @param root - корень редактора
 */
export function findLinkElement(
  node: Node | null | undefined,
  root: HTMLElement,
): HTMLElement | undefined {
  return (
    closestInEditor(node, DETAIL_TOOLTIP_TAG, root)
    ?? closestInEditor(node, 'a', root)
  );
}

/**
 * Текст и адрес ссылки из разметки.
 * @param element - `a` или `detail-tooltip`
 */
export function linkFromElement(element: HTMLElement): HtmlEditorLink {
  const anchor = element.tagName === 'A' ? element : element.querySelector('a');

  return {
    text: element.textContent.trim(),
    url: anchor?.getAttribute('href') ?? element.getAttribute('url') ?? '',
  };
}
