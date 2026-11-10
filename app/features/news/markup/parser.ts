import type {
  MarkerAttributes,
  MarkerNode,
  RenderNode,
  SimpleTextNode,
} from './types';

import { MARKER_ALIASES, MARKER_ALIASES_LOWERCASE, MARKER_MAP } from './config';
import { LEADING_CHARACTER, MAX_DEPTH, MAX_STRING_LENGTH } from './consts';
import { logError } from './utils';

/**
 * Разбирает строку разметки `{@...}` в дерево узлов. Слишком длинная или
 * битая строка не роняет страницу — ошибка пишется в лог, текст пропадает.
 *
 * @param text - Строка разметки
 * @returns Узлы разметки
 */
export function parse(text: string): RenderNode[] {
  if (text.length > MAX_STRING_LENGTH) {
    logError('Parser', 'String is too long', { text });

    return [];
  }

  try {
    const depth = 0;

    return recursiveParse(text, depth);
  } catch (error) {
    logError('Parser', 'Unexpected error', { text, error });

    return [];
  }
}

/**
 * Разбирает строку на текст и маркеры с учётом глубины вложенности.
 *
 * @param text - Строка разметки
 * @param depth - Текущая глубина вложенности маркеров
 * @returns Узлы разметки
 */
function recursiveParse(text: string, depth: number): RenderNode[] {
  if (depth > MAX_DEPTH) {
    logError('Parser', 'Maximum nesting depth exceeded', { text });

    return [];
  }

  let tagSplit: string[];

  try {
    tagSplit = splitByMarkers(text);
  } catch (error) {
    logError('Parser', 'Splitting error', { text, error });

    return [];
  }

  const result: RenderNode[] = [];

  for (const chunk of tagSplit) {
    if (!chunk) {
      continue;
    }

    try {
      if (chunk.startsWith(`{${LEADING_CHARACTER}`)) {
        result.push(convertMarker(chunk.slice(1, -1), depth));
      } else {
        result.push(convertText(chunk));
      }
    } catch (error) {
      logError('Parser', 'Converting error', { chunk, error });

      // Разобрать маркер не удалось (неизвестное имя, битые атрибуты) —
      // оставляем хотя бы его текст. Молчаливый пропуск вырезал бы кусок
      // предложения вместе со знаками препинания вокруг.
      const fallback = recoverMarkerText(chunk, depth);

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

/**
 * Превращает тело маркера `@name текст | key:value` в узел.
 *
 * @param source - Тело маркера без внешних фигурных скобок
 * @param depth - Текущая глубина вложенности
 * @returns Узел маркера
 */
function convertMarker(source: string, depth: number): MarkerNode {
  const { text: rawMarker, rest } = splitFirstSpace(source);
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
  } catch (error) {
    // Атрибуты не распарсились: скорее всего `|` — это часть текста, а не
    // разделитель key:value (например форматирующий маркер над текстом
    // «5 | 10»).
    // Не теряем маркер целиком — трактуем всё тело как контент, `|` остаётся
    // литеральным. Так текст не пропадает со страницы.
    logError('Parser', 'Invalid attributes, treating body as content', {
      rest,
      error,
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

/**
 * Разбирает верхнеуровневый чанк `{@name body}` на имя и тело.
 *
 * @param chunk - Чанк маркера вместе с фигурными скобками
 * @returns Имя маркера без `@` и его тело
 */
function readMarker(chunk: string): { name: string; body: string } {
  // Срезаем внешние фигурные скобки
  const inner = chunk.slice(1, -1);
  const { text: rawName, rest } = splitFirstSpace(inner);

  return { name: rawName.replace(/^@/, ''), body: rest };
}

/**
 * Разбирает атрибуты, не бросая: кривые атрибуты ячейки не рушат таблицу.
 *
 * @param params - Части после `|`
 * @returns Атрибуты или `undefined`
 */
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
 *
 * @param rest - Тело маркера таблицы
 * @param depth - Текущая глубина вложенности
 * @returns Узел таблицы
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
      const { text: captionText } = splitByPipeBase(body);

      caption = recursiveParse(captionText ?? '', depth + 1);

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

/**
 * Превращает кусок обычного текста в текстовый узел.
 *
 * @param text - Текст между маркерами
 * @returns Текстовый узел
 */
function convertText(text: string | undefined): SimpleTextNode {
  if (!text) {
    throw new Error(`Text marker must have text`);
  }

  return {
    type: 'text',
    text,
  };
}

/**
 * Делит строку на куски обычного текста и маркеры верхнего уровня; вложенные
 * маркеры остаются внутри своего родителя.
 *
 * @param source - Строка разметки
 * @returns Куски текста и маркеров по порядку
 */
function splitByMarkers(source: string): string[] {
  let buffer = '';
  let level = 0;

  const result: string[] = [];

  for (let i = 0; i < source.length; i++) {
    // Открытие маркера
    if (source[i] === '{' && source[i + 1] === LEADING_CHARACTER) {
      if (level++ === 0 && buffer) {
        result.push(buffer);
        buffer = '';
      }

      buffer += `{${LEADING_CHARACTER}`;
      i++;

      continue;
    }

    // Закрытие маркера
    if (source[i] === '}') {
      buffer += '}';

      if (level && --level === 0) {
        result.push(buffer);
        buffer = '';
      }

      continue;
    }

    buffer += source[i];
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}

/**
 * Делит тело маркера по `|` верхнего уровня на текст и параметры; `|` внутри
 * вложенных маркеров не считается разделителем.
 *
 * @param input - Тело маркера
 * @returns Текст до первого `|` и параметры после него
 */
function splitByPipeBase(input: string): { text?: string; params: string[] } {
  let buffer = '';
  let level = 0;

  const params: string[] = [];

  let text: string | undefined;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const isMarkerOpen = char === '{' && input[i + 1] === LEADING_CHARACTER;

    if (isMarkerOpen) {
      level++;
      buffer += `{${LEADING_CHARACTER}`;
      i++;

      continue;
    }

    if (char === '}') {
      buffer += '}';

      if (level) {
        --level;
      }

      continue;
    }

    // Основная логика: разделитель pipe, если не во вложенностях
    if (char === '|' && level === 0) {
      if (text === undefined) {
        text = buffer.trim();
      } else {
        params.push(buffer.trim());
      }

      buffer = '';
    } else {
      buffer += char;
    }
  }

  if (buffer) {
    if (text === undefined) {
      text = buffer.trim();
    } else {
      params.push(buffer.trim());
    }
  }

  return { text, params };
}

/**
 * Делит строку по первому пробелу.
 *
 * @param source - Исходная строка
 * @returns Часть до пробела и остаток после него
 */
function splitFirstSpace(source: string): { text: string; rest: string } {
  const index = source.indexOf(' ');

  if (index < 0) {
    return { text: source, rest: '' };
  }

  return {
    text: source.substring(0, index),
    rest: source.substring(index + 1),
  };
}

/**
 * Разбирает параметры `key:value` (или `key=value`) в атрибуты маркера.
 *
 * @param params - Части после `|`
 * @returns Атрибуты или `undefined`, если их нет
 * @throws Если у параметра нет имени или значения
 */
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

/**
 * Приводит значение атрибута к типу: число, `true`/`false` и `null` читаются
 * как JSON, всё остальное остаётся строкой.
 *
 * @param attributeValue - Значение атрибута из разметки
 * @returns Значение нужного типа
 */
function parseAttrValue(
  attributeValue: string,
): string | number | boolean | null {
  try {
    const parsed: unknown = JSON.parse(attributeValue);

    return typeof parsed === 'number'
      || typeof parsed === 'boolean'
      || typeof parsed === 'string'
      || parsed === null
      ? parsed
      : attributeValue;
  } catch {
    return attributeValue;
  }
}
