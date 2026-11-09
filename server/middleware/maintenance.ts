import { MAINTENANCE_CONTEXT_KEY } from '#shared/consts';
import { isMaintenancePageRequest } from '#shared/utils';

/**
 * Режим «сайт закрыт на обновление» (настройку ведёт админка core-app).
 * Решает на сервере, до рендера, показать ли вместо страницы заглушку: её
 * получают все, кроме администраторов. Решение кладётся в контекст запроса —
 * по нему рендер рисует заглушку, а плагин `maintenanceResponse` ставит ответу
 * статус и заголовки.
 *
 * API, сборку и служебные роуты режим не трогает — иначе не заработали бы ни
 * вход, ни сайт у администратора.
 */
export default defineEventHandler(async (event) => {
  const isPageRequest = isMaintenancePageRequest(
    event.method,
    getRequestURL(event).pathname,
    getRequestHeader(event, 'accept') ?? '',
  );

  if (!isPageRequest) {
    return;
  }

  const settings = await getMaintenanceSettings();

  if (!settings.enabled) {
    return;
  }

  event.context[MAINTENANCE_CONTEXT_KEY] = await resolveMaintenanceGate(
    event,
    settings,
  );
});
