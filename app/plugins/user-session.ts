/**
 * Восстанавливает сессию пользователя: на сервере по access-cookie, в браузере
 * после гидрации продлевает истёкшую сессию, чтобы не было hydration mismatch.
 */
export default defineNuxtPlugin({
  name: 'user-session',
  async setup() {
    const { restoreOnServer, restoreOnClient } = useUser();

    if (import.meta.server) {
      await restoreOnServer(useRequestFetch());

      return;
    }

    onNuxtReady(restoreOnClient);
  },
});
