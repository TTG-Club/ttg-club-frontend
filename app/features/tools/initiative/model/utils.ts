import type { CreatureDetail, CreatureLink } from '~bestiary/model';

import type {
  ParticipantValues,
  TrackerParticipant,
  TrackerSlot,
} from './schema';
import type {
  CreatureOption,
  CreatureSummary,
  HitPointsTone,
  ParticipantType,
  TurnReelCell,
} from './types';

import { clamp } from 'es-toolkit';

import { getHitsFormula } from '~bestiary/model';

import {
  HIT_POINT_INPUT_PATTERN,
  INITIATIVE_BESTIARY_ROUTE,
  INITIATIVE_ROUTE,
  PARTICIPANT_TYPE_META,
  TRACKER_KEY_HEADER,
  TURN_REEL,
} from './constants';
import {
  participantValuesSchema,
  trackerErrorSchema,
  trackerSlotSchema,
} from './schema';

/**
 * Адрес страницы трекера.
 * @param id - идентификатор трекера
 */
export function getTrackerRoute(id: string): string {
  return `${INITIATIVE_ROUTE}/${id}`;
}

/**
 * Адрес статблока существа.
 * @param creatureUrl - слаг существа
 */
export function getCreatureRoute(creatureUrl: string): string {
  return `${INITIATIVE_BESTIARY_ROUTE}/${creatureUrl}`;
}

/**
 * Заголовки запроса к трекеру: гость передаёт ключ доступа, пользователя
 * бэкенд узнаёт по cookie.
 * @param accessKey - ключ трекера гостя
 */
export function getTrackerHeaders(accessKey?: string): Record<string, string> {
  return accessKey ? { [TRACKER_KEY_HEADER]: accessKey } : {};
}

/**
 * Текст ошибки для уведомления: бэкенд присылает его по-русски.
 * @param title - что не получилось
 * @param error - пойманная ошибка `$fetch`
 */
export function getTrackerErrorMessage(title: string, error: unknown): string {
  const parsed = trackerErrorSchema.safeParse(error);

  return parsed.success ? `${title}. ${parsed.data.data.message}` : title;
}

/**
 * Читает хиты или КД участников из localStorage; битое значение — пусто.
 * @param raw - строка из хранилища
 */
