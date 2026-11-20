import type { MarkerNode, RenderNode } from '~news/markup';

import type { ContentElementNode, ContentNode } from './types';

import {
  clampHeadingLevel,
  getNodeText,
  isBlockNode,
  isMarkerNode,
  isSimpleTextNode,
  parse,
} from '~news/markup';

import {
  DETAIL_TOOLTIP_TAG,
  DICE_ROLLER_TAG,
  EXTERNAL_LINK_TARGET,
  MARKUP_ALIGNS,
  MARKUP_CELL_PLACEHOLDER,
  MARKUP_HEADING_TAG_OFFSET,
  MARKUP_INLINE_TAGS,
  MARKUP_LINK_DETAIL_TYPES,
  MARKUP_LINK_TYPE,
  MARKUP_SECTION_LINKS,
  MARKUP_TABLE_CLASS,
  MARKUP_TABLE_WRAPPER_CLASS,
} from './constants';

/**
 * Создаёт элемент контента.
 * @param tag - имя тега
 * @param attributes - атрибуты
 * @param children - дочерние узлы
 */
function element(
  tag: string,
  attributes: Record<string, string>,
  children: Array<ContentNode>,
): ContentElementNode {
  return { kind: 'element', tag, attributes, children };
}

/**
 * Читает атрибут маркера строкой (пустая строка, если его нет).
 * @param node - маркер разметки
 * @param name - имя атрибута
 */
function readAttribute(node: MarkerNode, name: string): string {
  const value = node.attrs?.[name];

  return value === undefined || value === null ? '' : String(value).trim();
}

/**
 * Атрибуты выравнивания блока или ячейки (`align:center` → стиль).
 * @param node - маркер с атрибутом `align`
 */
function alignAttributes(node: MarkerNode): Record<string, string> {
  return alignStyle(readAttribute(node, 'align'));
}

/**
 * Стиль выравнивания для известного значения `align`, иначе без атрибутов.
 * @param align - значение выравнивания из разметки
 */
function alignStyle(align: unknown): Record<string, string> {
  return typeof align === 'string' && MARKUP_ALIGNS.has(align)
    ? { style: `text-align: ${align};` }
    : {};
}

/**
 * Ссылка, обёрнутая в подсказку сущности, если для раздела она есть.
 * @param href - адрес
 * @param detailType - тип подсказки или `undefined`
 * @param children - текст ссылки
 */
function linkNode(
  href: string,
  detailType: string | undefined,
  children: Array<ContentNode>,
): ContentNode {
  const anchor = element('a', { href }, children);

  return detailType
    ? element(DETAIL_TOOLTIP_TAG, { type: detailType }, [anchor])
    : anchor;
}

/**
 * Маркер ссылки на раздел (`{@spell … | url:fireball}`).
 * @param node - маркер раздела
 * @param children - текст ссылки
 */
function sectionLink(
  node: MarkerNode,
  children: Array<ContentNode>,
): Array<ContentNode> {
  const section = MARKUP_SECTION_LINKS.get(node.type);
  const url = readAttribute(node, 'url');

  if (!section || !url) {
    return children;
  }

  return [linkNode(`${section.path}${url}`, section.detailType, children)];
}

/**
 * Маркер `{@link … | url:…}`: внутренний адрес — с подсказкой по разделу,
 * внешний — в новой вкладке.
 * @param node - маркер ссылки
 * @param children - текст ссылки
 */
function plainLink(
  node: MarkerNode,
  children: Array<ContentNode>,
): Array<ContentNode> {
  const url = readAttribute(node, 'url');

  if (!url) {
    return children;
  }

  if (url.startsWith('/')) {
    const [section = ''] = url.slice(1).split('/');

    return [
      linkNode(
        url,
        MARKUP_LINK_DETAIL_TYPES.get(section.toLowerCase()),
        children,
      ),
    ];
  }

  // rel для внешних ссылок добавляет ContentLink
  return [element('a', { href: url, target: EXTERNAL_LINK_TARGET }, children)];
}

/**
 * Маркер броска `{@roll формула | text:подпись}`.
 * @param node - маркер броска
 */
function rollNode(node: MarkerNode): ContentNode {
  const formula = getNodeText(node.content ?? []).trim();
  const shown = readAttribute(node, 'text') || formula;

  return element(DICE_ROLLER_TAG, { formula }, [{ kind: 'text', text: shown }]);
}

/**
 * Строчные узлы разметки → узлы контента.
 * @param nodes - узлы разметки
 */
function inlineNodes(nodes: ReadonlyArray<RenderNode>): Array<ContentNode> {
  return mergeTextNodes(nodes.flatMap((node) => inlineNode(node)));
}

/**
 * Склеивает соседние текстовые узлы (парсер разметки дробит текст вокруг
 * маркеров) — дерево совпадает с разбором того же текста из HTML.
 * @param nodes - узлы контента
 */
