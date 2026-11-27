import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import { PDFDocument } from 'pdf-lib';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createEmptySheetDocument,
  sheetDocumentSchema,
} from '~character-sheet/model';
import {
  buildCharacterSheetPdf,
  getSheetPdfFileName,
} from '~character-sheet/model/pdf';

/** Папка `public`: шрифты листа отдаются оттуда. */
const PUBLIC_DIRECTORY = new URL('../public', import.meta.url);

/** Адрес заклинания, на который справочник «отвечает». */
const FIREBALL_URL = '/spells/fireball';

/** Адрес предмета, на который справочник «отвечает». */
const ROPE_URL = '/items/rope';

/** Начало любого PDF-файла. */
const PDF_SIGNATURE = '%PDF';

/**
 * Ответ справочника по адресу API: одно заклинание с HTML старой базы и
 * предмет с разметкой; остальные запросы падают, как упавшая сеть.
 * @param path - адрес запроса
 */
function answerCatalog(path: string): Promise<unknown> {
  if (path.endsWith(FIREBALL_URL)) {
    return Promise.resolve({
      name: { rus: 'Огненный шар', eng: 'Fireball' },
      level: 3,
      school: 'Воплощение',
      time: '1 действие',
      range: '150 футов',
      duration: 'Мгновенная',
      components: { v: true, s: true, m: 'крошечный шарик из гуано' },
      description:
        '<p>Яркая вспышка <b>взрывается</b> пламенем.</p><ul><li>Огонь</li><li>Урон <i>8к6</i></li></ul><table><tr><th>Круг</th><th>Урон</th></tr><tr><td>4</td><td>9к6</td></tr></table>',
      upper: '<p>Урон увеличивается на 1к6 за каждый круг выше третьего.</p>',
    });
  }

  if (path.endsWith(ROPE_URL)) {
    return Promise.resolve({
      description: ['Верёвка {@b длиной} 50 футов.', '{@separator}'],
    });
  }

  return Promise.reject(new Error('Нет сети'));
}

/** Лист с классами, заклинаниями, снаряжением, особенностями и личностью. */
function createSampleDocument() {
  return sheetDocumentSchema.parse({
    ...createEmptySheetDocument(),
    race: { name: 'Высший эльф', url: '/races/elf' },
    background: { name: 'Мудрец', url: '/backgrounds/sage' },
    alignment: 'Хаотично-добрый',
    experience: 6500,
    inspiration: true,
    classes: [
      {
        id: 'c1',
        name: 'Волшебник',
        url: '/classes/wizard',
        level: 5,
        hitDie: 6,
        archetypeName: null,
        archetypeUrl: null,
        hitPointGains: [],
        spellcastingAbility: 'INTELLIGENCE',
      },
      {
        id: 'c2',
        name: 'Воин',
        url: null,
        level: 2,
        hitDie: 10,
        archetypeName: null,
        archetypeUrl: null,
        hitPointGains: [],
        spellcastingAbility: null,
      },
    ],
    abilities: {
      STRENGTH: 10,
      DEXTERITY: 14,
      CONSTITUTION: 13,
      INTELLIGENCE: 18,
      WISDOM: 12,
      CHARISMA: 8,
    },
    savingThrows: ['INTELLIGENCE', 'WISDOM'],
    skills: { ARCANA: 'expertise', HISTORY: 'proficient', STEALTH: 'half' },
    health: { max: 38, current: 30, temporary: 5 },
    deathSaves: { successes: 1, failures: 2 },
    darkvision: 60,
    speed: 30,
    proficiencies: {
      armor: ['Лёгкие доспехи'],
      weapons: ['Простое оружие', 'Длинный меч'],
      tools: [{ name: 'Набор каллиграфа', url: null }],
      languages: ['Общий', 'Эльфийский'],
    },
    currency: { cp: 12, sp: 30, ep: 0, gp: 150, pp: 2 },
    spellSlotsUsed: [2, 1],
    spells: [
      { id: 's1', name: 'Огненный шар', url: FIREBALL_URL, level: 3 },
      {
        id: 's2',
        name: 'Огонь Жени',
        url: null,
        level: 0,
        school: 'Воплощение',
        castingTime: '1 действие',
        range: '30 футов',
        description: 'Свой заговор.\n\nВторой абзац описания.',
        isPrepared: true,
      },
      {
        id: 's3',
        name: 'Обнаружение магии',
        url: '/spells/detect-magic',
        level: 1,
        isRitual: true,
        isConcentration: true,
      },
    ],
    inventory: [
      {
        id: 'i1',
        name: 'Длинный меч',
        url: '/weapons/longsword',
        quantity: 1,
        weight: 3,
        isEquipped: true,
        cost: '15 зм',
        weapon: {
          damage: '1к8',
          damageType: 'рубящий',
          versatileDamage: '1к10',
        },
      },
      { id: 'i2', name: 'Верёвка', url: ROPE_URL, quantity: 1, weight: 10 },
      {
        id: 'i3',
        name: 'Амулет предков',
        url: null,
        quantity: 1,
        requiresAttunement: true,
        isAttuned: true,
        description: 'Тёплый на ощупь.',
      },
    ],
    features: [
      {
        id: 'f1',
        name: 'Ученик тайн',
        source: 'Своё',
        origin: 'custom',
        choice: 'Школа воплощения',
        description: ['Вы знаете {@i секреты} магии.', '{@h Подзаголовок}'],
      },
    ],
    resources: [{ id: 'r1', name: 'Магическое восстановление', max: 1 }],
    personality: {
      traits: ['Всегда читаю.'],
      ideals: ['Знание.'],
      bonds: [],
      flaws: [],
      appearance: ['Высокий, в синей мантии.'],
      backstory: ['Вырос в библиотеке.\n\nУшёл странствовать.'],
      age: '120 лет',
      height: '180 см',
      weight: '',
      eyes: 'Серые',
      hair: '',
      skin: '',
    },
    notes: [{ id: 'n1', title: 'Задания', text: ['Найти {@b книгу}.'] }],
  });
}

