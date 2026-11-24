import type {
  CharacterSheet,
  CharacterSheetList,
  SheetDocument,
} from './schema';

import { z } from 'zod';

import {
  CHARACTER_SHEET_API_URL,
  SHEET_AVATAR_API_SEGMENT,
  SHEET_AVATAR_URL_PREFIX,
} from './constants';
import { characterSheetListSchema, characterSheetSchema } from './schema';
import { getCatalogApiPath } from './utils';

/** Тело сохранения листа: имя, документ и версия, с которой начиналась правка. */
interface SheetSaveBody {
  name?: string;
  data?: SheetDocument;
  version?: number;
}

/**
 * Адрес листа на сервере.
 * @param id - идентификатор листа
 */
function getSheetUrl(id: string): string {
  return `${CHARACTER_SHEET_API_URL}/${encodeURIComponent(id)}`;
}

/** Листы пользователя с документами, сколько занято и лимит. */
export async function fetchSheetList(): Promise<CharacterSheetList> {
  const api = useApi();

  return characterSheetListSchema.parse(await api(CHARACTER_SHEET_API_URL));
}

/**
 * Лист целиком.
 * @param id - идентификатор листа
 */
export async function fetchSheet(id: string): Promise<CharacterSheet> {
  const api = useApi();

  return characterSheetSchema.parse(await api(getSheetUrl(id)));
}

/**
 * Создаёт лист; сверх лимита сервер отвечает 403.
 * @param name - имя персонажа; пустое — сервер подставит своё
 * @param data - документ листа
 */
export async function createSheet(
  name: string,
  data: SheetDocument,
): Promise<CharacterSheet> {
  const api = useApi();

  return characterSheetSchema.parse(
    await api(CHARACTER_SHEET_API_URL, {
      method: 'POST',
      body: { name, data },
    }),
  );
}

/**
 * Сохраняет лист; устаревшая версия — 409.
 * @param id - идентификатор листа
 * @param body - имя, документ и версия
 */
export async function saveSheet(
  id: string,
  body: SheetSaveBody,
): Promise<CharacterSheet> {
  const api = useApi();

  return characterSheetSchema.parse(
    await api(getSheetUrl(id), { method: 'PUT', body }),
  );
}

/**
 * Сохраняет лист, когда страницу закрывают: обычный запрос браузер оборвал
 * бы, а `keepalive` доживает до ответа. Сессия — в cookie, поэтому клиент
 * сайта здесь не нужен.
 * @param id - идентификатор листа
 * @param body - имя, документ и версия
 */
export function saveSheetOnLeave(id: string, body: SheetSaveBody): void {
  void fetch(getSheetUrl(id), {
    method: 'PUT',
    keepalive: true,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Удаляет лист.
 * @param id - идентификатор листа
 */
export async function deleteSheet(id: string): Promise<void> {
  const api = useApi();

  await api(getSheetUrl(id), { method: 'DELETE' });
}

/** Ответ загрузки портрета: адрес файла листа с меткой версии. */
const sheetAvatarResponseSchema = z.object({
  url: z.string().startsWith(SHEET_AVATAR_URL_PREFIX),
});

/**
 * Адрес ручки портрета листа.
 * @param id - идентификатор листа
 */
function getSheetAvatarUrl(id: string): string {
  return `${getSheetUrl(id)}/${SHEET_AVATAR_API_SEGMENT}`;
}

/**
 * Загружает портрет листа вместо прежнего. Документ листа сервер не меняет:
 * адрес записывает в него сам лист.
 * @param id - идентификатор листа
 * @param file - вырезанный квадрат
 * @returns адрес портрета с меткой версии
 */
export async function uploadSheetAvatar(
  id: string,
  file: File,
): Promise<string> {
  const api = useApi();
  const body = new FormData();

  body.append('file', file);

  const response = await api(getSheetAvatarUrl(id), { method: 'POST', body });

  return sheetAvatarResponseSchema.parse(response).url;
}

/**
 * Удаляет файл портрета листа.
 * @param id - идентификатор листа
 */
export async function deleteSheetAvatar(id: string): Promise<void> {
  const api = useApi();

  await api(getSheetAvatarUrl(id), { method: 'DELETE' });
}

/**
 * Запись справочника по её адресу на сайте.
 * @param url - адрес записи, например `/classes/fighter`
 * @param schema - схема ответа
 */
export async function fetchCatalogEntry<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const api = useApi();

  return schema.parse(
    await api(getCatalogApiPath(url), { method: 'POST', body: {} }),
  );
}

/**
 * Запись справочника без разбора: одну карточку лист читает несколькими
 * схемами (раздел и механика), чтобы битая механика не роняла остальное.
 * @param url - адрес записи, например `/classes/fighter`
 */
export async function fetchCatalogRaw(url: string): Promise<unknown> {
  const api = useApi();

  return await api(getCatalogApiPath(url), { method: 'POST', body: {} });
}
