import type { SignUpState } from './schema';

import {
  AUTH_EXIST_PATH,
  AUTH_SIGN_UP_PATH,
  AUTH_VERIFY_EMAIL_PATH,
  PASSWORD_RESET_CONFIRM_PATH,
  PASSWORD_RESET_REQUEST_PATH,
  PASSWORD_RESET_VALIDATE_PATH,
} from '~/shared/consts';

import { LEGAL_DOCUMENTS } from './constants';

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
