import type { SectionConfig } from '~section/model';

import { SECTION_PAGE_SIZE_ALL } from '~section/model';

/** Подпись, когда у черты или особенности нет требований. */
export const CHARACTER_NO_REQUIREMENTS = 'Нет';

export const CHARACTER_LIST_SEPARATOR = ', ';

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
  description: 'Описание',
  showSubraces: 'Показать разновидности',
  hideSubraces: 'Скрыть разновидности',
} as const;

export const RACE_ICON = {
  expand: 'tabler:plus',
  collapse: 'tabler:minus',
} as const;

/** Короткие характеристики расы в карточке: подпись и подсказка. */
export const RACE_STATS = {
  type: { label: 'ТИП', hint: 'Тип существа' },
  abilities: { label: 'ХАР', hint: 'Увеличение характеристик' },
  size: { label: 'РАЗ', hint: 'Размер' },
  speed: { label: 'СКР', hint: 'Скорость' },
  darkvision: { label: 'ТЗ', hint: 'Тёмное зрение' },
} as const;

/** Раздел мастерской, где правятся расы. */
export const RACES_WORKSHOP_PATH = '/workshop/races';
