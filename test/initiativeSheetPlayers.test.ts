import type { SheetDocument } from '~character-sheet/model';
import type {
  SheetPlayerOption,
  TrackerParticipant,
} from '~tools/initiative/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptySheetDocument,
  getSheetStats,
} from '~character-sheet/model';
import {
  applyTrackerHitPointsToSheet,
  buildSheetPlayerOption,
  findAddedSheetParticipant,
  getLinkedSheetIds,
  INITIATIVE_LIMIT,
  participantSchema,
  toParticipantSheetLink,
} from '~tools/initiative/model';

/**
 * Лист с правками поверх пустого.
 * @param patch - правки
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Документ с заданными хитами.
 * @param max - максимум
 * @param current - текущие
 * @param temporary - временные
 */
function withHealth(
  max: number,
  current: number,
  temporary = 0,
): SheetDocument {
  return makeDocument({ health: { max, current, temporary } });
}

const ownIdentity = {
  sheetId: 'sheet-1',
  source: 'own',
  shareToken: null,
  savedId: null,
  name: 'Торин',
} as const;

/**
 * Участник трекера для проверок.
 * @param id - идентификатор участника
 * @param sheetId - лист, к которому привязан; нет — заведён вручную
 */
function makeParticipant(id: string, sheetId?: string): TrackerParticipant {
  return participantSchema.parse({
    id,
    type: 'PLAYER',
    name: id,
    initiativeBonus: 0,
    ...(sheetId ? { sheetLink: { sheetId, source: 'own' } } : {}),
  });
}

describe('buildSheetPlayerOption', () => {
  it('берёт КД, инициативу и максимум хитов из расчёта листа', () => {
    const document = withHealth(24, 17, 3);
    const stats = getSheetStats(document);
    const option = buildSheetPlayerOption(document, ownIdentity);

    expect(option).toMatchObject({
      sheetId: 'sheet-1',
      source: 'own',
      savedId: null,
      name: 'Торин',
      armorClass: stats.armorClass,
      initiativeBonus: stats.initiative,
      maxHitPoints: stats.hitPointsMax,
      currentHitPoints: 17,
      temporaryHitPoints: 3,
    });
  });

  it('обрезает имя и зажимает текущие хиты максимумом', () => {
    const option = buildSheetPlayerOption(withHealth(10, 40), {
      ...ownIdentity,
      name: `  ${'а'.repeat(INITIATIVE_LIMIT.name + 20)}  `,
    });

    expect(option.name).toHaveLength(INITIATIVE_LIMIT.name);
    expect(option.currentHitPoints).toBe(option.maxHitPoints);
  });

  it('лист без максимума хитов сверху не режет', () => {
    const option = buildSheetPlayerOption(withHealth(0, 7), ownIdentity);

    expect(option.maxHitPoints).toBe(0);
    expect(option.currentHitPoints).toBe(7);
  });
});

describe('toParticipantSheetLink', () => {
  it('оставляет только привязку к листу', () => {
    const option: SheetPlayerOption = {
      ...buildSheetPlayerOption(withHealth(10, 10), ownIdentity),
      source: 'saved',
      shareToken: 'token',
      savedId: 'saved-1',
    };

    expect(toParticipantSheetLink(option)).toEqual({
      sheetId: 'sheet-1',
      source: 'saved',
      shareToken: 'token',
      savedId: 'saved-1',
    });
  });
});

describe('applyTrackerHitPointsToSheet', () => {
  it('пишет текущие и временные хиты, не трогая остальное', () => {
    const document = makeDocument({
      health: { max: 30, current: 30, temporary: 0 },
      alignment: 'Законно-добрый',
    });

    const updated = applyTrackerHitPointsToSheet(document, {
      current: 12,
      temporary: 4,
    });

    expect(updated.health).toEqual({ max: 30, current: 12, temporary: 4 });
    expect(updated.alignment).toBe('Законно-добрый');
    expect(document.health.current).toBe(30);
  });

  it('зажимает текущие максимумом листа и не уходит ниже нуля', () => {
    const document = withHealth(30, 30);
    const { hitPointsMax } = getSheetStats(document);

    expect(
      applyTrackerHitPointsToSheet(document, { current: 99, temporary: -2 })
        .health,
    ).toMatchObject({ current: hitPointsMax, temporary: 0 });

    expect(
      applyTrackerHitPointsToSheet(document, { current: -5, temporary: 0 })
        .health.current,
    ).toBe(0);
  });

  it('поднявшийся с нуля забывает спасброски от смерти', () => {
    const document = makeDocument({
      health: { max: 20, current: 0, temporary: 0 },
      deathSaves: { successes: 2, failures: 1 },
    });

    const updated = applyTrackerHitPointsToSheet(document, {
      current: 5,
      temporary: 0,
    });

    expect(updated.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});

describe('getLinkedSheetIds и findAddedSheetParticipant', () => {
  const participants = [
    makeParticipant('p1', 'sheet-1'),
    makeParticipant('p2'),
    makeParticipant('p3', 'sheet-1'),
  ];

  it('собирает листы участников, привязанных к листам', () => {
    expect([...getLinkedSheetIds(participants)]).toEqual(['sheet-1']);
  });

  it('находит только нового участника этого листа', () => {
    expect(
      findAddedSheetParticipant(participants, new Set(['p1', 'p2']), 'sheet-1')
        ?.id,
    ).toBe('p3');

    expect(
      findAddedSheetParticipant(
        participants,
        new Set(['p1', 'p2', 'p3']),
        'sheet-1',
      ),
    ).toBeUndefined();
  });

  it('битая привязка в ответе не роняет участника', () => {
    const participant = participantSchema.parse({
      id: 'p4',
      type: 'PLAYER',
      name: 'Гимли',
      initiativeBonus: 1,
      sheetLink: { sheetId: 'sheet-2', source: 'stolen' },
    });

    expect(participant.sheetLink).toBeNull();
  });
});
