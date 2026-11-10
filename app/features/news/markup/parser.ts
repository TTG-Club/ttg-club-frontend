import type {
  MarkerAttributes,
  MarkerNode,
  RenderNode,
  SimpleTextNode,
} from './types';

import { MARKER_ALIASES, MARKER_ALIASES_LOWERCASE, MARKER_MAP } from './config';
import { LEADING_CHARACTER, MAX_DEPTH, MAX_STRING_LENGTH } from './consts';
import { logError } from './utils';

export function parse(text: string): RenderNode[] {
  if (text.length > MAX_STRING_LENGTH) {
    logError('Parser', 'String is too long', { text });

    return [];
  }

  try {
    const depth = 0;

    return recursiveParse(text, depth);
  } catch (err) {
    logError('Parser', 'Unexpected error', { text, err });

    return [];
  }
}

function recursiveParse(text: string, depth: number): RenderNode[] {
  if (depth > MAX_DEPTH) {
    logError('Parser', 'Maximum nesting depth exceeded', { text });

    return [];
  }

  let tagSplit: string[];

  try {
    tagSplit = splitByMarkers(text);
  } catch (err) {
    logError('Parser', 'Splitting error', { text, err });

    return [];
  }

  const len = tagSplit.length;
  const result: RenderNode[] = [];

  for (let i = 0; i < len; ++i) {
    const str = tagSplit[i];

    if (!str) {
      continue;
    }

    try {
      if (str.startsWith(`{${LEADING_CHARACTER}`)) {
        const markerStr = str.slice(1, -1);
        const marker = convertMarker(markerStr, depth);

        result.push(marker);
      } else {
        result.push(convertText(str));
      }
    } catch (err) {
      logError('Parser', 'Converting error', { str, err });

      // Разобрать маркер не удалось (неизвестное имя, битые атрибуты) —
      // оставляем хотя бы его текст. Молчаливый пропуск вырезал бы кусок
      // предложения вместе со знаками препинания вокруг.
      const fallback = recoverMarkerText(str, depth);

      if (fallback.length) {
        result.push(...fallback);
      }
    }
  }

  return result;
}

/**
 * Достаёт из неразобранного чанка его текст, чтобы предложение не осталось
 * с дырой.
 *
 * `{@name текст | attr:value}` даёт «текст»: имя маркера и хвост атрибутов
 * пользователю не нужны, а вложенные маркеры внутри разбираются обычным
 * путём. Не-маркерный чанк возвращается как есть.
 *
 * @param chunk - Чанк, на котором споткнулся разбор
 * @param depth - Текущая глубина рекурсии
 * @returns Узлы с текстом маркера либо пустой массив, если текста не было
 */
function recoverMarkerText(chunk: string, depth: number): RenderNode[] {
  if (!chunk.startsWith(`{${LEADING_CHARACTER}`) || !chunk.endsWith('}')) {
    return chunk.trim() ? [{ type: 'text', text: chunk }] : [];
  }

  const { text: rawName, rest } = splitFirstSpace(chunk.slice(1, -1));

  // Имени нет вовсе (`{@ i текст}` — лишний пробел после «@»): без него
  // неясно, где кончается имя и начинается текст, и восстановление вывело
  // бы обрубок имени как прозу. Такой чанк отбрасываем целиком.
  if (!rawName.replace(/^@/, '')) {
    return [];
  }

  // Берётся только часть до первого `|`. Хвост — это либо атрибуты, либо
  // ссылочный ключ (`{@book Название|dmg}`), и ни то ни другое пользователю
  // показывать не нужно. Литеральный `|` внутри текста неизвестного маркера
  // при этом теряется, но отличить его от ключа нечем: `splitAttrs`
  // бросает одинаково на «dmg» и на «10».
  const { text } = splitByPipeBase(rest);

  if (!text?.trim()) {
    return [];
  }

  try {
    return recursiveParse(text, depth + 1);
  } catch {
    return [{ type: 'text', text }];
  }
}

