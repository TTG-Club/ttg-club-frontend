import type { ScreenLink } from '~wiki/model';

import { describe, expect, it } from 'vitest';

import {
  getScreenGroup,
  getScreenGroupOrder,
  groupScreens,
  parseSvgIcon,
  screenLinkSchema,
} from '~wiki/model';

/**
 * Раздел ширмы для теста.
 * @param rus - название
 * @param order - порядок
 * @param group - группа
 */
function screen(rus: string, order: number, group?: string): ScreenLink {
  return { name: { rus, eng: rus }, url: `/screens/${rus}`, order, group };
}

describe('справочник мастера', () => {
  it('группирует вложенные разделы: сначала без группы', () => {
    const groups = groupScreens([
      screen('Б', 1, 'Укрытие'),
      screen('А', 2),
      screen('В', 0, 'Бой'),
      screen('Г', 1),
      screen('Д', 0, 'Бой'),
    ]);

    expect(
      groups.map((group) => [
        group.name,
        group.items.map((item) => item.name.rus),
      ]),
    ).toEqual([
      [undefined, ['Г', 'А']],
      ['Бой', ['В', 'Д']],
      ['Укрытие', ['Б']],
    ]);
  });

  it('группирует список по корневому разделу в его порядке', () => {
    const child = screenLinkSchema.parse({
      name: { rus: 'Укрытие', eng: 'Cover' },
      url: '/screens/cover',
      parent: {
        name: { rus: 'Бой', eng: 'Combat' },
        url: '/screens/combat',
        order: 2,
      },
    });

    expect(getScreenGroup(child)).toBe('Бой');
    expect(getScreenGroupOrder(child)).toBe(2);
  });

  it('раздел без корневого (старый ответ API) — вне групп и в конце', () => {
    const screenWithoutParent = screen('А', 1);

    expect(getScreenGroup(screenWithoutParent)).toBe('');
    expect(getScreenGroupOrder(screenWithoutParent)).toBeGreaterThan(1000);

    expect(
      getScreenGroupOrder(
        screenLinkSchema.parse({
          ...screenWithoutParent,
          parent: { name: { rus: 'Бой', eng: 'Combat' }, url: '/screens/c' },
        }),
      ),
    ).toBeGreaterThan(1000);
  });

  it('очищает SVG-иконку', () => {
    const icon = parseSvgIcon(
      '<svg viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><path fill="#000" d="M0 0" onclick="x"/><a href="javascript:x"><path d="M1 1"/></a></svg>',
    );

    expect(icon).toEqual({
      tag: 'svg',
      attributes: {
        viewBox: '0 0 24 24',
        fill: 'currentColor',
        width: '100%',
        height: '100%',
      },
      children: [
        {
          tag: 'path',
          attributes: { fill: 'currentColor', d: 'M0 0' },
          children: [],
        },
      ],
    });
  });

  it('без корневого svg иконки нет', () => {
    expect(parseSvgIcon('<path d="M0 0"/>')).toBeUndefined();
    expect(parseSvgIcon('icon-name')).toBeUndefined();
  });
});
