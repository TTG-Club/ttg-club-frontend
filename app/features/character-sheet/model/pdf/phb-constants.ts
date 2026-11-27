import { rgb } from 'pdf-lib';

import {
  PDF_CONTENT_BOTTOM,
  PDF_CONTENT_WIDTH,
  PDF_PAGE_MARGIN,
} from './constants';

/*
 * Лист «как в Книге игрока»: печатный лист персонажа PHB 2014 на русском —
 * три страницы (основная, персонаж, заклинания) векторными примитивами, без
 * подложек и логотипов.
 */

/** Цвета листа PHB. */
export const PHB_COLORS = {
  /** Текст и рамки. */
  ink: rgb(0.08, 0.08, 0.1),

  /** Подписи полей и заголовки панелей. */
  label: rgb(0.32, 0.32, 0.35),

  /** Сокращение характеристики у навыка. */
  muted: rgb(0.55, 0.55, 0.58),

  /** Линовка под запись. */
  line: rgb(0.62, 0.62, 0.65),

  /** Серая подложка групп панелей (полоса характеристик, рамки колонок). */
  group: rgb(0.86, 0.86, 0.88),

  /** Серые строки таблицы атак. */
  row: rgb(0.92, 0.92, 0.93),

  /** Заливка полей. */
  field: rgb(1, 1, 1),
};

/** Толщины линий листа PHB. */
export const PHB_LINE_WIDTHS = {
  frame: 0.9,
  thin: 0.5,
  ruling: 0.35,
};

/** Радиус скругления рамок. */
export const PHB_RADIUS = 5;

/** Внутренний отступ панелей. */
export const PHB_PADDING = 5;

/** Зазор между панелями. */
export const PHB_GAP = 6;

/** Зазор между колонками страницы. */
export const PHB_COLUMN_GAP = 8;

/** Кегли листа PHB. */
export const PHB_FONT_SIZES = {
  /** Заголовок панели прописными внизу панели. */
  title: 6.2,

  /** Подпись поля под линией. */
  label: 5.6,

  /** Значение поля шапки. */
  field: 9.5,

  /** Строка линовки и списков. */
  line: 7.4,

  /** Значение в строке спасброска и навыка. */
  rowValue: 7.6,

  /** Крупное значение (модификатор, КД, хиты). */
  big: 18,

  /** Среднее значение (бонус мастерства, монеты). */
  medium: 11,

  /** Мелкая приписка. */
  small: 5.8,
};

/** Наименьший кегль подписи, ужатой под ширину рамки. */
export const PHB_MIN_CAPTION_SIZE = 4.2;

/** Разрядка заголовков панелей — доля кегля. */
export const PHB_TITLE_SPACING_RATIO = 0.1;

/** Высота строки линовки. */
export const PHB_LINE_HEIGHT = 10;

/** Высота строки спасброска и навыка. */
export const PHB_ROW_HEIGHT = 10.4;

/** Доля высоты кегля, которую занимают цифры: по ней числа центрируются. */
export const PHB_DIGIT_HEIGHT_RATIO = 0.7;

/** Высота заголовка внизу панели. */
export const PHB_TITLE_HEIGHT = 10;

/** Верх и высота шапки страницы. */
export const PHB_HEADER = {
  top: PDF_PAGE_MARGIN,
  height: 58,
  /** Ширина ленты с именем. */
  bannerWidth: 196,
};

/** Верх колонок под шапкой. */
export const PHB_BODY_TOP = PHB_HEADER.top + PHB_HEADER.height + 8;

/** Низ колонок: ниже — колонтитул сайта. */
export const PHB_BODY_BOTTOM = PDF_CONTENT_BOTTOM - 4;

/** Ширины колонок основной страницы. */
export const PHB_MAIN_COLUMNS = {
  left: 182,
  center: 182,
  right: PDF_CONTENT_WIDTH - 182 * 2 - PHB_COLUMN_GAP * 2,
};

/** Полоса характеристик основной страницы. */
export const PHB_ABILITY_STRIP = {
  width: 62,
  blockWidth: 54,
  blockHeight: 64,
  blockGap: 5,
  /** Полуоси овала со значением характеристики. */
  ovalRadiusX: 15,
  ovalRadiusY: 7.5,
};

/** Плашка с кружком или квадратом слева (вдохновение, мастерство). */
export const PHB_PLATE = {
  height: 22,
  markRadius: 11,
};

/** Высоты блоков средней колонки основной страницы. */
export const PHB_COMBAT = {
  statHeight: 56,
  shieldWidth: 46,
  currentHitsHeight: 64,
  temporaryHitsHeight: 42,
  squareHeight: 62,
  attackRowHeight: 13,
  attacksHeight: 190,
  /** Сколько серых строк атак как минимум, как на печатном листе. */
  attackMinRows: 3,
};

