import { DiceRoller } from '@ttg-club/dice-roller-parser';
import { describe, expect, it } from 'vitest';

import {
  appendRollEntry,
  formatFormula,
  getModeSuffix,
  getRollCritical,
} from '~dice-roller/model';

describe('formatFormula', () => {
  it('переводит русскую нотацию и минус', () => {
    expect(formatFormula('2к6 − 1')).toBe('2d6 - 1');
  });

  it('бросает к20 дважды при преимуществе и помехе', () => {
    expect(formatFormula('к20 + 5', 'advantage')).toBe('2d20kh1 + 5');
    expect(formatFormula('1к20', 'disadvantage')).toBe('2d20kl1');
  });

  it('удваивает первый кубик и делит результат пополам для остальных', () => {
    expect(formatFormula('2к6 + 3', 'advantage')).toBe('2d6 + 3+2d6');
    expect(formatFormula('2к6 + 3', 'disadvantage')).toBe('(2d6 + 3)/2');
  });
});

describe('getModeSuffix', () => {
  it('подписывает особый бросок', () => {
    expect(getModeSuffix('к20', 'advantage')).toBe(' (преимущество)');
    expect(getModeSuffix('2к6', 'disadvantage')).toBe(' (1/2)');
    expect(getModeSuffix('2к6')).toBe('');
  });
});

describe('getRollCritical', () => {
  it('узнаёт натуральные 20 и 1 на первом к20', () => {
    const max = new DiceRoller(() => 0.9999);
    const min = new DiceRoller(() => 0);

    expect(getRollCritical(max.roll('1d20+5'))).toBe('success');
    expect(getRollCritical(max.roll('d20'))).toBe('success');
    expect(getRollCritical(min.roll('2d20kh1'))).toBe('failure');
  });

  it('не считает критом другие кубики', () => {
    expect(
      getRollCritical(new DiceRoller(() => 0.9999).roll('2d6')),
    ).toBeUndefined();
  });
});

describe('appendRollEntry', () => {
  it('держит историю в пределах лимита', () => {
    const entry = (id: string) => ({
      id,
      date: '',
      formula: 'к6',
      value: 1,
      dice: [1],
      label: 'Бросок',
    });

    const result = appendRollEntry([entry('1'), entry('2')], entry('3'), 2);

    expect(result.map(({ id }) => id)).toEqual(['2', '3']);
  });
});