function convertMarker(string: string, depth: number): MarkerNode {
  const { text: rawMarker, rest } = splitFirstSpace(string);
  const name = rawMarker.replace(/^@/, '');

  // Регистр имени не важен: в данных попадается `{@I ...}` вместо
  // `{@i ...}`, и без этого маркер считался бы неизвестным.
  const marker =
    MARKER_ALIASES.get(name)
    ?? MARKER_ALIASES_LOWERCASE.get(name.toLowerCase());

  if (!marker) {
    throw new Error(`Unknown marker: ${rawMarker}`);
  }

  const config = MARKER_MAP.get(marker);

  if (!config) {
    throw new Error(`Unknown marker type: ${marker}`);
  }

  // Empty маркер (break)
  if (config.isEmpty) {
    return { type: marker };
  }

  // Таблица: разбираем {@caption}/{@tr}/{@th}/{@td} ЛОКАЛЬНО в ту же структуру,
  // что присылает бэкенд-JSON (caption/colLabels/colStyles/rows), — чтобы
  // MarkupTable рендерил строку-{@table} без изменений.
  if (marker === 'table') {
    return buildTableNode(rest, depth);
  }

  // Разделитель `{@separator}` — блочный маркер БЕЗ текста (только атрибуты
  // оформления, например `| color:...`). Разбираем локально: иначе проверка
  // `if (!text)` ниже бросит «must have text», и разделитель потеряется при
  // разборе строки-исходника (в узловой форме он приходит без текста).
  if (marker === 'separator') {
    return { type: marker, attrs: safeAttrs(splitByPipeBase(rest).params) };
  }

  const { text, params } = splitByPipeBase(rest);

  if (!text) {
    throw new Error(
      `${marker.charAt(0).toUpperCase() + marker.slice(1)} marker must have text`,
    );
  }

  let attrs: MarkerAttributes | undefined;
  let contentSource = text;

  try {
    attrs = splitAttrs(params);
  } catch (err) {
    // Атрибуты не распарсились: скорее всего `|` — это часть текста, а не
    // разделитель key:value (например форматирующий маркер над текстом
    // «5 | 10»).
    // Не теряем маркер целиком — трактуем всё тело как контент, `|` остаётся
    // литеральным. Так текст не пропадает со страницы.
    logError('Parser', 'Invalid attributes, treating body as content', {
      rest,
      err,
    });

    attrs = undefined;
    contentSource = rest;
  }

  return {
    type: marker,
    attrs,
    content: recursiveParse(contentSource, depth + 1),
  };
}

/** Разбирает верхнеуровневый чанк `{@name body}` на имя и тело. */
function readMarker(chunk: string): { name: string; body: string } {
  const inner = chunk.slice(1, -1); // срезаем внешние { }
  const { text: rawName, rest } = splitFirstSpace(inner);

  return { name: rawName.replace(/^@/, ''), body: rest };
}

/** splitAttrs, который не бросает (кривые атрибуты ячейки не рушат таблицу). */
function safeAttrs(params: string[]): MarkerAttributes | undefined {
  try {
    return splitAttrs(params);
  } catch {
    return undefined;
  }
}

/** Структурная ячейка тела таблицы. */
interface TableBodyCell {
  content: RenderNode[];
  align?: string;
}

/**
 * Узел таблицы: `MarkerNode` + структурные поля (сверх маркера), которые читает
 * MarkupTable (его локальный TableNode). Форма совпадает с бэкенд-AST.
 */
interface TableNode extends MarkerNode {
  caption?: RenderNode[];
  colLabels?: RenderNode[][];
  colStyles?: string[];
  colAligns?: string[];
  rows?: TableBodyCell[][];
}

/**
 * Строит структурный узел таблицы из тела `{@table …}`. Строка-заголовок — это
 * `{@tr}`, чьи ячейки `{@th}` → colLabels/colStyles; прочие `{@tr}` из
 * `{@td}` → rows. Форма идентична бэкенд-AST, поэтому MarkupTable не
 * меняется. Содержимое ячеек и подписи разбираются рекурсивно (внутри
 * может быть {@dice}, {@creature}…).
 */
