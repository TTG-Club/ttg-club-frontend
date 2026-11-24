import type { SheetDocument } from './schema';
import type { HitDiceTotal, HitPointsInput } from './types';

import { clamp } from 'es-toolkit';

import {
  HIT_POINTS_INPUT_PATTERN,
  RECHARGE_EVENTS,
  REST_TEXT,
} from './constants';

/**
 * Разбирает ввод хитов: `20` — точное значение, `+3` и `-7` (или `−7`) —
 * сдвиг от текущих.
 * @param text - ввод игрока
 * @returns разобранный ввод; null — ввод не похож на хиты
 */
export function parseHitPointsInput(text: string): HitPointsInput | null {
  const match = HIT_POINTS_INPUT_PATTERN.exec(text.trim());

  if (!match) {
    return null;
  }

  const [, sign, digits] = match;
  const value = Number(digits);

  if (!sign) {
    return { kind: 'set', value };
  }

  return { kind: 'delta', value: sign === '+' ? value : -value };
}

/**
 * Хиты после урона или лечения. Урон сперва снимает временные хиты, затем
 * текущие; лечение поднимает текущие не выше максимума, а персонаж, пришедший
 * в себя с 0 хитов, забывает спасброски от смерти.
 * @param document - лист персонажа
 * @param delta - сдвиг: отрицательный — урон, положительный — лечение
 * @param hitPointsMax - максимум хитов с прибавками
 */
export function changeHitPoints(
  document: SheetDocument,
  delta: number,
  hitPointsMax: number,
): SheetDocument {
  const { current, temporary } = document.health;

  if (delta < 0) {
    const damage = -delta;
    const absorbed = Math.min(temporary, damage);

    return {
      ...document,
      health: {
        ...document.health,
        temporary: temporary - absorbed,
        current: Math.max(0, current - (damage - absorbed)),
      },
    };
  }

  return setCurrentHitPoints(document, current + delta, hitPointsMax);
}

/**
 * Точное значение текущих хитов в пределах [0, максимум]; временные хиты
 * остаются как были.
 * @param document - лист персонажа
 * @param value - новые текущие хиты
 * @param hitPointsMax - максимум хитов с прибавками
 */
export function setCurrentHitPoints(
  document: SheetDocument,
  value: number,
  hitPointsMax: number,
): SheetDocument {
  const limit = hitPointsMax > 0 ? hitPointsMax : Number.POSITIVE_INFINITY;
  const current = clamp(Math.trunc(value), 0, limit);
  const isRevived = document.health.current === 0 && current > 0;

  return {
    ...document,
    health: { ...document.health, current },
    deathSaves: isRevived ? { successes: 0, failures: 0 } : document.deathSaves,
  };
}

/**
 * Применяет ввод хитов.
 * @param document - лист персонажа
 * @param input - разобранный ввод
 * @param hitPointsMax - максимум хитов с прибавками
 */
export function applyHitPointsInput(
  document: SheetDocument,
  input: HitPointsInput,
  hitPointsMax: number,
): SheetDocument {
  return input.kind === 'set'
    ? setCurrentHitPoints(document, input.value, hitPointsMax)
    : changeHitPoints(document, input.value, hitPointsMax);
}

/**
 * Цвет числа хитов: ноль — ошибка, половина и меньше — предупреждение.
 * @param current - текущие хиты
 * @param max - максимум хитов
 */
export function getHitPointsToneClass(current: number, max: number): string {
  if (current <= 0) {
    return 'text-error';
  }

  return max > 0 && current * 2 <= max ? 'text-warning' : 'text-highlighted';
}

/**
 * Сколько костей хитов каждого размера вернёт долгий отдых: половина от их
 * общего числа (не меньше одной), сначала самые крупные потраченные — их
 * выгоднее держать на руках.
 * @param totals - кости хитов по размерам
 * @returns возвращаемые кости по размеру кости
 */
export function getLongRestHitDiceRecovery(
  totals: ReadonlyArray<HitDiceTotal>,
): Record<number, number> {
  const all = totals.reduce((sum, total) => sum + total.total, 0);

  let budget = all > 0 ? Math.max(1, Math.floor(all / 2)) : 0;

  const recovery: Record<number, number> = {};

  for (const total of [...totals].sort((left, right) => right.die - left.die)) {
    const restored = Math.min(budget, total.used);

    if (restored > 0) {
      recovery[total.die] = restored;
      budget -= restored;
    }
  }

  return recovery;
}

/**
 * Что ещё вернёт отдых, кроме хитов и костей хитов: ячейки, ресурсы и заряды
 * предметов — подписями для значков.
 * @param document - лист персонажа
 * @param mode - короткий или долгий отдых
 */
export function getRestRecoveryLabels(
  document: SheetDocument,
  mode: 'short' | 'long',
): Array<string> {
  const events: ReadonlyArray<string> =
    mode === 'short'
      ? [RECHARGE_EVENTS.short]
      : [RECHARGE_EVENTS.short, RECHARGE_EVENTS.long, RECHARGE_EVENTS.dawn];

  const hasSpellSlots =
    mode === 'long' && document.spellSlotsUsed.some((used) => used > 0);

  const resources = document.resources
    .filter(
      (resource) =>
        resource.used > 0 && (mode === 'long' || resource.reset !== 'LONG'),
    )
    .map((resource) => resource.name);

  const items = document.inventory
    .filter(
      (item) =>
        item.charges?.used && events.includes(item.charges.rechargeEvent),
    )
    .map((item) => `${REST_TEXT.charges}: ${item.name}`);

  return [
    ...(hasSpellSlots ? [REST_TEXT.spellSlots] : []),
    ...(document.pactSlotsUsed ? [REST_TEXT.pactSlots] : []),
    ...resources,
    ...items,
  ];
}
