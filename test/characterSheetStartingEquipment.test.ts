import { describe, expect, it } from 'vitest';

import {
  getChosenEquipment,
  parseBackgroundStartingEquipment,
  parseClassStartingEquipment,
} from '~character-sheet/model';

/** Снаряжение воина из справочника 5e14 как есть. */
const FIGHTER = [
  "{@list {@li а) {@link кольчуга [chain mail] | url:/armors/chain_mail} или б) {@link кожаный доспех [leather armor] | url:/armors/leather_armor}, {@link длинный лук [longbow] | url:/weapons/longbow} и 20 {@item стрел [arrows] | url:arrows}}{@li а) воинское оружие и {@link щит [shield] | url:/armors/shield} или б) два воинских оружия}{@li а) {@link лёгкий арбалет [crossbow light] | url:/weapons/crossbow,_light} и 20 {@item болтов [bolt] | url:crossbow_bolt} или б) два {@link ручных топора [handaxe] | url:/weapons/handaxe}}{@li а) {@item набор исследователя подземелий [dungeoneer's pack] | url:dungeoneer's_pack} или б) {@item набор путешественника [explorer's pack] | url:explorer's_pack}}}",
  'В качестве альтернативы базовому снаряжению класса и предыстории, вы можете получить {@roll 5к4 * 10 | text:5к4 × 10} зм. монет и приобрести себе снаряжение самостоятельно.',
];

/** Снаряжение прислужника. */
const ACOLYTE = [
  'Священный символ (подаренный вам в момент принятия священного сана)',
  'молитвенник или молитвенный барабан',
  '5 палочек благовоний',
  '{@item комплект обычной одежды | url:Common_Clothes}',
];

describe('стартовое снаряжение класса', () => {
  const lines = parseClassStartingEquipment(FIGHTER);

  it('строки списка становятся выбором, абзац про золото — нет', () => {
    expect(lines).toHaveLength(4);
    expect(lines.map((line) => line.options.length)).toEqual([2, 2, 2, 2]);
  });

  it('ссылки — записи справочника, число перед ссылкой — количество', () => {
    expect(lines[0]?.options[0]?.items).toEqual([
      {
        name: 'кольчуга',
        url: '/armors/chain_mail',
        kind: 'armor',
        quantity: 1,
      },
    ]);

    expect(lines[0]?.options[1]?.items).toEqual([
      {
        name: 'кожаный доспех',
        url: '/armors/leather_armor',
        kind: 'armor',
        quantity: 1,
      },
      {
        name: 'длинный лук',
        url: '/weapons/longbow',
        kind: 'weapon',
        quantity: 1,
      },
      { name: 'стрел', url: '/items/arrows', kind: 'item', quantity: 20 },
    ]);

    expect(lines[2]?.options[1]?.items).toEqual([
      {
        name: 'ручных топора',
        url: '/weapons/handaxe',
        kind: 'weapon',
        quantity: 2,
      },
    ]);
  });

  it('текст без ссылки — свой предмет', () => {
    expect(lines[1]?.options[0]?.items).toEqual([
      { name: 'воинское оружие', url: null, kind: 'item', quantity: 1 },
      { name: 'щит', url: '/armors/shield', kind: 'armor', quantity: 1 },
    ]);

    expect(lines[1]?.options[1]?.items).toEqual([
      { name: 'воинских оружия', url: null, kind: 'item', quantity: 2 },
    ]);
  });

  it('выбранные варианты собираются в список предметов', () => {
    const chosen = getChosenEquipment(lines, [1, 0, 1, 0]);

    expect(chosen.map((item) => item.name)).toEqual([
      'кожаный доспех',
      'длинный лук',
      'стрел',
      'воинское оружие',
      'щит',
      'ручных топора',
      'набор исследователя подземелий',
    ]);
  });
});

describe('стартовое снаряжение предыстории', () => {
  const lines = parseBackgroundStartingEquipment(ACOLYTE);

  it('строка — набор, «или» без меток — выбор', () => {
    expect(lines).toHaveLength(4);

    expect(lines[1]?.options.map((option) => option.items[0]?.name)).toEqual([
      'молитвенник',
      'молитвенный барабан',
    ]);
  });

  it('количество в начале своего предмета и ссылка на предмет', () => {
    expect(lines[2]?.options[0]?.items).toEqual([
      { name: 'палочек благовоний', url: null, kind: 'item', quantity: 5 },
    ]);

    expect(lines[3]?.options[0]?.items).toEqual([
      {
        name: 'комплект обычной одежды',
        url: '/items/Common_Clothes',
        kind: 'item',
        quantity: 1,
      },
    ]);
  });
});
