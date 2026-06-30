/** Статус подписки пользователя из subscriber-service. */
export interface Subscription {
  /** Есть ли сейчас активная подписка. */
  active: boolean;

  /** Зарегистрирован ли пользователь в subscriber-service. */
  registered: boolean;

  /** Дата окончания подписки (ISO-строка) либо null. */
  expiresAt: string | null;

  /** Дата начала подписки (ISO-строка) либо null. */
  startsAt: string | null;

  /** Тип подписки (например, plan-код) либо null. */
  type: string | null;
}

/** Тело запроса на активацию промокода. */
export interface RedeemCodePayload {
  code: string;
}

/**
 * Результат погашения промокода.
 *
 * Контракт subscriber-service фиксирован не полностью, поэтому поля
 * опциональны: при наличии — используем актуальный статус из ответа.
 */
export interface RedeemCodeResult {
  /** Успешно ли применён код. */
  success?: boolean;

  /** Человекочитаемое сообщение от сервиса. */
  message?: string;

  /** Актуальный статус подписки после погашения (если сервис его вернул). */
  subscription?: Partial<Subscription>;
}

/** Элемент списка подписок пользователя (GET /api/subscriptions/my). */
export interface SubscriptionItem {
  type: string | null;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}
