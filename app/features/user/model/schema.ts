import { z } from 'zod';

import {
  AUTH_LIMIT,
  AUTH_VALIDATION,
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
  USERNAME_PATTERN,
} from './constants';

const emailSchema = z
  .string()
  .trim()
  .min(1, AUTH_VALIDATION.required)
  .max(AUTH_LIMIT.max, AUTH_VALIDATION.max)
  .regex(EMAIL_PATTERN, AUTH_VALIDATION.email);

const passwordSchema = z
  .string()
  .trim()
  .min(1, AUTH_VALIDATION.required)
  .min(AUTH_LIMIT.passwordMin, AUTH_VALIDATION.passwordMin)
  .max(AUTH_LIMIT.max, AUTH_VALIDATION.max)
  .regex(PASSWORD_PATTERN, AUTH_VALIDATION.passwordChars);

/** Галочка согласия: снятая не пропускает форму. */
const consentSchema = z
  .boolean()
  .refine((value) => value, { message: AUTH_VALIDATION.consent });

/** Новый пароль и его повтор. */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    repeat: z.string().trim().min(1, AUTH_VALIDATION.required),
  })
  .refine((value) => value.password === value.repeat, {
    message: AUTH_VALIDATION.repeat,
    path: ['repeat'],
  });

export type NewPasswordState = z.input<typeof newPasswordSchema>;

/** Регистрация: обе галочки согласия человек ставит сам. */
export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, AUTH_VALIDATION.required)
      .min(AUTH_LIMIT.usernameMin, AUTH_VALIDATION.usernameMin)
      .max(AUTH_LIMIT.max, AUTH_VALIDATION.max)
      .regex(USERNAME_PATTERN, AUTH_VALIDATION.usernameChars),
    email: emailSchema,
    password: passwordSchema,
    repeat: z.string().trim().min(1, AUTH_VALIDATION.required),
    offerAccepted: consentSchema,
    personalDataConsent: consentSchema,
  })
  .refine((value) => value.password === value.repeat, {
    message: AUTH_VALIDATION.repeat,
    path: ['repeat'],
  });

export type SignUpState = z.input<typeof signUpSchema>;

/** Почта для письма со ссылкой сброса. */
export const passwordResetRequestSchema = z.object({ email: emailSchema });

export type PasswordResetRequestState = z.input<
  typeof passwordResetRequestSchema
>;

/** Тело ошибки бэкенда: текст на русском в `message`. */
export const apiErrorSchema = z.object({
  data: z.object({ message: z.string().min(1) }),
});
