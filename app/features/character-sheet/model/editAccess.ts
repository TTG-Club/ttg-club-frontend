import type { SavedSheetEditAccess, SheetEditStatus } from './schema';

import {
  SHEET_HTTP_STATUS,
  SHEET_PRESENCE_INTERVAL_MS,
  SHEET_PRESENCE_SHARED_INTERVAL_MS,
} from './constants';

/** Что можно сделать с правом на редактирование сохранённого листа. */
export type SavedSheetEditAction = 'request' | 'pending' | null;

/** Перемены в сводке прав на редактирование между двумя опросами. */
export interface EditAccessChanges {
  /** Запрос ждал ответа, и владелец разрешил правки. */
  granted: Array<SavedSheetEditAccess>;

  /** Запрос ждал ответа и пропал из сводки — владелец отклонил его. */
  declined: Array<SavedSheetEditAccess>;
}

/**
 * Пункт запроса правок у сохранённого чужого листа. С выданным правом пункта
 * нет: карточка сама открывает лист на правку.
 * @param editStatus - право на редактирование; null — не запрашивалось
 * @returns `request` — запрос можно отправить, `pending` — ждёт ответа, null —
 *   пункт не нужен
 */
export function getSavedSheetEditAction(
  editStatus: SheetEditStatus | null,
): SavedSheetEditAction {
  if (editStatus === 'APPROVED') {
    return null;
  }

  return editStatus === 'PENDING' ? 'pending' : 'request';
}

/**
 * Ответы владельцев между двумя опросами сводки: разрешения и отказы. Отказ
 * записи не оставляет — о нём узнаём по пропаже ждавшего ответа запроса.
 * Разрешение, которое уже было в прошлой сводке, новым не считается: о нём
 * сообщили раньше или пользователь получил его до открытия страницы.
 * @param previous - прошлая сводка; null — опросов ещё не было
 * @param next - свежая сводка
 * @returns новые разрешения и отказы
 */
export function getEditAccessChanges(
  previous: Array<SavedSheetEditAccess> | null,
  next: Array<SavedSheetEditAccess>,
): EditAccessChanges {
  if (!previous) {
    return { granted: [], declined: [] };
  }

  const nextBySavedId = new Map(next.map((access) => [access.savedId, access]));

  const waiting = previous.filter((access) => access.status === 'PENDING');

  return {
    granted: waiting.flatMap((access) => {
      const answered = nextBySavedId.get(access.savedId);

      return answered?.status === 'APPROVED' ? [answered] : [];
    }),
    declined: waiting.filter((access) => !nextBySavedId.has(access.savedId)),
  };
}

/**
 * Пауза между отметками присутствия. Пока лист открыт у кого-то ещё, отметка
 * идёт чаще: чужие правки появляются почти сразу. Редактор чужого листа
 * отмечается часто всегда — так он сразу узнаёт, что право отозвали.
 * @param otherUsersCount - сколько ещё пользователей сейчас на листе
 * @param isEditor - лист чужой и открыт по праву редактора
 * @returns пауза, мс
 */
export function getPresenceInterval(
  otherUsersCount: number,
  isEditor: boolean,
): number {
  return otherUsersCount > 0 || isEditor
    ? SHEET_PRESENCE_SHARED_INTERVAL_MS
    : SHEET_PRESENCE_INTERVAL_MS;
}

/**
 * Отказ в отметке присутствия по самому листу: право на правки отозвали или
 * лист удалён. Прочие сбои не страшны — следующая отметка по таймеру.
 * @param status - HTTP-статус ошибки
 * @returns true, если править лист больше нельзя
 */
export function isEditAccessLostStatus(status: number | undefined): boolean {
  return (
    status === SHEET_HTTP_STATUS.forbidden
    || status === SHEET_HTTP_STATUS.notFound
  );
}
