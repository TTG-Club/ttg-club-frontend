import type {
  CustomThemeBase,
  CustomThemePalette,
  CustomThemeSettings,
  CustomThemeTextTargets,
} from './types';

import Color from 'colorjs.io';

import {
  CUSTOM_THEME_ACCENT_LIGHTNESS_LIMIT,
  CUSTOM_THEME_ACCENT_TARGET,
  CUSTOM_THEME_ANCHOR_STEP,
  CUSTOM_THEME_BASE_THRESHOLD,
  CUSTOM_THEME_CLASS,
  CUSTOM_THEME_MAX_BACKGROUND_CHROMA,
  CUSTOM_THEME_MAX_TEXT_CHROMA,
  CUSTOM_THEME_SCALE_STEPS,
  CUSTOM_THEME_SOLID_TEXT_TARGET,
  CUSTOM_THEME_STATUS_COLORS,
  CUSTOM_THEME_STATUS_START_LIGHTNESS,
  CUSTOM_THEME_SURFACES,
  CUSTOM_THEME_TEXT_TARGETS,
  CUSTOM_THEME_TEXT_TINT_SHARE,
  CUSTOM_THEME_WARNING_CLASH_DEGREES,
  CUSTOM_THEME_WARNING_FALLBACK_HUE,
} from './constants';

interface OklchColor {
  lightness: number;
  chroma: number;
  hue: number;
}

type ColorScale = Record<number, string>;

/** Светлота верхней (самой светлой) ступени шкалы. */
const SCALE_TOP_LIGHTNESS = 0.975;

/** Светлота нижней (самой тёмной) ступени шкалы. */
const SCALE_BOTTOM_LIGHTNESS = 0.2;

/** Шагов двоичного поиска светлоты — точность лучше тысячной. */
const SEARCH_ITERATIONS = 24;

/** Различие светлоты, после которого акцент считается подправленным. */
const ADJUSTMENT_EPSILON = 0.005;

/** Светлота чёрного и белого в OKLCH — края любого поиска светлоты. */
const BLACK_LIGHTNESS = 0;
const WHITE_LIGHTNESS = 1;

/** Отрезок светлоты короче этого считается точкой — положения на нём нет. */
const MIN_RANGE_WIDTH = 0.001;

/** Белый — надпись на сплошных кнопках светлой основы. */
const WHITE = '#ffffff';

/**
 * Переводит цвет в OKLCH. У серых цветов оттенок не определён — тогда
 * возвращается 0.
 *
 * @param value - Цвет в любом формате CSS
 * @returns Светлота, насыщенность и оттенок
 */
function toOklch(value: string): OklchColor {
  const [lightness, chroma, hue] = new Color(value).to('oklch').coords;

  return {
    lightness: lightness ?? 0,
    chroma: chroma ?? 0,
    hue: Number.isFinite(hue) ? (hue ?? 0) : 0,
  };
}

/**
 * Собирает цвет из OKLCH и приводит его к sRGB, уменьшая насыщенность, если
 * цвет не помещается в экранный охват.
 *
 * @param color - Светлота, насыщенность и оттенок
 * @returns Цвет в формате `#rrggbb`
 */
function fromOklch(color: OklchColor): string {
  return new Color('oklch', [
    Math.min(1, Math.max(0, color.lightness)),
    color.chroma,
    color.hue,
  ])
    .to('srgb')
    .toGamut({ space: 'srgb' })
    .toString({ format: 'hex', collapse: false });
}

/**
 * Контраст текста на фоне по APCA — по модулю, без знака полярности.
 *
 * @param text - Цвет текста
 * @param background - Цвет фона
 * @returns Lc от 0 до ~108
 */
export function getApcaContrast(text: string, background: string): number {
  return Math.abs(Color.contrastAPCA(new Color(background), new Color(text)));
}

/**
 * Ищет светлоту на отрезке между `from` и `to`, ближайшую к `from`, при
 * которой проверка проходит. Проверка должна быть монотонной: чем ближе к
 * `to`, тем легче её пройти.
 *
 * @param from - Откуда начинать — сюда хочется быть ближе
 * @param to - Крайнее значение, где проверка заведомо легче всего
 * @param passes - Проверка светлоты
 * @returns Найденная светлота или `to`, если не прошла даже она
 */
