import type { MaintenanceGate } from '#shared/types';

import { consola } from 'consola';

import { MAINTENANCE_API_PATH, MAINTENANCE_OPEN_GATE } from '#shared/consts';
import { maintenanceGateSchema } from '#shared/utils';

import {
  MAINTENANCE_CHECKED_AT_STATE_KEY,
  MAINTENANCE_GATE_STATE_KEY,
  MAINTENANCE_RECHECK_INTERVAL_MS,
  MAINTENANCE_REFRESH_FAILED_LOG,
} from '../model';

/**
 * Решение о заглушке режима «сайт закрыт на обновление» для текущего
 * посетителя. Первым его принимает сервер при рендере страницы (плагин
 * `maintenance.server`), дальше оно живёт в общем состоянии и перепроверяется
 * при переходах между страницами без перезагрузки.
 *
 * @returns решение о заглушке и действия с ним
 */
export function useMaintenanceGate() {
  const api = useApi();

  const gate = useState<MaintenanceGate>(
    MAINTENANCE_GATE_STATE_KEY,
    () => MAINTENANCE_OPEN_GATE,
  );

  // Время рендера на сервере уезжает в payload: сразу после загрузки страницы
  // решение свежее и перепроверять его незачем.
  const checkedAt = useState<number>(MAINTENANCE_CHECKED_AT_STATE_KEY, () =>
    Date.now(),
  );

  const isBlocked = computed(() => gate.value.blocked);

  /**
   * Ставит решение, принятое сервером при рендере.
   *
   * @param serverGate - Решение из контекста запроса
   */
  function setGate(serverGate: MaintenanceGate): void {
    gate.value = serverGate;
    checkedAt.value = Date.now();
  }

  /**
   * Сверяет решение с сервером. Сбой сети решение не меняет: полная загрузка
   * страницы всё равно решается на сервере.
   */
  async function refresh(): Promise<void> {
    try {
      gate.value = maintenanceGateSchema.parse(
        await api<unknown>(MAINTENANCE_API_PATH),
      );

      checkedAt.value = Date.now();
    } catch (error) {
      consola.warn(MAINTENANCE_REFRESH_FAILED_LOG, error);
    }
  }

  /** Сверяет решение с сервером, если с прошлой сверки прошло достаточно. */
  async function refreshIfStale(): Promise<void> {
    if (Date.now() - checkedAt.value < MAINTENANCE_RECHECK_INTERVAL_MS) {
      return;
    }

    await refresh();
  }

  /**
   * Отмечает, вошёл ли посетитель: вошедшему не-администратору заглушка
   * вместо формы входа показывает отказ.
   *
   * @param signedIn - Вошёл ли посетитель
   */
  function setSignedIn(signedIn: boolean): void {
    gate.value = { ...gate.value, signedIn };
  }

  return {
    gate: readonly(gate),
    isBlocked,
    setGate,
    refresh,
    refreshIfStale,
    setSignedIn,
  };
}
