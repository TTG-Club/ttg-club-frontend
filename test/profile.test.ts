import type { z } from 'zod';

import { describe, expect, it } from 'vitest';

import {
  displayNameSchema,
  formatSubscriptionDate,
  getPerkLabels,
  getRoleLabels,
  getSubscriptionCaption,
  getSubscriptionSummary,
  passwordChangeSchema,
  PROFILE_VALIDATION,
  redeemResultSchema,
} from '~user/model';

/**
 * Первое сообщение об ошибке проверки.
 * @param result - итог `safeParse`
 */
function firstIssue(result: z.ZodSafeParseResult<unknown>): string | undefined {
  return result.error?.issues[0]?.message;
}

describe('личные данные', () => {
  it('проверяет отображаемое имя', () => {
    expect(
      displayNameSchema.safeParse({ displayName: ' Отважный Странник ' }).data,
    ).toEqual({ displayName: 'Отважный Странник' });

    expect(firstIssue(displayNameSchema.safeParse({ displayName: 'Я' }))).toBe(
      PROFILE_VALIDATION.displayNameMin,
    );

    expect(
      firstIssue(displayNameSchema.safeParse({ displayName: 'Маг!' })),
    ).toBe(PROFILE_VALIDATION.displayNameChars);
  });

  it('не даёт сменить пароль на тот же', () => {
    const same = passwordChangeSchema.safeParse({
      currentPassword: 'secret-123',
      password: 'secret-123',
      repeat: 'secret-123',
    });

    expect(firstIssue(same)).toBe(PROFILE_VALIDATION.samePassword);

    expect(
      passwordChangeSchema.safeParse({
        currentPassword: 'secret-123',
        password: 'secret-456',
        repeat: 'secret-456',
      }).success,
    ).toBe(true);
  });

  it('подписывает роли', () => {
    expect(getRoleLabels(['USER', 'ADMIN', 'NEW'])).toEqual([
      'Пользователь',
      'Администратор',
      'NEW',
    ]);
  });
});

describe('подписка', () => {
  const base = { type: 'GIFT', durationMonths: 3 };

  it('находит активную, ожидающую и истёкшую', () => {
    const summary = getSubscriptionSummary([
      { ...base, id: 'a1', status: 'ACTIVE', expiresAt: '2026-11-01' },
      { ...base, id: 'a2', status: 'ACTIVE', expiresAt: '2027-01-01' },
      { ...base, id: 'r1', status: 'REGISTERED' },
      { ...base, id: 'e1', status: 'EXPIRED', expiresAt: '2025-01-01' },
    ]);

    expect(summary.active?.id).toBe('a2');
    expect(summary.registered?.id).toBe('r1');
    expect(summary.expired?.id).toBe('e1');
    expect(getSubscriptionSummary([])).toEqual({});
  });

  it('подписывает тип и срок', () => {
    expect(
      getSubscriptionCaption({ ...base, id: 's', status: 'ACTIVE' }, 'мес.'),
    ).toBe('Подарочная · 3 мес.');

    expect(
      getSubscriptionCaption({ id: 's', status: 'ACTIVE', type: 'X' }, 'мес.'),
    ).toBe('');
  });

  it('пишет даты как ДД.ММ.ГГГГ', () => {
    expect(formatSubscriptionDate('2026-12-31T12:00:00Z')).toBe('31.12.2026');
    expect(formatSubscriptionDate('не дата')).toBe('');
    expect(formatSubscriptionDate(null)).toBe('');
  });

  it('разбирает итог промокода и подписывает награды', () => {
    expect(redeemResultSchema.parse({ subscription: null })).toEqual({
      subscription: null,
      grantedPerks: [],
      grantedAchievements: [],
    });

    expect(getPerkLabels(['MAP_TOKENS_DOWNLOAD', 'NEW'])).toEqual([
      'Карты и токены',
      'NEW',
    ]);
  });
});