/**
 * Число страниц собранного PDF.
 * @param bytes - байты документа
 */
async function getPageCount(bytes: Uint8Array): Promise<number> {
  const document = await PDFDocument.load(bytes);

  return document.getPageCount();
}

describe('экспорт листа в PDF', () => {
  beforeAll(() => {
    // Шрифты читаются с диска вместо сети, справочник частично «отвечает».
    vi.stubGlobal('fetch', (url: string) =>
      Promise.resolve(
        new Response(
          readFileSync(
            fileURLToPath(new URL(`.${url}`, `${PUBLIC_DIRECTORY}/`)),
          ),
        ),
      ),
    );

    vi.stubGlobal('useApi', () => answerCatalog);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('собирает лист с классами, заклинаниями и снаряжением', async () => {
    const bytes = await buildCharacterSheetPdf(
      { name: 'Элронд', document: createSampleDocument() },
      { shareUrl: 'https://5e14.ttg.club/tools/character-sheet/shared/abc' },
    );

    expect(bytes.length).toBeGreaterThan(0);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe(PDF_SIGNATURE);

    // Основная, личность, снаряжение, заклинания и справочник.
    const pages = await getPageCount(bytes);

    expect(pages).toBeGreaterThanOrEqual(5);
    expect(pages).toBeLessThanOrEqual(10);
  });

  it('пустой лист собирается без справочника и страниц личности', async () => {
    const bytes = await buildCharacterSheetPdf({
      name: 'Новый персонаж',
      document: createEmptySheetDocument(),
    });

    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe(PDF_SIGNATURE);

    // Основная страница и снаряжение с пустыми строками под запись от руки.
    expect(await getPageCount(bytes)).toBe(2);
  });

  it('лист как в Книге игрока: три страницы и справочник у заклинателя', async () => {
    const bytes = await buildCharacterSheetPdf(
      { name: 'Элронд', document: createSampleDocument() },
      {
        variant: 'phb',
        shareUrl: 'https://5e14.ttg.club/tools/character-sheet/shared/abc',
      },
    );

    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe(PDF_SIGNATURE);

    // Основная, персонаж, заклинания и одна страница справочника.
    expect(await getPageCount(bytes)).toBe(4);
  });

  it('лист как в Книге игрока без заклинаний: две страницы и справочник', async () => {
    const sample = createSampleDocument();

    const document = {
      ...sample,
      spellcastingAbility: null,
      spells: [],
      classes: sample.classes.map((sheetClass) => ({
        ...sheetClass,
        spellcastingAbility: null,
      })),
    };

    const bytes = await buildCharacterSheetPdf(
      { name: 'Торин', document },
      { variant: 'phb' },
    );

    expect(await getPageCount(bytes)).toBe(3);
  });

  it('имя файла без запрещённых символов', () => {
    expect(getSheetPdfFileName('Элронд: "Мудрый"')).toBe(
      'Элронд_ _Мудрый_.pdf',
    );

    expect(getSheetPdfFileName('  ')).toBe('Новый персонаж.pdf');
  });
});
