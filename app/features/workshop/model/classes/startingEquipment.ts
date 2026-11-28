import type { StartingEquipmentLine } from '~character-sheet/model';
import type {
  ClassStartingEquipmentItem,
  ClassStartingEquipmentLine,
  StartingEquipmentCategory,
  StartingEquipmentSection,
} from '~character/model';

import { z } from 'zod';

import { parseClassStartingEquipment } from '~character-sheet/model';
import {
  formatStartingEquipmentLine,
  getStartingEquipmentSection,
  STARTING_EQUIPMENT_CATEGORIES,
  STARTING_EQUIPMENT_KINDS,
  STARTING_EQUIPMENT_LIMITS,
  STARTING_EQUIPMENT_SECTIONS,
} from '~character/model';

import { WORKSHOP_VALIDATION } from '../constants';
import {
  STARTING_EQUIPMENT_CATEGORY_PATTERNS,
  STARTING_EQUIPMENT_VALIDATION,
} from './constants';

/**
 * Стартовое снаряжение в редакторе класса: строки → варианты → позиции.
 * Пустой список — снаряжение не заполнено, тогда отправляется null и
 * страница класса выводит текст.
 */

/** Количество позиции: целое от 1 до 1000. */
const quantitySchema = z
  .number(STARTING_EQUIPMENT_VALIDATION.quantity)
  .int(STARTING_EQUIPMENT_VALIDATION.quantity)
  .min(
    STARTING_EQUIPMENT_LIMITS.minQuantity,
    STARTING_EQUIPMENT_VALIDATION.quantity,
  )
  .max(
    STARTING_EQUIPMENT_LIMITS.maxQuantity,
    STARTING_EQUIPMENT_VALIDATION.quantity,
  );

/** Позиция в форме: у выбора нужна категория, у предмета — название. */
const startingEquipmentItemFormSchema = z
  .object({
    kind: z.enum(STARTING_EQUIPMENT_KINDS),
    section: z.enum(STARTING_EQUIPMENT_SECTIONS).nullable(),
    url: z.string().nullable(),
    name: z.string(),
    quantity: quantitySchema,
    description: z.string(),
    category: z.enum(STARTING_EQUIPMENT_CATEGORIES).nullable(),
  })
  .superRefine((item, context) => {
    if (item.kind === 'CHOICE' && !item.category) {
      context.addIssue({
        code: 'custom',
        path: ['category'],
        message: STARTING_EQUIPMENT_VALIDATION.category,
      });
    }

    if (item.kind === 'ITEM' && !item.name.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: WORKSHOP_VALIDATION.required,
      });
    }
  });

/** Вариант в форме: хотя бы одна позиция или монеты. */
const startingEquipmentOptionFormSchema = z
  .object({
    items: z
      .array(startingEquipmentItemFormSchema)
      .max(
        STARTING_EQUIPMENT_LIMITS.items,
        STARTING_EQUIPMENT_VALIDATION.tooManyItems,
      ),
    coins: z
      .number(STARTING_EQUIPMENT_VALIDATION.coins)
      .int(STARTING_EQUIPMENT_VALIDATION.coins)
      .min(
        STARTING_EQUIPMENT_LIMITS.minCoins,
        STARTING_EQUIPMENT_VALIDATION.coins,
      )
      .nullable(),
  })
  .refine((option) => option.items.length > 0 || (option.coins ?? 0) > 0, {
    path: ['items'],
    message: STARTING_EQUIPMENT_VALIDATION.emptyOption,
  });

/** Строка в форме: от одного до пяти вариантов. */
const startingEquipmentLineFormSchema = z.object({
  options: z
    .array(startingEquipmentOptionFormSchema)
    .min(1, STARTING_EQUIPMENT_VALIDATION.noOptions)
    .max(
      STARTING_EQUIPMENT_LIMITS.options,
      STARTING_EQUIPMENT_VALIDATION.tooManyOptions,
    ),
});

