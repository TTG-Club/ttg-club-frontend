import type { MarkerNode, RenderNode } from '~news/markup';

import type { SheetItem } from './schema';
import type {
  StartingEquipmentItem,
  StartingEquipmentLine,
  StartingEquipmentOption,
} from './types';

import { upperFirst } from 'es-toolkit';
import { z } from 'zod';

import { isMarkerNode, isSimpleTextNode, parse } from '~news/markup';

import { fetchCatalogEntry } from './api';
import { createSheetItem, loadCatalogItem } from './catalog';
import {
  STARTING_EQUIPMENT_LINK_KINDS,
  STARTING_EQUIPMENT_PATTERNS,
  STARTING_EQUIPMENT_QUANTITY_WORDS,
} from './constants';

/**
 * Стартовое снаряжение 2014: в справочнике оно лежит разметкой — списком
 * строк «а) кольчуга или б) кожаный доспех, длинный лук и 20 стрел», где
 * предметы стоят ссылками. Строка становится выбором из вариантов, вариант —
 * набором предметов: ссылки — записями справочника, остальной текст между
 * ними (кроме связок «и», «,») — своими предметами вроде «воинское оружие».
 */

/** Кусок варианта: текст или ссылка на запись. */
type Piece = { text: string } | { link: MarkerNode };

/**
 * Текст узла разметки со всеми вложенными.
 * @param node - узел
 */
function getText(node: RenderNode | ReadonlyArray<RenderNode>): string {
  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child: RenderNode) => getText(child)).join('');
  }

  if (isSimpleTextNode(node)) {
    return node.text;
  }

  return isMarkerNode(node) ? (node.content ?? []).map(getText).join('') : '';
}

/**
 * Куски строки в порядке следования: ссылки отдельно, текст склеен.
 * @param nodes - строчные узлы
 */
function toPieces(nodes: ReadonlyArray<RenderNode>): Array<Piece> {
  const pieces: Array<Piece> = [];

  const pushText = (text: string): void => {
    const last = pieces.at(-1);

    if (last && 'text' in last) {
      last.text += text;
    } else {
      pieces.push({ text });
    }
  };

  for (const node of nodes) {
    if (isMarkerNode(node) && node.type in STARTING_EQUIPMENT_LINK_KINDS) {
      pieces.push({ link: node });
    } else if (isMarkerNode(node) && node.type !== 'break') {
      pieces.push(...toPieces(node.content ?? []));
    } else {
      pushText(getText(node));
    }
  }

  return pieces;
}

/**
 * Количество по слову или числу в конце текста перед ссылкой: «и 20», «два».
 * @param text - текст перед ссылкой
 */
function getTrailingQuantity(text: string): { quantity: number; rest: string } {
  const digits = STARTING_EQUIPMENT_PATTERNS.trailingNumber.exec(text);

  if (digits) {
    return {
      quantity: Number(digits[1]),
      rest: text.slice(0, digits.index),
    };
  }

  const word = STARTING_EQUIPMENT_PATTERNS.trailingWord.exec(text);

  const quantity = word
    ? STARTING_EQUIPMENT_QUANTITY_WORDS[word[1]!.toLocaleLowerCase()]
    : undefined;

  return quantity && word
    ? { quantity, rest: text.slice(0, word.index) }
    : { quantity: 1, rest: text };
}

/**
 * Свои предметы из текста между ссылками: связки отбрасываются, остаток с
 * количеством в начале («два воинских оружия») становится предметом.
 * @param text - текст
 */
function toTextItems(text: string): Array<StartingEquipmentItem> {
  return text
    .split(STARTING_EQUIPMENT_PATTERNS.separator)
    .map((part) =>
      part.replace(STARTING_EQUIPMENT_PATTERNS.edgeJunk, '').trim(),
    )
    .filter(
      (part) =>
        part.length > 1 && !STARTING_EQUIPMENT_PATTERNS.money.test(part),
    )
    .map((part) => {
      const leading = STARTING_EQUIPMENT_PATTERNS.leadingQuantity.exec(part);
      const word = leading?.[1]?.toLocaleLowerCase() ?? '';

      const quantity =
        Number(word) || STARTING_EQUIPMENT_QUANTITY_WORDS[word] || 1;

      return {
        name: leading && quantity > 1 ? part.slice(leading[0].length) : part,
        url: null,
        kind: 'item',
        quantity,
      };
    });
}

/**
 * Убирает слово, прилипшее к следующей ссылке: «и поясной » → «и ».
 * @param text - текст перед ссылкой
 */