function mergeTextNodes(nodes: ReadonlyArray<ContentNode>): Array<ContentNode> {
  return nodes.reduce<Array<ContentNode>>((merged, node) => {
    const previous = merged.at(-1);

    if (node.kind === 'text' && previous?.kind === 'text') {
      return [
        ...merged.slice(0, -1),
        { kind: 'text', text: previous.text + node.text },
      ];
    }

    return [...merged, node];
  }, []);
}

/**
 * Один строчный узел разметки → узлы контента.
 * @param node - узел разметки
 */
function inlineNode(node: RenderNode): Array<ContentNode> {
  if (typeof node === 'string') {
    return node ? [{ kind: 'text', text: node }] : [];
  }

  if (Array.isArray(node)) {
    return inlineNodes(node);
  }

  if (isSimpleTextNode(node)) {
    return node.text ? [{ kind: 'text', text: node.text }] : [];
  }

  if (!isMarkerNode(node)) {
    return [];
  }

  const children = inlineNodes(node.content ?? []);
  const tag = MARKUP_INLINE_TAGS.get(node.type);

  if (tag) {
    return [element(tag, {}, children)];
  }

  switch (node.type) {
    case 'break':
      return [element('br', {}, [])];
    case 'roll':
      return [rollNode(node)];
    case 'link':
      return plainLink(node, children);
    default:
      return MARKUP_SECTION_LINKS.has(node.type)
        ? sectionLink(node, children)
        : children;
  }
}

/**
 * Делит строчное содержимое цитаты на абзацы по двойному `{@br}`.
 * @param nodes - содержимое цитаты
 */
function splitQuoteParagraphs(
  nodes: ReadonlyArray<RenderNode>,
): Array<Array<RenderNode>> {
  const paragraphs: Array<Array<RenderNode>> = [[]];

  nodes.forEach((node, index) => {
    const isBreak = isMarkerNode(node) && node.type === 'break';
    const nextNode = nodes[index + 1];
    const isNextBreak = isMarkerNode(nextNode) && nextNode.type === 'break';
    const previousNode = nodes[index - 1];

    const isPreviousBreak =
      isMarkerNode(previousNode) && previousNode.type === 'break';

    if (isBreak && isNextBreak) {
      paragraphs.push([]);

      return;
    }

    if (isBreak && isPreviousBreak) {
      return;
    }

    paragraphs.at(-1)?.push(node);
  });

  return paragraphs.filter((paragraph) => paragraph.length > 0);
}

/**
 * Пункты списка: `{@li}`, вложенные `{@list}` (уходят в предыдущий пункт)
 * и пункты-массивы из структурного хранения.
 * @param node - маркер списка
 */
function listNode(node: MarkerNode): ContentNode {
  const items: Array<ContentElementNode> = [];

  for (const child of node.content ?? []) {
    if (isMarkerNode(child) && child.type === 'list') {
      const nested = listNode(child);
      const previous = items.at(-1);

      if (previous) {
        previous.children.push(nested);
      } else {
        items.push(element('li', {}, [nested]));
      }

      continue;
    }

    const content =
      isMarkerNode(child) && child.type === 'li'
        ? (child.content ?? [])
        : [child];

    items.push(element('li', {}, cellContent(content)));
  }

  const tag = readAttribute(node, 'type') === 'ordered' ? 'ol' : 'ul';

  return element(tag, {}, items);
}

/**
 * Содержимое ячейки или пункта без заглушки пустой ячейки.
 * @param nodes - узлы разметки
 */
function cellContent(nodes: ReadonlyArray<RenderNode>): Array<ContentNode> {
  return inlineNodes(nodes).filter(
    (node) => !(node.kind === 'text' && node.text === MARKUP_CELL_PLACEHOLDER),
  );
}

/**
 * Читает массив из структурного поля узла таблицы.
 * @param node - узел таблицы
 * @param field - имя поля
 */
function readArrayField(node: MarkerNode, field: string): Array<unknown> {
  if (!(field in node)) {
    return [];
  }

  const value: unknown = Reflect.get(node, field);

  return Array.isArray(value) ? value : [];
}

/**
 * Узлы разметки из значения структурной таблицы (подпись, заголовок, ячейка).
 * @param value - значение поля
 */
function toRenderNodes(value: unknown): Array<RenderNode> {
  if (Array.isArray(value)) {
    return value.filter(
      (item: unknown): item is RenderNode =>
        typeof item === 'string'
        || isMarkerNode(item)
        || isSimpleTextNode(item),
    );
  }

  return typeof value === 'string' ? [value] : [];
}

/**
 * Ячейка тела таблицы: `{ content, align }` из разбора `{@table}`.
 * @param cell - ячейка
 */
function bodyCell(cell: unknown): ContentNode {
  if (typeof cell !== 'object' || cell === null || !('content' in cell)) {
    return element('td', {}, cellContent(toRenderNodes(cell)));
  }

  const align =
    'align' in cell && typeof cell.align === 'string' ? cell.align : '';

  const attributes = alignStyle(align);

  return element('td', attributes, cellContent(toRenderNodes(cell.content)));
}

/**
 * Таблица `{@table}`: структурный узел парсера (caption, colLabels, colAligns, rows)
 * → таблица в обёртке, как в HTML старой базы.
 * @param node - узел таблицы
 */
