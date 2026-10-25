import type { FilterDefinition } from '~section/model';

import type { RedeemResult, SignUpState, Subscription } from './schema';

import {
  ACCOUNT_CHANGE_PASSWORD_PATH,
  AUTH_EXIST_PATH,
  AUTH_SIGN_UP_PATH,
  AUTH_VERIFY_EMAIL_PATH,
  PASSWORD_RESET_CONFIRM_PATH,
  PASSWORD_RESET_REQUEST_PATH,
  PASSWORD_RESET_VALIDATE_PATH,
  SUBSCRIPTIONS_MY_PATH,
  SUBSCRIPTIONS_PATH,
  SUBSCRIPTIONS_REDEEM_PATH,
  USER_DISPLAY_NAME_PATH,
  USER_SOURCES_PATH,
} from '~/shared/consts';
import { filterResponseSchema, normalizeFilter } from '~section/model';

import { LEGAL_DOCUMENTS } from './constants';
import {
  redeemResultSchema,
  subscriptionListSchema,
  subscriptionSchema,
} from './schema';

/**
 * Регистрирует пользователя. Вместе с согласиями уходят редакции документов,
 * которые он видел.
 * @param state - заполненная форма
 */
export async function signUp(state: SignUpState): Promise<void> {
  await $fetch(AUTH_SIGN_UP_PATH, {
    method: 'POST',
    body: {
      username: state.username.trim(),
      email: state.email.trim(),
      password: state.password.trim(),
      offerAccepted: state.offerAccepted,
      offerVersion: LEGAL_DOCUMENTS.offerVersion,
      personalDataConsent: state.personalDataConsent,
      privacyPolicyVersion: LEGAL_DOCUMENTS.privacyVersion,
    },
  });
}

/**
 * Проверяет, свободно ли имя пользователя или почта: занятое отвечает 409.
 * @param field - что проверить
 * @param value - значение поля
 */
export async function checkAccountExists(
  field: 'username' | 'email',
  value: string,
): Promise<void> {
  await $fetch(AUTH_EXIST_PATH, {
    method: 'POST',
    body: { [field]: value.trim() },
  });
}

/**
 * Просит письмо со ссылкой на сброс пароля.
 * @param email - почта аккаунта
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await $fetch(PASSWORD_RESET_REQUEST_PATH, {
    method: 'POST',
    body: { email: email.trim() },
  });
}

/**
 * Проверяет ссылку сброса: просроченная бросает ошибку с причиной.
 * @param token - ключ из письма
 */
export async function validatePasswordResetToken(token: string): Promise<void> {
  await $fetch(PASSWORD_RESET_VALIDATE_PATH, { query: { token } });
}

/**
 * Ставит новый пароль по ссылке сброса.
 * @param token - ключ из письма
 * @param password - новый пароль
 */
export async function confirmPasswordReset(
  token: string,
  password: string,
): Promise<void> {
  await $fetch(PASSWORD_RESET_CONFIRM_PATH, {
    method: 'POST',
    body: { token, newPassword: password.trim() },
  });
}

/**
 * Подтверждает почту по ссылке из письма.
 * @param token - ключ из письма
 */
export async function verifyEmail(token: string): Promise<void> {
  await $fetch(AUTH_VERIFY_EMAIL_PATH, { query: { token } });
}

/**
 * Меняет отображаемое имя. Имя в старых комментариях бэкенд меняет сам.
 * @param displayName - новое имя
 */
export async function changeDisplayName(displayName: string): Promise<void> {
  await $fetch(USER_DISPLAY_NAME_PATH, {
    method: 'PATCH',
    body: { displayName: displayName.trim() },
  });
}

/**
 * Меняет пароль вошедшего пользователя.
 * @param currentPassword - текущий пароль
 * @param password - новый пароль
 */
export async function changePassword(
  currentPassword: string,
  password: string,
): Promise<void> {
  await $fetch(ACCOUNT_CHANGE_PASSWORD_PATH, {
    method: 'POST',
    body: {
      currentPassword: currentPassword.trim(),
      newPassword: password.trim(),
    },
  });
}

/** Загружает подписки текущего пользователя. */
export async function getMySubscriptions(): Promise<Subscription[]> {
  const response: unknown = await $fetch(SUBSCRIPTIONS_MY_PATH);

  return subscriptionListSchema.parse(response);
}

/**
 * Гасит промокод.
 * @param code - промокод в любом регистре
 * @returns что выдано впервые
 */
export async function redeemCode(code: string): Promise<RedeemResult> {
  const response: unknown = await $fetch(SUBSCRIPTIONS_REDEEM_PATH, {
    method: 'POST',
    body: { code: code.trim() },
  });

  return redeemResultSchema.parse(response);
}

/**
 * Запускает срок подписки, полученной по промокоду.
 * @param id - подписка в статусе `REGISTERED`
 */
export async function activateSubscription(id: string): Promise<Subscription> {
  const response: unknown = await $fetch(
    `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}/activate`,
    { method: 'POST' },
  );

  return subscriptionSchema.parse(response);
}

/**
 * Загружает все книги группами по типу; книги, снятые в источниках по
 * умолчанию, не выбраны.
 */
export async function getDefaultSources(): Promise<FilterDefinition> {
  const response: unknown = await $fetch(USER_SOURCES_PATH);

  return normalizeFilter(filterResponseSchema.parse(response));
}

/**
 * Сохраняет источники по умолчанию: разделы откроются без снятых книг.
 * @param excluded - ключи снятых книг; пустой список выбирает все книги
 */
export async function saveDefaultSources(
  excluded: ReadonlyArray<string>,
): Promise<void> {
  await $fetch(USER_SOURCES_PATH, { method: 'PUT', body: { excluded } });
}
