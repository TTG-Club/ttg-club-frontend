import type { SheetDocument } from '~character-sheet/model';

import type { ParticipantSheetLink, TrackerParticipant } from './schema';
import type { HitPointsState, SheetPlayerOption } from './types';

import { clamp } from 'es-toolkit';

import {
  getClassesLabel,
  getSheetStats,
  setCurrentHitPoints,
} from '~character-sheet/model';

import { INITIATIVE_LIMIT } from './constants';

/** Чей лист и где он лежит: всё, что нужно варианту, кроме чисел документа. */
export type SheetPlayerIdentity = Pick<
  SheetPlayerOption,
  'sheetId' | 'source' | 'shareToken' | 'savedId' | 'name'
>;

/**
 * Лист персонажа как вариант добавления игрока. КД, бонус инициативы и
 * максимум хитов (с прибавками от черт и предметов) лист считает сам, трекер
 * берёт их готовыми и приводит к своим пределам — иначе бэкенд отклонил бы
 * слишком длинное имя или бонус за границей диапазона.
 * @param document - документ листа
 * @param identity - id листа, источник, токен ссылки, сохранённая запись и имя
 */
export function buildSheetPlayerOption(
  document: SheetDocument,
  identity: SheetPlayerIdentity,
): SheetPlayerOption {
  const stats = getSheetStats(document);
  const maxHitPoints = Math.max(0, stats.hitPointsMax);

  const currentHitPoints =
    maxHitPoints > 0
      ? clamp(document.health.current, 0, maxHitPoints)
      : Math.max(0, document.health.current);

  return {
    ...identity,
    name: identity.name.trim().slice(0, INITIATIVE_LIMIT.name),
    subtitle: getClassesLabel(document.classes),
    initiativeBonus: clamp(
      stats.initiative,
      INITIATIVE_LIMIT.bonusMin,
      INITIATIVE_LIMIT.bonusMax,
    ),
    armorClass: clamp(
      stats.armorClass,
      INITIATIVE_LIMIT.armorClassMin,
      INITIATIVE_LIMIT.armorClassMax,
    ),
    maxHitPoints,
    currentHitPoints,
    temporaryHitPoints: Math.max(0, document.health.temporary),
  };
}

/**
 * Привязка участника к листу — то, что остаётся у участника на сервере после
 * добавления (сам вариант трекеру больше не нужен).
 * @param option - выбранный лист персонажа
 */
export function toParticipantSheetLink(
  option: SheetPlayerOption,
): ParticipantSheetLink {
  return {
    sheetId: option.sheetId,
    source: option.source,
    shareToken: option.shareToken,
    savedId: option.savedId,
  };
}

/**
 * Документ листа с хитами из боя. Текущие хиты зажимаются максимумом самого
 * листа (с прибавками) по правилу листа: максимум `0` — сверху не режет, а
 * персонаж, поднявшийся с нуля, забывает спасброски от смерти. Временные — не
 * ниже нуля. Остальной документ не меняется.
 * @param document - свежий документ листа
 * @param hitPoints - текущие и временные хиты из трекера
 */
export function applyTrackerHitPointsToSheet(
  document: SheetDocument,
  hitPoints: HitPointsState,
): SheetDocument {
  const { hitPointsMax } = getSheetStats(document);

  const updated = setCurrentHitPoints(
    document,
    hitPoints.current,
    hitPointsMax,
  );

  return {
    ...updated,
    health: {
      ...updated.health,
      temporary: Math.max(0, Math.trunc(hitPoints.temporary)),
    },
  };
}

/**
 * Листы, персонажи которых уже стоят в бою: список выбора их помечает.
 * @param participants - участники трекера
 */
export function getLinkedSheetIds(
  participants: ReadonlyArray<TrackerParticipant>,
): Set<string> {
  return new Set(
    participants.flatMap((participant) =>
      participant.sheetLink ? [participant.sheetLink.sheetId] : [],
    ),
  );
}

/**
 * Участник, только что добавленный из листа: его не было до добавления, и он
 * привязан к этому листу. Лист мог уже стоять в бою — прежнюю копию не берём.
 * @param participants - участники после добавления
 * @param knownIds - участники до добавления
 * @param sheetId - идентификатор листа
 */
export function findAddedSheetParticipant(
  participants: ReadonlyArray<TrackerParticipant>,
  knownIds: ReadonlySet<string>,
  sheetId: string,
): TrackerParticipant | undefined {
  return participants.find(
    (participant) =>
      !knownIds.has(participant.id)
      && participant.sheetLink?.sheetId === sheetId,
  );
}
