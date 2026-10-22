import type { z } from 'zod';

import { describe, expect, it } from 'vitest';

import {
  AUTH_VALIDATION,
  getApiErrorMessage,
  getQueryToken,
  newPasswordSchema,
  passwordResetRequestSchema,
  signUpSchema,
} from '~user/model';

const filled = {
  username: 'magistr',
  email: 'mage@ttg.club',
  password: 'secret#42',
  repeat: 'secret#42',
  offerAccepted: true,
  personalDataConsent: true,
};

/**
 * Подсказки проверки по полям.
 * @param result - результат `safeParse`
 */
function getIssues(
  result: z.ZodSafeParseResult<unknown>,
): Record<string, string> {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      String(issue.path[0]),
      issue.message,
    ]),
  );
}

describe('регистрация', () => {
  it('пропускает заполненную форму', () => {
    expect(signUpSchema.safeParse(filled).success).toBe(true);
  });

  it('не пропускает без согласий', () => {
    const issues = getIssues(
      signUpSchema.safeParse({
        ...filled,
        offerAccepted: false,
        personalDataConsent: false,
      }),
    );

    expect(issues.offerAccepted).toBe(AUTH_VALIDATION.consent);
    expect(issues.personalDataConsent).toBe(AUTH_VALIDATION.consent);
  });

  it('проверяет имя, почту и пароль', () => {
    const issues = getIssues(
      signUpSchema.safeParse({
        ...filled,
        username: 'маг!!',
        email: 'mage@',
        password: 'пароль12',
        repeat: 'пароль12',
      }),
    );

    expect(issues.username).toBe(AUTH_VALIDATION.usernameChars);
    expect(issues.email).toBe(AUTH_VALIDATION.email);
    expect(issues.password).toBe(AUTH_VALIDATION.passwordChars);
  });

  it('требует одинаковые пароли', () => {
    const issues = getIssues(
      signUpSchema.safeParse({ ...filled, repeat: 'secret#43' }),
    );

    expect(issues.repeat).toBe(AUTH_VALIDATION.repeat);
  });
});

describe('сброс пароля', () => {
  it('проверяет почту и новый пароль', () => {
    expect(
      passwordResetRequestSchema.safeParse({ email: ' mage@ttg.club ' })
        .success,
    ).toBe(true);

    expect(
      getIssues(newPasswordSchema.safeParse({ password: 'short', repeat: '' }))
        .password,
    ).toBe(AUTH_VALIDATION.passwordMin);
  });

  it('берёт ключ из ссылки одной строкой', () => {
    expect(getQueryToken('abc')).toBe('abc');
    expect(getQueryToken(['abc'])).toBeUndefined();
    expect(getQueryToken('')).toBeUndefined();
  });

  it('показывает причину ошибки бэкенда', () => {
    expect(
      getApiErrorMessage({ data: { message: 'Ссылка устарела' } }, 'запас'),
    ).toBe('Ссылка устарела');

    expect(getApiErrorMessage(new Error('x'), 'запас')).toBe('запас');
  });
});
