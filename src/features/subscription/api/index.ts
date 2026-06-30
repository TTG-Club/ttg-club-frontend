import { httpClient } from '@/shared/api';
import { getSubscriberBaseUrl } from '@/shared/utils/getApiUrl';

import {
  EMPTY_SUBSCRIPTION,
  SUBSCRIPTION_ENDPOINTS,
} from '@/features/subscription/model';
import type {
  RedeemCodeResult,
  Subscription,
  SubscriptionItem,
} from '@/features/subscription/types/Subscription.d';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

/**
 * Аккуратная валидация внешних данных subscriber-service.
 * Zod в репозитории отсутствует, поэтому нормализуем ответ вручную,
 * чтобы стор всегда работал с предсказуемой структурой.
 */
const normalizeSubscription = (payload: unknown): Subscription => {
  if (!isRecord(payload)) {
    return { ...EMPTY_SUBSCRIPTION };
  }

  return {
    active: payload.active === true,
    registered: payload.registered === true,
    expiresAt: toNullableString(payload.expiresAt),
    startsAt: toNullableString(payload.startsAt),
    type: toNullableString(payload.type),
  };
};

export default class SubscriptionApi {
  /** GET /api/subscriptions/status — актуальный статус подписки. */
  static async getStatus(signal?: AbortSignal): Promise<Subscription> {
    const resp = await httpClient.get<unknown>({
      url: SUBSCRIPTION_ENDPOINTS.status,
      baseUrl: getSubscriberBaseUrl(),
      signal,
    });

    return normalizeSubscription(resp.data);
  }

  /** POST /api/subscriptions/redeem — активация промокода. */
  static async redeem(code: string): Promise<RedeemCodeResult> {
    const resp = await httpClient.post<unknown>({
      url: SUBSCRIPTION_ENDPOINTS.redeem,
      baseUrl: getSubscriberBaseUrl(),
      payload: { code },
    });

    if (!isRecord(resp.data)) {
      return { success: true };
    }

    return {
      success: resp.data.success !== false,
      message: toNullableString(resp.data.message) ?? undefined,
      subscription: isRecord(resp.data.subscription)
        ? normalizeSubscription(resp.data.subscription)
        : undefined,
    };
  }

  /** GET /api/subscriptions/my — список подписок пользователя. */
  static async getMySubscriptions(
    signal?: AbortSignal,
  ): Promise<SubscriptionItem[]> {
    const resp = await httpClient.get<unknown>({
      url: SUBSCRIPTION_ENDPOINTS.my,
      baseUrl: getSubscriberBaseUrl(),
      signal,
    });

    if (!Array.isArray(resp.data)) {
      return [];
    }

    return resp.data.map((item) => {
      const normalized = normalizeSubscription(item);

      return {
        type: normalized.type,
        active: normalized.active,
        startsAt: normalized.startsAt,
        expiresAt: normalized.expiresAt,
      };
    });
  }
}
