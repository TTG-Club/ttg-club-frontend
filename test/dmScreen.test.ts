import { describe, expect, it } from 'vitest';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  clampDmScreenView,
  createDmScreenNotePath,
  DM_SCREEN_FIELD,
  DM_SCREEN_GRID_GAP,
  DM_SCREEN_ICON,
  DM_SCREEN_SNAP_HALVES,
  DM_SCREEN_SNAP_LAYOUTS,
  DM_SCREEN_VIEW_DEFAULT,
  DM_SCREEN_WINDOW_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  DM_SCREEN_ZOOM,
  dmScreenDetailSchema,
  dmScreenListSchema,
  fitDmScreenView,
  formatDmScreenGrid,
  getDmScreenDividers,
  getDmScreenEdgeTarget,
  getDmScreenEntryRoot,
  getDmScreenGridCells,
  getDmScreenVisibleRect,
  getDmScreenWindowIcon,
  getDmScreenZoneRect,
  isDmScreenGridCellInside,
  isDmScreenLayoutFitting,
  isDmScreenNotePath,
  isDmScreenPath,
  isDmScreenPickerBand,
  isDmScreenRectVisible,
  keepDmScreenWindowOnField,
  moveDmScreenDivider,
  panDmScreenView,
  resizeDmScreenWindow,
  resolveDmScreenSection,
  snapDmScreenWindow,
  toDmScreenCanvasRect,
  toDmScreenFieldPoint,
  zoomDmScreenView,
} from '~dm-screen/model';

/** Холст на экране 1600×900: под шапкой ширмы, правее боковой панели. */
const CANVAS = { width: 1536, height: 835 };

/** Видимая часть поля при обычном обзоре. */
const BOARD = getDmScreenVisibleRect(DM_SCREEN_VIEW_DEFAULT, CANVAS);

/** Невысокий холст: на нём помещается лишь один ряд обычных окон. */
const SHORT_BOARD = { ...BOARD, width: 1066, height: 335 };

/** Края свободного места видимой части поля. */
const AREA = {
  left: BOARD.x + DM_SCREEN_WINDOW_MARGIN,
  top: BOARD.y + DM_SCREEN_WINDOW_MARGIN,
  right: BOARD.x + BOARD.width - DM_SCREEN_WINDOW_MARGIN,
  bottom: BOARD.y + BOARD.height - DM_SCREEN_WINDOW_MARGIN,
};

