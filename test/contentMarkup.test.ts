import { describe, expect, it } from 'vitest';

import {
  contentDescriptionSchema,
  getNodesText,
  hasContentDescription,
  markupToContent,
  markupToInlineContent,
  parseContent,
  toMarkupLink,
} from '~content/model';
import { toMarkupSource, toStoredMarkup } from '~news/markup';

describe('markupToContent', () => {
  it('строит то же дерево, что HTML старой базы: абзацы, оформление, бросок', () => {
    expect(
      markupToContent([
        'Урон {@roll 8к6} и {@b жирный {@i курсив}}.',
        'Атака {@roll к20 + 4 | text:+4}{@br}конец',
      ]),
    ).toEqual(
      parseContent(
        '<p>Урон <dice-roller formula="8к6">8к6</dice-roller> и <strong>жирный <em>курсив</em></strong>.</p>'
          + '<p>Атака <dice-roller formula="к20 + 4">+4</dice-roller><br>конец</p>',
      ),
    );
  });

  it('бросок с подписью — как dice-roller с label', () => {
    expect(
      markupToContent([
        '{@roll к20 + 4 | text:+4 | label:Атака} к попаданию, {@roll 1к6 + 2 | label:Урон}',
      ]),
    ).toEqual(
      parseContent(
        '<p><dice-roller label="Атака" formula="к20 + 4">+4</dice-roller> к попаданию, '
          + '<dice-roller label="Урон" formula="1к6 + 2">1к6 + 2</dice-roller></p>',
      ),
    );
  });

  it('ссылки на разделы — с подсказкой сущности, как в HTML', () => {
    expect(
      markupToContent([
        'См. {@spell огненный шар | url:fireball}, {@link захват | url:/screens/grapple}, '
          + '{@class волшебник | url:wizard}, {@magicItem сумка | url:bag_of_holding}.',
      ]),
    ).toEqual(
      parseContent(
        '<p>См. <detail-tooltip type="spell"><a href="/spells/fireball">огненный шар</a></detail-tooltip>, '
          + '<detail-tooltip type="screen"><a href="/screens/grapple">захват</a></detail-tooltip>, '
          + '<a href="/classes/wizard">волшебник</a>, '
          + '<detail-tooltip type="magic-item"><a href="/items/magic/bag_of_holding">сумка</a></detail-tooltip>.</p>',
      ),
    );
  });

  it('якорь на той же странице — обычная ссылка, как в HTML', () => {
    expect(
      markupToContent(['См. {@link Вдохновение барда | url:#c1}.']),
    ).toEqual(parseContent('<p>См. <a href="#c1">Вдохновение барда</a>.</p>'));
  });

  it('внешняя ссылка открывается в новой вкладке', () => {
    expect(
      markupToContent([
        '{@link сайт | url:https://example.com | target:_blank}',
      ]),
    ).toEqual(
      parseContent(
        '<p><a href="https://example.com" target="_blank">сайт</a></p>',
      ),
    );
  });

  it('небезопасный адрес ссылки — текст, как в HTML', () => {
    expect(
      markupToContent([
        '{@link а | url:javascript:alert(1)} {@link б | url:data:text/html,x} '
          + '{@link в | url://evil.example} {@link г | url:/\\evil.example} '
          + '{@link д | url: JavaScript:alert(1) | target:_blank}',
      ]),
    ).toEqual(parseContent('<p>а б в г д</p>'));
  });

  it('пробелы между пунктами списка не дают пустых пунктов', () => {
    expect(
      markupToContent(['{@list {@li один} {@li два}\n{@list {@li а}} }']),
    ).toEqual(
      parseContent('<ul><li>один</li><li>два<ul><li>а</li></ul></li></ul>'),
    );
  });

  it('блоки: заголовок, выравнивание, список, цитата, разделитель, таблица', () => {
    expect(
      markupToContent([
        '{@h Заголовок | level:2}',
        '{@p по центру | align:center}',
        '{@list {@li один}{@li два}{@list {@li а} | type:ordered}}',
        '{@quote раз{@br}{@br}два}',
        '{@separator}',
        '{@table {@tr {@th к6}{@th Эффект}}{@tr {@td 1 | align:center}{@td ​}}}',
      ]),
    ).toEqual(
      parseContent(
        '<h4>Заголовок</h4>'
          + '<p style="text-align: center;">по центру</p>'
          + '<ul><li>один</li><li>два<ol><li>а</li></ol></li></ul>'
          + '<blockquote><p>раз</p><p>два</p></blockquote>'
          + '<hr>'
          + '<div class="table-responsive"><table class="dnd5_table"><thead><tr><th>к6</th><th>Эффект</th></tr></thead>'
          + '<tbody><tr><td style="text-align: center;">1</td><td></td></tr></tbody></table></div>',
      ),
    );
  });

  it('неизвестный маркер и незакрытая скобка не теряют текст', () => {
    expect(getNodesText(markupToContent(['{@unknown текст} и обычный']))).toBe(
      'текст и обычный',
    );

    expect(getNodesText(markupToContent(['до {@b незакрытый']))).toContain(
      'до ',
    );

    expect(markupToContent([])).toEqual([]);
  });
});

