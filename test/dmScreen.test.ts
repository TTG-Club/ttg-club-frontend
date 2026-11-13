import { describe, expect, it } from 'vitest';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  createDmScreenNotePath,
  DM_SCREEN_GRID_GAP,
  DM_SCREEN_ICON,
  DM_SCREEN_LEFT_INSET,
  DM_SCREEN_SNAP_HALVES,
  DM_SCREEN_SNAP_LAYOUTS,
  DM_SCREEN_SNAP_PICKER_OFFSET,
  DM_SCREEN_TOP_INSET,
  DM_SCREEN_WINDOW_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  dmScreenDetailSchema,
  dmScreenListSchema,
  getDmScreenDividers,
  getDmScreenEdgeTarget,
  getDmScreenEntryRoot,
  getDmScreenPickerStyle,
  getDmScreenWindowIcon,
  getDmScreenZoneRect,
  isDmScreenNotePath,
  isDmScreenPath,
  isDmScreenPickerBand,
  moveDmScreenDivider,
  resizeDmScreenWindow,
  resolveDmScreenSection,
  snapDmScreenWindow,
} from '~dm-screen/model';

/** Небольшой экран: под шапкой помещается лишь один ряд обычных окон. */
const SHORT_VIEWPORT = { width: 1130, height: 400 };

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

  it('укладывает все окна в сетку, которая помещается на невысокий экран', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const tiles = arrangeDmScreenWindows(ids, SHORT_VIEWPORT);

    expect(tiles.map((tile) => tile.id)).toEqual(ids);

    const bottom = Math.max(...tiles.map((tile) => tile.y + tile.height));
    const right = Math.max(...tiles.map((tile) => tile.x + tile.width));

    expect(bottom).toBeLessThanOrEqual(
      SHORT_VIEWPORT.height - DM_SCREEN_WINDOW_MARGIN,
    );

    expect(right).toBeLessThanOrEqual(
      SHORT_VIEWPORT.width - DM_SCREEN_WINDOW_MARGIN,
    );

    expect(Math.min(...tiles.map((tile) => tile.y))).toBe(DM_SCREEN_TOP_INSET);
  });

  it('клетки сетки не перекрываются', () => {
    const tiles = arrangeDmScreenWindows(['a', 'b', 'c', 'd', 'e'], {
      width: 1600,
      height: 900,
    });

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

  it('добавляет запись окном и не дублирует уже добавленную', () => {
    const viewport = { width: 1600, height: 900 };

    const first = appendDmScreenWindow(
      [],
      { path: '/spells/fireball', title: 'Огненный шар' },
      viewport,
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
      viewport,
      'w2',
    );

    expect(again.isAdded).toBe(false);
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

  it('сетка доходит до краёв холста с одинаковым отступом', () => {
    const viewport = { width: 1600, height: 900 };
    const tiles = arrangeDmScreenWindows(['a', 'b', 'c'], viewport);

    expect(Math.min(...tiles.map((tile) => tile.x))).toBe(
      DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN,
    );

    expect(Math.max(...tiles.map((tile) => tile.x + tile.width))).toBe(
      viewport.width - DM_SCREEN_WINDOW_MARGIN,
    );

    expect(Math.max(...tiles.map((tile) => tile.y + tile.height))).toBe(
      viewport.height - DM_SCREEN_WINDOW_MARGIN,
    );
  });

  describe('примагничивание', () => {
    const viewport = { width: 1600, height: 900 };
    const other = { x: 500, y: 200, width: 400, height: 300 };
    const size = { width: 300, height: 200 };

    it('ставит окно рядом с другим с промежутком сетки', () => {
      const snapped = snapDmScreenWindow(
        { x: 500 + 400 + DM_SCREEN_GRID_GAP + 7, y: 205, ...size },
        [other],
        viewport,
      );

      expect(snapped).toEqual({
        x: 500 + 400 + DM_SCREEN_GRID_GAP,
        y: 200,
      });
    });

    it('прижимает к краю холста под шапкой и у боковой панели', () => {
      const snapped = snapDmScreenWindow(
        { x: DM_SCREEN_LEFT_INSET + 20, y: DM_SCREEN_TOP_INSET + 9, ...size },
        [],
        viewport,
      );

      expect(snapped).toEqual({
        x: DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN,
        y: DM_SCREEN_TOP_INSET,
      });
    });

    it('далеко от краёв окно остаётся, где его держат', () => {
      const snapped = snapDmScreenWindow(
        { x: 1100, y: 600, ...size },
        [other],
        viewport,
      );

      expect(snapped).toEqual({ x: 1100, y: 600 });
    });
  });

  describe('растягивание', () => {
    const viewport = { width: 1600, height: 900 };
    const start = { x: 500, y: 200, width: 400, height: 300 };
    const other = { x: 1000, y: 200, width: 320, height: 450 };

    it('тянет левую сторону, правая остаётся на месте', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: -1, y: 0 },
        { x: -150, y: 40 },
        viewport,
      );

      expect(resized).toEqual({ x: 350, y: 200, width: 550, height: 300 });
    });

    it('примагничивает высоту к высоте соседнего окна', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 0, y: 1 },
        { x: 0, y: 143 },
        viewport,
        [other],
      );

      expect(resized.height).toBe(other.height);
    });

    it('примагничивает ширину к ширине соседнего окна', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 1, y: 0 },
        { x: -75, y: 0 },
        viewport,
        [other],
      );

      expect(resized.width).toBe(other.width);
    });

    it('не пускает верхнюю сторону под шапку ширмы', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 0, y: -1 },
        { x: 0, y: -500 },
        { ...viewport, top: 120 },
      );

      expect(resized.y).toBe(120);
      expect(resized.height).toBe(380);
    });

    it('не сжимает окно меньше минимального', () => {
      const resized = resizeDmScreenWindow(
        start,
        { x: 1, y: 1 },
        { x: -1000, y: -1000 },
        viewport,
      );

      expect(resized).toEqual({
        x: 500,
        y: 200,
        ...DM_SCREEN_WINDOW_MIN_SIZE,
      });
    });
  });

  describe('раскладки', () => {
    const viewport = { width: 1600, height: 900 };
    const [leftZone, rightZone] = DM_SCREEN_SNAP_HALVES.zones;

    it('половины делят холст с промежутком сетки между ними', () => {
      if (!leftZone || !rightZone) {
        throw new Error('В раскладке половин должно быть два места');
      }

      const left = getDmScreenZoneRect(leftZone, viewport);
      const right = getDmScreenZoneRect(rightZone, viewport);

      expect(left.x).toBe(DM_SCREEN_LEFT_INSET + DM_SCREEN_WINDOW_MARGIN);
      expect(left.y).toBe(DM_SCREEN_TOP_INSET);
      expect(right.x - (left.x + left.width)).toBe(DM_SCREEN_GRID_GAP);

      expect(right.x + right.width).toBe(
        viewport.width - DM_SCREEN_WINDOW_MARGIN,
      );

      expect(left.y + left.height).toBe(
        viewport.height - DM_SCREEN_WINDOW_MARGIN,
      );
    });

    it('у боковых краёв холста предлагает половину', () => {
      expect(
        getDmScreenEdgeTarget({ x: DM_SCREEN_LEFT_INSET + 5, y: 400 }, viewport)
          ?.zone,
      ).toBe(leftZone);

      expect(getDmScreenEdgeTarget({ x: 1595, y: 400 }, viewport)?.zone).toBe(
        rightZone,
      );

      expect(getDmScreenEdgeTarget({ x: 800, y: 400 }, viewport)).toBe(
        undefined,
      );
    });

    it('панель раскладок видна в полосе у выбранного края холста', () => {
      const nearTop = { x: 800, y: DM_SCREEN_TOP_INSET + 20 };
      const nearBottom = { x: 800, y: viewport.height - 20 };

      expect(isDmScreenPickerBand(nearTop, viewport, 'top')).toBe(true);
      expect(isDmScreenPickerBand(nearBottom, viewport, 'top')).toBe(false);
      expect(isDmScreenPickerBand(nearBottom, viewport, 'bottom')).toBe(true);
      expect(isDmScreenPickerBand(nearTop, viewport, 'bottom')).toBe(false);
    });

    it('полоса панели раскладок растёт вместе с панелью в два ряда', () => {
      const belowBand = { x: 800, y: DM_SCREEN_TOP_INSET + 140 };

      expect(isDmScreenPickerBand(belowBand, viewport, 'top')).toBe(false);
      expect(isDmScreenPickerBand(belowBand, viewport, 'top', 136)).toBe(true);
    });

    it('скрытая панель раскладок не появляется ни у одного края', () => {
      expect(
        isDmScreenPickerBand(
          { x: 800, y: DM_SCREEN_TOP_INSET + 20 },
          viewport,
          'hidden',
        ),
      ).toBe(false);

      expect(
        isDmScreenPickerBand(
          { x: 800, y: viewport.height - 20 },
          viewport,
          'hidden',
        ),
      ).toBe(false);
    });

    it('панель раскладок прижата к выбранному краю холста', () => {
      expect(getDmScreenPickerStyle(viewport, 'top')).toEqual({
        top: `${DM_SCREEN_TOP_INSET + DM_SCREEN_SNAP_PICKER_OFFSET}px`,
      });

      expect(getDmScreenPickerStyle(viewport, 'bottom')).toEqual({
        bottom: `${DM_SCREEN_SNAP_PICKER_OFFSET}px`,
      });
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
