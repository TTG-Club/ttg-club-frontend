import { describe, expect, it } from 'vitest';

import {
  getVisibleMenuSections,
  MENU_SECTIONS,
} from '~infrastructure/navigation/model';

const SHEET_HREF = '/tools/character-sheet';

/**
 * Адреса всех пунктов меню.
 * @param isEditor - посетитель — модератор или администратор
 */
function getHrefs(isEditor: boolean): Array<string> {
  return getVisibleMenuSections(MENU_SECTIONS, isEditor).flatMap((section) =>
    section.items.map((item) => item.href),
  );
}

describe('пункты меню только для редакторов', () => {
  it('лист персонажа скрыт от гостей и обычных пользователей', () => {
    expect(getHrefs(false)).not.toContain(SHEET_HREF);
  });

  it('модераторы и администраторы видят лист персонажа', () => {
    expect(getHrefs(true)).toContain(SHEET_HREF);
  });

  it('опустевший раздел скрывается', () => {
    const sections = getVisibleMenuSections(
      [
        {
          label: 'Закрытый',
          items: [
            { label: 'А', href: '/a', icon: 'tabler:point', editorOnly: true },
          ],
        },
      ],
      false,
    );

    expect(sections).toEqual([]);
  });
});
