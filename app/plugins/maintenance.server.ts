import { MAINTENANCE_CONTEXT_KEY } from '#shared/consts';
import { maintenanceGateSchema } from '#shared/utils';
import { useMaintenanceGate } from '~infrastructure/maintenance/composables';

/**
 * Переносит решение о заглушке режима обновления из серверного middleware
 * (`maintenance`) в состояние приложения — по нему `app.vue` и `error.vue`
 * рисуют заглушку вместо страницы. Нет решения в контексте — режим выключен.
 */
export default defineNuxtPlugin(() => {
  const { setGate } = useMaintenanceGate();

  const serverGate = maintenanceGateSchema.safeParse(
    useRequestEvent()?.context[MAINTENANCE_CONTEXT_KEY],
  );

  if (serverGate.success) {
    setGate(serverGate.data);
  }
});
