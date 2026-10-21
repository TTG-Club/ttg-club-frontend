import type { RollBase } from '@ttg-club/dice-roller-parser';

import type { RollCritical, RollEntry, RollMode } from './types';

import { z } from 'zod';

import { D20_MODE_SUFFIX, OTHER_MODE_SUFFIX } from './constants';

/** Бросок к20 в начале формулы: к нему применяются преимущество и помеха. */
const LEADING_D20 = /^1?d20/i;

/** Все к20 формулы, которые заменяются на бросок двух кубиков. */
const ANY_D20 = /1?d20/gi;

/** Первый кубик формулы, который удваивается при «преимуществе». */
const FIRST_DIE = /\d*d\d+/i;

const dieRollSchema = z.object({ roll: z.number(), valid: z.boolean() });

/**
 * Приводит формулу к нотации парсера и применяет особый бросок, как старое SPA:
 * к20 с преимуществом или помехой бросается дважды, остальные кубики при
 * «преимуществе» удваиваются, а при «помехе» результат делится пополам.
 * @param formula - формула из контента, например `2к6 + 3`
 * @param mode - особый бросок
 */
export function formatFormula(formula: string, mode?: RollMode): string {
  const formatted = formula.replace(/к/gi, 'd').replace(/−/g, '-');

  if (!mode) {
    return formatted;
  }

  if (LEADING_D20.test(formatted)) {
    return formatted.replace(
      ANY_D20,
      mode === 'advantage' ? '2d20kh1' : '2d20kl1',
    );
  }

  if (mode === 'disadvantage') {
    return `(${formatted})/2`;
  }

  const firstDie = formatted.match(FIRST_DIE)?.[0];

  return firstDie ? `${formatted}+${firstDie}` : formatted;
}

/**
 * Возвращает пометку особого броска для подписи.
 * @param formula - исходная формула
 * @param mode - особый бросок
 */
export function getModeSuffix(formula: string, mode?: RollMode): string {
  if (!mode) {
    return '';
  }

  return LEADING_D20.test(formatFormula(formula))
    ? D20_MODE_SUFFIX[mode]
    : OTHER_MODE_SUFFIX[mode];
}

/**
 * Собирает значения выпавших кубиков, которые пошли в результат.
 * @param node - узел результата парсера
 */
export function collectDiceValues(node: RollBase): Array<number> {
  const values: Array<number> = [];

  if ('rolls' in node && Array.isArray(node.rolls)) {
    for (const item of node.rolls) {
      const parsed = dieRollSchema.safeParse(item);

      if (parsed.success && parsed.data.valid) {
        values.push(parsed.data.roll);
      }
    }
  }

  const children: Array<unknown> = [];

  if ('dice' in node && Array.isArray(node.dice)) {
    children.push(...node.dice);
  }

  if ('expr' in node) {
    children.push(node.expr);
  }

  for (const child of children) {
    if (isRollNode(child)) {
      values.push(...collectDiceValues(child));
    }
  }

  return values;
}

/**
 * Проверяет, что значение похоже на узел результата парсера.
 * @param value - вложенный узел
 */
function isRollNode(value: unknown): value is RollBase {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && 'value' in value
  );
}

const criticalDieSchema = z.object({
  die: z.object({ value: z.number() }),
  rolls: z.array(
    z.object({ valid: z.boolean(), critical: z.string().nullish() }),
  ),
});

/**
 * Определяет критический результат, как старое SPA: первый бросок
 * формулы — к20 (не больше трёх кубиков, чтобы учесть преимущество),
 * и среди засчитанных кубиков есть натуральные 20 или 1.
 * @param node - корневой узел результата парсера
 */
export function getRollCritical(node: RollBase): RollCritical | undefined {
  // Формула из одного кубика (`к20`) приходит узлом кубика без обёртки.
  const first: unknown =
    'dice' in node && Array.isArray(node.dice) ? node.dice[0] : node;

  const parsed = criticalDieSchema.safeParse(first);

  if (
    !parsed.success
    || parsed.data.die.value !== 20
    || parsed.data.rolls.length > 3
  ) {
    return undefined;
  }

  const valid = parsed.data.rolls.filter((item) => item.valid);

  if (valid.some((item) => item.critical === 'success')) {
    return 'success';
  }

  if (valid.some((item) => item.critical === 'failure')) {
    return 'failure';
  }

  return undefined;
}

/** Проверка сохранённой истории: localStorage мог изменить кто угодно. */
export const rollHistorySchema = z.array(
  z.object({
    id: z.string(),
    date: z.string(),
    formula: z.string(),
    value: z.number(),
    dice: z.array(z.number()),
    label: z.string(),
    source: z.string().optional(),
    critical: z.enum(['success', 'failure']).optional(),
  }),
);

/**
 * Добавляет бросок в конец истории и обрезает её до лимита.
 * @param entries - текущая история
 * @param entry - новый бросок
 * @param limit - сколько бросков хранить
 */
export function appendRollEntry(
  entries: Array<RollEntry>,
  entry: RollEntry,
  limit: number,
): Array<RollEntry> {
  return [...entries, entry].slice(-limit);
}
