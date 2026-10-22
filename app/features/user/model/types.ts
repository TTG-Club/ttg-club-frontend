import type { AUTH_VIEWS } from './constants';
import type { Subscription } from './schema';

/** Форма в окне входа. */
export type AuthView = (typeof AUTH_VIEWS)[number];

/** Что показать в карточке подписки. */
export interface SubscriptionSummary {
  /** Активная с самым поздним окончанием. */
  active?: Subscription;
  /** Полученная по промокоду, но ещё не запущенная. */
  registered?: Subscription;
  /** Последняя истёкшая. */
  expired?: Subscription;
}
