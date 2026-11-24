import type { SheetClass, SheetDocument } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  applyHitPointsInput,
  applyMechanicsLongRest,
  changeHitPoints,
  createEmptySheetDocument,
  createSheetItem,
  getExperienceProgress,
  getHitDiceTotals,
  getHitPointsToneClass,
  getLongRestHitDiceRecovery,
  getRestRecoveryLabels,
  parseHitPointsInput,
  REST_TEXT,
  setCurrentHitPoints,
  sheetResourceSchema,
} from '~character-sheet/model';

/**
 * Лист с правками поверх пустого.
 * @param patch - правки
 */
function makeDocument(patch: Partial<SheetDocument> = {}): SheetDocument {
  return { ...createEmptySheetDocument(), ...patch };
}

/**
 * Свой класс листа.
 * @param id - идентификатор
 * @param level - уровень
 * @param hitDie - кость хитов
 */
function makeClass(id: string, level: number, hitDie: number): SheetClass {
  return {
    id,
    name: id,
    url: null,
    archetypeName: null,
    archetypeUrl: null,
    level,
    hitDie,
  };
}

describe('ввод хитов', () => {
  it('число без знака — точное значение, со знаком — сдвиг', () => {
    expect(parseHitPointsInput('20')).toEqual({ kind: 'set', value: 20 });
    expect(parseHitPointsInput(' +3 ')).toEqual({ kind: 'delta', value: 3 });
    expect(parseHitPointsInput('-7')).toEqual({ kind: 'delta', value: -7 });
    expect(parseHitPointsInput('−7')).toEqual({ kind: 'delta', value: -7 });
    expect(parseHitPointsInput('1к6')).toBeNull();
    expect(parseHitPointsInput('')).toBeNull();
  });

  it('урон снимает сперва временные хиты и не уходит ниже нуля', () => {
    const document = makeDocument({
      health: { max: 20, current: 6, temporary: 4 },
    });

    expect(changeHitPoints(document, -7, 20).health).toEqual({
      max: 20,
      current: 3,
      temporary: 0,
    });

    expect(changeHitPoints(document, -50, 20).health.current).toBe(0);
  });

  it('лечение — не выше максимума с прибавками; с нуля спасброски забываются', () => {
    const document = makeDocument({
      health: { max: 20, current: 0, temporary: 0 },
      deathSaves: { successes: 1, failures: 2 },
    });

    const healed = changeHitPoints(document, 30, 24);

    expect(healed.health.current).toBe(24);
    expect(healed.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it('точное значение не трогает временные хиты', () => {
    const document = makeDocument({
      health: { max: 20, current: 5, temporary: 3 },
    });

    const result = applyHitPointsInput(
      document,
      { kind: 'set', value: 12 },
      20,
    );

    expect(result.health).toEqual({ max: 20, current: 12, temporary: 3 });
    expect(setCurrentHitPoints(document, 99, 20).health.current).toBe(20);
  });

  it('цвет хитов: ноль, половина и больше', () => {
    expect(getHitPointsToneClass(0, 20)).toBe('text-error');
    expect(getHitPointsToneClass(10, 20)).toBe('text-warning');
    expect(getHitPointsToneClass(11, 20)).toBe('text-highlighted');
  });
});

describe('кости хитов', () => {
  it('дополнительные кости складываются с костями того же размера', () => {
    const document = makeDocument({
      classes: [makeClass('fighter', 3, 10)],
      extraHitDice: [
        { id: 'e1', name: 'Дар', die: 10, count: 1 },
        { id: 'e2', name: 'Черта', die: 6, count: 2 },
      ],
      hitDiceUsed: { 10: 1 },
    });

    expect(getHitDiceTotals(document)).toEqual([
      { die: 10, total: 4, used: 1 },
      { die: 6, total: 2, used: 0 },
    ]);
  });

  it('долгий отдых возвращает половину от ВСЕХ костей, сперва крупные', () => {
    // 1к10 + 1к8: всего 2 кости — вернётся одна, к10
    expect(
      getLongRestHitDiceRecovery([
        { die: 10, total: 1, used: 1 },
        { die: 8, total: 1, used: 1 },
      ]),
    ).toEqual({ 10: 1 });

    // 3к10 + 2к6: всего 5 → вернутся 2
    expect(
      getLongRestHitDiceRecovery([
        { die: 10, total: 3, used: 1 },
        { die: 6, total: 2, used: 2 },
      ]),
    ).toEqual({ 10: 1, 6: 1 });

    // Одна кость — вернётся хотя бы одна
    expect(getLongRestHitDiceRecovery([{ die: 8, total: 1, used: 1 }])).toEqual(
      { 8: 1 },
    );
  });

  it('долгий отдых на листе с мультиклассом', () => {
    const document = makeDocument({
      classes: [makeClass('fighter', 1, 10), makeClass('wizard', 1, 6)],
      hitDiceUsed: { 10: 1, 6: 1 },
    });

    const rested = applyMechanicsLongRest(document, 14, () => 0);

    expect(rested.hitDiceUsed).toEqual({ 10: 0, 6: 1 });
  });
});

describe('итоги отдыха', () => {
  it('короткий отдых: договор, ресурсы короткого отдыха и заряды', () => {
    const document = makeDocument({
      pactSlotsUsed: 1,
      spellSlotsUsed: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      resources: [
        sheetResourceSchema.parse({
          id: 'r1',
          name: 'Второе дыхание',
          max: 1,
          used: 1,
          reset: 'SHORT',
        }),
        sheetResourceSchema.parse({
          id: 'r2',
          name: 'Ярость',
          max: 2,
          used: 1,
          reset: 'LONG',
        }),
      ],
      inventory: [
        {
          ...createSheetItem('Палочка', '/items/wand'),
          charges: { max: 7, used: 2, recharge: '1к6', rechargeEvent: 'DAWN' },
        },
      ],
    });

    expect(getRestRecoveryLabels(document, 'short')).toEqual([
      REST_TEXT.pactSlots,
      'Второе дыхание',
    ]);

    expect(getRestRecoveryLabels(document, 'long')).toEqual([
      REST_TEXT.spellSlots,
      REST_TEXT.pactSlots,
      'Второе дыхание',
      'Ярость',
      `${REST_TEXT.charges}: Палочка`,
    ]);
  });
});

describe('опыт', () => {
  it('путь к следующему уровню', () => {
    expect(getExperienceProgress(600, 2)).toEqual({
      to: 900,
      percent: 50,
      remaining: 300,
    });

    expect(getExperienceProgress(400000, 20)).toEqual({
      to: null,
      percent: 100,
      remaining: 0,
    });
  });
});