function dropGluedWord(text: string): string {
  if (STARTING_EQUIPMENT_PATTERNS.endsWithSeparator.test(text)) {
    return text;
  }

  const parts = text.split(STARTING_EQUIPMENT_PATTERNS.separator);

  parts.pop();

  return parts.join(', ');
}

/**
 * Название ссылки без английского в скобках: «кольчуга [chain mail]».
 * @param link - маркер ссылки
 */
function getLinkName(link: MarkerNode): string {
  return getText(link)
    .replace(STARTING_EQUIPMENT_PATTERNS.englishName, '')
    .trim();
}

/**
 * Адрес и раздел записи по ссылке; незнакомая ссылка — без адреса.
 * @param link - маркер ссылки
 */
function getLinkTarget(link: MarkerNode): {
  url: string | null;
  kind: StartingEquipmentItem['kind'];
} {
  const raw = link.attrs?.url?.toString().trim() ?? '';

  if (link.type === 'item') {
    return raw
      ? { url: `/items/${raw.replace(/^\/?items\//, '')}`, kind: 'item' }
      : { url: null, kind: 'item' };
  }

  const kind = Object.entries(STARTING_EQUIPMENT_PATTERNS.sectionKinds).find(
    ([prefix]) => raw.startsWith(prefix),
  )?.[1];

  return kind ? { url: raw, kind } : { url: null, kind: 'item' };
}

/**
 * Предметы варианта.
 * @param nodes - строчные узлы варианта
 */
function toOption(nodes: ReadonlyArray<RenderNode>): StartingEquipmentOption {
  const items: Array<StartingEquipmentItem> = [];
  const pieces = toPieces(nodes);

  pieces.forEach((piece, index) => {
    if ('text' in piece) {
      const next = pieces[index + 1];

      // Число в конце текста относится к следующей ссылке, а слово, прилипшее
      // к ней («поясной кошель»), — её часть, а не отдельный предмет
      const text =
        next && 'link' in next
          ? dropGluedWord(getTrailingQuantity(piece.text).rest)
          : piece.text;

      items.push(...toTextItems(text));

      return;
    }

    const previous = pieces[index - 1];

    const { quantity } =
      previous && 'text' in previous
        ? getTrailingQuantity(previous.text)
        : { quantity: 1 };

    items.push({
      name: getLinkName(piece.link),
      quantity,
      ...getLinkTarget(piece.link),
    });
  });

  const label = getText([...nodes])
    .replace(STARTING_EQUIPMENT_PATTERNS.englishName, '')
    .trim();

  return { label, items };
}

/**
 * Разбивает строку на варианты по меткам «а)», «б)».
 * @param nodes - строчные узлы строки
 */
function splitOptions(
  nodes: ReadonlyArray<RenderNode>,
): Array<Array<RenderNode>> {
  const options: Array<Array<RenderNode>> = [[]];

  for (const node of nodes) {
    if (!(typeof node === 'string' || isSimpleTextNode(node))) {
      options.at(-1)!.push(node);

      continue;
    }

    const text = typeof node === 'string' ? node : node.text;
    const parts = text.split(STARTING_EQUIPMENT_PATTERNS.optionMarker);

    parts.forEach((part, index) => {
      // После метки начинается новый вариант; «или» перед меткой — связка
      if (index > 0) {
        options.push([]);
      }

      const cleaned =
        index < parts.length - 1
          ? part.replace(STARTING_EQUIPMENT_PATTERNS.trailingOr, '')
          : part;

      if (cleaned) {
        options.at(-1)!.push(cleaned);
      }
    });
  }

  return options.filter((option) => getText(option).trim());
}

/**
 * Строка снаряжения: варианты на выбор или единственный набор.
 * @param nodes - строчные узлы строки
 */
function toLine(
  nodes: ReadonlyArray<RenderNode>,
): StartingEquipmentLine | null {
  const options = splitOptions(nodes)
    .map(toOption)
    .filter((option) => option.items.length);

  return options.length ? { options } : null;
}

/**
 * Пункты списков блока; блок без списка — одна строка.
 * @param nodes - узлы блока
 */
function collectLines(
  nodes: ReadonlyArray<RenderNode>,
): Array<ReadonlyArray<RenderNode>> {
  const lists = nodes.filter(
    (node): node is MarkerNode => isMarkerNode(node) && node.type === 'list',
  );

  if (!lists.length) {
    return [nodes];
  }

  return lists.flatMap((list) =>
    (list.content ?? [])
      .filter(
        (item): item is MarkerNode => isMarkerNode(item) && item.type === 'li',
      )
      .map((item) => item.content ?? []),
  );
}

