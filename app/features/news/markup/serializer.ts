import type { MarkerAttributes, MarkerNode } from './types';

import { MARKER_MAP } from './config';
import { CELL_PLACEHOLDER } from './consts';
import { isMarkerNode, isSimpleTextNode } from './utils';

/**
 * Сериализует атрибуты маркера в хвост `| key:value | key:value`.
 *
 * Значения выводятся «как есть» (`String(value)`), чтобы при обратном разборе
 * `parseAttrValue` (JSON.parse c фолбэком в строку) вернул тот же тип:
 * число → число, `true`/`false` → boolean, произвольная строка → строка.
 *
 * @param attrs - Атрибуты маркера
 * @returns Строка вида ` | k:v` либо пустая строка
 */
function serializeAttrs(attrs: MarkerAttributes | undefined): string {
  if (!attrs) {
    return '';
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    parts.push(`${key}:${String(value)}`);
  }

  return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Сериализует узел-маркер обратно в синтаксис `{@type ...}`.
 *
 * Используется канонический `type` — парсер принимает его как алиас, поэтому
 * результат гарантированно разбирается обратно.
 */
function serializeMarker(node: MarkerNode): string {
  const config = MARKER_MAP.get(node.type);

  // Пустой маркер (break) — без текста и атрибутов. Отдаём под алиасом `{@br}`
  // (как хранит бэкенд), а не каноническим `{@break}`, чтобы не плодить
  // рассинхрон при round-trip и не нормализовать его потом вручную.
  if (config?.isEmpty) {
    return `{@${config.aliases?.[0] ?? node.type}}`;
  }

  // Список: каждый пункт оборачиваем в {@li ...}. Бэкенд-AST хранит пункты как
  // массивы-батчи ([[...], [...]]); вложенный {@list} и уже готовые {@li}
  // сериализуем как есть.
  if (node.type === 'list') {
    const items = serializeListItems(node.content ?? []);
    const attrs = serializeAttrs(node.attrs);

    return `{@list ${items}${attrs}}`;
  }

  // Таблица: и бэкенд-AST (caption/colLabels/colStyles/rows), и разобранная
  // строка-{@table} дают одну структуру — сериализуем в {@table {@tr {@th}}…},
  // которую парсер снова разберёт в ту же таблицу.
  if (node.type === 'table') {
    return serializeTable(node);
  }

  // Цитата: бэкенд-AST хранит content как МАССИВ-МАССИВОВ (каждый вложенный
  // массив — абзац), разобранная строка-{@quote} — как плоский инлайн. Абзацы
  // соединяем `{@br}{@br}` (граница), внутри абзаца — как есть. НИКАКИХ `\n`
  // внутри маркера (бэкенд бьёт описание по `\n\n`).
  if (node.type === 'quote') {
    return serializeQuote(node);
  }

  // Контент маркера — инлайновый, соединяем без разделителя.
  const content = node.content ? serializeNodes(node.content) : '';
  const attrs = serializeAttrs(node.attrs);

  return `{@${node.type} ${content}${attrs}}`;
}

/**
 * Сериализует пункты списка в цепочку `{@li ...}{@li ...}`. Пункт-батч (массив)
 * оборачивается в `{@li}`; вложенный `{@list}` и готовый `{@li}` — как есть.
 */
function serializeListItems(items: unknown[]): string {
  return items
    .map((item) => {
      if (isMarkerNode(item) && (item.type === 'list' || item.type === 'li')) {
        return serializeMarker(item);
      }

      const inner = Array.isArray(item)
        ? serializeNodes(item)
        : serializeMarkup(item);

      return `{@li ${inner}}`;
    })
    .join('');
}

/** Узел таблицы со структурными полями (сверх MarkerNode) — из бэкенда/парсера. */
interface TableLikeNode extends MarkerNode {
  caption?: unknown;
  colLabels?: unknown[];
  colStyles?: string[];
  colAligns?: string[];
  rows?: unknown[][];
}

/** Инлайн-сериализация содержимого ячейки (join БЕЗ разделителя, не `\n\n`). */
function serializeInline(value: unknown): string {
  return Array.isArray(value)
    ? value.map((node) => serializeMarkup(node)).join('')
    : serializeMarkup(value);
}

/** Тело ячейки; пустое → placeholder (иначе {@td} упадёт в convertMarker). */
function cellBody(value: unknown): string {
  return serializeInline(value).trim() || CELL_PLACEHOLDER;
}

/** Нормализует legacy-ячейку (string|number|RenderNode|{content,align}). */
function normalizeCellInner(cell: unknown): { inner: unknown; align?: string } {
  if (
    typeof cell === 'object'
    && cell !== null
    && !Array.isArray(cell)
    && 'content' in cell
    && !('type' in cell)
  ) {
    const align =
      'align' in cell && typeof cell.align === 'string'
        ? cell.align
        : undefined;

    return { inner: cell.content, align };
  }

  return { inner: cell };
}

/** Сериализует структурную таблицу в строку `{@table {@tr {@th}}{@tr {@td}}…}`. */
function serializeTable(node: TableLikeNode): string {
  const parts: string[] = [];

  if (node.caption != null) {
    const caption = serializeInline(node.caption).trim();

    if (caption) {
      parts.push(`{@caption ${caption}}`);
    }
  }

  const colLabels = node.colLabels ?? [];
  const colStyles = node.colStyles ?? [];
  const colAligns = node.colAligns ?? [];

  if (colLabels.length) {
    const th = colLabels
      .map((label, index) => {
        const style = colStyles[index] ? ` | style:${colStyles[index]}` : '';
        const align = colAligns[index] ? ` | align:${colAligns[index]}` : '';

        return `{@th ${cellBody(label)}${style}${align}}`;
      })
      .join('');

    parts.push(`{@tr ${th}}`);
  }

  for (const row of node.rows ?? []) {
    const td = (row ?? [])
      .map((cell) => {
        const { inner, align } = normalizeCellInner(cell);
        const alignAttr = align ? ` | align:${align}` : '';

        return `{@td ${cellBody(inner)}${alignAttr}}`;
      })
      .join('');

    parts.push(`{@tr ${td}}`);
  }

  return `{@table ${parts.join('')}}`;
}

/**
 * Сериализует цитату в `{@quote абзац{@br}{@br}абзац | color:… | variant:…}`.
 * Бэкенд-AST хранит content массивом-массивов (каждый вложенный массив — абзац);
 * разобранная строка-{@quote} — плоский инлайн. Абзацы соединяем `{@br}{@br}`.
 * Ни одного `\n` внутри маркера.
 */
function serializeQuote(node: MarkerNode): string {
  const blocks: unknown[] = Array.isArray(node.content) ? node.content : [];

  const isBatches =
    blocks.length > 0 && blocks.every((block) => Array.isArray(block));

  const paragraphs = isBatches
    ? blocks.map((batch) =>
        serializeNodes(Array.isArray(batch) ? batch : [batch]),
      )
    : [serializeNodes(blocks)];

  return `{@quote ${paragraphs.join('{@br}{@br}')}${serializeAttrs(node.attrs)}}`;
}

/**
 * Сериализует массив узлов, соединяя результат заданным разделителем.
 *
 * @param nodes - Узлы для сериализации
 * @param separator - Разделитель (для инлайн-контента `''`, для блочных групп
 *   верхнего уровня `\n\n`)
 */
function serializeNodes(nodes: unknown[], separator = ''): string {
  return nodes.map((node) => serializeMarkup(node)).join(separator);
}

/**
 * Преобразует узел разметки (`RenderNode`) обратно в строку формата
 * «Markdown + маркеры {@...}». Обратный к `parse()`.
 *
 * Принимает `unknown`, чтобы безопасно обрабатывать данные с бэкенда (строка,
 * разобранный AST-объект/массив или мусор) — неизвестные значения дают пустую
 * строку, а не падение.
 *
 * @param node - Узел или дерево узлов разметки
 * @returns Исходная строка разметки
 */
export function serializeMarkup(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    // Массив верхнего уровня — это блочные группы (каждый элемент MarkupRender
    // рисует отдельным блоком). Разделяем пустой строкой-абзацем, иначе абзацы
    // склеятся в один при обратном разборе.
    return serializeNodes(node, '\n\n');
  }

  if (isSimpleTextNode(node)) {
    return node.text;
  }

  if (isMarkerNode(node)) {
    return serializeMarker(node);
  }

  return '';
}

