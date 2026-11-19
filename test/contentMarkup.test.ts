import { describe, expect, it } from 'vitest';

import {
  contentDescriptionSchema,
  getNodesText,
  markupToContent,
  markupToInlineContent,
  parseContent,
} from '~content/model';

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
