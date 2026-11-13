import type { DmScreenWindow } from './schema';
import type {
  DmScreenAxisTile,
  DmScreenDivider,
  DmScreenPoint,
  DmScreenRect,
  DmScreenRequest,
  DmScreenResizeEdges,
  DmScreenResizeLimits,
  DmScreenSection,
  DmScreenSize,
  DmScreenSnapTarget,
  DmScreenSnapZone,
  DmScreenSpan,
  DmScreenTile,
  DmScreenViewport,
} from './types';

import { sortBy, uniq } from 'es-toolkit';

import {
  DM_SCREEN_CASCADE_LENGTH,
  DM_SCREEN_CASCADE_STEP,
  DM_SCREEN_CLICK_OFFSET,
  DM_SCREEN_DIVIDER_TOLERANCE,
  DM_SCREEN_GRID_GAP,
  DM_SCREEN_ICON,
  DM_SCREEN_LEFT_INSET,
  DM_SCREEN_NOTE_PATH_PREFIX,
  DM_SCREEN_PATH,
  DM_SCREEN_SECTIONS,
  DM_SCREEN_SNAP_DISTANCE,
  DM_SCREEN_SNAP_EDGE_DISTANCE,
  DM_SCREEN_SNAP_HALVES,
  DM_SCREEN_TEXT,
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
 * Где кончается шапка ширмы: выше окна не встают.
 * @param viewport - экран ширмы
 */
function getTopInset(viewport: DmScreenViewport): number {
  return viewport.top ?? DM_SCREEN_TOP_INSET;
}

/**
 * Добавляет запись окном в список окон ширмы. Уже добавленная запись не
 * дублируется: её окно разворачивается и встаёт сверху.
 * @param windows - окна ширмы
 * @param request - запись, название и точка клика
 * @param viewport - размер экрана
 * @param id - идентификатор нового окна
 * @returns новые окна и добавлена ли новая запись
 */
export function appendDmScreenWindow(
  windows: ReadonlyArray<DmScreenWindow>,
  request: DmScreenRequest,
  viewport: DmScreenViewport,
  id: string,
): { windows: Array<DmScreenWindow>; isAdded: boolean } {
  const topLayer = windows.reduce((top, item) => Math.max(top, item.layer), 0);

  if (windows.some((item) => item.path === request.path)) {
    return {
      windows: windows.map((item) =>
        item.path === request.path
          ? { ...item, isMinimized: false, layer: topLayer + 1 }
          : item,
      ),
      isAdded: false,
    };
  }

  const size = fitDmScreenWindowSize(viewport);

  const position = placeDmScreenWindow(
    viewport,
    size,
    request.origin,
    windows.filter((item) => !item.isMinimized).length,
  );

  return {
    windows: [
      ...windows,
      {
        id,
        path: request.path,
        title: request.title,
        ...position,
        ...size,
        layer: topLayer + 1,
        isMinimized: false,
      },
    ],
    isAdded: true,
  };
}

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
export function fitDmScreenWindowSize(
  viewport: DmScreenViewport,
): DmScreenSize {
  const availableWidth =
    viewport.width - DM_SCREEN_LEFT_INSET - DM_SCREEN_WINDOW_MARGIN * 2;

  const availableHeight =
    viewport.height - getTopInset(viewport) - DM_SCREEN_WINDOW_MARGIN;

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
  viewport: DmScreenViewport,
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
        getTopInset(viewport),
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
  viewport: DmScreenViewport,
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
        getTopInset(viewport),
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
  viewport: DmScreenViewport,
): Array<DmScreenTile> {
  if (!ids.length) {
    return [];
  }

  const left = DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN;
  const top = getTopInset(viewport);

  const area = {
    width: viewport.width - left - DM_SCREEN_WINDOW_MARGIN,
    height: viewport.height - top - DM_SCREEN_WINDOW_MARGIN,
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
    y: top + Math.floor(index / columns) * (height + DM_SCREEN_GRID_GAP),
    width,
    height,
  }));
}

/**
 * Страница ширмы пользователя.
 * @param id - идентификатор ширмы
 */
export function getDmScreenPagePath(id: string): string {
  return `${DM_SCREEN_PATH}/${encodeURIComponent(id)}`;
}

/**
 * Ближайшее к значению место из возможных, если оно не дальше расстояния
 * примагничивания; иначе значение как есть.
 * @param value - где окно сейчас
 * @param candidates - куда его можно притянуть
 */
