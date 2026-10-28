import type { OnlineHeartbeatBody } from './types';

import { z } from 'zod';

import {
  ONLINE_VISITOR_KEY_MAX_LENGTH,
  ONLINE_VISITOR_TYPE,
} from './constants';

const visitorIdSchema = z.string().min(1).max(ONLINE_VISITOR_KEY_MAX_LENGTH);

/**
 * Идентификатор гостя из cookie; пустой или чужой отбрасывается.
 * @param value - значение cookie
 */
export function parseOnlineVisitorId(value: unknown): string | undefined {
  const parsed = visitorIdSchema.safeParse(value);

  return parsed.success ? parsed.data : undefined;
}

/**
 * Тело отметки вошедшего: логин и прежний ключ гостя, если он был.
 * @param username - логин
 * @param visitorId - идентификатор гостя из cookie
 */
export function getRegisteredHeartbeatBody(
  username: string,
  visitorId?: string,
): OnlineHeartbeatBody {
  return {
    key: username,
    ...(visitorId ? { previousGuestKey: visitorId } : {}),
    type: ONLINE_VISITOR_TYPE.registered,
  };
}

/**
 * Тело отметки гостя.
 * @param visitorId - идентификатор гостя
 */
export function getGuestHeartbeatBody(visitorId: string): OnlineHeartbeatBody {
  return { key: visitorId, type: ONLINE_VISITOR_TYPE.guest };
}
