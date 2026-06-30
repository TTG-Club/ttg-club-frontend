import type { Subscription } from '@/features/subscription/types/Subscription.d';

/** Эндпоинты subscriber-service (USER, тот же SSO-JWT). */
export const SUBSCRIPTION_ENDPOINTS = {
  status: '/subscriptions/status',
  redeem: '/subscriptions/redeem',
  my: '/subscriptions/my',
} as const;

/** Интервал опроса статуса подписки в реал-тайме (мс). */
export const SUBSCRIPTION_POLL_INTERVAL_MS = 30 * 1000;

/** Пустой (дефолтный) статус подписки до первого ответа сервиса. */
export const EMPTY_SUBSCRIPTION: Subscription = {
  active: false,
  registered: false,
  expiresAt: null,
  startsAt: null,
  type: null,
};

/** Тексты тостов и подписей. */
export const SUBSCRIPTION_REDEEM_SUCCESS = 'Промокод успешно активирован!';

export const SUBSCRIPTION_REDEEM_ERROR =
  'Не удалось активировать промокод. Попробуйте позже.';

export const SUBSCRIPTION_REDEEM_INVALID =
  'Промокод не найден или уже использован.';

export const SUBSCRIPTION_REDEEM_LIMIT =
  'Слишком много попыток. Подождите немного и попробуйте снова.';

export const SUBSCRIPTION_REDEEM_EMPTY = 'Введите промокод';

export const SUBSCRIPTION_STATUS_ACTIVE_PREFIX = 'Активна до';

export const SUBSCRIPTION_STATUS_INACTIVE = 'Нет активной подписки';

export const SUBSCRIPTION_DATE_FORMAT = 'DD.MM.YYYY';