function snapToNearest(
  value: number,
  candidates: ReadonlyArray<number>,
): number {
  const nearest = candidates.reduce<number | undefined>((best, candidate) => {
    const distance = Math.abs(candidate - value);

    if (distance > DM_SCREEN_SNAP_DISTANCE) {
      return best;
    }

    return best === undefined || distance < Math.abs(best - value)
      ? candidate
      : best;
  }, undefined);

  return nearest ?? value;
}

/**
 * Примагничивает перетаскиваемое окно: к краям холста (под шапкой, у
 * боковой панели, у краёв экрана) и к другим окнам — край к краю или рядом
 * с промежутком сетки. По каждой оси выбирается ближайший край в пределах
 * расстояния примагничивания, иначе окно остаётся, где его держат.
 * @param rect - где окно сейчас
 * @param others - остальные развёрнутые окна
 * @param viewport - размер экрана
 */
export function snapDmScreenWindow(
  rect: DmScreenRect,
  others: ReadonlyArray<DmScreenRect>,
  viewport: DmScreenViewport,
): DmScreenPoint {
  const left = DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN;
  const right = viewport.width - DM_SCREEN_WINDOW_MARGIN;
  const bottom = viewport.height - DM_SCREEN_WINDOW_MARGIN;

  const xCandidates = [
    left,
    right - rect.width,
    ...others.flatMap((other) => [
      // Левые и правые края вровень
      other.x,
      other.x + other.width - rect.width,
      // Рядом слева или справа с промежутком сетки
      other.x + other.width + DM_SCREEN_GRID_GAP,
      other.x - DM_SCREEN_GRID_GAP - rect.width,
    ]),
  ];

  const yCandidates = [
    getTopInset(viewport),
    bottom - rect.height,
    ...others.flatMap((other) => [
      other.y,
      other.y + other.height - rect.height,
      other.y + other.height + DM_SCREEN_GRID_GAP,
      other.y - DM_SCREEN_GRID_GAP - rect.height,
    ]),
  ];

  return {
    x: snapToNearest(rect.x, xCandidates),
    y: snapToNearest(rect.y, yCandidates),
  };
}

/**
 * Двигает одну сторону окна по одной оси; противоположная остаётся на
 * месте. Сторона примагничивается к краю холста, к краям соседних окон
 * (вровень или рядом с промежутком сетки) и к такой же длине, как у соседа.
 * @param span - отрезок окна по оси до растягивания
 * @param edge - какую сторону тянут: `-1` — начало, `1` — конец
 * @param delta - на сколько сдвинулся указатель
 * @param limits - границы холста и наименьший размер окна
 * @param neighbours - отрезки соседних окон; без них сторона не магнитится
 */
function resizeDmScreenSpan(
  span: DmScreenSpan,
  edge: DmScreenResizeEdges['x'],
  delta: number,
  limits: DmScreenResizeLimits,
  neighbours?: ReadonlyArray<DmScreenSpan>,
): DmScreenSpan {
  const spanEnd = span.start + span.size;

  if (edge < 0) {
    const dragged = span.start + delta;

    const snapped = neighbours
      ? snapToNearest(dragged, [
          limits.snapMin,
          ...neighbours.flatMap((other) => [
            other.start,
            other.start + other.size,
            other.start + other.size + DM_SCREEN_GRID_GAP,
            spanEnd - other.size,
          ]),
        ])
      : dragged;

    const start = clampToRange(
      snapped,
      Math.min(span.start, limits.min),
      spanEnd - limits.minSize,
    );

    return { start, size: spanEnd - start };
  }

  if (edge > 0) {
    const dragged = spanEnd + delta;

    const snapped = neighbours
      ? snapToNearest(dragged, [
          limits.snapMax,
          ...neighbours.flatMap((other) => [
            other.start + other.size,
            other.start,
            other.start - DM_SCREEN_GRID_GAP,
            span.start + other.size,
          ]),
        ])
      : dragged;

    return {
      start: span.start,
      size: Math.max(snapped, span.start + limits.minSize) - span.start,
    };
  }

  return span;
}

/**
 * Меняет размер окна, которое тянут за сторону или угол. Противоположные
 * стороны остаются на месте, окно не становится меньше минимального и не
 * заходит под шапку ширмы и боковую панель сайта. Сторона, которую тянут,
 * примагничивается: к краям холста, к краям других окон и к такой же ширине
 * или высоте, как у другого окна.
 * @param start - окно до растягивания
 * @param edges - за какие стороны тянут
 * @param delta - на сколько сдвинулся указатель
 * @param viewport - экран ширмы
 * @param others - остальные развёрнутые окна; без них окно не магнитится
 */
