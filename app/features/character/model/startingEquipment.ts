import type {
  ClassStartingEquipmentItem,
  ClassStartingEquipmentLine,
  ClassStartingEquipmentOption,
  StartingEquipmentSection,
} from './types';

import { lowerFirst } from 'es-toolkit';
import { z } from 'zod';

import {
  STARTING_EQUIPMENT_CATEGORIES,
  STARTING_EQUIPMENT_CATEGORY_TEXT,
  STARTING_EQUIPMENT_FORMAT,
  STARTING_EQUIPMENT_KINDS,
  STARTING_EQUIPMENT_LIMITS,
  STARTING_EQUIPMENT_MARKUP_UNSAFE,
  STARTING_EQUIPMENT_OPTION_LETTERS,
  STARTING_EQUIPMENT_SECTION_PREFIX,
  STARTING_EQUIPMENT_SECTIONS,
} from './constants';

/**
 * Стартовое снаряжение класса данными: строки из вариантов, варианты из
 * позиций справочника, своих предметов и выборов из категории. Разбор
 * терпимый — незнакомые значения становятся пустыми, битые позиции
 * отбрасываются, а не роняют карточку класса.
 */

/** Позиция как её прислал сервер: незнакомое — null. */
const startingEquipmentItemSchema = z.object({
  kind: z.enum(STARTING_EQUIPMENT_KINDS).catch('ITEM'),
  section: z.enum(STARTING_EQUIPMENT_SECTIONS).nullable().catch(null),
  url: z.string().trim().nullable().catch(null),
  name: z.string().trim().catch(''),
  quantity: z
    .number()
    .int()
    .min(STARTING_EQUIPMENT_LIMITS.minQuantity)
    .max(STARTING_EQUIPMENT_LIMITS.maxQuantity)
    .catch(STARTING_EQUIPMENT_LIMITS.minQuantity),
  description: z.string().trim().nullable().catch(null),
  category: z.enum(STARTING_EQUIPMENT_CATEGORIES).nullable().catch(null),
});

const startingEquipmentOptionSchema = z.object({
  items: z.array(z.unknown()).catch([]),
  coins: z
    .number()
    .int()
    .min(STARTING_EQUIPMENT_LIMITS.minCoins)
    .nullable()
    .catch(null),
});

const startingEquipmentLineSchema = z.object({
  options: z.array(z.unknown()).catch([]),
});

/** Режим вывода: простой текст или разметка со ссылками на карточки. */
type StartingEquipmentFormatMode = 'text' | 'markup';

/**
 * Раздел справочника по адресу записи: `/weapons/…` — оружие.
 * @param url - адрес записи
 * @returns раздел; null — адрес не из разделов снаряжения
 */
export function getStartingEquipmentSection(
  url: string | null | undefined,
): StartingEquipmentSection | null {
  if (!url) {
    return null;
  }

  return (
    STARTING_EQUIPMENT_SECTIONS.find((section) =>
      url.startsWith(STARTING_EQUIPMENT_SECTION_PREFIX[section]),
    ) ?? null
  );
}

/**
 * Позиция из ответа сервера. Выбор без категории становится своим
 * предметом, позиция без названия и адреса отбрасывается.
 * @param input - позиция из ответа
 */
function toStartingEquipmentItem(
  input: unknown,
): ClassStartingEquipmentItem | null {
  const parsed = startingEquipmentItemSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const item = parsed.data;
  const description = item.description || null;

  if (item.kind === 'CHOICE' && item.category) {
    return {
      kind: 'CHOICE',
      section: null,
      url: null,
      name: item.name,
      quantity: item.quantity,
      description,
      category: item.category,
    };
  }

  const url = item.url || null;

  if (!url && !item.name) {
    return null;
  }

  return {
    kind: 'ITEM',
    section: url ? (item.section ?? getStartingEquipmentSection(url)) : null,
    url,
    name: item.name,
    quantity: item.quantity,
    description,
    category: null,
  };
}

/**
 * Вариант из ответа сервера; пустой (без позиций и монет) отбрасывается.
 * @param input - вариант из ответа
 */
function toStartingEquipmentOption(
  input: unknown,
): ClassStartingEquipmentOption | null {
  const parsed = startingEquipmentOptionSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const items = parsed.data.items.flatMap((raw) => {
    const item = toStartingEquipmentItem(raw);

    return item ? [item] : [];
  });

  const coins = parsed.data.coins || null;

  return items.length || coins ? { items, coins } : null;
}

/**
 * Стартовое снаряжение из ответа сервера (деталь класса или мастерская).
 * @param input - поле `startingEquipment`
 * @returns строки снаряжения; null — снаряжение не заполнено
 */
