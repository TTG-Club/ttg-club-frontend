import type { SheetCurrency } from '../schema';
import type { AbilityKey, SkillKey } from '../types';

/** Название формата-источника: показывается в тосте после импорта. */
export const LSS_SOURCE_LABEL = 'Long Story Short';

/** Признак файла LSS: этим полем помечен документ персонажа. */
export const LSS_JSON_TYPE = 'character';

/** Характеристики листа по кодам LSS. */
export const LSS_ABILITY_KEYS: Readonly<Record<string, AbilityKey>> = {
  str: 'STRENGTH',
  dex: 'DEXTERITY',
  con: 'CONSTITUTION',
  int: 'INTELLIGENCE',
  wis: 'WISDOM',
  cha: 'CHARISMA',
};

/** Навыки листа по ключам LSS: там навыки записаны английскими названиями. */
export const LSS_SKILL_KEYS: Readonly<Record<string, SkillKey>> = {
  'acrobatics': 'ACROBATICS',
  'animal handling': 'ANIMAL_HANDLING',
  'arcana': 'ARCANA',
  'athletics': 'ATHLETICS',
  'deception': 'DECEPTION',
  'history': 'HISTORY',
  'insight': 'INSIGHT',
  'intimidation': 'INTIMIDATION',
  'investigation': 'INVESTIGATION',
  'medicine': 'MEDICINE',
  'nature': 'NATURE',
  'perception': 'PERCEPTION',
  'performance': 'PERFORMANCE',
  'persuasion': 'PERSUASION',
  'religion': 'RELIGION',
  'sleight of hand': 'SLEIGHT_OF_HAND',
  'stealth': 'STEALTH',
  'survival': 'SURVIVAL',
};

/** Уровень владения навыком в LSS: 2 — компетентность. */
export const LSS_SKILL_EXPERTISE_VALUE = 2;

/** Размеры листа по ключам LSS. */
export const LSS_SIZE_KEYS = {
  tiny: 'TINY',
  small: 'SMALL',
  medium: 'MEDIUM',
  large: 'LARGE',
  huge: 'HUGE',
  gargantuan: 'GARGANTUAN',
} as const;

/**
 * Группы владения доспехами по флагам LSS. `armor-label` — так LSS называет
 * щиты; более говорящие варианты того же флага держим рядом.
 */
export const LSS_ARMOR_PROFICIENCY_LABELS: Readonly<Record<string, string>> = {
  'armor-light': 'Лёгкие доспехи',
  'armor-medium': 'Средние доспехи',
  'armor-heavy': 'Тяжёлые доспехи',
  'armor-label': 'Щиты',
  'armor-shield': 'Щиты',
  'armor-shields': 'Щиты',
};

/** Группы владения оружием по флагам LSS; `weapon-other` — свободный текст. */
export const LSS_WEAPON_PROFICIENCY_LABELS: Readonly<Record<string, string>> = {
  'weapon-simple': 'Простое оружие',
  'weapon-martial': 'Воинское оружие',
};

/** Флаг владения воинским оружием: им помечается своё оружие из атак. */
export const LSS_MARTIAL_WEAPON_FLAG = 'weapon-martial';

/** Монеты листа по кодам LSS. */
export const LSS_COIN_KEYS: Readonly<Record<string, keyof SheetCurrency>> = {
  cp: 'cp',
  sp: 'sp',
  ep: 'ep',
  gp: 'gp',
  pp: 'pp',
};

/** Номинал кости хитов, если в файле он не указан. */
export const LSS_DEFAULT_HIT_DIE = 8;

/** Ключи текстовых блоков LSS, которые становятся особенностями листа. */
export const LSS_FEATURE_TEXT_KEYS: ReadonlyArray<string> = ['traits', 'feats'];

/** Блоки LSS, которые ложатся в поля личности листа. */
export const LSS_PERSONALITY_TEXT_KEYS = {
  personality: 'traits',
  ideals: 'ideals',
  bonds: 'bonds',
  flaws: 'flaws',
  background: 'backstory',
} as const;

/** Ключ текстового блока LSS с владениями и языками. */
export const LSS_TOOLS_TEXT_KEY = 'prof';

