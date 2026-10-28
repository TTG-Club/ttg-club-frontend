import type { SectionConfig } from '~section/model';

import { EntryExportPlatform, SECTION_PAGE_SIZE_ALL } from '~section/model';

/** Подпись, когда у черты или особенности нет требований. */
export const CHARACTER_NO_REQUIREMENTS = 'Нет';

export const CHARACTER_LIST_SEPARATOR = ', ';

/** Кнопка карточки расы или класса: её разновидности или архетипы. */
export const LINK_CARD_ICON = {
  links: 'tabler:subtask',
} as const;

/* --- Черты -------------------------------------------------------------- */

/** Черт немного, поэтому список грузится целиком, как в старом SPA */
export const FEATS_SECTION: SectionConfig = {
  key: 'feats',
  title: 'Черты',
  path: '/feats',
  listUrl: '/api/v1/feats',
  filterUrl: '/api/v1/filters/feats',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const FEAT_TEXT = {
  requirements: 'Требования:',
} as const;

/* --- Предыстории -------------------------------------------------------- */

export const BACKGROUNDS_SECTION: SectionConfig = {
  key: 'backgrounds',
  title: 'Предыстории',
  path: '/backgrounds',
  listUrl: '/api/v1/backgrounds',
  filterUrl: '/api/v1/filters/backgrounds',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

export const BACKGROUND_TEXT = {
  skills: 'Владение навыками:',
  tools: 'Владение инструментами:',
  languages: 'Языки:',
  equipment: 'Снаряжение:',
  startGold: 'Начальный капитал:',
  goldUnit: 'зм.',
  description: 'Описание',
  skillFallback: 'Умение предыстории',
  personalization: 'Персонализация',
} as const;

/* --- Особенности классов ------------------------------------------------ */

export const OPTIONS_SECTION: SectionConfig = {
  key: 'options',
  title: 'Особенности классов',
  path: '/options',
  listUrl: '/api/v1/options',
  filterUrl: '/api/v1/filters/options',
  order: [{ field: 'name', direction: 'asc' }],
};

export const OPTION_TEXT = {
  classes: 'Классы:',
} as const;

/** Запятая после ссылки в списке классов, рас и предысторий. */
export const REFERENCE_SEPARATOR = ',';

/* --- Заклинания --------------------------------------------------------- */

export const SPELLS_SECTION: SectionConfig = {
  key: 'spells',
  title: 'Заклинания',
  path: '/spells',
  listUrl: '/api/v1/spells',
  filterUrl: '/api/v1/filters/spells',
  order: [
    { field: 'level', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
  export: {
    type: 'spell',
    platforms: [EntryExportPlatform.FOUNDRY, EntryExportPlatform.LSS],
  },
};

export const SPELL_TEXT = {
  cantrip: 'Заговор',
  cantrips: 'Заговоры',
  cantripLower: 'заговор',
  cantripMark: '◐',
  level: 'уровень',
  levelHint: 'уровень заклинания',
  ritual: 'ритуал',
  ritualShort: 'Р',
  ritualHint: 'Ритуал',
  concentrationShort: 'К',
  concentrationHint: 'Концентрация',
  time: 'Время накладывания',
  range: 'Дистанция',
  duration: 'Длительность',
  components: 'Компоненты',
  upper: 'На более высоких уровнях:',
  classes: 'Классы:',
  subclasses: 'Подклассы:',
  races: 'Расы и происхождения:',
  backgrounds: 'Предыстории:',
  feats: 'Черты:',
} as const;

/** Компоненты заклинания: буква в списке, название и подсказка. */
export const SPELL_COMPONENTS = [
  {
    key: 'v',
    short: 'В',
    name: 'Вербальный',
    hint:
      'Большинство заклинаний требуют произношения таинственных слов. Сами по '
      + 'себе слова не являются источником силы заклинания; просто комбинация '
      + 'звуков с особой тональностью вызывает резонанс в прядях магии, приводя '
      + 'их в движение. Таким образом, персонаж с кляпом во рту или в области '
      + 'заклинания тишина, не может активировать заклинания с вербальным '
      + 'компонентом.',
  },
  {
    key: 's',
    short: 'С',
    name: 'Соматический',
    hint:
      'Заклинание может требовать энергичной жестикуляции или замысловатой '
      + 'последовательности телодвижений. Если у заклинания есть соматический '
      + 'компонент, у заклинателя должна быть свободной хотя бы одна рука для '
      + 'исполнения этих жестов.',
  },
  {
    key: 'm',
    short: 'М',
    name: 'Материальный',
    hint:
      'У заклинателя должна быть одна свободная рука для доступа к '
      + 'материальным компонентам, но это может быть та же самая рука, что '
      + 'используется для выполнения соматического компонента. Персонаж может '
      + 'использовать мешочек с компонентами или заклинательную фокусировку '
      + 'вместо указанных компонентов. Однако, если для компонента указана '
      + 'цена, у персонажа для накладывания заклинания должен быть именно такой '
      + 'компонент.',
  },
] as const;

/** Точка вместо буквы компонента, которого у заклинания нет. */
export const SPELL_COMPONENT_EMPTY = '·';

/* --- Расы --------------------------------------------------------------- */

/** Рас немного, поэтому список грузится целиком, как в старом SPA */
export const RACES_SECTION: SectionConfig = {
  key: 'races',
  title: 'Расы и происхождения',
  path: '/races',
  listUrl: '/api/v1/races',
  filterUrl: '/api/v1/filters/races',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
};

/** Сколько всего характеристик: бонус ко всем пишется одной фразой. */
export const ABILITIES_COUNT = 6;

export const RACE_TEXT = {
  everyAbility: '+1 к каждой',
  feet: 'фт.',
  subraces: 'Разновидности',
  raceLabel: 'Раса:',
  subraceLabel: 'Разновидность:',
  chooseSubrace: 'Выбрать',
  searchSubrace: 'Поиск разновидности…',
} as const;

/** Подписи свойств расы в колонке слева, как у видов на new.ttg.club. */
export const RACE_STATS = {
  type: 'Тип',
  abilities: 'Характеристики',
  size: 'Размер',
  speed: 'Скорость',
  darkvision: 'Тёмное зрение',
} as const;

/** Раздел мастерской, где правятся расы. */
export const RACES_WORKSHOP_PATH = '/workshop/races';

/* --- Классы ------------------------------------------------------------- */

/** Классов немного, поэтому список грузится целиком, как в старом SPA */
export const CLASSES_SECTION: SectionConfig = {
  key: 'classes',
  title: 'Классы',
  path: '/classes',
  listUrl: '/api/v1/classes',
  filterUrl: '/api/v1/filters/classes',
  order: [{ field: 'name', direction: 'asc' }],
  pageSize: SECTION_PAGE_SIZE_ALL,
  wideDetail: true,
};

/** Типы вкладок страницы класса из API. */
export const CLASS_TAB_TYPE = {
  traits: 'traits',
  description: 'description',
  spells: 'spells',
  options: 'options',
} as const;

/** Группа фильтра заклинаний, которая выбирает класс. */
export const SPELL_CLASS_FILTER_KEY = 'class';

/** Группа фильтра особенностей, которая выбирает особенности класса. */
export const OPTION_CLASS_FILTER_KEY = 'classOption';

/** Значки классов из коллекции `ttg`: `class/wizard` → `ttg:class-wizard`. */
export const CLASS_ICON_PREFIX = 'class/';

export const CLASS_ICON_COLLECTION_PREFIX = 'ttg:class-';

/** Классы, у которых есть свой значок. */
export const CLASS_ICONS: ReadonlySet<string> = new Set([
  'artificer',
  'barbarian',
  'bard',
  'blood-hunter',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
]);

/**
 * Задержка подсказки умения в таблице уровней, мс: подсказка не всплывает,
 * пока курсор идёт по таблице.
 */
export const CLASS_TRAIT_HINT_OPEN_DELAY_MS = 700;

/** Префикс кости хитов в формуле броска. */
export const CLASS_HIT_DICE_PREFIX = '1к';

/** Столько навыков всего: выбор из всех пишется одной фразой. */
export const SKILLS_COUNT = 18;

/** Опциональные умения из «Котла Таши»: правило о них. */
export const OPTIONAL_FEATURES_PATH = '/rules/optional_class_features';

export const CLASS_TEXT = {
  archetypes: 'Архетипы',
  hitPoints: 'Хиты',
  hitDice: 'Кость Хитов:',
  perLevel: 'за каждый уровень',
  firstLevel: 'Хиты на 1 уровне:',
  firstLevelModifier: '+ ваш модификатор',
  nextLevels: 'Хиты на следующих уровнях:',
  or: 'или',
  nextLevelsModifier: '+ модификатор',
  constitution: 'Телосложения',
  nextLevelsSuffix: 'за каждый уровень этого класса, после первого (минимум 1)',
  level: 'Ур.',
  proficiencyBonus: 'БМ',
  features: 'Умения',
  spellSlots: 'Ячейки заклинаний на уровень заклинаний',
  proficiencies: 'Владение',
  armor: 'Доспехи:',
  weapon: 'Оружие:',
  tools: 'Инструменты:',
  savingThrows: 'Спасброски:',
  skills: 'Навыки:',
  anySkills: 'Выберите любые навыки.',
  chooseSkills: 'Выберите',
  chooseSkillsFrom: 'навыка из следующих:',
  equipment: 'Снаряжение',
  equipmentIntro:
    'Вы начинаете со следующим снаряжением в дополнение к снаряжению, '
    + 'полученному за вашу предысторию:',
  optional: '(опционально)',
  optionalHint:
    'Эта опция представлена в книге «Котёл Таши со всякой всячиной». '
    + 'Всё в этой книге опционально.',
  subclasses: 'Подклассы',
  spellLevel: 'Уровень заклинания',
  classLevel: 'Уровень',
  spells: 'Заклинания',
  archetypeLoadError: 'Не удалось загрузить архетип',
  classLabel: 'Класс:',
  subclassLabel: 'Подкласс:',
  chooseSubclass: 'Выбрать',
  searchSubclass: 'Поиск подкласса…',
  listLabel: 'Список:',
  spellsList: 'Заклинаний',
  aboutLabel: 'О классе:',
  description: 'Описание',
} as const;

export const CLASS_ICON = {
  spells: 'tabler:vocabulary',
  description: 'tabler:file-description',
  options: 'tabler:list-details',
} as const;

/** Уровень в таблице заклинаний архетипа — уровень заклинания. */
export const ARCHETYPE_SPELL_LEVEL_TYPE = 'SPELL_LEVEL';
