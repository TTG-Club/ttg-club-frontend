import type {
  CharacterSheet,
  CharacterSheetList,
  SavedSheet,
  SavedSheetEditAccess,
  SavedSheetList,
  SharedSheet,
  SheetDocument,
  SheetEditorList,
  SheetEditStatus,
  SheetPresence,
} from './schema';

import { z } from 'zod';

import {
  CHARACTER_SHEET_API_URL,
  SHEET_AVATAR_API_SEGMENT,
  SHEET_AVATAR_URL_PREFIX,
  SHEET_EDIT_API,
  SHEET_HISTORY_API_SEGMENT,
  SHEET_SHARE_API,
} from './constants';
import {
  characterSheetListSchema,
  characterSheetSchema,
  savedSheetEditAccessListSchema,
  savedSheetListSchema,
  savedSheetSchema,
  sharedSheetSchema,
  sheetEditorListSchema,
  sheetEditRequestCountSchema,
  sheetEditRequestSchema,
  sheetPresenceSchema,
  sheetShareSchema,
} from './schema';
import { getCatalogApiPath } from './utils';

/** Хиты сохранённого чужого листа: текущие и временные. */
interface SavedSheetHealthBody {
  current: number;
  temporary: number;
}

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

/**
 * Пишет хиты в сохранённый чужой лист (их отмечает мастер в трекере
 * инициативы). Сервер меняет только текущие и временные хиты, текущие зажимает
 * максимумом листа; отозванная ссылка или удалённый лист — 404.
 * @param id - идентификатор сохранённой записи
 * @param body - текущие и временные хиты
 */
export async function updateSavedSheetHealth(
  id: string,
  body: SavedSheetHealthBody,
): Promise<void> {
  const api = useApi();

  await api(
    `${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}/${encodeURIComponent(id)}/${SHEET_SHARE_API.health}`,
    { method: 'PATCH', body },
  );
}

/**
 * Адрес записи в «Других листах».
 * @param savedId - идентификатор записи
 */
function getSavedSheetUrl(savedId: string): string {
  return `${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}/${encodeURIComponent(savedId)}`;
}

/**
 * Просит владельца разрешить правки сохранённого чужого листа.
 * @param savedId - идентификатор записи в «Других листах»
 * @returns состояние права: запрос ждёт ответа или право уже выдано
 */
export async function requestSheetEdit(
  savedId: string,
): Promise<SheetEditStatus> {
  const api = useApi();

  const response = await api(
    `${getSavedSheetUrl(savedId)}/${SHEET_EDIT_API.editRequest}`,
    { method: 'POST' },
  );

  return sheetEditRequestSchema.parse(response).status;
}

/** Права на редактирование сохранённых листов: запрошенные и выданные. */
export async function fetchSavedSheetEditAccess(): Promise<
  Array<SavedSheetEditAccess>
> {
  const api = useApi();

  const response = await api(
    `${CHARACTER_SHEET_API_URL}/${SHEET_SHARE_API.saved}/${SHEET_EDIT_API.editAccess}`,
  );

  return savedSheetEditAccessListSchema.parse(response).sheets;
}

/** Число неотвеченных запросов на редактирование листов пользователя. */
export async function fetchEditRequestCount(): Promise<number> {
  const api = useApi();

  const response = await api(
    `${CHARACTER_SHEET_API_URL}/${SHEET_EDIT_API.editRequestsCount}`,
  );

  return sheetEditRequestCountSchema.parse(response).count;
}

/**
 * Запросы и редакторы своего листа.
 * @param id - идентификатор листа
 */
export async function fetchSheetEditors(id: string): Promise<SheetEditorList> {
  const api = useApi();

  return sheetEditorListSchema.parse(
    await api(`${getSheetUrl(id)}/${SHEET_EDIT_API.editors}`),
  );
}

/**
 * Разрешает правки по запросу.
 * @param id - идентификатор листа
 * @param editorId - идентификатор запроса
 * @returns обновлённые запросы и редакторы
 */
export async function approveSheetEditor(
  id: string,
  editorId: string,
): Promise<SheetEditorList> {
  const api = useApi();

  return sheetEditorListSchema.parse(
    await api(
      `${getSheetUrl(id)}/${SHEET_EDIT_API.editors}/${encodeURIComponent(editorId)}/${SHEET_EDIT_API.approve}`,
      { method: 'POST' },
    ),
  );
}

/**
 * Отклоняет запрос или отзывает выданное право.
 * @param id - идентификатор листа
 * @param editorId - идентификатор запроса или права
 * @returns обновлённые запросы и редакторы
 */
export async function removeSheetEditor(
  id: string,
  editorId: string,
): Promise<SheetEditorList> {
  const api = useApi();

  return sheetEditorListSchema.parse(
    await api(
      `${getSheetUrl(id)}/${SHEET_EDIT_API.editors}/${encodeURIComponent(editorId)}`,
      { method: 'DELETE' },
    ),
  );
}

/**
 * Отмечает, что лист открыт на правку; 403 и 404 — права больше нет.
 * @param id - идентификатор листа
 * @returns кто ещё на листе и версия листа на сервере
 */
export async function sendSheetPresence(id: string): Promise<SheetPresence> {
  const api = useApi();

  return sheetPresenceSchema.parse(
    await api(`${getSheetUrl(id)}/${SHEET_EDIT_API.presence}`, {
      method: 'POST',
    }),
  );
}

/**
 * Снимает отметку присутствия запросом, который переживёт закрытие страницы.
 * Ответ не нужен: отметка и так истечёт на сервере сама.
 * @param id - идентификатор листа
 */
export function leaveSheetPresence(id: string): void {
  fetch(`${getSheetUrl(id)}/${SHEET_EDIT_API.presence}`, {
    method: 'DELETE',
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => undefined);
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
