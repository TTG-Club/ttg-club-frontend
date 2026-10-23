import { useOnlineHeartbeat } from '~infrastructure/analytics/composables';

/** Плагин учёта посетителей онлайн: отметки идут, пока открыт сайт. */
export default defineNuxtPlugin(() => {
  useOnlineHeartbeat();
});