/** Стартовое снаряжение в форме класса: не больше двадцати строк. */
export const startingEquipmentFormSchema = z
  .array(startingEquipmentLineFormSchema)
  .max(
    STARTING_EQUIPMENT_LIMITS.lines,
    STARTING_EQUIPMENT_VALIDATION.tooManyLines,
  );

export type StartingEquipmentItemForm = z.infer<
  typeof startingEquipmentItemFormSchema
>;

export type StartingEquipmentOptionForm = z.infer<
  typeof startingEquipmentOptionFormSchema
>;

export type StartingEquipmentLineForm = z.infer<
  typeof startingEquipmentLineFormSchema
>;

/**
 * Предмет справочника для варианта.
 * @param section - раздел справочника
 * @param url - адрес записи
 * @param name - название записи
 */
export function createCatalogEquipmentItem(
  section: StartingEquipmentSection,
  url: string,
  name: string,
): StartingEquipmentItemForm {
  return {
    kind: 'ITEM',
    section,
    url,
    name,
    quantity: STARTING_EQUIPMENT_LIMITS.minQuantity,
    description: '',
    category: null,
  };
}

/** Свой предмет: только название. */
export function createCustomEquipmentItem(): StartingEquipmentItemForm {
  return {
    kind: 'ITEM',
    section: null,
    url: null,
    name: '',
    quantity: STARTING_EQUIPMENT_LIMITS.minQuantity,
    description: '',
    category: null,
  };
}

/**
 * Выбор из категории: «любое воинское оружие».
 * @param category - категория; пусто — выберет автор
 */
export function createChoiceEquipmentItem(
  category: StartingEquipmentCategory | null = null,
): StartingEquipmentItemForm {
  return {
    kind: 'CHOICE',
    section: null,
    url: null,
    name: '',
    quantity: STARTING_EQUIPMENT_LIMITS.minQuantity,
    description: '',
    category,
  };
}

/** Пустой вариант. */
export function createStartingEquipmentOption(): StartingEquipmentOptionForm {
  return { items: [], coins: null };
}

/** Новая строка с одним пустым вариантом. */
export function createStartingEquipmentLine(): StartingEquipmentLineForm {
  return { options: [createStartingEquipmentOption()] };
}

/**
 * Снаряжение записи для формы: копия, уточнения — строками.
 * @param lines - строки снаряжения записи
 */
export function toStartingEquipmentForm(
  lines: ReadonlyArray<ClassStartingEquipmentLine>,
): Array<StartingEquipmentLineForm> {
  return lines.map((line) => ({
    options: line.options.map((option) => ({
      coins: option.coins,
      items: option.items.map((item) => ({
        ...item,
        description: item.description ?? '',
      })),
    })),
  }));
}

/**
 * Позиция для сохранения: названия обрезаны, пустое уточнение — null, у
 * выбора нет записи, у своего предмета — раздела.
 * @param item - позиция формы
 */
function toStartingEquipmentItemPayload(
  item: StartingEquipmentItemForm,
): ClassStartingEquipmentItem {
  const isChoice = item.kind === 'CHOICE';
  const url = isChoice ? null : item.url || null;

  return {
    kind: item.kind,
    section: url ? item.section : null,
    url,
    name: item.name.trim(),
    quantity: item.quantity,
    description: item.description.trim() || null,
    category: isChoice ? item.category : null,
  };
}

/**
 * Снаряжение для сохранения класса.
 * @param lines - строки формы
 * @returns строки; null — снаряжение не заполнено
 */
export function getStartingEquipmentPayload(
  lines: ReadonlyArray<StartingEquipmentLineForm>,
): Array<ClassStartingEquipmentLine> | null {
  if (!lines.length) {
    return null;
  }

  return lines.map((line) => ({
    options: line.options.map((option) => ({
      items: option.items.map(toStartingEquipmentItemPayload),
      coins: option.coins || null,
    })),
  }));
}

/**
 * Категория выбора по тексту позиции: «два воинских оружия».
 * @param text - текст позиции
 */
