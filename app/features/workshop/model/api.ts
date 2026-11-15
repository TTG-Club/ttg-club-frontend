import type {
  BookSourceOption,
  RevisionInfo,
  SavedEntry,
  SelectOption,
} from './types';

import {
  REFERENCE_API_PATH,
  WORKSHOP_API_PATH,
  WORKSHOP_BOOKS_PATH,
  WORKSHOP_BOOKS_QUERY,
  WORKSHOP_PREVIEW_SEGMENT,
} from './constants';
import {
  parseBookSources,
  parseFilterGroups,
  parseRevisions,
  parseSavedEntry,
} from './schemas';

/**
 * Запись справочника по адресу её страницы: `/spells/Fire_Bolt`.
 * @param path - адрес страницы записи
 */
export async function fetchReferenceEntry(path: string): Promise<unknown> {
  const api = useApi();

  return await api<unknown>(`${REFERENCE_API_PATH}${path}`, {
    method: 'POST',
  });
}

/**
 * Карточка записи по данным формы: бэкенд сохраняет запись и откатывает
 * изменения, поэтому карточка такая же, как после сохранения.
 * @param apiSection - раздел в ручках мастерской
 * @param payload - данные формы, как при сохранении
 * @param entryId - идентификатор записи при правке
 */
export async function fetchWorkshopPreview(
  apiSection: string,
  payload: Record<string, unknown>,
  entryId: number | undefined,
): Promise<unknown> {
  const api = useApi();

  return await api<unknown>(
    `${WORKSHOP_API_PATH}/${apiSection}/${WORKSHOP_PREVIEW_SEGMENT}`,
    {
      method: 'POST',
      body: payload,
      query: entryId === undefined ? {} : { id: entryId },
    },
  );
}

/**
 * Запись в виде формы мастерской: так её отдают только боги.
 * @param apiSection - раздел в ручках мастерской
 * @param slug - сегмент адреса записи
 */
export async function fetchWorkshopEntry(
  apiSection: string,
  slug: string,
): Promise<unknown> {
  const api = useApi();

  return await api<unknown>(`${WORKSHOP_API_PATH}/${apiSection}/${slug}`);
}

/**
 * Группы фильтров раздела: значения по ключу группы.
 * @param filterPath - ручка фильтров, например `/api/v1/filters/gods`
 */
export async function fetchFilterGroups(
  filterPath: string,
): Promise<Map<string, Array<SelectOption>>> {
  const api = useApi();

  return parseFilterGroups(
    await api<unknown>(filterPath, { method: 'POST', body: {} }),
  );
}

/**
 * Создаёт запись.
 * @param apiSection - раздел в ручках мастерской
 * @param payload - данные формы
 */
export async function createWorkshopEntry(
  apiSection: string,
  payload: Record<string, unknown>,
): Promise<SavedEntry> {
  const api = useApi();

  return parseSavedEntry(
    await api<unknown>(`${WORKSHOP_API_PATH}/${apiSection}`, {
      method: 'POST',
      body: payload,
    }),
  );
}

/**
 * Сохраняет правку записи.
 * @param apiSection - раздел в ручках мастерской
 * @param entryId - идентификатор записи
 * @param payload - данные формы
 */
export async function updateWorkshopEntry(
  apiSection: string,
  entryId: number,
  payload: Record<string, unknown>,
): Promise<SavedEntry> {
  const api = useApi();

  return parseSavedEntry(
    await api<unknown>(`${WORKSHOP_API_PATH}/${apiSection}/${entryId}`, {
      method: 'PATCH',
      body: payload,
    }),
  );
}

/**
 * Ревизии записи, свежие сверху — в порядке ответа бэкенда.
 * @param apiSection - раздел в ручках мастерской
 * @param entryId - идентификатор записи
 */
export async function fetchRevisions(
  apiSection: string,
  entryId: number,
): Promise<Array<RevisionInfo>> {
  const api = useApi();

  return parseRevisions(
    await api<unknown>(
      `${WORKSHOP_API_PATH}/${apiSection}/${entryId}/revisions`,
    ),
  );
}

/**
 * Возвращает запись к состоянию ревизии.
 * @param apiSection - раздел в ручках мастерской
 * @param entryId - идентификатор записи
 * @param revision - номер ревизии
 */
export async function restoreRevision(
  apiSection: string,
  entryId: number,
  revision: number,
): Promise<void> {
  const api = useApi();

  await api(
    `${WORKSHOP_API_PATH}/${apiSection}/${entryId}/revisions/${revision}/restore`,
    { method: 'POST' },
  );
}

/** Книги для выбора источника. */
export async function fetchBookSources(): Promise<Array<BookSourceOption>> {
  const api = useApi();

  return parseBookSources(
    await api<unknown>(WORKSHOP_BOOKS_PATH, {
      method: 'POST',
      body: WORKSHOP_BOOKS_QUERY,
    }),
  );
}
