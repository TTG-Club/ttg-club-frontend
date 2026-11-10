import type { RenderNode } from './types';

import { LEADING_CHARACTER } from './consts';
import { parse } from './parser';
import { getNodeText, isRenderNodeValue } from './utils';

/**
 * Разворачивает хранимое описание из ответа API.
 *
 * Бэкенд отдаёт описание по-разному: готовым деревом, строкой разметки или
 * JSON-строкой хранения вида `["абзац", {"type":"list",…}]`. JSON-строку
 * разворачиваем в массив — каждый элемент верхнего уровня рисуется отдельным
 * абзацем или блоком, а строчные маркеры внутри абзаца остаются в нём. Иначе
 * на странице были бы видны скобки и кавычки.
 *
 * @param value - Поле описания из ответа API
 * @returns Описание для MarkupRender
 */
export function parseStoredMarkup(
  value: RenderNode,
): RenderNode | Array<RenderNode> {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  const looksLikeJson =
    trimmed.startsWith('[')
    || (trimmed.startsWith('{')
      && !trimmed.startsWith(`{${LEADING_CHARACTER}`));

  if (!looksLikeJson) {
    return value;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.filter((entry: unknown) => isRenderNodeValue(entry));
    }

    return isRenderNodeValue(parsed) ? parsed : value;
  } catch {
    // Обычный текст, похожий на JSON (например «[15]»), остаётся как есть
    return value;
  }
}

/**
 * Читаемый текст описания без маркеров: строки разбираются так же, как при
 * отрисовке, абзацы разделяются пробелом.
 *
 * @param value - Описание после `parseStoredMarkup`
 * @returns Текст описания
 */
export function getMarkupText(value: RenderNode | Array<RenderNode>): string {
  const entries = Array.isArray(value) ? value : [value];

  return entries
    .map((entry) =>
      typeof entry === 'string'
        ? getNodeText(parse(entry))
        : getNodeText(entry),
    )
    .join(' ')
    .trim();
}