export function parseStartingEquipment(
  input: unknown,
): Array<ClassStartingEquipmentLine> | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const lines = input.flatMap((raw: unknown) => {
    const parsed = startingEquipmentLineSchema.safeParse(raw);

    if (!parsed.success) {
      return [];
    }

    const options = parsed.data.options.flatMap((option) => {
      const parsedOption = toStartingEquipmentOption(option);

      return parsedOption ? [parsedOption] : [];
    });

    return options.length ? [{ options }] : [];
  });

  return lines.length ? lines : null;
}

/**
 * Текст без символов, ломающих разметку.
 * @param text - текст
 */
function toMarkupSafe(text: string): string {
  return text.replace(STARTING_EQUIPMENT_MARKUP_UNSAFE, '').trim();
}

/**
 * Позиция строкой: «20 стрел», «любое воинское оружие», в скобках —
 * уточнение. В разметке предмет справочника — ссылка на карточку.
 * @param item - позиция
 * @param mode - текст или разметка
 */
function formatItem(
  item: ClassStartingEquipmentItem,
  mode: StartingEquipmentFormatMode,
): string {
  const description = item.description?.trim() ?? '';

  const details = description
    ? ` (${mode === 'markup' ? toMarkupSafe(description) : description})`
    : '';

  if (item.kind === 'CHOICE' && item.category) {
    const text = STARTING_EQUIPMENT_CATEGORY_TEXT[item.category];

    return item.quantity > 1
      ? `${item.quantity} ${text.anyFew}${details}`
      : `${text.any}${details}`;
  }

  const name = lowerFirst(item.name.trim() || (item.url ?? ''));

  const title =
    mode === 'markup' && item.url
      ? `{@link ${toMarkupSafe(name)} | url:${toMarkupSafe(item.url)}}`
      : name;

  return item.quantity > 1
    ? `${item.quantity} ${title}${details}`
    : `${title}${details}`;
}

/**
 * Перечисление с союзом перед последним: «а, б и в».
 * @param parts - части
 * @param conjunction - союз
 */
function joinWithConjunction(
  parts: ReadonlyArray<string>,
  conjunction: string,
): string {
  if (parts.length < 2) {
    return parts[0] ?? '';
  }

  const leading = parts
    .slice(0, -1)
    .join(STARTING_EQUIPMENT_FORMAT.itemSeparator);

  return `${leading} ${conjunction} ${parts.at(-1)}`;
}

/**
 * Вариант строкой: позиции через запятую и «и», монеты в конце — «+ 10 зм».
 * @param option - вариант
 * @param mode - текст или разметка
 */
function formatOption(
  option: ClassStartingEquipmentOption,
  mode: StartingEquipmentFormatMode,
): string {
  const items = joinWithConjunction(
    option.items.map((item) => formatItem(item, mode)).filter(Boolean),
    STARTING_EQUIPMENT_FORMAT.and,
  );

  if (!option.coins) {
    return items;
  }

  const coins = `${option.coins} ${STARTING_EQUIPMENT_FORMAT.coins}`;

  return items
    ? `${items} ${STARTING_EQUIPMENT_FORMAT.coinsPrefix} ${coins}`
    : coins;
}

/**
 * Буква варианта по порядку: «а», «б», …
 * @param index - номер варианта
 */
function getOptionLetter(index: number): string {
  return STARTING_EQUIPMENT_OPTION_LETTERS[index] ?? String(index + 1);
}

/**
 * Строка снаряжения: единственный вариант как есть, несколько —
 * «а) … или б) …».
 * @param line - строка
 * @param mode - текст или разметка
 */
function formatLine(
  line: ClassStartingEquipmentLine,
  mode: StartingEquipmentFormatMode,
): string {
  const options = line.options
    .map((option) => formatOption(option, mode))
    .filter(Boolean);

  if (options.length < 2) {
    return options[0] ?? '';
  }

  return joinWithConjunction(
    options.map((text, index) => `${getOptionLetter(index)}) ${text}`),
    STARTING_EQUIPMENT_FORMAT.or,
  );
}

/**
 * Вариант строки простым текстом: «длинный лук и 20 стрел + 10 зм».
 * @param option - вариант
 */
export function formatStartingEquipmentOption(
  option: ClassStartingEquipmentOption,
): string {
  return formatOption(option, 'text');
}

/**
 * Строка снаряжения простым текстом: «а) кольчуга или б) кожаный доспех,
 * длинный лук и 20 стрел».
 * @param line - строка
 */
export function formatStartingEquipmentLine(
  line: ClassStartingEquipmentLine,
): string {
  return formatLine(line, 'text');
}

/**
 * Снаряжение блоком разметки для вывода на странице класса: список строк,
 * предметы справочника — ссылками на карточки.
 * @param lines - строки снаряжения
 * @returns блоки разметки; пусто — выводить нечего
 */
export function getStartingEquipmentMarkup(
  lines: ReadonlyArray<ClassStartingEquipmentLine>,
): Array<string> {
  const items = lines
    .map((line) => formatLine(line, 'markup'))
    .filter(Boolean)
    .map((text) => `{@li ${text}}`);

  return items.length ? [`{@list ${items.join('')}}`] : [];
}
