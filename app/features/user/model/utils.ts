import { z } from 'zod';

import { GREETINGS } from './constants';
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