function searchLightness(
  from: number,
  to: number,
  passes: (lightness: number) => boolean,
): number {
  if (passes(from)) {
    return from;
  }

  let near = from;
  let far = to;

  for (let i = 0; i < SEARCH_ITERATIONS; i++) {
    const middle = (near + far) / 2;

    if (passes(middle)) {
      far = middle;
    } else {
      near = middle;
    }
  }

  return far;
}

/**
 * Куда уходит светлота, чтобы контраст с фоном рос: на тёмной основе — к
 * белому, на светлой — к чёрному.
 *
 * @param base - Основа темы
 * @returns Крайняя светлота
 */
function getContrastEnd(base: CustomThemeBase): number {
  return base === 'dark' ? WHITE_LIGHTNESS : BLACK_LIGHTNESS;
}

/**
 * Цвет текста нужного контраста на фоне страницы: светлее страницы на тёмной
 * основе и темнее на светлой — ровно настолько, чтобы дойти до порога.
 *
 * @param base - Основа темы
 * @param page - Цвет фона страницы
 * @param target - Нужный контраст (Lc)
 * @param tint - Насыщенность и оттенок, которые получает текст
 * @returns Цвет текста
 */
function solveTextColor(
  base: CustomThemeBase,
  page: string,
  target: number,
  tint: Omit<OklchColor, 'lightness'>,
): string {
  const lightness = searchLightness(
    toOklch(page).lightness,
    getContrastEnd(base),
    (candidate) =>
      getApcaContrast(fromOklch({ ...tint, lightness: candidate }), page)
      >= target,
  );

  return fromOklch({ ...tint, lightness });
}

/**
 * Подгоняет цветной оттенок под тему: сохраняет тон и насыщенность и меняет
 * только светлоту, пока цвет не начнёт читаться на странице и пока надпись на
 * сплошной кнопке этого цвета не станет читаемой.
 *
 * @param base - Основа темы
 * @param source - Исходный цвет
 * @param page - Цвет фона страницы
 * @returns Подогнанный цвет
 */
function fitColorToTheme(
  base: CustomThemeBase,
  source: OklchColor,
  page: string,
): string {
  const lightness = searchLightness(
    source.lightness,
    getContrastEnd(base),
    (candidate) => isColorReadable(base, source, page, candidate),
  );

  return fromOklch({ ...source, lightness });
}

/**
 * Читается ли цветной оттенок с этой светлотой: сам на странице и надпись на
 * сплошной кнопке этого цвета.
 *
 * @param base - Основа темы
 * @param source - Цвет — берутся тон и насыщенность
 * @param page - Цвет фона страницы
 * @param lightness - Проверяемая светлота
 * @returns `true`, если оба порога контраста пройдены
 */
function isColorReadable(
  base: CustomThemeBase,
  source: OklchColor,
  page: string,
  lightness: number,
): boolean {
  const solidText = base === 'dark' ? page : WHITE;
  const color = fromOklch({ ...source, lightness });

  return (
    getApcaContrast(color, page) >= CUSTOM_THEME_ACCENT_TARGET
    && getApcaContrast(solidText, color) >= CUSTOM_THEME_SOLID_TEXT_TARGET
  );
}

/**
 * Положение светлоты на отрезке в процентах.
 *
 * @param lightness - Светлота
 * @param range - Отрезок: самая тёмная и самая светлая
 * @returns Целое от 0 до 100
 */
function toPercent(
  lightness: number,
  range: readonly [number, number],
): number {
  const [darkest, lightest] = range;

  if (lightest - darkest < MIN_RANGE_WIDTH) {
    return 0;
  }

  const share = (lightness - darkest) / (lightest - darkest);

  return Math.round(Math.min(1, Math.max(0, share)) * 100);
}

/**
 * Светлота по положению на отрезке в процентах.
 *
 * @param percent - Положение, 0–100
 * @param range - Отрезок: самая тёмная и самая светлая
 * @returns Светлота
 */
function fromPercent(
  percent: number,
  range: readonly [number, number],
): number {
  const [darkest, lightest] = range;
  const share = Math.min(100, Math.max(0, percent)) / 100;

  return darkest + (lightest - darkest) * share;
}

