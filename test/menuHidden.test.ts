import { describe, expect, it } from 'vitest';

// Прямой путь, а не `#shared/consts`: в Linux vitest разрешает этот алиас в
// app/shared/consts (там свои константы), и тест получал пустой модуль.
import { MENU_FALLBACK, MENU_HIDDEN_URLS } from '../shared/consts/menu';
import { withoutHiddenMenuItems } from '../shared/utils/menu';

describe('withoutHiddenMenuItems', () => {
  it('убирает скрытые пункты на любой глубине, остальное не трогает', () => {
    const menu = withoutHiddenMenuItems([
      {
        name: 'Инструкции',
        order: 6,
        children: [
          { name: 'Discord Bot', url: '/info/discord_bot', order: 1 },
          { name: 'Экспортирование', url: '/info/exporting', order: 3 },
        ],
      },
      { name: 'Discord Bot', url: '/info/discord_bot', order: 9 },
    ]);

    expect(menu).toEqual([
      {
        name: 'Инструкции',
        order: 6,
        children: [
          { name: 'Экспортирование', url: '/info/exporting', order: 3 },
        ],
      },
    ]);
  });

  it('запасное меню уже без скрытых пунктов', () => {
    const urls = JSON.stringify(MENU_FALLBACK);

    for (const url of MENU_HIDDEN_URLS) {
      expect(urls).not.toContain(url);
    }
  });
});
