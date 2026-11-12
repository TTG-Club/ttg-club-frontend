import type { DmScreenDetail, DmScreenList, DmScreenWindow } from './schema';

import { DM_SCREENS_API_URL } from './constants';
import { dmScreenDetailSchema, dmScreenListSchema } from './schema';

/**
 * Адрес ширмы на сервере.
 * @param id - идентификатор ширмы
 */
function getScreenUrl(id: string): string {
  return `${DM_SCREENS_API_URL}/${encodeURIComponent(id)}`;
}

/**
 * Адрес окон ширмы на сервере.
 * @param id - идентификатор ширмы
 */
function getWindowsUrl(id: string): string {
  return `${getScreenUrl(id)}/windows`;
}

/** Ширмы пользователя, сколько создано и сколько можно. */
export async function fetchDmScreenList(): Promise<DmScreenList> {
  const api = useApi();

  return dmScreenListSchema.parse(await api(DM_SCREENS_API_URL));
}

/**
 * Ширма целиком: имя и окна.
 * @param id - идентификатор ширмы
 */
export async function fetchDmScreen(id: string): Promise<DmScreenDetail> {
  const api = useApi();

  return dmScreenDetailSchema.parse(await api(getScreenUrl(id)));
}

/**
 * Создаёт ширму; сверх лимита сервер отвечает 403.
 * @param name - имя ширмы
 * @param windows - окна, с которыми ширма создаётся, например перенесённые
 * из браузера
 */
export async function createDmScreen(
  name: string,
  windows: ReadonlyArray<DmScreenWindow> = [],
): Promise<DmScreenDetail> {
  const api = useApi();

  return dmScreenDetailSchema.parse(
    await api(DM_SCREENS_API_URL, {
      method: 'POST',
      body: { name, windows },
    }),
  );
}

/**
 * Переименовывает ширму.
 * @param id - идентификатор ширмы
 * @param name - новое имя
 */
export async function renameDmScreen(
  id: string,
  name: string,
): Promise<DmScreenDetail> {
  const api = useApi();

  return dmScreenDetailSchema.parse(
    await api(getScreenUrl(id), { method: 'PATCH', body: { name } }),
  );
}

/**
 * Сохраняет окна ширмы целиком.
 * @param id - идентификатор ширмы
 * @param windows - окна ширмы
 */
export async function saveDmScreenWindows(
  id: string,
  windows: ReadonlyArray<DmScreenWindow>,
): Promise<void> {
  const api = useApi();

  await api(getWindowsUrl(id), { method: 'PUT', body: windows });
}

/**
 * Сохраняет окна, когда страницу закрывают: обычный запрос браузер
 * оборвал бы, а `keepalive` доживает до ответа. Сессия — в cookie, поэтому
 * клиент сайта здесь не нужен.
 * @param id - идентификатор ширмы
 * @param windows - окна ширмы
 */
export function saveDmScreenWindowsOnLeave(
  id: string,
  windows: ReadonlyArray<DmScreenWindow>,
): void {
  void fetch(getWindowsUrl(id), {
    method: 'PUT',
    keepalive: true,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(windows),
  });
}

/**
 * Удаляет ширму.
 * @param id - идентификатор ширмы
 */
export async function deleteDmScreen(id: string): Promise<void> {
  const api = useApi();

  await api(getScreenUrl(id), { method: 'DELETE' });
}
