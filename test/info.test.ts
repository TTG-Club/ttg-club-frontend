import { describe, expect, it } from 'vitest';

import { getInfoSlug, infoPageSchema } from '~info/model';

describe('информационные страницы', () => {
  it('берёт адрес из параметра маршрута', () => {
    expect(getInfoSlug('about')).toBe('about');
    expect(getInfoSlug(['about', 'x'])).toBe('about');
    expect(getInfoSlug(undefined)).toBe('');
  });

  it('принимает страницу без подзаголовка', () => {
    expect(
      infoPageSchema.parse({ title: 'О проекте', description: '<p>Текст</p>' }),
    ).toEqual({ title: 'О проекте', description: '<p>Текст</p>' });
  });
});