/**
 * Шкала 50–950 вокруг опорного цвета: светлые ступени высветляются и теряют
 * насыщенность, тёмные — темнеют. Опорный цвет встаёт на свою ступень как есть.
 *
 * @param anchor - Опорный цвет
 * @param anchorStep - Ступень опорного цвета
 * @returns Шкала по ступеням
 */
function buildColorScale(anchor: string, anchorStep: number): ColorScale {
  const { lightness, chroma, hue } = toOklch(anchor);
  const steps: ReadonlyArray<number> = CUSTOM_THEME_SCALE_STEPS;
  const anchorIndex = steps.indexOf(anchorStep);
  const lastIndex = steps.length - 1;

  return Object.fromEntries(
    steps.map((step, index) => {
      if (index === anchorIndex) {
        return [step, anchor];
      }

      if (index < anchorIndex) {
        const share = (anchorIndex - index) / anchorIndex;

        return [
          step,
          fromOklch({
            lightness:
              lightness + (SCALE_TOP_LIGHTNESS - lightness) * share ** 0.85,
            chroma: chroma * (1 - 0.85 * share),
            hue,
          }),
        ];
      }

      const share = (index - anchorIndex) / (lastIndex - anchorIndex);

      return [
        step,
        fromOklch({
          lightness: lightness - (lightness - SCALE_BOTTOM_LIGHTNESS) * share,
          chroma: chroma * (1 - 0.4 * share),
          hue,
        }),
      ];
    }),
  );
}

/**
 * Цвет посередине между двумя — для промежуточных ступеней серой шкалы.
 *
 * @param first - Первый цвет
 * @param second - Второй цвет
 * @returns Смесь пополам в OKLab
 */
function mixHalf(first: string, second: string): string {
  return new Color(first)
    .mix(new Color(second), 0.5, { space: 'oklab' })
    .to('srgb')
    .toGamut({ space: 'srgb' })
    .toString({ format: 'hex', collapse: false });
}

/**
 * Разница двух оттенков по кругу, в градусах.
 *
 * @param first - Первый оттенок
 * @param second - Второй оттенок
 * @returns Расстояние от 0 до 180
 */
function hueDistance(first: number, second: number): number {
  const difference = Math.abs(first - second) % 360;

  return Math.min(difference, 360 - difference);
}

type SurfaceName =
  | 'page'
  | 'card'
  | 'elevated'
  | 'accented'
  | 'borderMuted'
  | 'border'
  | 'borderAccented'
  | 'inverted';

interface NeutralColors {
  surfaces: Record<SurfaceName, string>;
  text: Record<keyof CustomThemeTextTargets, string>;
}

/**
 * Основа темы по цвету фона: тёмный фон — тёмная основа, светлый — светлая.
 *
 * @param background - Цвет фона
 * @returns Основа
 */
export function getCustomThemeBase(background: string): CustomThemeBase {
  return toOklch(background).lightness < CUSTOM_THEME_BASE_THRESHOLD
    ? 'dark'
    : 'light';
}

/**
 * Фон страницы, пригодный для чтения: светлота подтягивается в пределы
 * основы, слишком сочный цвет приглушается. Оттенок остаётся как выбран.
 *
 * @param background - Выбранный цвет фона
 * @returns Основа и фон страницы в OKLCH
 */
function resolvePage(background: string): {
  base: CustomThemeBase;
  page: OklchColor;
} {
  const base = getCustomThemeBase(background);
  const source = toOklch(background);
  const [darkest, lightest] = CUSTOM_THEME_SURFACES[base].pageRange;

  return {
    base,
    page: {
      lightness: Math.min(lightest, Math.max(darkest, source.lightness)),
      chroma: Math.min(CUSTOM_THEME_MAX_BACKGROUND_CHROMA, source.chroma),
      hue: source.hue,
    },
  };
}

/**
 * Яркость фона внутри его основы: 0 — самый тёмный допустимый, 100 — самый
 * светлый.
 *
 * @param background - Цвет фона
 * @returns Целое от 0 до 100
 */
export function getCustomThemeBackgroundLightness(background: string): number {
  const { base, page } = resolvePage(background);

  return toPercent(page.lightness, CUSTOM_THEME_SURFACES[base].pageRange);
}