/** Доли ширины столбцов таблицы атак. */
export const PHB_ATTACK_COLUMN_RATIOS = {
  name: 0.38,
  bonus: 0.26,
  damage: 0.36,
};

/** Столбик монет в панели снаряжения. */
export const PHB_COINS = {
  width: 36,
  height: 30,
  gap: 6,
};

/** Высоты панелей личности в правой колонке основной страницы. */
export const PHB_PERSONALITY_HEIGHTS = {
  traits: 72,
  ideals: 52,
  bonds: 52,
  flaws: 52,
};

/** Раскладка страницы персонажа. */
export const PHB_DETAILS = {
  leftWidth: 182,
  topHeight: 236,
  emblemWidth: 112,
  treasureHeight: 190,
};

/** Раскладка страницы заклинаний. */
export const PHB_SPELLS = {
  /** Строки под заклинания по кругам, как на печатном листе. */
  rows: [8, 12, 13, 13, 13, 9, 9, 9, 7, 7],
  /** Круги в колонках страницы. */
  columns: [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8, 9],
  ],
  headerHeight: 24,
  rowHeight: 16.5,
  blockGap: 6,
  /** Подписи над строками первого круга. */
  captionHeight: 8,
  /** Ширина шестиугольника с номером круга. */
  levelWidth: 24,
  /** Ширина поля «Итого ячеек». */
  totalWidth: 44,
  /** Ширина шестиугольника поля шапки. */
  hexWidth: 100,
};

/** Подписи листа PHB. */
export const PHB_LABELS = {
  characterName: 'Имя персонажа',
  classLevel: 'Класс и уровень',
  background: 'Предыстория',
  playerName: 'Имя игрока',
  race: 'Раса',
  alignment: 'Мировоззрение',
  experience: 'Опыт',
  inspiration: 'Вдохновение',
  proficiencyBonus: 'Бонус мастерства',
  savingThrows: 'Спасброски',
  skills: 'Навыки',
  passivePerception: 'Пассивная мудрость (Внимательность)',
  otherProficiencies: 'Прочие владения и языки',
  armorClass: 'КД',
  initiative: 'Инициатива',
  speed: 'Скорость',
  maxHits: 'Максимум хитов',
  currentHits: 'Текущие хиты',
  temporaryHits: 'Временные хиты',
  hitDiceTotal: 'Итого',
  hitDice: 'Кость хитов',
  deathSaves: 'Спасброски от смерти',
  successes: 'Успехи',
  failures: 'Провалы',
  attacks: 'Атаки и заклинания',
  attackName: 'Название',
  attackBonus: 'Бонус атаки',
  attackDamage: 'Урон / вид',
  equipment: 'Снаряжение',
  traits: 'Черты характера',
  ideals: 'Идеалы',
  bonds: 'Привязанности',
  flaws: 'Слабости',
  features: 'Умения и особенности',
  age: 'Возраст',
  height: 'Рост',
  weight: 'Вес',
  eyes: 'Глаза',
  skin: 'Кожа',
  hair: 'Волосы',
  appearance: 'Внешний вид персонажа',
  allies: 'Союзники и организации',
  emblem: 'Название / символ',
  backstory: 'Предыстория персонажа',
  extraFeatures: 'Дополнительные особенности и умения',
  treasure: 'Сокровища',
  spellcastingClass: 'Класс заклинателя',
  spellAbility: 'Базовая характеристика заклинаний',
  spellSaveDc: 'Сложность спасброска',
  spellAttack: 'Бонус броска атаки заклинанием',
  cantrips: 'Заговоры',
  slotsTotal: 'Итого ячеек',
  slotsUsed: 'Ячеек израсходовано',
  knownSpells: 'Известные заклинания',
  spellLevel: 'Уровень заклинания',
  spellName: 'Название заклинания',
  prepared: 'Подготовлено',
  /** Хвост списка, не влезшего в панель: перед ним — число. */
  more: (count: number): string => `… и ещё ${count} — в справочнике`,
};

/**
 * Начало заголовка заметки, которая печатается в «Союзниках и организациях»:
 * отдельного поля под союзников в листе 5e14 нет.
 */
export const PHB_ALLIES_NOTE_PREFIX = 'союзник';

/** Разделитель костей хитов разного размера: «2к10 + 5к6». */
export const PHB_DICE_SEPARATOR = ' + ';

/** Сигнатуры форматов портрета, которые pdf-lib встраивает без перекодирования. */
export const PHB_PORTRAIT_SIGNATURES = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpeg: [0xff, 0xd8, 0xff],
};
