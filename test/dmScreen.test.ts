import { describe, expect, it } from 'vitest';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  createDmScreenNotePath,
  DM_SCREEN_GRID_GAP,
  DM_SCREEN_ICON,
  DM_SCREEN_LEFT_INSET,
  DM_SCREEN_TOP_INSET,
  DM_SCREEN_WINDOW_MARGIN,
  DM_SCREEN_WINDOW_MIN_SIZE,
  dmScreenDetailSchema,
  dmScreenListSchema,
  formatDmScreenDate,
  getDmScreenEntryRoot,
  getDmScreenWindowIcon,
  isDmScreenNotePath,
  isDmScreenPath,
  resizeDmScreenWindow,
  resolveDmScreenSection,
  snapDmScreenResize,
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

  it('пишет дату изменения ширмы по-русски, битую — пусто', () => {
    expect(formatDmScreenDate('2026-11-12T14:05:00')).toContain('ноября');
    expect(formatDmScreenDate('не дата')).toBe('');
    expect(formatDmScreenDate(null)).toBe('');
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

  describe('растягивание за край', () => {
    const start = { x: 200, y: 150, width: 400, height: 300 };

    it('правый нижний угол тянет ширину и высоту, место не меняется', () => {
      expect(resizeDmScreenWindow(start, 'se', { x: 50, y: 30 })).toEqual({
        x: 200,
        y: 150,
        width: 450,
        height: 330,
      });
    });

    it('левый верхний угол двигает место, правый и нижний края стоят', () => {
      expect(resizeDmScreenWindow(start, 'nw', { x: -40, y: 20 })).toEqual({
        x: 160,
        y: 170,
        width: 440,
        height: 280,
      });
    });

    it('сторона тянет только свою ось', () => {
      expect(resizeDmScreenWindow(start, 'e', { x: 25, y: 99 })).toEqual({
        ...start,
        width: 425,
      });
    });

    it('меньше минимального не сжимает, край упирается', () => {
      const shrunk = resizeDmScreenWindow(start, 'w', { x: 1000, y: 0 });

      expect(shrunk.width).toBe(DM_SCREEN_WINDOW_MIN_SIZE.width);
      expect(shrunk.x + shrunk.width).toBe(start.x + start.width);
    });
  });

  describe('примагничивание при растягивании', () => {
    const viewport = { width: 1600, height: 900 };
    const other = { x: 700, y: 100, width: 400, height: 300 };

    it('правый край встаёт перед соседним окном через промежуток', () => {
      const snapped = snapDmScreenResize(
        { x: 200, y: 100, width: 485, height: 300 },
        'e',
        [other],
        viewport,
      );

      expect(snapped).toEqual({
        x: 200,
        y: 100,
        width: 700 - DM_SCREEN_GRID_GAP - 200,
        height: 300,
      });
    });

    it('верхний край прилипает под шапку, нижний стоит', () => {
      const snapped = snapDmScreenResize(
        { x: 200, y: DM_SCREEN_TOP_INSET + 7, width: 300, height: 400 },
        'n',
        [],
        viewport,
      );

      expect(snapped.y).toBe(DM_SCREEN_TOP_INSET);
      expect(snapped.y + snapped.height).toBe(DM_SCREEN_TOP_INSET + 7 + 400);
    });

    it('неподвижные края не трогает, далеко от краёв — без магнита', () => {
      const rect = { x: 300, y: 500, width: 300, height: 200 };

      expect(snapDmScreenResize(rect, 'se', [other], viewport)).toEqual(rect);
    });
  });
});
