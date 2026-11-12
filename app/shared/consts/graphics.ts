/**
 * Режим графики: «красота» — с размытием фона под меню и плашками,
 * «производительность» — без него, для слабых видеокарт.
 */
export const GRAPHICS_MODES = ['beauty', 'performance'] as const;

export type GraphicsMode = (typeof GRAPHICS_MODES)[number];

/** Пока посетитель не выбрал сам и сайт не переключил — «красота». */
export const GRAPHICS_MODE_DEFAULT: GraphicsMode = 'beauty';

/**
 * Cookie с режимом графики: её читает сервер, чтобы страница сразу пришла
 * без размытия. Пока cookie нет, сайт сам замеряет плавность анимаций.
 */
export const GRAPHICS_MODE_COOKIE = 'ttg_graphics_mode';

/** Срок хранения режима графики. */
export const GRAPHICS_MODE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Атрибут на `<html>`, по которому стили отключают размытие. */
export const GRAPHICS_MODE_ATTRIBUTE = 'data-graphics';

/**
 * Средняя длительность кадра анимации, в миллисекундах, выше которой
 * открытие панели считается рывками (меньше ~40 кадров в секунду).
 */
export const GRAPHICS_PROBE_SLOW_FRAME_MS = 24;

/**
 * Кадр длиннее этого — вкладка была в фоне или браузер придержал отрисовку:
 * такой замер ни о чём не говорит и отбрасывается.
 */
export const GRAPHICS_PROBE_STALLED_FRAME_MS = 500;

/** После стольких открытий рывками сайт сам включает «производительность». */
export const GRAPHICS_PROBE_SLOW_LIMIT = 2;

/** Столько открытий замеряется за одно посещение, дальше замеры прекращаются. */
export const GRAPHICS_PROBE_SAMPLE_LIMIT = 4;

/** Сообщение о том, что сайт сам включил «производительность». */
export const GRAPHICS_PROBE_TOAST = {
  title: 'Включён режим производительности',
  description:
    'Анимации шли рывками, поэтому размытие фона отключено. Вернуть его можно в настройках отображения.',
  icon: 'tabler:bolt',
} as const;