describe('ширма мастера', () => {
  it('магические предметы не путает с предметами', () => {
    expect(resolveDmScreenSection('/items/magic/bag_of_holding')?.path).toBe(
      '/items/magic',
    );

    expect(resolveDmScreenSection('/items/rope')?.path).toBe('/items');
  });

  it('берёт в ширму только записи, а не списки и чужие страницы', () => {
    expect(isDmScreenPath('/spells/fireball')).toBe(true);
    expect(isDmScreenPath('/traits/alert')).toBe(true);
    expect(isDmScreenPath('/spells')).toBe(false);
    expect(isDmScreenPath('/options?classOption=FIGHTING_STYLE')).toBe(false);
    expect(isDmScreenPath('/tools/trader')).toBe(false);
  });

  it('вкладки класса — та же запись', () => {
    expect(getDmScreenEntryRoot('/classes/fighter/champion')).toBe(
      '/classes/fighter',
    );

    expect(getDmScreenEntryRoot('/classes/fighter')).toBe('/classes/fighter');
    expect(getDmScreenEntryRoot('/tools/trader')).toBeUndefined();
  });

  it('укладывает все окна в сетку, которая помещается на невысокий холст', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const tiles = arrangeDmScreenWindows(ids, SHORT_BOARD);

    expect(tiles.map((tile) => tile.id)).toEqual(ids);

    const bottom = Math.max(...tiles.map((tile) => tile.y + tile.height));
    const right = Math.max(...tiles.map((tile) => tile.x + tile.width));

    expect(bottom).toBeLessThanOrEqual(
      SHORT_BOARD.y + SHORT_BOARD.height - DM_SCREEN_WINDOW_MARGIN,
    );

    expect(right).toBeLessThanOrEqual(
      SHORT_BOARD.x + SHORT_BOARD.width - DM_SCREEN_WINDOW_MARGIN,
    );

    expect(Math.min(...tiles.map((tile) => tile.y))).toBe(AREA.top);
  });

  it('клетки сетки не перекрываются', () => {
    const tiles = arrangeDmScreenWindows(['a', 'b', 'c', 'd', 'e'], BOARD);

    const overlaps = tiles.some((tile, index) =>
      tiles
        .slice(index + 1)
        .some(
          (other) =>
            tile.x < other.x + other.width
            && other.x < tile.x + tile.width
            && tile.y < other.y + other.height
            && other.y < tile.y + tile.height,
        ),
    );

    expect(overlaps).toBe(false);
  });

  it('раскладывает окна сеткой, которую выбрал мастер', () => {
    const tiles = arrangeDmScreenWindows(['a', 'b', 'c', 'd'], BOARD, {
      columns: 3,
      rows: 2,
    });

    const [first, second, third, fourth] = tiles;

    if (!first || !second || !third || !fourth) {
      throw new Error('Сетка должна вернуть все четыре окна');
    }

    // Три колонки: четвёртое окно уходит на второй ряд под первое
    expect(new Set([first.y, second.y, third.y]).size).toBe(1);
    expect(fourth.x).toBe(first.x);
    expect(fourth.y).toBe(first.y + first.height + DM_SCREEN_GRID_GAP);

    // Клетка — треть ширины и половина высоты, даже когда окон меньше
    expect(third.x + third.width).toBe(AREA.right);
    expect(fourth.y + fourth.height).toBe(AREA.bottom);
  });

  it('добавляет запись окном и не дублирует уже добавленную', () => {
    const first = appendDmScreenWindow(
      [],
      { path: '/spells/fireball', title: 'Огненный шар' },
      BOARD,
      'w1',
    );

    expect(first.isAdded).toBe(true);
    expect(first.windows).toHaveLength(1);
    expect(first.windows[0]?.layer).toBe(1);

    const minimized = first.windows.map((item) => ({
      ...item,
      isMinimized: true,
    }));

    const again = appendDmScreenWindow(
      minimized,
      { path: '/spells/fireball', title: 'Огненный шар' },
      BOARD,
      'w2',
    );

    expect(again.isAdded).toBe(false);
    expect(again.windowId).toBe('w1');
    expect(again.windows).toHaveLength(1);
    expect(again.windows[0]?.isMinimized).toBe(false);
    expect(again.windows[0]?.layer).toBe(2);
  });

  it('читает список ширм и ширму с сервера, числовой id — строкой', () => {
    const list = dmScreenListSchema.parse({
      items: [{ id: 7, name: 'Подземелье', windowCount: 3, updatedAt: null }],
      used: 1,
      limit: 1,
    });

    expect(list.items[0]?.id).toBe('7');

    const screen = dmScreenDetailSchema.parse({
      id: 'abc',
      name: 'Подземелье',
      windows: [
        {
          id: 'w1',
          path: '/bestiary/goblin',
          title: 'Гоблин',
          x: 100,
          y: 80,
          width: 480,
          height: 600,
          layer: 1,
          isMinimized: false,
        },
      ],
    });

    expect(screen.windows).toHaveLength(1);
  });

  it('новое окно встаёт в видимой части поля, куда бы её ни сдвинули', () => {
    const board = { ...BOARD, x: 3000, y: -2000 };

    const { windows } = appendDmScreenWindow(
      [],
      { path: '/spells/fireball', title: 'Огненный шар' },
      board,
      'w1',
    );

    const [added] = windows;

    if (!added) {
      throw new Error('Окно должно добавиться');
    }

    expect(isDmScreenRectVisible(added, board)).toBe(true);
    expect(added.x).toBeGreaterThanOrEqual(board.x + DM_SCREEN_WINDOW_MARGIN);
    expect(added.y).toBeGreaterThanOrEqual(board.y + DM_SCREEN_WINDOW_MARGIN);
  });

  it('сетка доходит до краёв холста с одинаковым отступом', () => {
    const tiles = arrangeDmScreenWindows(['a', 'b', 'c'], BOARD);

    expect(Math.min(...tiles.map((tile) => tile.x))).toBe(AREA.left);

    expect(Math.max(...tiles.map((tile) => tile.x + tile.width))).toBe(
      AREA.right,
    );

    expect(Math.max(...tiles.map((tile) => tile.y + tile.height))).toBe(
      AREA.bottom,
    );
  });

  describe('примагничивание', () => {
    const other = { x: 500, y: 200, width: 400, height: 300 };
    const size = { width: 300, height: 200 };

    it('ставит окно рядом с другим с промежутком сетки', () => {
      const snapped = snapDmScreenWindow(
        { x: 500 + 400 + DM_SCREEN_GRID_GAP + 7, y: 205, ...size },
        [other],
        BOARD,
      );

      expect(snapped).toEqual({
        x: 500 + 400 + DM_SCREEN_GRID_GAP,
        y: 200,
      });
    });

    it('прижимает к краям свободного места холста', () => {
      const snapped = snapDmScreenWindow(
        { x: AREA.left + 11, y: AREA.top + 9, ...size },
        [],
        BOARD,
      );

      expect(snapped).toEqual({ x: AREA.left, y: AREA.top });
    });

    it('далеко от краёв окно остаётся, где его держат', () => {
      const snapped = snapDmScreenWindow(
        { x: 1100, y: 600, ...size },
        [other],
        BOARD,
      );

      expect(snapped).toEqual({ x: 1100, y: 600 });
    });
  });

  describe('растягивание', () => {
    const start = { x: 500, y: 200, width: 400, height: 300 };
    const other = { x: 1000, y: 200, width: 320, height: 450 };

    it('тянет левую сторону, правая остаётся на месте', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: -1, y: 0 },
        { x: -150, y: 40 },
        BOARD,
      );

      expect(resized).toEqual({ x: 350, y: 200, width: 550, height: 300 });
    });

    it('примагничивает высоту к высоте соседнего окна', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 0, y: 1 },
        { x: 0, y: 143 },
        BOARD,
        [other],
      );

      expect(resized.height).toBe(other.height);
    });

    it('примагничивает ширину к ширине соседнего окна', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 1, y: 0 },
        { x: -75, y: 0 },
        BOARD,
        [other],
      );

      expect(resized.width).toBe(other.width);
    });

    it('примагничивает сторону к краю свободного места холста', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 0, y: -1 },
        { x: 0, y: AREA.top + 5 - start.y },
        BOARD,
        [],
      );

      expect(resized.y).toBe(AREA.top);
      expect(resized.y + resized.height).toBe(start.y + start.height);
    });

    it('не сжимает окно меньше минимального', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 1, y: 1 },
        { x: -1000, y: -1000 },
        BOARD,
      );

      expect(resized).toEqual({
        x: 500,
        y: 200,
        ...DM_SCREEN_WINDOW_MIN_SIZE,
      });
    });
  });

  describe('раскладки', () => {
    const [leftZone, rightZone] = DM_SCREEN_SNAP_HALVES.zones;

    it('половины делят холст с промежутком сетки между ними', () => {
      if (!leftZone || !rightZone) {
        throw new Error('В раскладке половин должно быть два места');
      }

      const left = getDmScreenZoneRect(leftZone, BOARD);
      const right = getDmScreenZoneRect(rightZone, BOARD);

      expect(left.x).toBe(AREA.left);
      expect(left.y).toBe(AREA.top);
      expect(right.x - (left.x + left.width)).toBe(DM_SCREEN_GRID_GAP);
      expect(right.x + right.width).toBe(AREA.right);
      expect(left.y + left.height).toBe(AREA.bottom);
    });

    it('у боковых краёв холста предлагает половину', () => {
      expect(getDmScreenEdgeTarget({ x: 5, y: 400 }, CANVAS)?.zone).toBe(
        leftZone,
      );

      expect(
        getDmScreenEdgeTarget({ x: CANVAS.width - 5, y: 400 }, CANVAS)?.zone,
      ).toBe(rightZone);

      expect(getDmScreenEdgeTarget({ x: 800, y: 400 }, CANVAS)).toBe(undefined);
    });

    it('панель раскладок видна в полосе у выбранного края холста', () => {
      const nearTop = { x: 800, y: 20 };
      const nearBottom = { x: 800, y: CANVAS.height - 20 };

      expect(isDmScreenPickerBand(nearTop, CANVAS, 'top')).toBe(true);
      expect(isDmScreenPickerBand(nearBottom, CANVAS, 'top')).toBe(false);
      expect(isDmScreenPickerBand(nearBottom, CANVAS, 'bottom')).toBe(true);
      expect(isDmScreenPickerBand(nearTop, CANVAS, 'bottom')).toBe(false);
    });

    it('полоса панели раскладок растёт вместе с панелью в два ряда', () => {
      const belowBand = { x: 800, y: 140 };

      expect(isDmScreenPickerBand(belowBand, CANVAS, 'top')).toBe(false);
      expect(isDmScreenPickerBand(belowBand, CANVAS, 'top', 136)).toBe(true);
    });

    it('скрытая панель раскладок не появляется ни у одного края', () => {
      expect(isDmScreenPickerBand({ x: 800, y: 20 }, CANVAS, 'hidden')).toBe(
        false,
      );

      expect(
        isDmScreenPickerBand(
          { x: 800, y: CANVAS.height - 20 },
          CANVAS,
          'hidden',
        ),
      ).toBe(false);
    });

    it('тесному холсту частые раскладки не предлагает, отдалённому — все', () => {
      const tight = { ...BOARD, width: 800, height: 500 };
      const far = getDmScreenVisibleRect({ x: 0, y: 0, zoom: 0.5 }, CANVAS);

      const fitting = DM_SCREEN_SNAP_LAYOUTS.filter((layout) =>
        isDmScreenLayoutFitting(layout, tight),
      ).map((layout) => layout.key);

      expect(fitting).toContain('columns-2');
      expect(fitting).not.toContain('columns-6');

      expect(
        DM_SCREEN_SNAP_LAYOUTS.every((layout) =>
          isDmScreenLayoutFitting(layout, far),
        ),
      ).toBe(true);
    });

    it('места каждой раскладки покрывают холст целиком', () => {
      DM_SCREEN_SNAP_LAYOUTS.forEach((layout) => {
        const area = layout.zones.reduce(
          (sum, zone) => sum + zone.width * zone.height,
          0,
        );

        expect(area).toBeCloseTo(1);
      });
    });
  });

  describe('обзор поля', () => {
    it('при обычном обзоре старые окна стоят на экране, где стояли', () => {
      // Раньше место окна считалось от угла окна браузера, а холст
      // начинался под шапкой, правее боковой панели
      const legacy = { x: 72, y: 73, width: 480, height: 600 };

      expect(toDmScreenCanvasRect(legacy, DM_SCREEN_VIEW_DEFAULT)).toEqual({
        ...legacy,
        x: DM_SCREEN_WINDOW_MARGIN,
        y: DM_SCREEN_WINDOW_MARGIN,
      });
    });

    it('точка холста и точка поля переводятся друг в друга', () => {
      const view = { x: 400, y: -200, zoom: 0.5 };

      expect(toDmScreenFieldPoint({ x: 100, y: 50 }, view)).toEqual({
        x: 600,
        y: -100,
      });

      expect(
        toDmScreenCanvasRect(
          { x: 600, y: -100, width: 200, height: 100 },
          view,
        ),
      ).toEqual({ x: 100, y: 50, width: 100, height: 50 });
    });

    it('отдалённое поле показывает больше', () => {
      const board = getDmScreenVisibleRect({ x: 0, y: 0, zoom: 0.5 }, CANVAS);

      expect(board.width).toBe(CANVAS.width * 2);
      expect(board.height).toBe(CANVAS.height * 2);
    });

    it('масштаб меняется вокруг указателя и не выходит за пределы', () => {
      const anchor = { x: 300, y: 200 };
      const before = toDmScreenFieldPoint(anchor, DM_SCREEN_VIEW_DEFAULT);
      const zoomed = zoomDmScreenView(DM_SCREEN_VIEW_DEFAULT, 0.5, anchor);
      const after = toDmScreenFieldPoint(anchor, zoomed);

      expect(zoomed.zoom).toBe(0.5);
      expect(after.x).toBeCloseTo(before.x);
      expect(after.y).toBeCloseTo(before.y);

      expect(zoomDmScreenView(zoomed, 5, anchor).zoom).toBe(DM_SCREEN_ZOOM.max);

      expect(zoomDmScreenView(zoomed, 0.01, anchor).zoom).toBe(
        DM_SCREEN_ZOOM.min,
      );
    });

    it('поле едет за указателем, на отдалённом — быстрее', () => {
      expect(
        panDmScreenView({ x: 0, y: 0, zoom: 0.5 }, { x: 100, y: -50 }),
      ).toEqual({ x: -200, y: 100, zoom: 0.5 });
    });

    it('обзор не уходит за края поля', () => {
      const clamped = clampDmScreenView(
        { x: 999999, y: -999999, zoom: 1 },
        CANVAS,
      );

      expect(clamped.x).toBe(
        DM_SCREEN_FIELD.x + DM_SCREEN_FIELD.width - CANVAS.width,
      );

      expect(clamped.y).toBe(DM_SCREEN_FIELD.y);
    });

    it('окно не уходит за край поля', () => {
      const kept = keepDmScreenWindowOnField({
        x: DM_SCREEN_FIELD.x - 500,
        y: DM_SCREEN_FIELD.y + DM_SCREEN_FIELD.height,
        width: 400,
        height: 300,
      });

      expect(kept.x).toBe(DM_SCREEN_FIELD.x);
      expect(kept.y).toBe(DM_SCREEN_FIELD.y + DM_SCREEN_FIELD.height - 300);
    });

    it('«показать все окна» отдаляет поле, пока окна не поместятся', () => {
      const bounds = { x: -1000, y: -500, width: 4000, height: 2000 };
      const view = fitDmScreenView(bounds, CANVAS, 48);
      const board = getDmScreenVisibleRect(view, CANVAS);

      expect(view.zoom).toBeLessThan(1);
      expect(board.x).toBeLessThanOrEqual(bounds.x);
      expect(board.y).toBeLessThanOrEqual(bounds.y);

      expect(board.x + board.width).toBeGreaterThanOrEqual(
        bounds.x + bounds.width,
      );

      expect(board.y + board.height).toBeGreaterThanOrEqual(
        bounds.y + bounds.height,
      );
    });

    it('небольшое окно «показать все» не приближает сверх обычного', () => {
      const view = fitDmScreenView(
        { x: 0, y: 0, width: 200, height: 100 },
        CANVAS,
        48,
      );

      expect(view.zoom).toBe(DM_SCREEN_ZOOM.max);
    });
  });

  describe('выбор сетки', () => {
    it('поле выбора — клетки по рядам, считая с единицы', () => {
      const cells = getDmScreenGridCells(3);

      expect(cells).toHaveLength(9);
      expect(cells[0]).toEqual({ columns: 1, rows: 1 });
      expect(cells[2]).toEqual({ columns: 3, rows: 1 });
      expect(cells[3]).toEqual({ columns: 1, rows: 2 });
    });

    it('подсвечивает клетки от угла до той, что под указателем', () => {
      const grid = { columns: 3, rows: 2 };

      expect(isDmScreenGridCellInside({ columns: 3, rows: 2 }, grid)).toBe(
        true,
      );

      expect(isDmScreenGridCellInside({ columns: 1, rows: 1 }, grid)).toBe(
        true,
      );

      expect(isDmScreenGridCellInside({ columns: 4, rows: 1 }, grid)).toBe(
        false,
      );

      expect(isDmScreenGridCellInside({ columns: 1, rows: 3 }, grid)).toBe(
        false,
      );
    });

    it('подписывает сетку колонками и рядами', () => {
      expect(formatDmScreenGrid({ columns: 3, rows: 2 })).toBe('3 × 2');
    });
  });

  describe('общие границы', () => {
    const left = { id: 'left', x: 80, y: 76, width: 400, height: 300 };

    const right = {
      id: 'right',
      x: 480 + DM_SCREEN_GRID_GAP,
      y: 76,
      width: 400,
      height: 300,
    };

    const far = { id: 'far', x: 1200, y: 500, width: 300, height: 200 };

    it('находит границу между окнами через промежуток сетки', () => {
      const dividers = getDmScreenDividers([left, right, far]);

      expect(dividers).toHaveLength(1);

      expect(dividers[0]).toMatchObject({
        isVertical: true,
        position: 480,
        leadingIds: ['left'],
        trailingIds: ['right'],
      });
    });

    it('граница идёт только вдоль общей части окон разного размера', () => {
      const small = { ...right, id: 'small', y: 200, height: 100 };
      const [divider] = getDmScreenDividers([left, small]);

      expect(divider).toMatchObject({ start: 200, end: 300 });
    });

    it('в сетке 2×2 вертикальная граница одна на оба ряда', () => {
      const row = 300 + DM_SCREEN_GRID_GAP;

      const dividers = getDmScreenDividers([
        left,
        right,
        { ...left, id: 'left-bottom', y: left.y + row },
        { ...right, id: 'right-bottom', y: right.y + row },
      ]);

      const vertical = dividers.filter((divider) => divider.isVertical);

      expect(vertical).toHaveLength(1);
      expect(vertical[0]?.leadingIds).toEqual(['left', 'left-bottom']);
      expect(vertical[0]?.trailingIds).toEqual(['right', 'right-bottom']);
    });

    it('сдвиг границы меняет оба окна и сохраняет промежуток', () => {
      const [divider] = getDmScreenDividers([left, right]);

      if (!divider) {
        throw new Error('Граница между окнами не найдена');
      }

      const moved = moveDmScreenDivider(divider, 100, [left, right]);

      expect(moved.tiles).toEqual([
        { ...left, width: 500 },
        { ...right, x: 580 + DM_SCREEN_GRID_GAP, width: 300 },
      ]);
    });

    it('граница не сжимает окно меньше минимального', () => {
      const [divider] = getDmScreenDividers([left, right]);

      if (!divider) {
        throw new Error('Граница между окнами не найдена');
      }

      const moved = moveDmScreenDivider(divider, 5000, [left, right]);

      expect(moved.tiles[1]?.width).toBe(DM_SCREEN_WINDOW_MIN_SIZE.width);
    });
  });

  describe('заметки', () => {
    it('путь заметки не путает с записями сайта', () => {
      const path = createDmScreenNotePath('n1');

      expect(isDmScreenNotePath(path)).toBe(true);
      expect(isDmScreenPath(path)).toBe(false);
      expect(isDmScreenNotePath('/spells/fireball')).toBe(false);
    });

    it('у заметки своя иконка, у записи — раздела', () => {
      expect(getDmScreenWindowIcon(createDmScreenNotePath('n1'))).toBe(
        DM_SCREEN_ICON.note,
      );

      expect(getDmScreenWindowIcon('/tools/trader')).toBe(
        DM_SCREEN_ICON.unknown,
      );
    });

    it('сервер отдаёт заметку с текстом, запись — без', () => {
      const screen = dmScreenDetailSchema.parse({
        id: 's1',
        name: 'Подземелье',
        windows: [
          {
            id: 'n1',
            path: 'note:n1',
            title: 'Логово',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            layer: 1,
            isMinimized: false,
            content: '<p>Вожак — <strong>21 хит</strong></p>',
          },
          {
            id: 'w1',
            path: '/bestiary/goblin',
            title: 'Гоблин',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            layer: 2,
            isMinimized: false,
            content: null,
          },
        ],
      });

      expect(screen.windows[0]?.content).toContain('21 хит');
      expect(screen.windows[1]?.content).toBeNull();
    });
  });
});
