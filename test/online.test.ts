import { describe, expect, it } from 'vitest';

import {
  getGuestHeartbeatBody,
  getRegisteredHeartbeatBody,
  parseOnlineVisitorId,
} from '~infrastructure/analytics/model';

describe('учёт посетителей онлайн', () => {
  it('отмечает гостя его идентификатором', () => {
    expect(getGuestHeartbeatBody('g1')).toEqual({ key: 'g1', type: 'GUEST' });
  });

  it('отмечает вошедшего логином и прежним ключом гостя', () => {
    expect(getRegisteredHeartbeatBody('magistrus', 'g1')).toEqual({
      key: 'magistrus',
      previousGuestKey: 'g1',
      type: 'REGISTERED',
    });

    expect(getRegisteredHeartbeatBody('magistrus')).toEqual({
      key: 'magistrus',
      type: 'REGISTERED',
    });
  });

  it('отбрасывает пустой и слишком длинный идентификатор гостя', () => {
    expect(parseOnlineVisitorId('g1')).toBe('g1');
    expect(parseOnlineVisitorId('')).toBeUndefined();
    expect(parseOnlineVisitorId('x'.repeat(129))).toBeUndefined();
    expect(parseOnlineVisitorId(42)).toBeUndefined();
  });
});
