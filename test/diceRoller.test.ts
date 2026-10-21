import { describe, expect, it } from 'vitest';

import { formatFormula, getModeSuffix } from '~dice-roller/model';

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
