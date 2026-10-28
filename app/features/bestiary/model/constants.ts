import type { SectionConfig } from '~section/model';

import type { AbilityKey } from './types';

import { EntryExportPlatform } from '~section/model';

/** Бестиарий грузится постранично, по опыту и затем по названию. */
export const BESTIARY_SECTION: SectionConfig = {
  key: 'bestiary',
  title: 'Бестиарий',
  path: '/bestiary',
  listUrl: '/api/v1/bestiary',
  filterUrl: '/api/v1/filters/bestiary',
  order: [
    { field: 'exp', direction: 'asc' },
    { field: 'name', direction: 'asc' },
  ],
  export: {
    type: 'bestiary',
    platforms: [EntryExportPlatform.FOUNDRY],
  },
};

export const CREATURE_TEXT = {
  ratingHint: 'Уровень опасности',
  armorClass: 'Класс доспеха',
  hits: 'Хиты',
  speed: 'Скорость',
  savingThrows: 'Спасброски',
  skills: 'Навыки',
  damageVulnerabilities: 'Уязвимость к урону',
  damageResistances: 'Сопротивление к урону',
  damageImmunities: 'Иммунитет к урону',
  conditionImmunities: 'Иммунитет к состояниям',
  senses: 'Чувства',
  languages: 'Языки',
  challengeRating: 'Уровень опасности',
  proficiencyBonus: 'Бонус мастерства',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные Действия',
  mystical: 'Мифические действия',
  lair: 'Логово',
  lairActions: 'Действия логова:',
  regionalEffects: 'Региональные эффекты:',
  environment: 'Места обитания',
  description: 'Описание',
  feet: 'фт.',
  passivePerception: 'пассивная Внимательность',
  experience: 'опыта',
  zeroExperience: '0 или 10 опыта',
  savingThrowRoll: 'Спасбросок',
  skillRoll: 'Проверка навыка',
  hitsRoll: 'Хиты',
  empty: '—',
} as const;

/** Вступление легендарных действий, когда в базе его нет. */
export const LEGENDARY_DEFAULT_INTRO = {
  start:
    'может совершить 3 легендарных действия, выбирая из представленных ниже вариантов. За один раз можно использовать только одно легендарное действие, и только в конце хода другого существа.',
  end: 'восстанавливает использованные легендарные действия в начале своего хода.',
} as const;

/** Характеристики в порядке таблицы: сокращение, название и подпись броска. */
export const CREATURE_ABILITIES: ReadonlyArray<{
  key: AbilityKey;
  label: string;
  name: string;
  rollLabel: string;
}> = [
  { key: 'str', label: 'СИЛ', name: 'Сила', rollLabel: 'Проверка Силы' },
  {
    key: 'dex',
    label: 'ЛОВ',
    name: 'Ловкость',
    rollLabel: 'Проверка Ловкости',
  },
  {
    key: 'con',
    label: 'ТЕЛ',
    name: 'Телосложение',
    rollLabel: 'Проверка Телосложения',
  },
  {
    key: 'int',
    label: 'ИНТ',
    name: 'Интеллект',
    rollLabel: 'Проверка Интеллекта',
  },
  {
    key: 'wiz',
    label: 'МДР',
    name: 'Мудрость',
    rollLabel: 'Проверка Мудрости',
  },
  {
    key: 'cha',
    label: 'ХАР',
    name: 'Харизма',
    rollLabel: 'Проверка Харизмы',
  },
];

/** Уровень опасности у существ без опыта, например у НИП. */
export const NO_CHALLENGE_RATING = '—';

/** Бросок к20 для спасбросков, навыков и проверок характеристик. */
export const D20_FORMULA = 'к20';

/** Бросок одного к20 с модификатором характеристики. */
export const ABILITY_D20_FORMULA = '1к20';

/** Знак минуса в модификаторах, как в книгах. */
export const MINUS_SIGN = '−';

/** Разделитель перечислений в строке существа. */
export const LIST_SEPARATOR = ', ';

/** Разделитель перечислений, когда в пунктах уже есть запятые. */
export const LIST_SEPARATOR_STRONG = '; ';
