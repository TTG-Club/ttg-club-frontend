import ms from 'ms';

/** Ключ общего состояния: показывать ли заглушку режима обновления. */
export const MAINTENANCE_GATE_STATE_KEY = 'maintenance:gate';

/** Ключ общего состояния: когда решение о заглушке последний раз сверяли. */
export const MAINTENANCE_CHECKED_AT_STATE_KEY = 'maintenance:checked-at';

/**
 * Как часто переход между страницами перепроверяет режим у сервера. Чаще не
 * нужно: включение режима само по себе редкость, а полная загрузка любой
 * страницы и так решается на сервере.
 */
export const MAINTENANCE_RECHECK_INTERVAL_MS = ms('30s');

/** Сверка режима не удалась — остаёмся при прежнем решении. */
export const MAINTENANCE_REFRESH_FAILED_LOG =
  '[Maintenance] Failed to refresh the gate:';

/** Заглушку не индексируют и по её ссылкам не ходят. */
export const MAINTENANCE_ROBOTS_RULE = 'noindex, nofollow';

export const MAINTENANCE_SIGN_IN_HINT =
  'Ворота открыты только для мастеров подземелий — администраторов сайта.';

export const MAINTENANCE_SIGN_IN_HINT_ICON = 'tabler:crown';

export const MAINTENANCE_FORBIDDEN_TITLE = 'Вход воспрещён';

export const MAINTENANCE_FORBIDDEN_MESSAGE =
  'Стража у ворот качает головой: сейчас в цитадель пускают только мастеров подземелий (администраторов). Возвращайся, когда ворота откроются.';

export const MAINTENANCE_FORBIDDEN_ICON = 'tabler:shield-lock';

export const MAINTENANCE_SIGN_OUT_LABEL = 'Выйти';

export const MAINTENANCE_SIGN_OUT_ICON = 'tabler:logout';
