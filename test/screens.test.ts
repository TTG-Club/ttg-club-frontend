import type { ScreenLink } from '~wiki/model';

import { describe, expect, it } from 'vitest';

import { groupScreens, parseSvgIcon } from '~wiki/model';

/**
 * Раздел ширмы для теста.
 * @param rus - название
 * @param order - порядок
 * @param group - группа
 */
function screen(rus: string, order: number, group?: string): ScreenLink {
  return { name: { rus, eng: rus }, url: `/screens/${rus}`, order, group };
}

describe('ширма', () => {
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