export function findStartingEquipmentCategory(
  text: string,
): StartingEquipmentCategory | null {
  return (
    STARTING_EQUIPMENT_CATEGORY_PATTERNS.find(({ pattern }) =>
      pattern.test(text),
    )?.category ?? null
  );
}

/**
 * Позиция формы из разобранного текста: ссылка — предмет справочника,
 * текст с категорией — выбор, остальное — свой предмет.
 * @param item - предмет, разобранный из текста
 */
function toParsedEquipmentItem(
  item: StartingEquipmentLine['options'][number]['items'][number],
): StartingEquipmentItemForm {
  const section = getStartingEquipmentSection(item.url);

  if (item.url && section) {
    return {
      ...createCatalogEquipmentItem(section, item.url, item.name),
      quantity: item.quantity,
    };
  }

  const category = findStartingEquipmentCategory(item.name);

  if (category) {
    return { ...createChoiceEquipmentItem(category), quantity: item.quantity };
  }

  return {
    ...createCustomEquipmentItem(),
    name: item.name,
    quantity: item.quantity,
  };
}

/**
 * Снаряжение формы из текста класса: строки списка разбираются тем же
 * разбором, что и в листе персонажа. Лишние строки, варианты и позиции
 * сверх ограничений отбрасываются, количество зажимается в допустимое.
 * @param blocks - блоки разметки снаряжения
 */
export function parseStartingEquipmentText(
  blocks: ReadonlyArray<string>,
): Array<StartingEquipmentLineForm> {
  return parseClassStartingEquipment(blocks)
    .slice(0, STARTING_EQUIPMENT_LIMITS.lines)
    .map((line) => ({
      options: line.options
        .slice(0, STARTING_EQUIPMENT_LIMITS.options)
        .map((option) => ({
          coins: null,
          items: option.items
            .slice(0, STARTING_EQUIPMENT_LIMITS.items)
            .map(toParsedEquipmentItem)
            .map((item) => ({
              ...item,
              quantity: Math.min(
                Math.max(item.quantity, STARTING_EQUIPMENT_LIMITS.minQuantity),
                STARTING_EQUIPMENT_LIMITS.maxQuantity,
              ),
            })),
        })),
    }));
}

/**
 * Список с заменённым элементом.
 * @param list - список
 * @param index - номер элемента
 * @param value - новый элемент
 */
export function replaceListEntry<Entry>(
  list: ReadonlyArray<Entry>,
  index: number,
  value: Entry,
): Array<Entry> {
  return list.map((entry, position) => (position === index ? value : entry));
}

/**
 * Список без элемента.
 * @param list - список
 * @param index - номер элемента
 */
export function removeListEntry<Entry>(
  list: ReadonlyArray<Entry>,
  index: number,
): Array<Entry> {
  return list.filter((_, position) => position !== index);
}

/**
 * Список с элементом, переставленным на место раньше или позже.
 * @param list - список
 * @param index - номер элемента
 * @param offset - `-1` — раньше, `1` — позже
 * @returns новый список или копия прежнего, если двигать некуда
 */
export function moveListEntry<Entry>(
  list: ReadonlyArray<Entry>,
  index: number,
  offset: -1 | 1,
): Array<Entry> {
  const target = index + offset;

  if (
    index < 0
    || target < 0
    || index >= list.length
    || target >= list.length
  ) {
    return [...list];
  }

  return list.map((entry, position) => {
    if (position === index) {
      return list[target] ?? entry;
    }

    return position === target ? (list[index] ?? entry) : entry;
  });
}

/**
 * Строка формы текстом для предпросмотра: «а) кольчуга или б) …».
 * @param line - строка формы
 */
export function formatStartingEquipmentFormLine(
  line: StartingEquipmentLineForm,
): string {
  const [payload] = getStartingEquipmentPayload([line]) ?? [];

  return payload ? formatStartingEquipmentLine(payload) : '';
}