export function resizeDmScreenWindow(
  start: DmScreenRect,
  edges: DmScreenResizeEdges,
  delta: DmScreenPoint,
  viewport: DmScreenViewport,
  others?: ReadonlyArray<DmScreenRect>,
): DmScreenRect {
  const top = getTopInset(viewport);

  const horizontal = resizeDmScreenSpan(
    { start: start.x, size: start.width },
    edges.x,
    delta.x,
    {
      min: DM_SCREEN_LEFT_INSET,
      snapMin: DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN,
      snapMax: viewport.width - DM_SCREEN_WINDOW_MARGIN,
      minSize: DM_SCREEN_WINDOW_MIN_SIZE.width,
    },
    others?.map((other) => ({ start: other.x, size: other.width })),
  );

  const vertical = resizeDmScreenSpan(
    { start: start.y, size: start.height },
    edges.y,
    delta.y,
    {
      min: top,
      snapMin: top,
      snapMax: viewport.height - DM_SCREEN_WINDOW_MARGIN,
      minSize: DM_SCREEN_WINDOW_MIN_SIZE.height,
    },
    others?.map((other) => ({ start: other.y, size: other.height })),
  );

  return {
    x: Math.round(horizontal.start),
    y: Math.round(vertical.start),
    width: Math.round(horizontal.size),
    height: Math.round(vertical.size),
  };
}

/**
 * Прямоугольник места раскладки на холсте: под шапкой ширмы, правее боковой
 * панели, с промежутком сетки между соседними местами. Меньше минимального
 * окна место не становится.
 * @param zone - место раскладки в долях холста
 * @param viewport - экран ширмы
 */
export function getDmScreenZoneRect(
  zone: DmScreenSnapZone,
  viewport: DmScreenViewport,
): DmScreenRect {
  const left = DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN;
  const top = getTopInset(viewport);

  // Промежуток добавлен к холсту и вычтен из каждого места: так он между
  // местами один и тот же, а у краёв холста его нет. Место считается по
  // своим краям, а не по ширине: иначе из-за округления промежуток между
  // соседними местами гулял бы на пиксель
  const width =
    viewport.width - left - DM_SCREEN_WINDOW_MARGIN + DM_SCREEN_GRID_GAP;

  const height =
    viewport.height - top - DM_SCREEN_WINDOW_MARGIN + DM_SCREEN_GRID_GAP;

  const x = Math.round(left + zone.x * width);
  const y = Math.round(top + zone.y * height);

  const right =
    Math.round(left + (zone.x + zone.width) * width) - DM_SCREEN_GRID_GAP;

  const bottom =
    Math.round(top + (zone.y + zone.height) * height) - DM_SCREEN_GRID_GAP;

  return {
    x,
    y,
    width: Math.max(DM_SCREEN_WINDOW_MIN_SIZE.width, right - x),
    height: Math.max(DM_SCREEN_WINDOW_MIN_SIZE.height, bottom - y),
  };
}

/**
 * Половина холста, которую займёт окно, если его отпустить: указатель у
 * левого или правого края холста. Вдали от краёв — ничего.
 * @param pointer - где указатель
 * @param viewport - экран ширмы
 */
export function getDmScreenEdgeTarget(
  pointer: DmScreenPoint,
  viewport: DmScreenViewport,
): DmScreenSnapTarget | undefined {
  const [leftZone, rightZone] = DM_SCREEN_SNAP_HALVES.zones;

  if (
    leftZone
    && pointer.x <= DM_SCREEN_LEFT_INSET + DM_SCREEN_SNAP_EDGE_DISTANCE
  ) {
    return { layout: DM_SCREEN_SNAP_HALVES, zone: leftZone };
  }

  if (rightZone && pointer.x >= viewport.width - DM_SCREEN_SNAP_EDGE_DISTANCE) {
    return { layout: DM_SCREEN_SNAP_HALVES, zone: rightZone };
  }

  return undefined;
}

/**
 * Место и размер прямоугольника холста для привязки `style`.
 * @param rect - прямоугольник, px
 */