function buildTableNode(rest: string, depth: number): MarkerNode {
  const { text } = splitByPipeBase(rest); // params таблицы зарезервированы
  const children = text ? splitByMarkers(text) : [];

  let caption: RenderNode[] | undefined;

  const colLabels: RenderNode[][] = [];
  const colStyles: string[] = [];
  const colAligns: string[] = [];
  const rows: TableBodyCell[][] = [];

  for (const child of children) {
    const chunk = child.trim();

    if (!chunk.startsWith(`{${LEADING_CHARACTER}`)) {
      continue; // пробелы между маркерами
    }

    const { name, body } = readMarker(chunk);

    if (name === 'caption') {
      const { text: capText } = splitByPipeBase(body);

      caption = recursiveParse(capText ?? '', depth + 1);

      continue;
    }

    if (name !== 'tr') {
      continue;
    }

    const { text: rowText } = splitByPipeBase(body);
    const cells = rowText ? splitByMarkers(rowText) : [];

    const bodyCells: TableBodyCell[] = [];

    let isHeaderRow = false;

    for (const cell of cells) {
      const cellChunk = cell.trim();

      if (!cellChunk.startsWith(`{${LEADING_CHARACTER}`)) {
        continue;
      }

      const { name: cellName, body: cellBody } = readMarker(cellChunk);

      if (cellName !== 'th' && cellName !== 'td') {
        continue;
      }

      const { text: cellText, params } = splitByPipeBase(cellBody);
      const attrs = safeAttrs(params);

      // Атрибуты не распарсились (например ячейка «5 | 10») — значит `|`
      // литеральный: весь текст ячейки идёт в контент, чтобы не потерять часть
      // после `|` (иначе от «5 | 10» осталось бы только «5»). Ср.
      // convertMarker.
      const content =
        attrs || params.length === 0
          ? recursiveParse(cellText ?? '', depth + 1)
          : recursiveParse(cellBody, depth + 1);

      if (cellName === 'th') {
        isHeaderRow = true;
        colLabels.push(content);
        colStyles.push(typeof attrs?.style === 'string' ? attrs.style : '');
        colAligns.push(typeof attrs?.align === 'string' ? attrs.align : '');
      } else {
        bodyCells.push({
          content,
          align: typeof attrs?.align === 'string' ? attrs.align : undefined,
        });
      }
    }

    if (!isHeaderRow) {
      rows.push(bodyCells);
    }
  }

  // Доп. поля (caption/colLabels/colStyles/rows) — сверх MarkerNode; их читает
  // MarkupTable. Возвращаем как MarkerNode (доп. поля присутствуют в рантайме).
  const node: TableNode = {
    type: 'table',
    caption,
    colLabels: colLabels.length ? colLabels : undefined,
    colStyles: colStyles.length ? colStyles : undefined,
    colAligns: colAligns.length ? colAligns : undefined,
    rows,
  };

  return node;
}

function convertText(text: string | undefined): SimpleTextNode {
  if (!text) {
    throw new Error(`Text marker must have text`);
  }

  return {
    type: 'text',
    text,
  };
}

function splitByMarkers(source: string): string[] {
  let acc = '';
  let level = 0;

  const result: string[] = [];

  for (let i = 0; i < source.length; i++) {
    // Открытие маркера
    if (source[i] === '{' && source[i + 1] === LEADING_CHARACTER) {
      if (level++ === 0 && acc) {
        result.push(acc);
        acc = '';
      }

      acc += `{${LEADING_CHARACTER}`;
      i++;

      continue;
    }

    // Закрытие маркера
    if (source[i] === '}') {
      acc += '}';

      if (level && --level === 0) {
        result.push(acc);
        acc = '';
      }

      continue;
    }

    acc += source[i];
  }

  if (acc) {
    result.push(acc);
  }

  return result;
}

function splitByPipeBase(input: string): { text?: string; params: string[] } {
  let acc = '';
  let level = 0;

  const params: string[] = [];

  let text: string | undefined;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const isMarkerOpen = char === '{' && input[i + 1] === LEADING_CHARACTER;

    if (isMarkerOpen) {
      level++;
      acc += `{${LEADING_CHARACTER}`;
      i++;

      continue;
    }

    if (char === '}') {
      acc += '}';

      if (level) {
        --level;
      }

      continue;
    }

    // Основная логика: разделитель pipe, если не во вложенностях
    if (char === '|' && level === 0) {
      if (text === undefined) {
        text = acc.trim();
      } else {
        params.push(acc.trim());
      }

      acc = '';
    } else {
      acc += char;
    }
  }

  if (acc) {
    if (text === undefined) {
      text = acc.trim();
    } else {
      params.push(acc.trim());
    }
  }

  return { text, params };
}

function splitFirstSpace(string: string): { text: string; rest: string } {
  const index = string.indexOf(' ');

  if (index < 0) {
    return { text: string, rest: '' };
  }

  return {
    text: string.substring(0, index),
    rest: string.substring(index + 1),
  };
}

function splitAttrs(params: string[]): MarkerAttributes | undefined {
  if (!params.length) {
    return undefined;
  }

  const attrs: MarkerAttributes = {};

  for (const param of params) {
    const index = param.includes(':') ? param.indexOf(':') : param.indexOf('=');

    if (index < 0) {
      throw new Error(`Attribute must have value: ${param}`);
    }

    const name = param.substring(0, index);

    if (!name) {
      throw new Error(`Attribute name is required: ${param}`);
    }

    const value = param.substring(index + 1);

    if (!value) {
      throw new Error(`Attribute value is required: ${name}`);
    }

    attrs[name] = parseAttrValue(value);
  }

  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

function parseAttrValue(attrValue: string): string | number | boolean | null {
  try {
    return JSON.parse(attrValue);
  } catch (err) {
    return attrValue;
  }
}
