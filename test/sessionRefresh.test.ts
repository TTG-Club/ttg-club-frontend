import { describe, expect, it } from 'vitest';

import { shouldRefreshSession } from '#shared/utils';

describe('shouldRefreshSession', () => {
  it('продлевает сессию на 401 обычного запроса', () => {
    expect(shouldRefreshSession('/api/v1/bookmarks', 401)).toBe(true);

    expect(
      shouldRefreshSession(
        new Request('https://5e14.ttg.club/api/v1/bookmarks/42'),
        401,
      ),
    ).toBe(true);
  });

  it('не продлевает сессию на другие ошибки', () => {
    expect(shouldRefreshSession('/api/v1/bookmarks', 403)).toBe(false);
    expect(shouldRefreshSession('/api/v1/bookmarks', 500)).toBe(false);
  });

  it('не продлевает сессию для входа, продления и смены пароля', () => {
    expect(shouldRefreshSession('/api/v1/auth/signin', 401)).toBe(false);
    expect(shouldRefreshSession('/api/v1/auth/refresh', 401)).toBe(false);

    expect(shouldRefreshSession('/api/account/change-password', 401)).toBe(
      false,
    );
  });
});