export function getDmScreenRectStyle(
  rect: DmScreenRect,
): Record<'left' | 'top' | 'width' | 'height', string> {
  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

/**
 * Место и размер места раскладки внутри её миниатюры для привязки `style`:
 * в процентах от миниатюры.
 * @param zone - место в долях холста
 */
export function getDmScreenZoneStyle(
  zone: DmScreenSnapZone,
): Record<'left' | 'top' | 'width' | 'height', string> {
  return {
    left: `${zone.x * 100}%`,
    top: `${zone.y * 100}%`,
    width: `${zone.width * 100}%`,
    height: `${zone.height * 100}%`,
  };
}

/**
 * Подпись и иконка кнопки, которая переключает просмотр и правку заметки.
 * @param isEditing - заметка сейчас в правке
 */
export function getDmScreenNoteToggle(isEditing: boolean): {
  label: string;
  icon: string;
} {
  return isEditing
    ? { label: DM_SCREEN_TEXT.noteDone, icon: DM_SCREEN_ICON.noteDone }
    : { label: DM_SCREEN_TEXT.noteEdit, icon: DM_SCREEN_ICON.noteEdit };
}

/**
 * Окно вдоль оси: по горизонтали для вертикальной границы и по вертикали
 * для горизонтальной.
 * @param tile - окно
 * @param isVertical - граница вертикальная
 */
function toAxisTile(tile: DmScreenTile, isVertical: boolean): DmScreenAxisTile {
  return isVertical
    ? {
        id: tile.id,
        start: tile.x,
        end: tile.x + tile.width,
        crossStart: tile.y,
        crossEnd: tile.y + tile.height,
      }
    : {
        id: tile.id,
        start: tile.y,
        end: tile.y + tile.height,
        crossStart: tile.x,
        crossEnd: tile.x + tile.width,
      };
}

/**
 * Окно с новым отрезком вдоль оси; поперёк оси оно не меняется.
 * @param tile - окно
 * @param isVertical - граница вертикальная
 * @param start - начало окна по оси
 * @param end - конец окна по оси
 */
function withAxisSpan(
  tile: DmScreenTile,
  isVertical: boolean,
  start: number,
  end: number,
): DmScreenTile {
  const { id, x, y, width, height } = tile;

  return isVertical
    ? { id, x: start, y, width: end - start, height }
    : { id, x, y: start, width, height: end - start };
}

/**
 * Общие границы окон по одной оси. Соседи — окна, между которыми ровно
 * промежуток сетки и которые перекрываются поперёк оси. Соседи на одной
 * линии, стоящие друг за другом, делят одну границу: в сетке 2×2 она идёт
 * через весь холст.
 * @param tiles - окна вдоль оси
 * @param isVertical - границы вертикальные
 */
function getAxisDividers(
  tiles: ReadonlyArray<DmScreenAxisTile>,
  isVertical: boolean,
): Array<DmScreenDivider> {
  const pairs = tiles.flatMap((leading) =>
    tiles
      .filter(
        (trailing) =>
          trailing.id !== leading.id
          && Math.abs(trailing.start - leading.end - DM_SCREEN_GRID_GAP)
            <= DM_SCREEN_DIVIDER_TOLERANCE
          && trailing.crossStart < leading.crossEnd
          && leading.crossStart < trailing.crossEnd,
      )
      .map((trailing) => ({
        leading,
        trailing,
        start: Math.min(leading.crossStart, trailing.crossStart),
        end: Math.max(leading.crossEnd, trailing.crossEnd),
      })),
  );

  return sortBy(pairs, [(pair) => pair.leading.end, 'start']).reduce<
    Array<DmScreenDivider>
  >((dividers, pair) => {
    const last = dividers.at(-1);

    const isSameDivider =
      last
      && Math.abs(last.position - pair.leading.end)
        <= DM_SCREEN_DIVIDER_TOLERANCE
      && pair.start
        <= last.end + DM_SCREEN_GRID_GAP + DM_SCREEN_DIVIDER_TOLERANCE;

    if (last && isSameDivider) {
      return [
        ...dividers.slice(0, -1),
        {
          ...last,
          end: Math.max(last.end, pair.end),
          leadingIds: uniq([...last.leadingIds, pair.leading.id]),
          trailingIds: uniq([...last.trailingIds, pair.trailing.id]),
        },
      ];
    }

    return [
      ...dividers,
      {
        key: `${isVertical ? 'x' : 'y'}:${pair.leading.end}:${pair.start}`,
        isVertical,
        position: pair.leading.end,
        start: pair.start,
        end: pair.end,
        leadingIds: [pair.leading.id],
        trailingIds: [pair.trailing.id],
      },
    ];
  }, []);
}

/**
 * Общие границы соседних окон: вертикальные и горизонтальные.
 * @param tiles - развёрнутые окна
 */
export function getDmScreenDividers(
  tiles: ReadonlyArray<DmScreenTile>,
): Array<DmScreenDivider> {
  return [true, false].flatMap((isVertical) =>
    getAxisDividers(
      tiles.map((tile) => toAxisTile(tile, isVertical)),
      isVertical,
    ),
  );
}

/**
 * Где указатель вдоль оси, по которой двигается граница: по горизонтали
 * для вертикальной и по вертикали для горизонтальной.
 * @param divider - граница
 * @param pointer - где указатель
 */
export function getDmScreenDividerPointer(
  divider: DmScreenDivider,
  pointer: DmScreenPoint,
): number {
  return divider.isVertical ? pointer.x : pointer.y;
}

/**
 * Прямоугольник общей границы на холсте: промежуток между окнами.
 * @param divider - граница
 * @param position - где граница сейчас; пока её тянут, она не на своём месте
 */
export function getDmScreenDividerRect(
  divider: DmScreenDivider,
  position: number = divider.position,
): DmScreenRect {
  return divider.isVertical
    ? {
        x: position,
        y: divider.start,
        width: DM_SCREEN_GRID_GAP,
        height: divider.end - divider.start,
      }
    : {
        x: divider.start,
        y: position,
        width: divider.end - divider.start,
        height: DM_SCREEN_GRID_GAP,
      };
}

/**
 * Сдвигает общую границу: окна перед ней растут или сжимаются концом, окна
 * за ней — началом, промежуток между ними остаётся. Граница не идёт дальше,
 * чем позволяет наименьший размер окон по обе стороны.
 * @param divider - граница
 * @param delta - на сколько сдвинулся указатель
 * @param tiles - развёрнутые окна
 * @returns новое место границы и окна, которые изменились
 */
export function moveDmScreenDivider(
  divider: DmScreenDivider,
  delta: number,
  tiles: ReadonlyArray<DmScreenTile>,
): { position: number; tiles: Array<DmScreenTile> } {
  const { isVertical } = divider;

  const minSize = isVertical
    ? DM_SCREEN_WINDOW_MIN_SIZE.width
    : DM_SCREEN_WINDOW_MIN_SIZE.height;

  const leading = tiles.filter((tile) => divider.leadingIds.includes(tile.id));

  const trailing = tiles.filter((tile) =>
    divider.trailingIds.includes(tile.id),
  );

  const min = Math.max(
    ...leading.map((tile) => toAxisTile(tile, isVertical).start + minSize),
  );

  const max =
    Math.min(
      ...trailing.map((tile) => toAxisTile(tile, isVertical).end - minSize),
    ) - DM_SCREEN_GRID_GAP;

  // Окнам уже некуда сжиматься: граница остаётся на месте
  const position =
    min > max
      ? divider.position
      : clampToRange(Math.round(divider.position + delta), min, max);

  return {
    position,
    tiles: [
      ...leading.map((tile) =>
        withAxisSpan(
          tile,
          isVertical,
          toAxisTile(tile, isVertical).start,
          position,
        ),
      ),
      ...trailing.map((tile) =>
        withAxisSpan(
          tile,
          isVertical,
          position + DM_SCREEN_GRID_GAP,
          toAxisTile(tile, isVertical).end,
        ),
      ),
    ],
  };
}

/**
 * Окно — заметка мастера, а не запись сайта.
 * @param path - путь окна
 */
export function isDmScreenNotePath(path: string): boolean {
  return path.startsWith(DM_SCREEN_NOTE_PATH_PREFIX);
}

/**
 * Путь новой заметки.
 * @param id - идентификатор заметки
 */
export function createDmScreenNotePath(id: string): string {
  return `${DM_SCREEN_NOTE_PATH_PREFIX}${id}`;
}

/**
 * Иконка окна: у заметки — своя, у записи — как у её раздела в меню.
 * @param path - путь окна
 */
export function getDmScreenWindowIcon(path: string): string {
  if (isDmScreenNotePath(path)) {
    return DM_SCREEN_ICON.note;
  }

  return resolveDmScreenSection(path)?.icon ?? DM_SCREEN_ICON.unknown;
}
