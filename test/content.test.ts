import { describe, expect, it } from 'vitest';

import {
  findRollTableRow,
  isKnownRoute,
  parseContent,
  toRenderItem,
} from '~content/model';

describe('parseContent', () => {
  it('разбирает самозакрывающийся бросок и не съедает текст после него', () => {
    const nodes = parseContent(
      '<p>Урон <dice-roller formula="2к6"/> рубящий</p>',
    );

    expect(nodes).toEqual([
      {
        kind: 'element',
        tag: 'p',
        attributes: {},
        children: [
          { kind: 'text', text: 'Урон ' },
          {
            kind: 'element',
            tag: 'dice-roller',
            attributes: { formula: '2к6' },
            children: [],
          },
          { kind: 'text', text: ' рубящий' },
        ],
      },
    ]);
  });

  it('выбрасывает скрипты и обработчики, оставляет текст незнакомых тегов', () => {
    const nodes = parseContent(
      '<script>alert(1)</script><custom onclick="x()"><b onclick="y()">жирный</b></custom>',
    );

    expect(nodes).toEqual([
      {
        kind: 'element',
        tag: 'b',
        attributes: {},
        children: [{ kind: 'text', text: 'жирный' }],
      },
    ]);
  });

  it('отбрасывает опасные ссылки', () => {
    const [link] = parseContent('<a href="javascript:alert(1)">ссылка</a>');

    expect(link).toMatchObject({ tag: 'a', attributes: {} });
  });

  it('берёт из привязки Vue только строковый литерал', () => {
    const [roller] = parseContent(
      `<dice-roller :formula="'к20 + 5'" :label="evil()" is-advantage/>`,
    );

    expect(roller).toMatchObject({
      attributes: { 'formula': 'к20 + 5', 'is-advantage': '' },
    });
  });

  it('превращает router-link в ссылку', () => {
    const [link] = parseContent(
      '<router-link to="/spells/shield">щит</router-link>',
    );

    expect(link).toMatchObject({
      tag: 'a',
      attributes: { href: '/spells/shield' },
    });
  });

  it('закрывает абзац перед блоком, как браузер, и собирает строки таблицы в tbody', () => {
    const [paragraph, list, , table] = parseContent(
      '<p><ul><li>a</li></ul></p><table>\n<tr><td>1</td></tr></table>',
    );

    expect(paragraph).toMatchObject({ tag: 'p', children: [] });
    expect(list).toMatchObject({ tag: 'ul' });

    expect(table).toMatchObject({
      tag: 'table',
      children: [{ tag: 'tbody', children: [{ tag: 'tr' }] }],
    });
  });
});

describe('toRenderItem', () => {
  it('собирает пропсы броска из атрибутов в обоих написаниях', () => {
    const [node] = parseContent(
      '<dice-roller formula="к20 + 3" label="Атака" isadvantage>+3</dice-roller>',
    );

    expect(node && toRenderItem(node)).toMatchObject({
      kind: 'dice',
      props: {
        formula: 'к20 + 3',
        label: 'Атака',
        isAdvantage: true,
        isDisadvantage: false,
        isSavingThrow: false,
      },
    });
  });

  it('берёт адрес подсказки из первой ссылки', () => {
    const [node] = parseContent(
      '<detail-tooltip type="spell"><a href="/spells/shield">щит</a></detail-tooltip>',
    );

    expect(node && toRenderItem(node)).toMatchObject({
      kind: 'tooltip',
      props: { type: 'spell', url: '/spells/shield' },
    });
  });

  it('не принимает незнакомый тип подсказки', () => {
    const [node] = parseContent(
      '<detail-tooltip type="evil" url="/x">x</detail-tooltip>',
    );

    expect(node && toRenderItem(node)).toMatchObject({
      kind: 'tooltip',
      props: { type: undefined, url: '/x' },
    });
  });
});

describe('findRollTableRow', () => {
  const rows = [
    ['1-4', 'a'],
    ['5', 'b'],
    ['6 - 10', 'c'],
  ];

  it('находит строку по диапазону и по числу', () => {
    expect(findRollTableRow(rows, 3)).toBe(0);
    expect(findRollTableRow(rows, 5)).toBe(1);
    expect(findRollTableRow(rows, 10)).toBe(2);
  });

  it('возвращает -1, если результат вне таблицы', () => {
    expect(findRollTableRow(rows, 11)).toBe(-1);
  });
});

describe('isKnownRoute', () => {
  const routes = ['/', '/spells/:slug', '/wiki/:path(.*)*'];

  it('узнаёт статические и динамические страницы', () => {
    expect(isKnownRoute('/', routes)).toBe(true);
    expect(isKnownRoute('/spells/shield?x=1#a', routes)).toBe(true);
    expect(isKnownRoute('/wiki/a/b', routes)).toBe(true);
  });

  it('не узнаёт разделы старого SPA', () => {
    expect(isKnownRoute('/classes', routes)).toBe(false);
    expect(isKnownRoute('/spells', routes)).toBe(false);
  });
});
