import { z } from 'zod';

/** Разметка core-api: массив строк-блоков. */
export const markupBlocksSchema = z.array(z.string());

/**
 * Описание записи из API: HTML-строка старой базы либо разметка core-api
 * (массив строк-блоков) — пока сущности переводятся на разметку по очереди.
 */
export const contentDescriptionSchema = z.union([
  z.string(),
  markupBlocksSchema,
]);
