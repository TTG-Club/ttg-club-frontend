import type {
  CharacterSheet,
  CharacterSheetList,
  SavedSheet,
  SavedSheetList,
  SharedSheet,
  SheetDocument,
} from './schema';

import { z } from 'zod';

import {
  CHARACTER_SHEET_API_URL,
  SHEET_AVATAR_API_SEGMENT,
  SHEET_AVATAR_URL_PREFIX,
  SHEET_HISTORY_API_SEGMENT,
  SHEET_SHARE_API,
} from './constants';
import {
  characterSheetListSchema,
  characterSheetSchema,
  savedSheetListSchema,
  savedSheetSchema,
  sharedSheetSchema,
  sheetShareSchema,
} from './schema';
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
 * Восстанавливает лист из истории; сверх лимита активных — 403.
 * @param id - идентификатор листа
 */
export async function restoreSheet(id: string): Promise<CharacterSheet> {
  const api = useApi();

  return characterSheetSchema.parse(
    await api(`${getSheetUrl(id)}/${SHEET_HISTORY_API_SEGMENT}`, {
      method: 'POST',
    }),
  );
}

/**
 * Удаляет лист в историю: его можно восстановить, пока он в ней.
 * @param id - идентификатор листа
 */
export async function deleteSheet(id: string): Promise<void> {
  const api = useApi();

  await api(getSheetUrl(id), { method: 'DELETE' });
}

/**
 * Включает доступ к листу по ссылке; у открытого листа — прежняя ссылка.
 * @param id - идентификатор листа
 * @returns секрет ссылки
 */
export async function shareSheet(id: string): Promise<string> {
  const api = useApi();

  const response = await api(`${getSheetUrl(id)}/${SHEET_SHARE_API.share}`, {
    method: 'POST',
  });

  return sheetShareSchema.parse(response).shareToken;
}

/**
 * Отзывает ссылку: прежняя больше не откроет лист.
 * @param id - идентификатор листа
 */
export async function unshareSheet(id: string): Promise<void> {
  const api = useApi();

  await api(`${getSheetUrl(id)}/${SHEET_SHARE_API.share}`, {
    method: 'DELETE',
  });
}

/**
 * Лист по ссылке: только чтение, открывается и гостю.
 * @param token - секрет ссылки
 */
export async function fetchSharedSheet(token: string): Promise<SharedSheet> {
  const api = useApi();

  return sharedSheetSchema.parse(
    await api(
      `${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.shared}/${encodeURIComponent(token)}`,
    ),
  );
}

/** «Другие листы»: чужие листы, сохранённые по ссылке, и лимит. */
export async function fetchSavedSheets(): Promise<SavedSheetList> {
  const api = useApi();

  return savedSheetListSchema.parse(
    await api(`${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}`),
  );
}

/**
 * Сохраняет чужой лист по ссылке; повторное сохранение обновляет запись.
 * @param token - секрет ссылки
 */
export async function saveSharedSheet(token: string): Promise<SavedSheet> {
  const api = useApi();

  return savedSheetSchema.parse(
    await api(`${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}`, {
      method: 'POST',
      body: { shareToken: token },
    }),
  );
}

/**
 * Убирает лист из «Других листов»; сам лист остаётся у владельца.
 * @param id - идентификатор записи
 */
export async function removeSavedSheet(id: string): Promise<void> {
  const api = useApi();

  await api(
    `${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
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