/**
 * Тот же фон, но с другой основой и яркостью: оттенок и насыщенность
 * сохраняются, меняется только светлота.
 *
 * @param background - Цвет фона
 * @param base - Нужная основа
 * @param lightness - Яркость внутри основы, 0–100
 * @returns Новый цвет фона в формате `#rrggbb`
 */
export function changeCustomThemeBackgroundLightness(
  background: string,
  base: CustomThemeBase,
  lightness: number,
): string {
  const { page } = resolvePage(background);

  return fromOklch({
    ...page,
    lightness: fromPercent(lightness, CUSTOM_THEME_SURFACES[base].pageRange),
  });
}

/**
 * Пределы светлоты акцента на этом фоне. Одна граница — где акцент
 * перестаёт читаться (её находит подбор по контрасту), другая — где он
 * становится слишком бледным на тёмной основе или слишком тёмным на светлой.
 *
 * @param background - Цвет фона
 * @param accent - Цвет акцента — берутся тон и насыщенность
 * @returns Самая тёмная и самая светлая допустимая светлота
 */
function getAccentLightnessRange(
  background: string,
  accent: string,
): readonly [number, number] {
  const { base, page } = resolvePage(background);
  const pageColor = fromOklch(page);
  const source = toOklch(accent);
  const limit = CUSTOM_THEME_ACCENT_LIGHTNESS_LIMIT[base];

  if (base === 'dark') {
    const darkest = searchLightness(
      BLACK_LIGHTNESS,
      WHITE_LIGHTNESS,
      (candidate) => isColorReadable(base, source, pageColor, candidate),
    );

    return [darkest, Math.max(darkest, limit)];
  }

  const lightest = searchLightness(
    WHITE_LIGHTNESS,
    BLACK_LIGHTNESS,
    (candidate) => isColorReadable(base, source, pageColor, candidate),
  );

  return [Math.min(lightest, limit), lightest];
}

/**
 * Яркость акцента в пределах, где он читается на этом фоне: 0 — самый
 * тёмный допустимый, 100 — самый светлый. Учитывается акцент после подгонки
 * под контраст — тот, что виден на сайте.
 *
 * @param background - Цвет фона
 * @param accent - Цвет акцента
 * @returns Целое от 0 до 100
 */
export function getCustomThemeAccentLightness(
  background: string,
  accent: string,
): number {
  const { base, page } = resolvePage(background);
  const fitted = fitColorToTheme(base, toOklch(accent), fromOklch(page));

  return toPercent(
    toOklch(fitted).lightness,
    getAccentLightnessRange(background, accent),
  );
}

/**
 * Тот же акцент с другой яркостью: тон и насыщенность сохраняются, светлота
 * ставится внутри пределов, где акцент читается на этом фоне.
 *
 * @param background - Цвет фона
 * @param accent - Цвет акцента
 * @param lightness - Яркость, 0–100
 * @returns Новый цвет акцента в формате `#rrggbb`
 */
export function changeCustomThemeAccentLightness(
  background: string,
  accent: string,
  lightness: number,
): string {
  return fromOklch({
    ...toOklch(accent),
    lightness: fromPercent(
      lightness,
      getAccentLightnessRange(background, accent),
    ),
  });
}

/**
 * Серые тона темы: страница — выбранный фон, остальные поверхности — сдвигом
 * от неё, уровни текста — по порогам контраста. Все с оттенком фона.
 *
 * @param base - Основа темы
 * @param page - Фон страницы
 * @returns Цвета поверхностей и текста
 */
function buildNeutralColors(
  base: CustomThemeBase,
  page: OklchColor,
): NeutralColors {
  const levels = CUSTOM_THEME_SURFACES[base];
  const targets = CUSTOM_THEME_TEXT_TARGETS[base];
  const surfaceTint = { chroma: page.chroma, hue: page.hue };

  const textTint = {
    chroma: Math.min(
      CUSTOM_THEME_MAX_TEXT_CHROMA,
      page.chroma * CUSTOM_THEME_TEXT_TINT_SHARE,
    ),
    hue: page.hue,
  };

  const surface = (offset: number) =>
    fromOklch({ ...surfaceTint, lightness: page.lightness + offset });

  const surfaces = {
    page: surface(0),
    card: surface(levels.card),
    elevated: surface(levels.elevated),
    accented: surface(levels.accented),
    borderMuted: surface(levels.borderMuted),
    border: surface(levels.border),
    borderAccented: surface(levels.borderAccented),
    inverted: fromOklch({ ...textTint, lightness: levels.inverted }),
  };

  const solve = (target: number) =>
    solveTextColor(base, surfaces.page, target, textTint);

  return {
    surfaces,
    text: {
      highlighted: solve(targets.highlighted),
      text: solve(targets.text),
      toned: solve(targets.toned),
      muted: solve(targets.muted),
      dimmed: solve(targets.dimmed),
    },
  };
}

