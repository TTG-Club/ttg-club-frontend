import { describe, expect, it, vi } from 'vitest';

import { importExternalSheet, parseSheetImport } from '~character-sheet/model';

/** Абзац TipTap. */
function paragraph(text: string) {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

/** Маркированный список TipTap. */
function bulletList(items: Array<string>) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [paragraph(item)],
    })),
  };
}

/** Документ персонажа LSS, как его кладёт выгрузка (строкой в `data`). */
const lssCharacter = {
  jsonType: 'character',
  name: { value: 'Торин' },
  info: {
    charClass: { value: 'Воин' },
    charSubclass: { value: 'Чемпион' },
    level: { value: 3 },
    background: { value: 'Солдат' },
    playerName: { value: 'Вася' },
    race: { value: 'Дварф (горный)' },
    alignment: { value: 'Законно-доброе' },
    experience: { value: 900 },
    size: { value: 'medium' },
  },
  subInfo: { age: { value: '50' }, eyes: { value: 'Серые' } },
  stats: {
    str: { score: 16 },
    dex: { score: 12 },
    con: { score: 15 },
    int: { score: 10 },
    wis: { score: 11 },
    cha: { score: 8 },
  },
  saves: { str: { isProf: true }, con: { isProf: true } },
  skills: { 'athletics': { isProf: 1 }, 'animal handling': { isProf: 2 } },
  vitality: {
    'hp-max': { value: 28 },
    'hp-current': { value: 20 },
    'hp-temp': { value: 3 },
    'hp-dice-current': { value: 1 },
    'hit-die': { value: 'd10' },
    'speed': { value: 25 },
    'darkvision': { value: 60 },
    'ac': { value: 16 },
    'shield': { value: true, mod: 2 },
  },
  weaponsList: [
    {
      name: { value: 'Боевой топор' },
      dmg: { value: '1к8+[str]' },
      dmgType: { value: 'рубящий' },
      isProf: true,
    },
  ],
  coins: { gp: { value: 15 }, sp: { value: 4 }, total: { value: 99 } },
  resources: {
    r1: {
      name: 'Второе дыхание',
      current: 0,
      max: 1,
      isShortRest: true,
      isLongRest: true,
    },
  },
  prof: {
    'armor-light': { value: true },
    'armor-label': { value: true },
    'weapon-martial': { value: true },
  },
  text: {
    'traits': {
      value: {
        data: { type: 'doc', content: [paragraph('Боевой стиль: защита')] },
      },
    },
    'personality': {
      value: { data: { type: 'doc', content: [paragraph('Упрям')] } },
    },
    'equipment': {
      value: {
        data: {
          type: 'doc',
          content: [
            bulletList([
              'Кольчуга',
              'Факел ×10',
              'Очень длинная строка описания, которая точно не название предмета и уходит в заметку',
            ]),
          ],
        },
      },
    },
    'notes-1': {
      value: { data: { type: 'doc', content: [paragraph('Долг гильдии')] } },
    },
  },
  spells: {},
  spellsPact: {},
  inspiration: true,
  bonuses: [],
  attunementsList: [],
};

const lssFile = {
  tags: [],
  data: JSON.stringify(lssCharacter),
  jsonType: 'character',
};

const source = { shortName: 'PHB', name: 'Книга игрока' };

/** Справочник отвечает классами, расами и предысториями по ручке списка. */
/**
 * Ответ справочника на запрос списка.
 * @param url - ручка списка
 */
function catalogList(url: string): unknown {
  if (url.includes('classes')) {
    return [
      {
        name: { rus: 'Воин', eng: 'Fighter' },
        url: '/classes/fighter',
        source,
        archetypes: [
          {
            name: { rus: 'Чемпион', eng: 'Champion' },
            url: '/classes/fighter/champion',
            source,
            type: { name: 'PHB', order: 0 },
          },
        ],
      },
    ];
  }

  if (url.includes('races')) {
    return [
      {
        name: { rus: 'Дварф', eng: 'Dwarf' },
        url: '/races/dwarf',
        source,
        type: { name: 'PHB', order: 0 },
        subraces: [
          {
            name: { rus: 'Горный дварф', eng: 'Mountain dwarf' },
            url: '/races/dwarf/mountain',
            source,
            type: { name: 'PHB', order: 0 },
          },
        ],
      },
    ];
  }

  return [
    {
      name: { rus: 'Солдат', eng: 'Soldier' },
      url: '/backgrounds/soldier',
      source,
    },
  ];
}

