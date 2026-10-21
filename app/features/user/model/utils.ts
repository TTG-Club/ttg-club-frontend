import { z } from 'zod';

import { GREETINGS } from './constants';

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