/**
 * Стартовое снаряжение класса из разметки справочника. Абзацы без ссылок
 * («вместо снаряжения можно взять золото») снаряжением не считаются.
 * @param blocks - блоки разметки
 */
export function parseClassStartingEquipment(
  blocks: ReadonlyArray<string>,
): Array<StartingEquipmentLine> {
  return blocks.flatMap((block) => {
    const nodes = parse(block);

    const hasList = nodes.some(
      (node) => isMarkerNode(node) && node.type === 'list',
    );

    if (!hasList) {
      return [];
    }

    return collectLines(nodes).flatMap((line) => {
      const parsed = toLine(line);

      return parsed ? [parsed] : [];
    });
  });
}

/**
 * Стартовое снаряжение предыстории: каждая строка — набор без выбора, «или»
 * без меток — выбор между двумя названиями.
 * @param equipments - строки снаряжения предыстории
 */
export function parseBackgroundStartingEquipment(
  equipments: ReadonlyArray<string>,
): Array<StartingEquipmentLine> {
  return equipments.flatMap((text) => {
    const nodes = parse(text);
    const plain = getText(nodes);

    // «молитвенник или молитвенный барабан» — выбор без меток
    if (
      !nodes.some((node) => isMarkerNode(node))
      && STARTING_EQUIPMENT_PATTERNS.plainOr.test(plain)
    ) {
      return [
        {
          options: plain
            .split(STARTING_EQUIPMENT_PATTERNS.plainOr)
            .map((part) => toOption([part.trim()])),
        },
      ];
    }

    const line = toLine(nodes);

    return line ? [line] : [];
  });
}

/**
 * Предметы выбранных вариантов.
 * @param lines - строки снаряжения
 * @param choices - выбранный вариант каждой строки
 */
export function getChosenEquipment(
  lines: ReadonlyArray<StartingEquipmentLine>,
  choices: ReadonlyArray<number>,
): Array<StartingEquipmentItem> {
  return lines.flatMap(
    (line, index) => line.options[choices[index] ?? 0]?.items ?? [],
  );
}

/** Предметы для листа и признак, что часть не загрузилась из справочника. */
export interface StartingEquipmentResult {
  items: Array<SheetItem>;
  hasFailures: boolean;
}

/**
 * Предметы листа из выбранного снаряжения: записи справочника загружаются со
 * свойствами (урон, КД, вес) и названием из справочника; свои и не
 * загрузившиеся добавляются своими предметами.
 * @param chosen - предметы выбранных вариантов
 */
export async function loadStartingEquipment(
  chosen: ReadonlyArray<StartingEquipmentItem>,
): Promise<StartingEquipmentResult> {
  let hasFailures = false;

  const items = await Promise.all(
    chosen.map(async (entry) => {
      const fallback = {
        ...createSheetItem(upperFirst(entry.name), entry.url),
        quantity: entry.quantity,
      };

      if (!entry.url) {
        return fallback;
      }

      try {
        const item = await loadCatalogItem(entry.kind, {
          name: fallback.name,
          url: entry.url,
          caption: '',
        });

        return { ...item, quantity: entry.quantity };
      } catch {
        hasFailures = true;

        return fallback;
      }
    }),
  );

  return { items, hasFailures };
}

/**
 * Текст снаряжения справочника блоками: старые записи хранят строку.
 * @param value - поле снаряжения
 */
export function toEquipmentBlocks(
  value: string | ReadonlyArray<string> | null | undefined,
): Array<string> {
  if (!value) {
    return [];
  }

  return typeof value === 'string' ? [value] : [...value];
}

/** Снаряжение и деньги из карточки предыстории. */
const backgroundEquipmentSchema = z.object({
  equipments: z.array(z.string()).nullish(),
  startGold: z.number().nullish(),
});

/**
 * Стартовое снаряжение и деньги предыстории; ошибка — без снаряжения.
 * @param url - адрес предыстории
 */
export async function fetchBackgroundEquipment(
  url: string,
): Promise<{ equipments: Array<string>; startGold: number }> {
  try {
    const detail = await fetchCatalogEntry(url, backgroundEquipmentSchema);

    return {
      equipments: detail.equipments ?? [],
      startGold: detail.startGold ?? 0,
    };
  } catch {
    return { equipments: [], startGold: 0 };
  }
}
