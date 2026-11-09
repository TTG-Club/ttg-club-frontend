import { useMaintenanceGate } from '~infrastructure/maintenance/composables';

/**
 * Режим «сайт закрыт на обновление» при переходах между страницами без
 * перезагрузки: раз в полминуты сверяет решение о заглушке с сервером. Если
 * режим включили, пока страница была открыта, `app.vue` покажет заглушку
 * вместо следующей страницы. Первую загрузку решает сервер.
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server || useNuxtApp().isHydrating) {
    return;
  }

  await useMaintenanceGate().refreshIfStale();
});
