import type {
  HeadingLevel,
  MarkerAttributes,
  MarkerNode,
  RenderNode,
  SimpleTextNode,
} from './types';

import { consola } from 'consola';

import { MARKER_MAP } from './config';
import { SECTION_LINK_PATHS } from './consts';

/**
 * Логирует ошибку с контекстом разметки.
 *
 * @param context - Контекст возникновения ошибки (например, имя компонента)
 * @param message - Сообщение об ошибке
 * @param data - Дополнительные данные для отладки
 */
export function logError(
  context: string,
  message: string,
  data?: unknown,
): void {
  consola.error(`[Markup ${context}]`, message, data);
}

/**
 * Клампит пользовательский уровень заголовка в 1–4 (1 — крупный … 4 —
 * минимальный). Нечисловое или пустое значение сводится к 1.
 *
 * @param value - Сырое значение уровня (атрибут `level`, любого типа)
 * @returns Уровень в диапазоне 1–4
 */
export function clampHeadingLevel(value: unknown): HeadingLevel {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  const clamped = Number.isNaN(parsed) ? 1 : Math.min(4, Math.max(1, parsed));

  switch (clamped) {
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    default:
      return 1;
  }
}

/**
 * Проверяет, является ли узел простым текстовым узлом.
 *
 * @param node - Узел для проверки
 * @returns true, если узел является SimpleTextNode
 */
export function isSimpleTextNode(node: unknown): node is SimpleTextNode {
  return (
    typeof node === 'object'
    && node !== null
    && !Array.isArray(node)
    && 'type' in node
    && node.type === 'text'
  );
}

/**
 * Проверяет, является ли узел узлом разметки (маркером).
 *
 * @param node - Узел для проверки
 * @returns true, если узел является MarkerNode
 */
export function isMarkerNode(node: unknown): node is MarkerNode {
  return (
    typeof node === 'object'
    && node !== null
    && !Array.isArray(node)
    && 'type' in node
    && typeof node.type === 'string'
    && node.type !== 'text'
  );
}

/**
 * Проверяет, является ли узел блочным элементом.
 *
 * @param node - Узел для проверки
 * @returns true, если узел является блочным элементом
 */
export function isBlockNode(node: unknown): boolean {
  if (!isMarkerNode(node)) {
    return false;
  }

  const config = MARKER_MAP.get(node.type);

  return config?.isBlock === true;
}

/**
 * Рекурсивно извлекает текстовое содержимое из узла рендеринга.
 *
 * @param node - Узел или массив узлов
 * @returns Строковое представление содержимого
 */
export function getNodeText(node: RenderNode | RenderNode[]): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join('');
  }

  if (isSimpleTextNode(node)) {
    return node.text;
  }

  if (
    typeof node === 'object'
    && node !== null
    && 'content' in node
    && Array.isArray(node.content)
  ) {
    return node.content.map((child) => getNodeText(child)).join('');
  }

  return '';
}

/**
 * Путь записи раздела на новом сайте для ссылки вида `{@spell ... | url:...}`.
 *
 * @param node - Маркер ссылки на раздел
 * @returns Путь от корня сайта или пустая строка, если тип незнаком или нет адреса
 */
export function getSectionLinkPath(node: MarkerNode): string {
  const url = node.attrs?.url?.toString() ?? '';
  const section = SECTION_LINK_PATHS.get(node.type);

  return section && url ? `/${section}/${url}` : '';
}

/**
 * Приводит адрес из текста новости к адресу на новом сайте: относительный путь
 * дописывается к его origin, полный адрес остаётся как есть.
 *
 * @param url - Адрес из разметки
 * @param newSiteUrl - Origin нового сайта без завершающего слэша
 * @returns Полный адрес или пустая строка для пустого адреса
 */
export function toNewSiteUrl(url: string, newSiteUrl: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed, `${newSiteUrl}/`).toString();
  } catch {
    return '';
  }
}

/** Ячейка таблицы, приведённая к узлам разметки. */
export interface MarkupTableCell {
  content: RenderNode[];
  align?: string;
}

/**
 * Проверяет, похоже ли значение на узел разметки.
 *
 * @param value - Произвольное значение из JSON таблицы
 * @returns Является ли значение узлом разметки
 */
function isRenderNodeValue(value: unknown): value is RenderNode {
  return (
    typeof value === 'string'
    || Array.isArray(value)
    || (typeof value === 'object'
      && value !== null
      && 'type' in value
      && typeof value.type === 'string')
  );
}

/**
 * Приводит строки таблицы из JSON к массивам ячеек; всё, что не массив,
 * отбрасывается.
 *
 * @param rows - Поле `rows` узла таблицы
 * @returns Строки таблицы
 */
export function normalizeTableRows(rows: unknown): Array<Array<unknown>> {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter((row): row is Array<unknown> => Array.isArray(row));
}

/**
 * Приводит ячейку таблицы к узлам разметки: число и строка становятся текстом,
 * объект `{ content, align }` остаётся с выравниванием, узел — узлом.
 *
 * @param value - Ячейка из строки таблицы
 * @returns Содержимое ячейки и её выравнивание
 */
export function normalizeTableCell(value: unknown): MarkupTableCell {
  if (typeof value === 'string' || typeof value === 'number') {
    return { content: [String(value)] };
  }

  if (
    typeof value === 'object'
    && value !== null
    && !('type' in value)
    && 'content' in value
    && Array.isArray(value.content)
  ) {
    const align =
      'align' in value && typeof value.align === 'string'
        ? value.align
        : undefined;

    return {
      content: value.content.filter((item: unknown) => isRenderNodeValue(item)),
      align,
    };
  }

  return isRenderNodeValue(value) ? { content: [value] } : { content: [] };
}

/**
 * Выбирает значение атрибута маркера из допустимых вариантов: незнакомое или
 * пустое значение заменяется значением по умолчанию.
 *
 * @param value - Значение атрибута из разметки
 * @param options - Допустимые значения
 * @param fallback - Значение по умолчанию
 * @returns Допустимое значение
 */
export function pickMarkupOption<T extends string>(
  value: MarkerAttributes[string] | undefined,
  options: ReadonlyArray<T>,
  fallback: T,
): T {
  return options.find((option) => option === value) ?? fallback;
}
