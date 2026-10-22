import type { Subscription } from './schema';
import type { SubscriptionSummary } from './types';

import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import {
  GREETINGS,
  REWARD_PERK_LABELS,
  ROLE_LABELS,
  SUBSCRIPTION_DATE_FORMAT,
  SUBSCRIPTION_DATE_LOCALE,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPE_LABELS,
} from './constants';
import { apiErrorSchema } from './schema';

const httpErrorSchema = z.object({ statusCode: z.number() });

/**
 * Возвращает приветствие для текущего часа.
 * @param hour - час от 0 до 23
 */
export function getGreeting(hour: number): string {
  const greeting = GREETINGS.find(({ untilHour }) => hour < untilHour);

  return greeting?.text ?? '';
}

/**
 * Достаёт HTTP-статус из ошибки запроса, если он есть.
 * @param error - пойманная ошибка `$fetch`
 */
export function getErrorStatus(error: unknown): number | undefined {
  const parsed = httpErrorSchema.safeParse(error);

  return parsed.success ? parsed.data.statusCode : undefined;
}

/**
 * Текст ошибки бэкенда или запасной, если его нет.
 * @param error - пойманная ошибка `$fetch`
 * @param fallback - текст на случай ошибки без причины
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const parsed = apiErrorSchema.safeParse(error);

  return parsed.success ? parsed.data.data.message : fallback;
}

/**
 * Ключ из ссылки письма: в query он одной строкой.
 * @param value - значение `token` из query
 */
export function getQueryToken(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Подписи ролей пользователя.
 * @param roles - роли из профиля
 */
export function getRoleLabels(roles: readonly string[]): string[] {
  return roles.map((role) => ROLE_LABELS[role] ?? role);
}

/**
 * Подписи наград за промокод.
 * @param perks - коды наград
 */
export function getPerkLabels(perks: readonly string[]): string[] {
  return perks.map((perk) => REWARD_PERK_LABELS[perk] ?? perk);
}

/**
 * Подпись типа подписки и срока: «Подарочная · 3 мес.».
 * @param subscription - подписка
 * @param monthsLabel - подпись месяцев
 */
export function getSubscriptionCaption(
  subscription: Subscription,
  monthsLabel: string,
): string {
  const type = subscription.type
    ? SUBSCRIPTION_TYPE_LABELS[subscription.type]
    : undefined;

  const months = subscription.durationMonths
    ? `${subscription.durationMonths} ${monthsLabel}`
    : undefined;

  return [type, months].filter(Boolean).join(' · ');
}

/**
 * Дата подписки в виде `ДД.ММ.ГГГГ`; битая или пустая — пустая строка.
 * @param value - ISO-дата
 */
export function formatSubscriptionDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(
    SUBSCRIPTION_DATE_LOCALE,
    SUBSCRIPTION_DATE_FORMAT,
  );
}

/**
 * Последняя по окончанию подписка с нужным статусом.
 * @param subscriptions - подписки пользователя
 * @param status - статус
 */
function findLatest(
  subscriptions: readonly Subscription[],
  status: string,
): Subscription | undefined {
  const matching = subscriptions.filter((item) => item.status === status);

  return sortBy(matching, [(item) => item.expiresAt ?? '']).at(-1);
}

/**
 * Разбирает подписки на активную, ожидающую запуска и истёкшую.
 * @param subscriptions - подписки пользователя
 */
export function getSubscriptionSummary(
  subscriptions: readonly Subscription[],
): SubscriptionSummary {
  return {
    active: findLatest(subscriptions, SUBSCRIPTION_STATUS.active),
    registered: subscriptions.find(
      (item) => item.status === SUBSCRIPTION_STATUS.registered,
    ),
    expired: findLatest(subscriptions, SUBSCRIPTION_STATUS.expired),
  };
}
