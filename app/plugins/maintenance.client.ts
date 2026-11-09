import { useMaintenanceGate } from '~infrastructure/maintenance/composables';

/**
 * Режим «сайт закрыт на обновление»: при выходе из учётной записи решение о
 * заглушке сверяется с сервером сразу, а не при следующем переходе по сайту —
 * иначе вышедший администратор остаётся на открытом сайте.
 */
export default defineNuxtPlugin(() => {
  const { isLoggedIn } = useUser();
  const { refresh } = useMaintenanceGate();

  watch(isLoggedIn, (loggedIn, wasLoggedIn) => {
    if (wasLoggedIn && !loggedIn) {
      refresh();
    }
  });
});