/**
 * Приводит «сырое» значение описания с бэкенда к строке-исходнику для правки.
 *
 * Обрабатывает три формы хранения: обычную строку «Markdown + {@...}»,
 * разобранный AST (объект/массив) и строку, в которую AST был сериализован как
 * JSON (например `["{@i ...}"]`) — такую строку разворачиваем и сериализуем.
 *
 * @param value - Значение поля описания (string | RenderNode | JSON-строка)
 * @returns Строка-исходник разметки
 */
export function toMarkupSource(value: unknown): string {
  if (typeof value !== 'string') {
    return serializeMarkup(value);
  }

  const trimmed = value.trim();

  // Похоже на JSON-обёртку над AST (массив узлов/строк или узел-объект), которую
  // иногда присылает бэкенд. Маркеры {@...} валидным JSON не являются — их не
  // трогаем (и не гоняем на них JSON.parse на каждом чтении геттера).
  const looksLikeJson =
    (trimmed.startsWith('[') || trimmed.startsWith('{'))
    && !trimmed.startsWith('{@');

  if (looksLikeJson) {
    try {
      const parsed: unknown = JSON.parse(trimmed);

      // Пустой AST-массив `[]` — это естественная сериализация ПУСТОГО описания
      // (JSON.stringify пустого дерева). Возвращаем пустую строку, а не
      // литерал «[]».
      if (Array.isArray(parsed) && parsed.length === 0) {
        return '';
      }

      const serialized = serializeMarkup(parsed);

      // Разворачиваем ТОЛЬКО если получилось непустое содержимое. Иначе это
      // обычный текст, случайно являющийся валидным JSON (например «[15]», «{}»,
      // «[true]») — его нельзя стирать, оставляем как есть.
      if (serialized) {
        return serialized;
      }
    } catch {
      // Не JSON — это обычный Markdown/маркеры, оставляем как есть.
    }
  }

  return value;
}
