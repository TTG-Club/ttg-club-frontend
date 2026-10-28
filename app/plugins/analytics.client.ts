import { useAnalytics } from '~infrastructure/analytics/composables';

/**
 * Плагин счётчиков статистики: Яндекс.Метрика и Google Analytics подключаются
 * автоматически при запуске приложения.
 */
export default defineNuxtPlugin(() => {
  useAnalytics();
});
