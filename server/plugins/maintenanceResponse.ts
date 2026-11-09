import {
  MAINTENANCE_CACHE_CONTROL,
  MAINTENANCE_CACHE_CONTROL_HEADER,
  MAINTENANCE_RETRY_AFTER_HEADER,
  MAINTENANCE_RETRY_AFTER_SECONDS,
  MAINTENANCE_ROBOTS_HEADER,
  MAINTENANCE_ROBOTS_TAG,
  MAINTENANCE_STATUS_CODE,
  MAINTENANCE_STATUS_MESSAGE,
} from '#server/consts';
import { MAINTENANCE_CONTEXT_KEY } from '#shared/consts';
import { maintenanceGateSchema } from '#shared/utils';

/**
 * Статус и заголовки страниц, пока включён режим «сайт закрыт на обновление»
 * (решение о заглушке оставил в контексте middleware `maintenance`).
 *
 * Ставятся уже после рендера, в ответ рендера: заданные заранее перетёрли бы
 * рендер Nuxt (свой статус) и модуль robots (свой X-Robots-Tag). Страница
 * ошибки рендерится отдельным внутренним запросом `/__nuxt_error`, и
 * обработчик ошибок Nuxt берёт его статус и заголовки — так заглушка вместо
 * ошибки (например, 404) тоже отвечает 503.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (pageResponse, { event }) => {
    const gate = maintenanceGateSchema.safeParse(
      event.context[MAINTENANCE_CONTEXT_KEY],
    );

    if (!gate.success) {
      return;
    }

    // Никакая страница не кешируется: иначе заглушка могла бы достаться
    // администратору из кеша, а открытая страница — посетителю.
    pageResponse.headers = {
      ...pageResponse.headers,
      [MAINTENANCE_CACHE_CONTROL_HEADER]: MAINTENANCE_CACHE_CONTROL,
    };

    if (!gate.data.blocked) {
      return;
    }

    pageResponse.statusCode = MAINTENANCE_STATUS_CODE;
    pageResponse.statusMessage = MAINTENANCE_STATUS_MESSAGE;

    pageResponse.headers = {
      ...pageResponse.headers,
      [MAINTENANCE_RETRY_AFTER_HEADER]: String(MAINTENANCE_RETRY_AFTER_SECONDS),
      [MAINTENANCE_ROBOTS_HEADER]: MAINTENANCE_ROBOTS_TAG,
    };
  });
});
