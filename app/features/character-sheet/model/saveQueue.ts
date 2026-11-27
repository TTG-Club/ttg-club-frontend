import type { SheetSaveStatus, SheetServerState, SheetSnapshot } from './types';

import {
  SHEET_SAVE_DELAY,
  SHEET_SAVE_RETRY_LIMIT,
  SHEET_SAVE_RETRY_MAX_DELAY,
} from './constants';

/** Настройки одной отправки листа на сервер. */
export interface SheetSaveOptions {
  /** Запрос должен пережить закрытие страницы; ответа на него не ждут. */
  keepalive?: boolean;
}

/** Чем очередь сохранения пользуется снаружи: сервер и открытый лист. */
export interface SheetSaveQueueDeps {
  /**
   * Отправляет лист на сервер.
   * @returns новая версия листа; null — ответа нет (запрос при уходе)
   */
  save: (
    snapshot: SheetSnapshot,
    version: number,
    options: SheetSaveOptions,
  ) => Promise<number | null>;

  /** Перечитывает лист с сервера. */
  fetch: () => Promise<SheetServerState>;

  /** Переносит свои правки на лист, который сервер принял от другого. */
  merge: (
    base: SheetSnapshot,
    mine: SheetSnapshot,
    theirs: SheetSnapshot,
  ) => SheetSnapshot;

  /** Отказ сервера — конфликт версий: лист успел сохранить кто-то ещё. */
  isConflict: (error: unknown) => boolean;

  /** Показывает состояние сохранения в шапке листа. */
  onStatus: (status: SheetSaveStatus) => void;

  /** Кладёт в открытый лист снимок, слитый с чужими правками. */
  onSnapshot: (snapshot: SheetSnapshot) => void;

  /** Сообщает о первой неудаче серии отправок (повторы молчат). */
  onError: (error: unknown) => void;
}

/** Очередь сохранения одного листа. */
export interface SheetSaveQueue {
  /** Сообщает очереди новое состояние листа; отличия уходят с паузой. */
  track: (next: SheetSnapshot) => void;

  /** Отправляет накопленное сейчас, не дожидаясь паузы. */
  flush: (options?: SheetSaveOptions) => Promise<void>;

  /** Повтор отправки после ошибки — вручную. */
  retry: () => void;

  /** Версия листа на сервере обогнала свою: подтягивает чужие правки. */
  syncRemote: (remoteVersion: number) => Promise<void>;

  /**
   * Лист закрыт: хвост правок досылается, а слитые документы в лист больше
   * не кладутся — там уже другой лист.
   */
  detach: () => void;

  /** Забывает несохранённые правки: лист удалён или право на правку отозвано. */
  discard: () => void;

  /** Есть правки, ещё не принятые сервером. */
  hasPending: () => boolean;

  /** Идёт отправка. */
  isSaving: () => boolean;

  /** Версия листа, с которой идёт правка. */
  getVersion: () => number;
}

/** Несохранённое состояние листа, ожидающее отправки. */
interface PendingSave {
  snapshot: SheetSnapshot;
  json: string;

  /**
   * Последний принятый сервером снимок, от которого сделаны правки. Нужен
   * слиянию: если лист тем временем сохранил другой редактор, свои правки
   * переносятся на его версию как разница с этой базой.
   */
  base: SheetSnapshot;
}

/** Последнее принятое сервером состояние листа. */
interface SheetBaseline {
  snapshot: SheetSnapshot;
  json: string;
}

/**
 * Пауза перед очередным повтором сохранения: удваивается с каждой неудачей,
 * чтобы упавший бэкенд не получал один и тот же PUT каждые полторы секунды.
 * @param attempt - сколько попыток уже сорвалось
 * @returns пауза, мс
 */
export function getSaveRetryDelay(attempt: number): number {
  return Math.min(SHEET_SAVE_DELAY * 2 ** attempt, SHEET_SAVE_RETRY_MAX_DELAY);
}

/**
 * Очередь сохранения одного листа: правки уходят на сервер с паузой, сбой
 * повторяется с растущей задержкой, а конфликт версий (лист сохранил другой
 * редактор или другая вкладка) разрешается слиянием — свои правки
 * переносятся на снимок, который сервер принял от другого. Если перечитать
 * лист или слить правки не вышло, очередь показывает конфликт и пробует
 * снова по таймеру повторов.
 *
 * Версия живёт внутри очереди: хвост правок прошлого листа может уйти уже
 * после того, как открыт следующий, и должен нести свою версию.
 *
 * Побочные действия: запросы к серверу через `deps` и таймеры.
 * @param initial - лист в том виде, в каком его отдал сервер при загрузке
 * @param deps - сервер и открытый лист
 * @returns очередь сохранения листа
 */