function tableNode(node: MarkerNode): ContentNode {
  const parts: Array<ContentNode> = [];

  const caption =
    'caption' in node ? toRenderNodes(Reflect.get(node, 'caption')) : [];

  if (caption.length > 0) {
    parts.push(element('caption', {}, inlineNodes(caption)));
  }

  const labels = readArrayField(node, 'colLabels');
  const aligns = readArrayField(node, 'colAligns');

  if (labels.length > 0) {
    const headerCells = labels.map((label, index) => {
      const align = aligns[index];

      const attributes = alignStyle(align);

      return element('th', attributes, cellContent(toRenderNodes(label)));
    });

    parts.push(element('thead', {}, [element('tr', {}, headerCells)]));
  }

  const rows = readArrayField(node, 'rows').map((row) =>
    element(
      'tr',
      {},
      Array.isArray(row) ? row.map((cell: unknown) => bodyCell(cell)) : [],
    ),
  );

  parts.push(element('tbody', {}, rows));

  return element('div', { class: MARKUP_TABLE_WRAPPER_CLASS }, [
    element('table', { class: MARKUP_TABLE_CLASS }, parts),
  ]);
}

/**
 * Блочный маркер разметки → узел контента.
 * @param node - блочный маркер
 */
function blockNode(node: MarkerNode): ContentNode | undefined {
  switch (node.type) {
    case 'heading': {
      const level =
        clampHeadingLevel(node.attrs?.level) + MARKUP_HEADING_TAG_OFFSET;

      return element(
        `h${level}`,
        alignAttributes(node),
        inlineNodes(node.content ?? []),
      );
    }
    case 'paragraph':
      return element(
        'p',
        alignAttributes(node),
        inlineNodes(node.content ?? []),
      );
    case 'separator':
      return element('hr', {}, []);
    case 'quote':
      return element(
        'blockquote',
        {},
        splitQuoteParagraphs(node.content ?? []).map((paragraph) =>
          element('p', {}, inlineNodes(paragraph)),
        ),
      );
    case 'list':
      return listNode(node);
    case 'table':
      return tableNode(node);
    default:
      return undefined;
  }
}

/**
 * Один блок описания: блочные маркеры — сами по себе, подряд идущий строчный
 * текст — абзацем.
 * @param block - строка-блок разметки
 */
function blockToContent(block: string): Array<ContentNode> {
  const result: Array<ContentNode> = [];

  let inlineRun: Array<RenderNode> = [];

  /** Закрывает накопленный строчный текст абзацем. */
  const flush = (): void => {
    const children = inlineNodes(inlineRun);

    inlineRun = [];

    if (children.length > 0) {
      result.push(element('p', {}, children));
    }
  };

  for (const node of parse(block)) {
    const blockContent =
      isMarkerNode(node) && isBlockNode(node) ? blockNode(node) : undefined;

    if (blockContent) {
      flush();
      result.push(blockContent);
    } else {
      inlineRun.push(node);
    }
  }

  flush();

  return result;
}

/**
 * Описание в разметке core-api (массив строк-блоков) → дерево контента, которое
 * выводит `ContentRender`: ссылки на разделы — с подсказками сущностей, броски —
 * компонентом броска, таблицы — как в HTML старой базы.
 * @param blocks - блоки описания
 */
export function markupToContent(
  blocks: ReadonlyArray<string>,
): Array<ContentNode> {
  return blocks.flatMap((block) => blockToContent(block));
}

/**
 * Как `markupToContent`, но для вывода внутри строки (например в `<p>`): абзацы
 * разворачиваются и разделяются переносом, блоки остаются как есть.
 * @param blocks - блоки описания
 */
export function markupToInlineContent(
  blocks: ReadonlyArray<string>,
): Array<ContentNode> {
  return markupToContent(blocks).flatMap((node, index) => {
    const separator: Array<ContentNode> =
      index > 0 ? [element('br', {}, [])] : [];

    return node.kind === 'element' && node.tag === 'p'
      ? [...separator, ...node.children]
      : [...separator, node];
  });
}

/**
 * Маркер ссылки на запись сайта по её адресу — обратное к выводу ссылок:
 * `/spells/fireball` → `{@spell … | url:fireball}`, `/items/magic/x` →
 * `magicItem`. Адрес вне разделов с маркером (правила, боги, ширма) и
 * внешний адрес остаются ссылкой `{@link … | url:…}`.
 * @param href - адрес записи, например из поиска по сайту
 */
export function toMarkupLink(href: string): { type: string; url: string } {
  let best: { type: string; url: string } | undefined;
  let bestLength = 0;

  // Самый длинный подходящий раздел: `/items/magic/` раньше `/items/`
  for (const [type, { path }] of MARKUP_SECTION_LINKS) {
    const rest = href.slice(path.length);

    if (href.startsWith(path) && rest && path.length > bestLength) {
      best = { type, url: rest };
      bestLength = path.length;
    }
  }

  return best ?? { type: MARKUP_LINK_TYPE, url: href };
}