vi.stubGlobal(
  'useApi',
  () => (url: string) => Promise.resolve(catalogList(url)),
);

describe('импорт из Long Story Short', () => {
  it('переносит персонажа и привязывает справочник', async () => {
    const result = await importExternalSheet(lssFile, 'файл');

    expect(result).not.toBeNull();

    const { sheet, warnings } = result!;
    const { data } = sheet;

    expect(sheet.name).toBe('Торин');
    expect(warnings).toEqual([]);

    expect(data.classes[0]).toMatchObject({
      name: 'Воин',
      url: '/classes/fighter',
      archetypeUrl: '/classes/fighter/champion',
      level: 3,
      hitDie: 10,
    });

    expect(data.race).toEqual({
      name: 'Горный дварф',
      url: '/races/dwarf/mountain',
    });

    expect(data.background?.url).toBe('/backgrounds/soldier');
    expect(data.abilities.STRENGTH).toBe(16);
    expect(data.savingThrows).toEqual(['STRENGTH', 'CONSTITUTION']);

    expect(data.skills).toEqual({
      ATHLETICS: 'proficient',
      ANIMAL_HANDLING: 'expertise',
    });

    // КД из LSS уже с щитом и Ловкостью
    expect(data.armorClassOverride).toBe(18);
    expect(data.armorClassAbilities).toEqual([]);
    expect(data.health).toEqual({ max: 28, current: 20, temporary: 3 });
    expect(data.hitDiceUsed).toEqual({ 10: 2 });
    expect(data.size).toBe('MEDIUM');
    expect(data.alignment).toBe('Законно-доброе');
    expect(data.personality.age).toBe('50');
    expect(data.personality.traits).toEqual(['Упрям']);
    expect(data.proficiencies.armor).toEqual(['Лёгкие доспехи', 'Щиты']);
    expect(data.proficiencies.weapons).toEqual(['Воинское оружие']);
    expect(data.currency).toMatchObject({ gp: 15, sp: 4 });

    expect(data.resources[0]).toMatchObject({
      name: 'Второе дыхание',
      max: 1,
      used: 1,
      reset: 'LONG',
    });

    expect(data.features[0]?.description).toEqual(['Боевой стиль: защита']);
  });

  it('снаряжение: атаки — оружием, пункты списка — предметами, длинное — в заметку', async () => {
    const { data } = (await importExternalSheet(lssFile, 'файл'))!.sheet;

    expect(data.inventory.map((item) => [item.name, item.quantity])).toEqual([
      ['Боевой топор', 1],
      ['Кольчуга', 1],
      ['Факел', 10],
    ]);

    expect(data.inventory[0]?.weapon).toMatchObject({
      damage: '1к8',
      damageType: 'рубящий',
      proficiency: 'yes',
      isMartial: true,
    });

    const titles = data.notes.map((note) => note.title);

    expect(titles).toEqual(['Снаряжение', 'Заметки 1', 'О персонаже']);
    expect(data.notes[0]?.text.join(' ')).toContain('Очень длинная строка');
    expect(data.notes[2]?.text.join(' ')).toContain('Игрок: Вася');
  });

  it('предупреждает о заклинаниях, которые не переносятся', async () => {
    const file = {
      data: JSON.stringify({
        ...lssCharacter,
        spellsInfo: { base: { code: 'int' } },
        spells: { 'slots-1': { value: 2, filled: 1 } },
      }),
    };

    const result = await importExternalSheet(file, 'файл');

    expect(result?.sheet.data.spellSlotsUsed[0]).toBe(1);
    expect(result?.sheet.data.spellcastingAbility).toBe('INTELLIGENCE');
    expect(result?.warnings).toHaveLength(1);
  });

  it('свой экспорт и посторонний JSON форматом LSS не считаются', async () => {
    expect(
      await importExternalSheet(
        { name: 'Лист', data: { experience: 1 } },
        'файл',
      ),
    ).toBeNull();

    expect(await importExternalSheet({ foo: 1 }, 'файл')).toBeNull();

    expect(parseSheetImport('{"name":"Лист","data":{}}', 'файл').success).toBe(
      true,
    );
  });
});
