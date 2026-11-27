import type { HitPointsState, ParticipantSheetLink } from '../model';

import {
  fetchSheet,
  saveSheet,
  updateSavedSheetHealth,
} from '~character-sheet/model';
import { getApiErrorMessage } from '~user/model';

import {
  applyTrackerHitPointsToSheet,
  SHEET_HIT_POINTS_SYNC_DELAY,
  SHEET_PLAYER_ICON,
  SHEET_PLAYER_TEXT,
} from '../model';

/** Хиты одного листа, ждущие записи. */
interface PendingHitPoints {
  link: ParticipantSheetLink;
  hitPoints: HitPointsState;
}

/**
 * Записывает хиты в свой лист. Лист сохраняется целиком, поэтому документ
 * перечитывается: снимок, снятый при добавлении в бой, затёр бы правки игрока.
 * Версия — от только что прочитанного документа: если лист поправили между
 * чтением и записью, сервер ответит 409, а не затрёт правку.
 * @param sheetId - идентификатор листа
 * @param hitPoints - текущие и временные хиты из трекера
 */
async function saveOwnSheet(
  sheetId: string,
  hitPoints: HitPointsState,
): Promise<void> {
  const { data, version } = await fetchSheet(sheetId);

  await saveSheet(sheetId, {
    data: applyTrackerHitPointsToSheet(data, hitPoints),
    version,
  });
}

/**
 * Записывает хиты одного листа: свой — целиком через `PUT`, чужой — узкой
 * ручкой сохранённой записи (на большее у ведущего прав нет, максимум зажмёт
 * сервер).
 * @param entry - лист и его хиты
 */
async function saveSheetHitPoints(entry: PendingHitPoints): Promise<void> {
  const { link, hitPoints } = entry;

  if (link.source === 'own') {
    await saveOwnSheet(link.sheetId, hitPoints);

    return;
  }

  if (link.savedId) {
    await updateSavedSheetHealth(link.savedId, hitPoints);
  }
}

/**
 * Запись хитов из боя в лист персонажа: урон и лечение, отмеченные ведущим,
 * игрок видит на своём листе. Запросы дебаунсятся и идут по очереди — в бою
 * один лист правится многократно, а на сервер уходит последнее значение.
 * Накопленное дописывается сразу, когда вкладку прячут или бой закрывают.
 */
export function useSheetHitPointsSync() {
  const toast = useToast();

  /** Хиты, ждущие записи: `sheetId → лист и его хиты`. */
  const pending = new Map<string, PendingHitPoints>();

  let isSaving = false;

  /**
   * Записывает хиты одного листа. Ошибку показываем тостом: молча игрок не
   * увидел бы урона в листе и не узнал бы об этом.
   * @param entry - лист и его хиты
   */
  async function save(entry: PendingHitPoints): Promise<void> {
    try {
      await saveSheetHitPoints(entry);
    } catch (error) {
      toast.add({
        title: SHEET_PLAYER_TEXT.syncError,
        description: getApiErrorMessage(error, SHEET_PLAYER_TEXT.syncError),
        color: 'error',
        icon: SHEET_PLAYER_ICON.error,
      });
    }
  }

  /** Записывает накопленные хиты — по одному листу за раз. */
  async function flush(): Promise<void> {
    if (isSaving) {
      return;
    }

    isSaving = true;

    try {
      // Пока идёт запись, в очередь могли лечь новые значения — цикл забирает
      // и их, поэтому последний клик не останется несохранённым.
      while (pending.size) {
        const batch = [...pending.values()];

        pending.clear();

        for (const entry of batch) {
          await save(entry);
        }
      }
    } finally {
      isSaving = false;
    }
  }

  const flushSoon = useDebounceFn(flush, SHEET_HIT_POINTS_SYNC_DELAY);

  // Дебаунс не должен съедать последний урон: ведущий отмечает «−5» и тут же
  // прячет вкладку или уходит со страницы — дописываем сразу.
  const visibility = useDocumentVisibility();

  watch(visibility, (state) => {
    if (state === 'hidden') {
      void flush();
    }
  });

  onScopeDispose(() => {
    void flush();
  });

  /**
   * Ставит хиты листа в очередь записи (последнее значение вытесняет прежнее).
   * @param link - привязка участника к листу
   * @param hitPoints - текущие и временные хиты из трекера
   */
  function syncHitPoints(
    link: ParticipantSheetLink,
    hitPoints: HitPointsState,
  ): void {
    pending.set(link.sheetId, { link, hitPoints });

    void flushSoon();
  }

  return { syncHitPoints };
}
