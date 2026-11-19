import { z } from 'zod';

/**
 * Описание записи из API: HTML-строка старой базы либо разметка core-api
 * (массив строк-блоков) — пока сущности переводятся на разметку по очереди.
 */
export const contentDescriptionSchema = z.union([
  z.string(),
  z.array(z.string()),
]);