/**
 * Серая шкала 50–950 из уровней текста и поверхностей: на тёмной основе
 * светлые ступени — текст, тёмные — фоны; на светлой наоборот. Опорная
 * ступень (400 на тёмной, 500 на светлой) — цвет `secondary`.
 *
 * @param base - Основа темы
 * @param neutral - Серые тона темы
 * @returns Шкала по ступеням
 */
function buildNeutralScale(
  base: CustomThemeBase,
  neutral: NeutralColors,
): ColorScale {
  const { surfaces, text } = neutral;

  if (base === 'dark') {
    return {
      50: text.highlighted,
      100: text.text,
      200: text.toned,
      300: mixHalf(text.toned, text.muted),
      400: text.muted,
      500: text.dimmed,
      600: mixHalf(text.dimmed, surfaces.borderAccented),
      700: surfaces.borderAccented,
      800: surfaces.border,
      900: surfaces.elevated,
      950: surfaces.page,
    };
  }

  return {
    50: surfaces.page,
    100: surfaces.elevated,
    200: surfaces.border,
    300: surfaces.borderAccented,
    400: text.dimmed,
    500: mixHalf(text.dimmed, text.muted),
    600: text.muted,
    700: text.toned,
    800: mixHalf(text.toned, text.text),
    900: text.text,
    950: text.highlighted,
  };
}

/**
 * Цвета состояний (ошибка, успех, инфо, предупреждение), подогнанные под ту
 * же яркость, что и акцент. Если акцент жёлтый, предупреждение становится
 * оранжевым, чтобы их не путали.
 *
 * @param base - Основа темы
 * @param page - Цвет фона страницы
 * @param accentHue - Оттенок акцента
 * @returns Цвета состояний
 */
function buildStatusColors(
  base: CustomThemeBase,
  page: string,
  accentHue: number,
): Record<keyof typeof CUSTOM_THEME_STATUS_COLORS, string> {
  const fit = (hue: number, chroma: number) =>
    fitColorToTheme(
      base,
      { lightness: CUSTOM_THEME_STATUS_START_LIGHTNESS[base], chroma, hue },
      page,
    );

  const { error, success, info, warning } = CUSTOM_THEME_STATUS_COLORS;

  const warningHue =
    hueDistance(accentHue, warning.hue) < CUSTOM_THEME_WARNING_CLASH_DEGREES
      ? CUSTOM_THEME_WARNING_FALLBACK_HUE
      : warning.hue;

  return {
    error: fit(error.hue, error.chroma),
    success: fit(success.hue, success.chroma),
    info: fit(info.hue, info.chroma),
    warning: fit(warningHue, warning.chroma),
  };
}

/**
 * Записывает шкалу в переменные `--color-<имя>-<ступень>`.
 *
 * @param name - Имя шкалы
 * @param scale - Шкала
 * @returns Пары «переменная — значение»
 */
function scaleVariables(
  name: string,
  scale: ColorScale,
): Array<[string, string]> {
  return CUSTOM_THEME_SCALE_STEPS.map((step) => [
    `color-${name}-${step}`,
    scale[step] ?? '',
  ]);
}

/**
 * Цвет надписи на сплошной заливке акцента: на тёмной основе — цвет
 * страницы, на светлой — белый.
 *
 * @param base - Основа темы
 * @param page - Цвет фона страницы
 * @returns Цвет надписи
 */
function getSolidTextColor(base: CustomThemeBase, page: string): string {
  return base === 'dark' ? page : WHITE;
}