describe('markupToInlineContent', () => {
  it('разворачивает абзацы для вывода внутри строки', () => {
    expect(markupToInlineContent(['раз', 'два {@roll 1к6}'])).toEqual(
      parseContent('раз<br>два <dice-roller formula="1к6">1к6</dice-roller>'),
    );
  });
});

describe('contentDescriptionSchema', () => {
  it('принимает HTML-строку и массив блоков разметки', () => {
    expect(contentDescriptionSchema.safeParse('<p>текст</p>').success).toBe(
      true,
    );

    expect(
      contentDescriptionSchema.safeParse(['абзац', '{@h заголовок}']).success,
    ).toBe(true);

    expect(contentDescriptionSchema.safeParse([1]).success).toBe(false);
  });
});

describe('toMarkupLink', () => {
  it('адрес записи → маркер раздела, остальное — обычная ссылка', () => {
    expect(toMarkupLink('/spells/fireball')).toEqual({
      type: 'spell',
      url: 'fireball',
    });

    expect(toMarkupLink('/items/magic/bag_of_holding')).toEqual({
      type: 'magicItem',
      url: 'bag_of_holding',
    });

    expect(toMarkupLink('/items/rope')).toEqual({ type: 'item', url: 'rope' });

    expect(toMarkupLink('/rules/cover')).toEqual({
      type: 'link',
      url: '/rules/cover',
    });

    expect(toMarkupLink('/spells/')).toEqual({ type: 'link', url: '/spells/' });
  });
});

describe('исходник редактора разметки', () => {
  it('блоки ↔ исходник через пустую строку', () => {
    const blocks = ['Первый {@b блок}.', '{@table {@tr {@th А}}{@tr {@td 1}}}'];

    expect(toMarkupSource(blocks)).toBe(
      'Первый {@b блок}.\n\n{@table {@tr {@th А}}{@tr {@td 1}}}',
    );

    expect(toStoredMarkup(toMarkupSource(blocks))).toEqual(blocks);
  });

  it('снимает экранирование редактора, пустые абзацы и `---`', () => {
    expect(
      toStoredMarkup('a \\~ b &amp; c\n\n&nbsp;\n\n---\n\n\n\n  конец  '),
    ).toEqual(['a ~ b & c', '{@separator}', 'конец']);

    expect(toStoredMarkup('   ')).toEqual([]);
  });
});

describe('hasContentDescription', () => {
  it('пустая строка и пустой массив — описания нет', () => {
    expect(hasContentDescription(['{@b а}'])).toBe(true);
    expect(hasContentDescription('<p>а</p>')).toBe(true);
    expect(hasContentDescription([])).toBe(false);
    expect(hasContentDescription('  ')).toBe(false);
    expect(hasContentDescription(null)).toBe(false);
  });
});
