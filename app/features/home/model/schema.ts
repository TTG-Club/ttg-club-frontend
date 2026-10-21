import type { HomePartner, HomeVideo } from './types';

import { z } from 'zod';

/**
 * Друг сайта из `GET /api/v1/partners`. Описание и порядок необязательны: без
 * описания у чипа просто нет подсказки, без порядка друг встаёт в начало.
 */
const partnerSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
  img: z.string(),
  url: z.string().min(1),
  order: z.number().nullish(),
});

/**
 * Ролик из `GET /api/v1/youtube`. На главной нужны только `id` и `name`,
 * остальные поля могут отсутствовать — это не повод прятать ролик.
 */
const videoSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
});

const videoPageSchema = z.object({ items: z.array(z.unknown()) });

/**
 * Игра из публичного каталога сервиса игр. Поля, без которых карточка всё
 * равно понятна (жанры, своя система, ближайшая встреча), необязательны.
 */
const homeGameSchema = z.object({
  id: z.guid(),
  masterId: z.string().min(1),
  title: z.string().min(1),
  system: z.string().min(1),
  customSystem: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  customGenre: z.string().nullish(),
  imageUrl: z.string().nullish(),
  type: z.enum(['ONLINE', 'TEXT', 'OFFLINE']),
  city: z.string().nullish(),
  durationType: z.enum(['ONE_SHOT', 'CAMPAIGN']),
  costType: z.enum(['FREE', 'PAID']),
  maxPlayers: z.number().int().nonnegative(),
  takenSeats: z.number().int().nonnegative(),
  nextSession: z
    .object({ startsAt: z.iso.datetime({ offset: true }) })
    .nullish(),
  createdAt: z.iso.datetime({ offset: true }),
});

export type HomeGame = z.infer<typeof homeGameSchema>;

const gamePageSchema = z.object({ content: z.array(z.unknown()) });

const gameSystemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

export type HomeGameSystem = z.infer<typeof gameSystemSchema>;

/** Имя пользователя из `POST /api/user/display-names/by-ids` core-api */
const displayNameSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().nullish(),
  avatarUrl: z.string().nullish(),
});

export type HomeDisplayName = z.infer<typeof displayNameSchema>;

/**
 * Разбирает массив из ответа API, отсеивая битые записи поштучно: одна кривая
 * запись не прячет весь блок главной.
 *
 * @param input - сырой массив из ответа API
 * @param schema - схема одной записи
 * @returns записи, прошедшие разбор
 */
function parseList<T>(input: unknown, schema: z.ZodType<T>): Array<T> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((entry) => {
    const parsed = schema.safeParse(entry);

    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * Проверяет список друзей для блока «Наши друзья».
 *
 * @param input - ответ `GET /api/v1/partners`
 * @returns друзья с порядком по умолчанию
 */
export function parseHomePartners(input: unknown): Array<HomePartner> {
  return parseList(input, partnerSchema).map((partner) => ({
    name: partner.name,
    description: partner.description ?? undefined,
    img: partner.img,
    url: partner.url,
    order: partner.order ?? 0,
  }));
}

/**
 * Проверяет страницу роликов для панели видео.
 *
 * @param input - ответ `GET /api/v1/youtube`
 * @returns ролики в порядке ответа
 */
export function parseHomeVideos(input: unknown): Array<HomeVideo> {
  const page = videoPageSchema.safeParse(input);

  return page.success ? parseList(page.data.items, videoSchema) : [];
}

/**
 * Проверяет страницу публичного каталога игр.
 *
 * @param input - ответ `GET /api/v1/games`
 * @returns игры с нужными полями
 */
export function parseHomeGames(input: unknown): Array<HomeGame> {
  return parseList(gamePageSchema.parse(input).content, homeGameSchema);
}

/**
 * Проверяет справочник систем сервиса игр.
 *
 * @param input - ответ `GET /api/v1/game-systems`
 * @returns системы с кодом и названием
 */
export function parseHomeGameSystems(input: unknown): Array<HomeGameSystem> {
  return parseList(input, gameSystemSchema);
}

/**
 * Проверяет ответ core-api с именами пользователей.
 *
 * @param input - ответ `POST /api/user/display-names/by-ids`
 * @returns имена с аватарами
 */
export function parseHomeDisplayNames(input: unknown): Array<HomeDisplayName> {
  return parseList(input, displayNameSchema);
}
