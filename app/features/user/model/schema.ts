import { z } from 'zod';

import {
  AUTH_LIMIT,
  AUTH_VALIDATION,
  DISPLAY_NAME_LIMIT,
  DISPLAY_NAME_PATTERN,
  EMAIL_PATTERN,
  PASSWORD_PATTERN,
  PROFILE_VALIDATION,
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

/** Отображаемое имя в личном кабинете. */
export const displayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(DISPLAY_NAME_LIMIT.min, PROFILE_VALIDATION.displayNameMin)
    .max(DISPLAY_NAME_LIMIT.max, PROFILE_VALIDATION.displayNameMax)
    .regex(DISPLAY_NAME_PATTERN, PROFILE_VALIDATION.displayNameChars),
});

export type DisplayNameState = z.input<typeof displayNameSchema>;

/** Смена пароля: текущий, новый по правилам регистрации и его повтор. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().trim().min(1, AUTH_VALIDATION.required),
    password: passwordSchema,
    repeat: z.string().trim().min(1, AUTH_VALIDATION.required),
  })
  .refine((value) => value.password === value.repeat, {
    message: AUTH_VALIDATION.repeat,
    path: ['repeat'],
  })
  .refine((value) => value.password !== value.currentPassword, {
    message: PROFILE_VALIDATION.samePassword,
    path: ['password'],
  });

export type PasswordChangeState = z.input<typeof passwordChangeSchema>;

/** Подписка из сервиса подписок; даты — ISO-строки. */
export const subscriptionSchema = z.object({
  id: z.string().min(1),
  type: z.string().nullish(),
  status: z.string(),
  durationMonths: z.number().nullish(),
  startsAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

/** Ответ `GET /api/subscriptions/my`. */
export const subscriptionListSchema = z.array(subscriptionSchema);

/** Итог погашения промокода: что из наград выдано впервые. */
export const redeemResultSchema = z.object({
  subscription: subscriptionSchema.nullish(),
  grantedPerks: z.array(z.string()).default([]),
  grantedAchievements: z.array(z.unknown()).default([]),
});

export type RedeemResult = z.infer<typeof redeemResultSchema>;

/** Поле промокода. */
export const redeemCodeSchema = z.object({
  code: z.string().trim().min(1, AUTH_VALIDATION.required),
});

export type RedeemCodeState = z.input<typeof redeemCodeSchema>;
