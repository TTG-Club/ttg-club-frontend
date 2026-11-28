import type {
  EncounterPartyRow,
  RandomSource,
  RolledTableCreature,
  TableCreatureGroup,
} from './types';

import {
  ENCOUNTER_TABLE_TIER_MAX_LEVELS,
  MIN_ROW_COUNT,
  TABLE_ALTERNATIVE_SEPARATOR,
} from './constants';

/** Ссылка на существо: адрес после `/bestiary/`. */
const CREATURE_LINK_PATTERN = /<a\s[^>]*href="\/bestiary\/([^"?#]+)"[^>]*>/giu;

/**
 * Количество прямо перед ссылкой: кубики `<dice-roller formula>` или число.
 * Между ними допускаются слова и скобка: «2к8 охотников (воителей племени)».
 */
const QUANTITY_BEFORE_LINK_PATTERN =
  /(?:<dice-roller[^>]*formula="([^"]+)"[^>]*>[^<]*<\/dice-roller>|(?:^|[\s>,(])(\d+))(?:[^<\d][^<]*)?(?:<detail-tooltip[^>]*>\s*)?$/u;

/** Формула кубиков: «2d4», «d6», «1d8+1», «1d6 - 1». */
const DICE_FORMULA_PATTERN = /^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/iu;

/**
 * Диапазон таблиц случайных столкновений по среднему уровню группы.
 * @param party Строки группы.
 */
export function getEncounterTableTier(
  party: ReadonlyArray<EncounterPartyRow>,
): number {
  const characters = party.reduce((sum, row) => sum + row.count, 0);

  const average = characters
    ? Math.round(
        party.reduce((sum, row) => sum + row.level * row.count, 0) / characters,
      )
    : 1;

  const index = ENCOUNTER_TABLE_TIER_MAX_LEVELS.findIndex(
    (maxLevel) => average <= maxLevel,
  );

  return (
    (index === -1 ? ENCOUNTER_TABLE_TIER_MAX_LEVELS.length - 1 : index) + 1
  );
}

/**
 * Существа одного варианта строки таблицы и их количество.
 * @param html Описание варианта.
 */
export function parseTableCreatureGroups(
  html: string,
): Array<TableCreatureGroup> {
  const groups: Array<TableCreatureGroup> = [];

  let previousEnd = 0;

  for (const match of html.matchAll(CREATURE_LINK_PATTERN)) {
    const [link, slug] = match;
    const start = match.index;

    if (slug) {
      const before = html.slice(previousEnd, start);
      const quantity = QUANTITY_BEFORE_LINK_PATTERN.exec(before);

      groups.push({
        slug: decodeURIComponent(slug),
        quantity: quantity?.[1] ?? quantity?.[2] ?? String(MIN_ROW_COUNT),
      });
    }

    previousEnd = start + link.length;
  }

  return groups;
}

/**
 * Бросает формулу кубиков или возвращает число; результат не меньше одного.
 * @param formula Формула («2d4+1») или число.
 * @param random Источник случайных чисел.
 */
export function rollQuantity(
  formula: string,
  random: RandomSource = Math.random,
): number {
  const trimmed = formula.trim();
  const dice = DICE_FORMULA_PATTERN.exec(trimmed);

  if (!dice) {
    const value = Number.parseInt(trimmed, 10);

    return Number.isFinite(value)
      ? Math.max(MIN_ROW_COUNT, value)
      : MIN_ROW_COUNT;
  }

  const [, countText, sidesText, sign, bonusText] = dice;
  const count = countText ? Number(countText) : 1;
  const sides = Number(sidesText);

  let total = 0;

  for (let index = 0; index < count; index += 1) {
    total += Math.floor(random() * sides) + 1;
  }

  const bonus = bonusText ? Number(bonusText) : 0;

  total += sign === '-' ? -bonus : bonus;

  return Math.max(MIN_ROW_COUNT, total);
}

/**
 * Разбирает выпавшую строку таблицы: выбирает случайный вариант с существами
 * (строка может предлагать «волков или медведя») и бросает их количество.
 * Одинаковые существа складываются.
 * @param html Описание из таблицы.
 * @param random Источник случайных чисел.
 */
export function rollTableCreatures(
  html: string,
  random: RandomSource = Math.random,
): Array<RolledTableCreature> {
  const alternatives = html
    .split(TABLE_ALTERNATIVE_SEPARATOR)
    .map(parseTableCreatureGroups)
    .filter((groups) => groups.length > 0);

  const chosen = alternatives[Math.floor(random() * alternatives.length)] ?? [];

  const counts = new Map<string, number>();

  for (const { slug, quantity } of chosen) {
    const key = slug.toLowerCase();

    counts.set(key, (counts.get(key) ?? 0) + rollQuantity(quantity, random));
  }

  return [...counts].map(([slug, count]) => ({ slug, count }));
}

/**
 * Адрес API существа из части ссылки таблицы.
 * @param listUrl Адрес списка бестиария.
 * @param slug Часть адреса после `/bestiary/`.
 */
export function getTableCreatureApiUrl(listUrl: string, slug: string): string {
  return `${listUrl}/${encodeURIComponent(slug)}`;
}