/**
 * Цвет с прозрачностью поверх того, что под ним.
 *
 * @param color - Цвет
 * @param percent - Сколько цвета оставить, в процентах
 * @returns Значение CSS
 */
function fade(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
}

/**
 * Палитра старого сайта (`theme.css`) из цветов своей темы: на её переменных
 * держатся фоны, текст, ссылки, кнопки и логотип. Цвета редкостей, меток
 * источников, соцсетей и карта на главной остаются от основы.
 *
 * @param base - Основа темы
 * @param neutral - Серые тона темы
 * @param accentScale - Шкала акцента
 * @param status - Цвета состояний
 * @returns Пары «переменная — значение»
 */
function buildLegacyVariables(
  base: CustomThemeBase,
  neutral: NeutralColors,
  accentScale: ColorScale,
  status: Record<keyof typeof CUSTOM_THEME_STATUS_COLORS, string>,
): Array<[string, string]> {
  const { surfaces, text } = neutral;
  const isDark = base === 'dark';
  const step = (value: number) => accentScale[value] ?? '';
  const accent = step(CUSTOM_THEME_ANCHOR_STEP[base]);

  // Ступени акцента в сторону контраста и обратно: на тёмной основе
  // наведение светлее, на светлой — темнее
  const accentHover = step(isDark ? 300 : 700);
  const accentPressed = step(isDark ? 500 : 600);
  const tableList = mixHalf(surfaces.card, surfaces.elevated);

  // Тень на тёмной основе — почти чёрная, на светлой — лёгкая
  const shadow = isDark
    ? `0 8px 22px ${fade(surfaces.page, 80)}`
    : `0 8px 22px ${fade(text.highlighted, 25)}`;

  return [
    ['bg-light-main', fade(surfaces.page, 30)],
    ['bg-main', surfaces.page],
    ['bg-secondary', surfaces.card],
    [
      'bg-secondary-gradient',
      `linear-gradient(135deg, ${surfaces.elevated}, ${surfaces.card})`,
    ],
    ['bg-sub-menu', surfaces.elevated],
    ['bg-dice', status.info],
    ['bg-blockquote', surfaces.elevated],
    ['bg-inpur-hover', fade(text.text, 10)],
    ['bg-inpur-focus', fade(text.text, 8)],
    ['bg-details-title', fade(text.text, 5)],
    ['bg-table-list', tableList],
    [
      'bg-liner-menu',
      `linear-gradient(to bottom, ${surfaces.page}, transparent)`,
    ],
    [
      'bg-liner-menu-scroll',
      `linear-gradient(to bottom, ${surfaces.page}, ${surfaces.page})`,
    ],
    ['bg-theme-selected', accent],
    ['bg-advantage', status.success],
    ['bg-disadvantage', status.error],

    ['text-color', text.text],
    ['text-color-disabled', text.dimmed],
    ['text-color-active', text.highlighted],
    ['text-color-title', text.highlighted],
    ['text-b-color', text.highlighted],
    ['text-g-color', text.muted],
    ['text-s-color', accent],
    ['text-a-color', status.success],
    ['text-on-accent', getSolidTextColor(base, surfaces.page)],

    ['link-color', accent],
    ['link-color-hover', accentHover],
    ['hover', fade(text.text, 6)],
    ['checkbox-bg', fade(text.text, 15)],
    ['bg-table-row', fade(text.text, 3)],
    ['bg-table-row-highlighted', fade(text.text, 15)],
    ['border', surfaces.border],
    ['border-hover', text.text],

    ['primary', accent],
    ['primary-hover', accentHover],
    ['primary-active', accentPressed],
    ['primary-disabled', fade(accent, 67)],
    ['primary-select', fade(accent, 16)],
    ['secondary', fade(text.text, 10)],
    ['secondary-hover', fade(text.text, 18)],
    ['box-shadow', shadow],
    [
      'bg-gradient',
      `linear-gradient(135deg, ${fade(surfaces.elevated, 78)}, ${fade(surfaces.page, 78)})`,
    ],
    ['border-gradient', step(isDark ? 800 : 200)],
    ['background-color-thumb', fade(text.text, 60)],
    ['background-color-thumb-hover', fade(text.text, 80)],

    ['logo-stroke', text.highlighted],
    ['logo-skull', step(isDark ? 900 : 300)],
    ['logo-section-1', step(200)],
    ['logo-section-2', step(300)],
    ['logo-section-3', step(400)],
    ['logo-section-4', step(500)],
    ['logo-section-5', step(600)],
    ['logo-section-6', step(700)],
    ['logo-section-7', step(800)],
    ['logo-section-8', step(900)],

    ['success', status.success],
    ['warning', status.warning],
    ['error', status.error],
  ];
}

