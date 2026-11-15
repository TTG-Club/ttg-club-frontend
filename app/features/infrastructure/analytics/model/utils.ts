import type { OnlineHeartbeatBody } from './types';

import { z } from 'zod';

import { getErrorStatus } from '~user/model';

import {
  FEATURE_USAGE_REJECTED_MIN_STATUS,
  FEATURE_USAGE_SERVER_ERROR_MIN_STATUS,
  FEATURE_USAGE_TOO_MANY_REQUESTS_STATUS,
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

/**
 * Сервис учёта отказал так, что повторять бессмысленно: ручки нет или запрос
 * ей не подходит. Превышение лимита, сбои сервера и обрыв сети — временные,
 * после них отметки продолжаются.
 * @param error - пойманная ошибка запроса
 */
export function isFeatureUsageRejected(error: unknown): boolean {
  const status = getErrorStatus(error);

  return (
    status !== undefined
    && status >= FEATURE_USAGE_REJECTED_MIN_STATUS
    && status < FEATURE_USAGE_SERVER_ERROR_MIN_STATUS
    && status !== FEATURE_USAGE_TOO_MANY_REQUESTS_STATUS
  );
}