export function createSheetSaveQueue(
  initial: SheetServerState,
  deps: SheetSaveQueueDeps,
): SheetSaveQueue {
  let version = initial.version;

  let baseline: SheetBaseline = {
    snapshot: initial.snapshot,
    json: JSON.stringify(initial.snapshot),
  };

  let pending: PendingSave | null = null;
  let isSaving = false;
  let isDetached = false;

  /** Идёт подтягивание чужих правок: второй запрос его не дублирует. */
  let isSyncing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  /** Сколько раз подряд отправка уже сорвалась. */
  let retryAttempt = 0;

  /**
   * Перезапускает таймер отправки накопленных изменений.
   * @param delay - пауза до отправки; по умолчанию — пауза после правки
   */
  function restartTimer(delay: number = SHEET_SAVE_DELAY): void {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
  }

  /** Останавливает таймер отправки. */
  function stopTimer(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /**
   * Планирует повтор после сорвавшейся отправки. После предела попыток
   * очередь остаётся с ошибкой и ждёт следующей правки, ухода со страницы
   * либо явного повтора.
   */
  function scheduleRetry(): void {
    if (retryAttempt >= SHEET_SAVE_RETRY_LIMIT) {
      return;
    }

    const delay = getSaveRetryDelay(retryAttempt);

    retryAttempt += 1;

    restartTimer(delay);
  }

  /**
   * Применяет лист, который сервер принял от другого редактора. Свои
   * несохранённые правки не теряются: они сливаются с ним и уходят следующим
   * сохранением уже от его версии.
   * @param server - актуальный лист с сервера
   * @param local - свои правки листа; null — их нет
   */
  function applyServerState(
    server: SheetServerState,
    local: PendingSave | null,
  ): void {
    const serverJson = JSON.stringify(server.snapshot);

    const merged = local
      ? deps.merge(local.base, local.snapshot, server.snapshot)
      : server.snapshot;

    const mergedJson = JSON.stringify(merged);

    version = server.version;
    baseline = { snapshot: server.snapshot, json: serverJson };

    if (mergedJson === serverJson) {
      pending = null;
      deps.onStatus('saved');
    } else {
      pending = { snapshot: merged, json: mergedJson, base: server.snapshot };
      deps.onStatus('pending');
      restartTimer();
    }

    if (!isDetached) {
      deps.onSnapshot(merged);
    }
  }

  /**
   * Конфликт сохранения: актуальный лист загружается, свои правки сливаются
   * с ним и отправляются заново — ничего не пропадает. Не вышло — очередь
   * показывает конфликт и пробует снова по таймеру повторов.
   * @param rejected - отвергнутая отправка
   */
  async function resolveConflict(rejected: PendingSave): Promise<void> {
    try {
      const server = await deps.fetch();

      // Пока шёл запрос, могли накопиться новые правки — сливаем самые свежие
      applyServerState(server, pending ?? rejected);
      retryAttempt = 0;
    } catch {
      deps.onStatus('conflict');
      scheduleRetry();
    }
  }

  /**
   * Отправляет накопленные изменения. Ошибка не сбрасывает очередь — база не
   * двигается, и правку дошлёт повтор (или следующая правка, или `retry`).
   * @param options - настройки отправки
   */
  async function flush(options: SheetSaveOptions = {}): Promise<void> {
    if (isSaving || !pending) {
      return;
    }

    stopTimer();

    const current = pending;

    isSaving = true;

    if (!options.keepalive) {
      deps.onStatus('saving');
    }

    try {
      const savedVersion = await deps.save(current.snapshot, version, options);

      if (savedVersion !== null) {
        version = savedVersion;
      }

      baseline = { snapshot: current.snapshot, json: current.json };
      retryAttempt = 0;

      if (pending === current) {
        pending = null;
        deps.onStatus('saved');
      } else if (pending) {
        // За время запроса накопились новые правки — дошлём следующим циклом.
        // Их база теперь — только что принятый снимок
        pending = { ...pending, base: current.snapshot };
        deps.onStatus('pending');
        restartTimer();
      }
    } catch (error) {
      if (deps.isConflict(error)) {
        await resolveConflict(current);

        return;
      }

      if (retryAttempt === 0) {
        deps.onError(error);
      }

      deps.onStatus('error');
      scheduleRetry();
    } finally {
      isSaving = false;
    }
  }

  /**
   * Сообщает очереди новое состояние листа.
   * @param next - новое состояние листа
   */
  function track(next: SheetSnapshot): void {
    const json = JSON.stringify(next);

    if (json === baseline.json) {
      // Правку откатили к сохранённому — отправлять нечего
      if (pending && !isSaving) {
        pending = null;
        stopTimer();
        deps.onStatus('saved');
      }

      return;
    }

    pending = {
      snapshot: next,
      json,
      // База серии правок — тот снимок, от которого начали править; у новой
      // серии это последнее принятое сервером
      base: pending?.base ?? baseline.snapshot,
    };

    // Новая правка — новая серия попыток: прошлая ошибка могла быть разовой
    retryAttempt = 0;
    deps.onStatus('pending');
    restartTimer();
  }

  /** Повтор отправки после ошибки сохранения — вручную. */
  function retry(): void {
    if (pending) {
      retryAttempt = 0;
      void flush();
    }
  }

  /**
   * Подтягивает чужие правки, когда версия листа на сервере обогнала свою.
   * Пока идёт своё сохранение, ждать незачем: устаревшая версия вернёт
   * конфликт, и то же слияние сделает его разбор.
   * @param remoteVersion - версия листа на сервере
   */
  async function syncRemote(remoteVersion: number): Promise<void> {
    if (isSaving || isSyncing || isDetached || remoteVersion <= version) {
      return;
    }

    isSyncing = true;

    try {
      const server = await deps.fetch();

      // За время запроса своё сохранение могло уйти и принести версию новее
      if (isSaving || isDetached || server.version <= version) {
        return;
      }

      applyServerState(server, pending);
    } catch {
      // Не страшно: следующая отметка присутствия или своё сохранение повторят
    } finally {
      isSyncing = false;
    }
  }

  /** Лист закрыт: хвост правок досылается сразу. */
  function detach(): void {
    isDetached = true;

    void flush();
  }

  /** Забывает несохранённые правки. */
  function discard(): void {
    pending = null;
    stopTimer();
  }

  return {
    track,
    flush,
    retry,
    syncRemote,
    detach,
    discard,
    hasPending: () => pending !== null,
    isSaving: () => isSaving,
    getVersion: () => version,
  };
}