/** Какие шкалы Tailwind стоят за цветами Nuxt UI. */
const UI_COLOR_SCALES = {
  primary: 'primary',
  success: 'green',
  info: 'blue',
  warning: 'yellow',
  error: 'red',
  neutral: 'neutral',
} as const;

/**
 * Собирает всю палитру своей темы из настроек: цвета фона и акцента.
 * Поверхности считаются сдвигом от страницы, уровни текста и цвета —
 * подбираются по порогам контраста APCA.
 *
 * @param settings - Настройки темы
 * @returns Переменные темы и сведения о подгонке акцента
 */
export function createCustomThemePalette(
  settings: CustomThemeSettings,
): CustomThemePalette {
  const { base, page } = resolvePage(settings.background);
  const anchorStep = CUSTOM_THEME_ANCHOR_STEP[base];
  const neutral = buildNeutralColors(base, page);
  const { surfaces, text } = neutral;

  const accentSource = toOklch(settings.accent);
  const accent = fitColorToTheme(base, accentSource, surfaces.page);

  const isAccentAdjusted =
    Math.abs(toOklch(accent).lightness - accentSource.lightness)
    > ADJUSTMENT_EPSILON;

  const status = buildStatusColors(base, surfaces.page, accentSource.hue);
  const solidText = getSolidTextColor(base, surfaces.page);
  const neutralScale = buildNeutralScale(base, neutral);
  const accentScale = buildColorScale(accent, anchorStep);

  const variables: Array<[string, string]> = [
    ...scaleVariables('primary', accentScale),
    ...scaleVariables('neutral', neutralScale),
    ...scaleVariables('red', buildColorScale(status.error, anchorStep)),
    ...scaleVariables('green', buildColorScale(status.success, anchorStep)),
    ...scaleVariables('blue', buildColorScale(status.info, anchorStep)),
    ...scaleVariables('yellow', buildColorScale(status.warning, anchorStep)),

    ...Object.entries(UI_COLOR_SCALES).flatMap(([uiName, scaleName]) =>
      CUSTOM_THEME_SCALE_STEPS.map((step): [string, string] => [
        `ui-color-${uiName}-${step}`,
        `var(--color-${scaleName}-${step})`,
      ]),
    ),

    // Опорная ступень цветов Nuxt UI — явно, без оглядки на класс `.dark`
    ...Object.keys(UI_COLOR_SCALES)
      .filter((uiName) => uiName !== 'neutral')
      .map((uiName): [string, string] => [
        `ui-${uiName}`,
        `var(--ui-color-${uiName}-${anchorStep})`,
      ]),

    // Уровни Nuxt UI, которых нет в палитре старого сайта; остальные
    // (`--ui-bg`, `--ui-text`, `--ui-border`…) берутся из неё в tailwind.css
    ['ui-text-toned', text.toned],
    ['ui-text-inverted', solidText],
    ['ui-bg-inverted', surfaces.inverted],
    ['ui-border-muted', surfaces.borderMuted],
    ['ui-border-inverted', surfaces.inverted],

    ...buildLegacyVariables(base, neutral, accentScale, status),
  ];

  return {
    base,
    variables: Object.fromEntries(variables),
    pageColor: surfaces.page,
    accentColor: accent,
    isAccentAdjusted,
  };
}

/**
 * Превращает палитру в CSS-правило для класса своей темы на `<html>`.
 * Селектор сильнее, чем у файлов тем (`html.dark`), поэтому переменные
 * своей темы перекрывают переменные основы.
 *
 * @param palette - Палитра темы
 * @returns Текст CSS
 */
export function renderCustomThemeCss(palette: CustomThemePalette): string {
  const declarations = Object.entries(palette.variables)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');

  return `:root.${CUSTOM_THEME_CLASS} {\n${declarations}\n}`;
}
