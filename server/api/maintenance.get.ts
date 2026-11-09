import type { MaintenanceGate } from '#shared/types';

import {
  MAINTENANCE_CACHE_CONTROL,
  MAINTENANCE_CACHE_CONTROL_HEADER,
} from '#server/consts';

/**
 * Показывать ли заглушку режима обновления текущему посетителю. Роут
 * публичный и обслуживается самим Nitro, а не прокси в бэкенд: его спрашивает
 * сайт при переходах между страницами без перезагрузки. Ответ зависит от
 * посетителя, поэтому не кешируется.
 */
export default defineEventHandler(async (event): Promise<MaintenanceGate> => {
  setResponseHeader(
    event,
    MAINTENANCE_CACHE_CONTROL_HEADER,
    MAINTENANCE_CACHE_CONTROL,
  );

  return resolveMaintenanceGate(event, await getMaintenanceSettings());
});
