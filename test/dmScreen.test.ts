import { describe, expect, it } from 'vitest';

import {
  appendDmScreenWindow,
  arrangeDmScreenWindows,
  DM_SCREEN_TOP_INSET,
  DM_SCREEN_WINDOW_MARGIN,
  dmScreenDetailSchema,
  dmScreenListSchema,
  formatDmScreenDate,
  getDmScreenEntryRoot,
  isDmScreenPath,
  resolveDmScreenSection,
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
});
