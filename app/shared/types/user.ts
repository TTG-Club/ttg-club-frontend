import { z } from 'zod';

/** Роли пользователя, которые знает бэкенд. */
export enum Role {
  USER = 'USER',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

/** Профиль из `GET /api/v1/user/info`. */
export const userProfileSchema = z.object({
  username: z.string().min(1),
  name: z.string().nullish(),
  email: z.string().nullish(),
  /** Отображаемое имя для комментариев; без него показывается логин. */
  displayName: z.string().nullish(),
  roles: z.array(z.string()),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/** Ответ входа и продления сессии: токен нужен только для отметки о входе. */
export const authTokenSchema = z.object({
  accessToken: z.string().min(1),
});

/** Данные формы входа. */
export interface SignInCredentials {
  usernameOrEmail: string;
  password: string;
  remember: boolean;
}