export function parseParticipantValues(raw: string): ParticipantValues {
  try {
    const parsed = participantValuesSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/**
 * Читает трекер гостя из localStorage; битое значение — слота нет.
 * @param raw - строка из хранилища
 */
export function parseTrackerSlot(raw: string): TrackerSlot | null {
  try {
    const parsed = trackerSlotSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Сколько участников заданного типа.
 * @param participants - участники
 * @param type - тип участника
 */
export function countParticipants(
  participants: ReadonlyArray<TrackerParticipant>,
  type: ParticipantType,
): number {
  return participants.filter((participant) => participant.type === type).length;
}

/**
 * Прокинута ли участнику инициатива.
 * @param participant - участник
 */
export function isParticipantRolled(participant: TrackerParticipant): boolean {
  return typeof participant.initiativeTotal === 'number';
}

/**
 * Подпись типа участника: от бэкенда или своя.
 * @param participant - участник
 */
export function getParticipantTypeLabel(
  participant: TrackerParticipant,
): string {
  return participant.typeName || PARTICIPANT_TYPE_META[participant.type].label;
}

/**
 * Бросок с преимуществом или помехой из двух к20.
 * @param first - первая кость
 * @param second - вторая кость
 * @param isAdvantage - преимущество: больший, иначе меньший
 */
export function pickPairRoll(
  first: number,
  second: number,
  isAdvantage: boolean,
): number {
  return isAdvantage ? Math.max(first, second) : Math.min(first, second);
}

/**
 * Существа бестиария как варианты выбора.
 * @param creatures - существа из поиска
 */
export function toCreatureOptions(
  creatures: ReadonlyArray<CreatureLink>,
): Array<CreatureOption> {
  return creatures.map((creature) => ({
    value: creature.url,
    label: creature.name.rus,
    challengeRating: creature.challengeRating,
  }));
}

/**
 * Имя трекера для запроса: пустое — бэкенд подставит своё.
 * @param name - введённое имя
 */
export function getTrackerNameBody(name: string): { name?: string } {
  const trimmed = name.trim();

  return trimmed ? { name: trimmed } : {};
}

/**
 * Ход назван «текущим», только пока идёт бой и участник жив.
 * @param participant - участник
 * @param currentId - чей сейчас ход
 */
export function isParticipantCurrent(
  participant: TrackerParticipant,
  currentId: string | null | undefined,
): boolean {
  return !participant.dead && participant.id === currentId;
}

/**
 * Сводка существа для трекера из его статблока.
 * @param creature - статблок из бестиария
 */
export function toCreatureSummary(creature: CreatureDetail): CreatureSummary {
  return {
    image: creature.images?.[0] || undefined,
    armorClass: creature.armorClass ?? undefined,
    challengeRating: creature.challengeRating,
    maxHitPoints: creature.hits.average ?? 0,
    hitFormula: getHitsFormula(creature.hits),
  };
}

/**
 * Держит хиты в пределах: не ниже нуля и не выше максимума, если он известен.
 * @param value - новые хиты
 * @param max - максимум, `0` — неизвестен
 */
export function clampHitPoints(value: number, max: number): number {
  return max > 0 ? clamp(value, 0, max) : Math.max(0, value);
}

/**
 * Хиты после ввода: число ставит значение, со знаком — сдвигает текущее.
 * @param input - введённое, например `58`, `+7` или `-6`
 * @param current - текущие хиты
 * @param max - максимум, `0` — неизвестен
 * @returns новые хиты или `undefined`, если ввод не распознан
 */
export function applyHitPointsInput(
  input: string,
  current: number,
  max: number,
): number | undefined {
  const match = HIT_POINT_INPUT_PATTERN.exec(input.trim());

  if (!match) {
    return undefined;
  }

  const [, sign, digits] = match;
  const amount = Number(digits);

  if (!sign) {
    return clampHitPoints(amount, max);
  }

  return clampHitPoints(current + (sign === '-' ? -amount : amount), max);
}

/**
 * Окраска остатка хитов: ноль — опасно, половина и меньше — тревожно.
 * @param current - текущие хиты
 * @param max - максимум, `0` — неизвестен
 */
export function getHitPointsTone(
  current: number,
  max: number,
): HitPointsTone | undefined {
  if (current <= 0) {
    return 'error';
  }

  return max > 0 && current * 2 <= max ? 'warning' : undefined;
}

/**
 * Подпись шага хитов со знаком: `−5`, `+1`.
 * @param delta - сдвиг хитов
 */
export function formatHitPointStep(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

/**
 * Лента ходов: участники по кругу, раунды разделены границей. Координата
 * растёт от раунда к раунду, поэтому лента всегда едет в одну сторону.
 * @param participants - участники в порядке хода
 * @param currentId - чей сейчас ход
 * @param round - текущий раунд
 * @returns ячейки вокруг текущего хода и колонка, на которой он стоит
 */
export function getTurnReel(
  participants: ReadonlyArray<TrackerParticipant>,
  currentId: string | null | undefined,
  round: number,
): { cells: Array<TurnReelCell>; column: number } {
  const total = participants.length;
  const span = total + 1;
  const safeRound = Math.max(1, round);

  const currentIndex = Math.max(
    0,
    participants.findIndex((participant) => participant.id === currentId),
  );

  const column = safeRound * span + currentIndex;

  if (!total) {
    return { cells: [], column };
  }

  const from = Math.max(1, Math.floor((column - TURN_REEL.window) / span) - 1);
  const to = Math.ceil((column + TURN_REEL.window) / span) + 1;
  const cells: Array<TurnReelCell> = [];

  for (let cycle = from; cycle <= to; cycle += 1) {
    const base = cycle * span;

    // Перед первым раундом границы нет: до него не было перехода
    if (cycle > 1) {
      cells.push({
        kind: 'divider',
        key: `divider-${cycle}`,
        column: base - 1,
        round: cycle,
      });
    }

    for (const [index, participant] of participants.entries()) {
      cells.push({
        kind: 'token',
        key: `${participant.id}-${cycle}`,
        column: base + index,
        participant,
        isCurrent: cycle === safeRound && index === currentIndex,
      });
    }
  }

  return {
    cells: cells.filter(
      (cell) => Math.abs(cell.column - column) <= TURN_REEL.window,
    ),
    column,
  };
}
