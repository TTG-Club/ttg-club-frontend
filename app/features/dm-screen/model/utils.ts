import type {
  DmScreenPoint,
  DmScreenSection,
  DmScreenSize,
  DmScreenTile,
} from './types';

import { sortBy } from 'es-toolkit';

import {
  DM_SCREEN_CASCADE_LENGTH,
  DM_SCREEN_CASCADE_STEP,
  DM_SCREEN_CLICK_OFFSET,
  DM_SCREEN_GRID_GAP,
  DM_SCREEN_LEFT_INSET,
  DM_SCREEN_SECTIONS,
  DM_SCREEN_TOP_INSET,
  DM_SCREEN_WINDOW_HEADER_HEIGHT,
  DM_SCREEN_WINDOW_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  DM_SCREEN_WINDOW_SIZE,
  DM_SCREEN_WINDOW_VISIBLE_PART,
} from './constants';

/** Конец адреса: строка запроса и якорь. */
const PATH_TAIL_PATTERN = /[?#].*$/;

/**
 * Ограничивает число отрезком; если отрезок пуст, отдаёт его начало.
 * @param value - число
 * @param min - начало отрезка
 * @param max - конец отрезка
 */
function clampToRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Адрес записи без строки запроса и якоря.
 * @param path - адрес записи на сайте
 */
export function getDmScreenPathname(path: string): string {
  return path.replace(PATH_TAIL_PATTERN, '');
}

/**
 * Раздел записи по её адресу: самый длинный подходящий адрес раздела, чтобы
 * `/items/magic/x` достался магическим предметам, а не предметам. Сам адрес
 * раздела — не запись.
 * @param path - адрес записи на сайте
 */
export function resolveDmScreenSection(
  path: string,
): DmScreenSection | undefined {
  const pathname = getDmScreenPathname(path);

  const matches = DM_SCREEN_SECTIONS.filter((section) =>
    pathname.startsWith(`${section.path}/`),
  );

  return matches.reduce<DmScreenSection | undefined>(
    (longest, section) =>
      !longest || section.path.length > longest.path.length ? section : longest,
    undefined,
  );
}

/**
 * Начало адреса записи без вложенных страниц: `/classes/fighter` у
 * `/classes/fighter/champion`. Вкладки класса и подрасы — та же запись.
 * @param path - адрес записи на сайте
 */
export function getDmScreenEntryRoot(path: string): string | undefined {
  const section = resolveDmScreenSection(path);

  if (!section) {
    return undefined;
  }

  const [slug] = getDmScreenPathname(path)
    .slice(section.path.length + 1)
    .split('/');

  return slug ? `${section.path}/${slug}` : undefined;
}

/**
 * Можно ли добавить запись с этим адресом в ширму.
 * @param path - адрес записи на сайте
 */
export function isDmScreenPath(path: string): boolean {
  return resolveDmScreenSection(path) !== undefined;
}

/**
 * Размер нового окна: обычный, но не больше экрана за вычетом боковой
 * панели и отступов.
 * @param viewport - размер экрана
 */
export function fitDmScreenWindowSize(viewport: DmScreenSize): DmScreenSize {
  const availableWidth =
    viewport.width - DM_SCREEN_LEFT_INSET - DM_SCREEN_WINDOW_MARGIN * 2;

  const availableHeight =
    viewport.height - DM_SCREEN_TOP_INSET - DM_SCREEN_WINDOW_MARGIN;

  return {
    width: Math.max(
      DM_SCREEN_WINDOW_MIN_SIZE.width,
      Math.min(DM_SCREEN_WINDOW_SIZE.width, availableWidth),
    ),
    height: Math.max(
      DM_SCREEN_WINDOW_MIN_SIZE.height,
      Math.min(DM_SCREEN_WINDOW_SIZE.height, availableHeight),
    ),
  };
}

/**
 * Место нового окна: рядом с точкой клика, а без неё — лесенкой от центра
 * экрана. Окно целиком на экране и не встаёт под боковую панель.
 * @param viewport - размер экрана
 * @param size - размер окна
 * @param origin - точка клика
 * @param index - сколько окон уже открыто
 */
export function placeDmScreenWindow(
  viewport: DmScreenSize,
  size: DmScreenSize,
  origin: DmScreenPoint | undefined,
  index: number,
): DmScreenPoint {
  const cascade = (index % DM_SCREEN_CASCADE_LENGTH) * DM_SCREEN_CASCADE_STEP;

  const preferred = origin
    ? {
        x: origin.x + DM_SCREEN_CLICK_OFFSET,
        y: origin.y + DM_SCREEN_CLICK_OFFSET,
      }
    : {
        x: (viewport.width - size.width) / 2 + cascade,
        y: (viewport.height - size.height) / 2 + cascade,
      };

  return {
    x: Math.round(
      clampToRange(
        preferred.x,
        DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN,
        viewport.width - size.width - DM_SCREEN_WINDOW_MARGIN,
      ),
    ),
    y: Math.round(
      clampToRange(
        preferred.y,
        DM_SCREEN_TOP_INSET,
        viewport.height - size.height - DM_SCREEN_WINDOW_MARGIN,
      ),
    ),
  };
}

/**
 * Место окна, за которое его можно ухватить: окно может уйти за край
 * экрана, но шапка остаётся видна, а с боков виден кусок окна.
 * @param position - желаемое место
 * @param size - размер окна
 * @param viewport - размер экрана
 */
export function keepDmScreenWindowReachable(
  position: DmScreenPoint,
  size: DmScreenSize,
  viewport: DmScreenSize,
): DmScreenPoint {
  return {
    x: Math.round(
      clampToRange(
        position.x,
        DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_VISIBLE_PART - size.width,
        viewport.width - DM_SCREEN_WINDOW_VISIBLE_PART,
      ),
    ),
    y: Math.round(
      clampToRange(
        position.y,
        DM_SCREEN_TOP_INSET,
        viewport.height - DM_SCREEN_WINDOW_HEADER_HEIGHT,
      ),
    ),
  };
}

/**
 * Число колонок для сетки окон. Сначала — варианты, где клетка не меньше
 * минимального окна: из них берутся самые крупные клетки в долях обычного
 * окна (по меньшей доле, чтобы клетки не вытягивались в полосы). Если окон
 * так много, что такого варианта нет, берётся самый близкий к минимальному
 * окну.
 * @param count - сколько окон
 * @param area - свободное место
 */
function pickGridColumns(count: number, area: DmScreenSize): number {
  const cells = Array.from({ length: count }, (_, index) => {
    const columns = index + 1;
    const rows = Math.ceil(count / columns);

    return {
      columns,
      width: (area.width - DM_SCREEN_GRID_GAP * (columns - 1)) / columns,
      height: (area.height - DM_SCREEN_GRID_GAP * (rows - 1)) / rows,
    };
  });

  const fitting = cells.filter(
    (cell) =>
      cell.width >= DM_SCREEN_WINDOW_MIN_SIZE.width
      && cell.height >= DM_SCREEN_WINDOW_MIN_SIZE.height,
  );

  const [best] = fitting.length
    ? sortBy(fitting, [
        (cell) =>
          -Math.min(
            cell.width / DM_SCREEN_WINDOW_SIZE.width,
            cell.height / DM_SCREEN_WINDOW_SIZE.height,
          ),
      ])
    : sortBy(cells, [
        (cell) =>
          -Math.min(
            cell.width / DM_SCREEN_WINDOW_MIN_SIZE.width,
            cell.height / DM_SCREEN_WINDOW_MIN_SIZE.height,
          ),
      ]);

  return best?.columns ?? 1;
}

/**
 * Раскладывает окна ровной сеткой на свободном месте ширмы: под шапкой,
 * правее боковой панели. Сетка целиком помещается на экран: колонок
 * столько, чтобы клетки были крупнее всего; меньше минимального окна клетки
 * не становятся — тогда нижний ряд может немного уйти за край.
 * @param ids - окна в порядке чтения: слева направо, сверху вниз
 * @param viewport - размер экрана
 */
export function arrangeDmScreenWindows(
  ids: ReadonlyArray<string>,
  viewport: DmScreenSize,
): Array<DmScreenTile> {
  if (!ids.length) {
    return [];
  }

  const left = DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN;

  const area = {
    width: viewport.width - left - DM_SCREEN_WINDOW_MARGIN,
    height: viewport.height - DM_SCREEN_TOP_INSET - DM_SCREEN_WINDOW_MARGIN,
  };

  const columns = pickGridColumns(ids.length, area);
  const rows = Math.ceil(ids.length / columns);

  const width = Math.max(
    DM_SCREEN_WINDOW_MIN_SIZE.width,
    Math.floor((area.width - DM_SCREEN_GRID_GAP * (columns - 1)) / columns),
  );

  const height = Math.max(
    DM_SCREEN_WINDOW_MIN_SIZE.height,
    Math.floor((area.height - DM_SCREEN_GRID_GAP * (rows - 1)) / rows),
  );

  return ids.map((id, index) => ({
    id,
    x: left + (index % columns) * (width + DM_SCREEN_GRID_GAP),
    y:
      DM_SCREEN_TOP_INSET
      + Math.floor(index / columns) * (height + DM_SCREEN_GRID_GAP),
    width,
    height,
  }));
}