/** Ключи блоков LSS со снаряжением: пункты списков становятся предметами. */
export const LSS_EQUIPMENT_TEXT_KEYS: ReadonlyArray<string> = [
  'equipment',
  'items',
];

/** Путь раздела «Предметы»: по нему в текстах LSS находятся инструменты. */
export const LSS_ITEMS_LINK_PATH = '/items';

/** Адрес сайта в ссылках LSS: ссылки на него становятся внутренними. */
export const LSS_SITE_LINK_PATTERN =
  /^https?:\/\/(?:new\.|5e14\.)?ttg\.club(\/.*)$/i;

/** Заголовки текстовых блоков LSS на листе. */
export const LSS_TEXT_TITLES: Readonly<Record<string, string>> = {
  'allies': 'Союзники и организации',
  'background': 'Предыстория',
  'bonds': 'Привязанности',
  'equipment': 'Снаряжение',
  'feats': 'Черты',
  'flaws': 'Слабости',
  'ideals': 'Идеалы',
  'items': 'Ценности и прочее',
  'personality': 'Черты характера',
  'prof': 'Владения и языки',
  'quests': 'Задания',
  'quests-completed': 'Выполненные задания',
  'traits': 'Умения и особенности',
};

/** Шаблон ключа пронумерованных заметок LSS (`notes-1`). */
export const LSS_NOTES_KEY_PATTERN = /^notes-(\d+)$/;

/** Заголовок пронумерованной заметки LSS. */
export const LSS_NOTES_TITLE = 'Заметки';

/** Заголовок заметки с блоком, которому в шаблоне нет названия. */
export const LSS_UNKNOWN_TEXT_TITLE = 'Из листа LSS';

/** Заголовок заметки с подписями шапки, которым на листе нет полей. */
export const LSS_DETAILS_NOTE_TITLE = 'О персонаже';

/** Подписи шапки, которые ложатся в приметы личности листа. */
export const LSS_PERSONALITY_DETAIL_KEYS = [
  'age',
  'height',
  'weight',
  'eyes',
  'hair',
  'skin',
] as const;

/** Ключ мировоззрения в шапке LSS. */
export const LSS_ALIGNMENT_DETAIL_KEY = 'alignment';

/** Подписи полей шапки LSS в порядке строк заметки «О персонаже». */
export const LSS_DETAIL_LABELS: Readonly<Record<string, string>> = {
  playerName: 'Игрок',
  alignment: 'Мировоззрение',
  age: 'Возраст',
  height: 'Рост',
  weight: 'Вес',
  eyes: 'Глаза',
  hair: 'Волосы',
  skin: 'Кожа',
};

/** Предельная длина названия предмета: длиннее — это описание, а не предмет. */
export const LSS_ITEM_NAME_MAX_LENGTH = 60;

/** Разбор строк снаряжения и урона. */
export const LSS_PATTERNS = {
  /** Кость урона: «2к6», «1d8». */
  damageDice: /(\d*)\s*[кkdд]\s*(\d+)/i,
  /** Подстановки характеристик LSS: «[str]». */
  damageAbilityToken: /\[[^\]]*\]/g,
  /** Подстановка Ловкости — оружие фехтовальное. */
  dexterityDamage: /\[\s*dex\s*\]/i,
  /** Количество в конце строки: «Стрелы ×20». */
  itemQuantity: /[х×xX*]\s*(\d+)\s*$/,
  /** Уточнение в скобках в конце названия. */
  parenthetical: /\s*\(([^)]*)\)\s*$/,
} as const;

/** Что LSS хранит, а лист не переносит, — попадает в тост после импорта. */
export const LSS_IMPORT_WARNINGS = {
  spells:
    'Заклинания не перенесены: LSS хранит только свои внутренние идентификаторы — добавьте их из справочника.',
  bonuses:
    'Пользовательские бонусы LSS не перенесены: на листе их заменяют свои бонусы в настройках.',
  attunements: 'Настройка магических предметов не перенесена.',
} as const;

/** Подписи тоста импорта. */
export const LSS_IMPORT_TEXT = {
  success: (label: string): string => `Лист импортирован из ${label}`,
} as const;
