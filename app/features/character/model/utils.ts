import type {
  BackgroundDetail,
  RaceAbility,
  RaceDetail,
  RaceLink,
  RaceSpeed,
  SpellComponents,
  SpellDetail,
  SubraceLink,
} from './schema';
import type { RaceStat, SpellComponentLabel, SubraceGroup } from './types';

import { sortBy } from 'es-toolkit';

import { WORKSHOP_EDIT_SUFFIX } from '~section/model';

import {
  ABILITIES_COUNT,
  CHARACTER_LIST_SEPARATOR,
  CHARACTER_NO_REQUIREMENTS,
  FEAT_TEXT,
  RACE_STATS,
  RACE_TEXT,
  RACES_WORKSHOP_PATH,
  SPELL_COMPONENTS,
  SPELL_TEXT,
} from './constants';

/**
 * Подпись требований черты или особенности для плашки источника.
 * @param requirements - требования из API
 */
export function getRequirementsLabel(requirements?: string | null): string {
  return `${FEAT_TEXT.requirements} ${requirements || CHARACTER_NO_REQUIREMENTS}`;
}

/**
 * Языки предыстории: списком, а у старых записей — одной строкой.
 * @param background - предыстория
 */
export function getBackgroundLanguages(background: BackgroundDetail): string {
  return background.languages?.length
    ? background.languages.join(CHARACTER_LIST_SEPARATOR)
    : (background.language ?? '');
}

/**
 * Есть ли у предыстории блок персонализации: текст или таблицы.
 * @param background - предыстория
 */
export function hasPersonalization(background: BackgroundDetail): boolean {
  return Boolean(
    background.personalization || background.personalizationTables?.length,
  );
}

/**
 * Группа заклинания в списке: «Заговоры» или «3 уровень».
 * @param spell - заклинание из списка
 * @param spell.level - круг заклинания, 0 — заговор
 */
export function getSpellGroup(spell: { level: number }): string {
  return spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantrips;
}

/**
 * Подпись заклинания в плашке источника:
 * «3 уровень, воплощение [огонь] (ритуал)».
 * @param spell - заклинание
 */
export function getSpellTypeLabel(spell: SpellDetail): string {
  const level = spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantripLower;

  const additional = spell.additionalType ? ` [${spell.additionalType}]` : '';
  const ritual = spell.ritual ? ` (${SPELL_TEXT.ritual})` : '';

  return `${level}, ${spell.school}${additional}${ritual}`;
}

/**
 * Компоненты заклинания для карточки: только те, что есть, а у
 * материального — его описание в скобках.
 * @param components - компоненты из API
 */
export function getSpellComponentLabels(
  components?: SpellComponents | null,
): SpellComponentLabel[] {
  return SPELL_COMPONENTS.flatMap((component) => {
    const value = components?.[component.key];

    if (!value) {
      return [];
    }

    const detail = typeof value === 'string' ? ` (${value})` : '';

    return [
      {
        key: component.key,
        label: `${component.name}${detail}`,
        hint: component.hint,
      },
    ];
  });
}

/**
 * Бонусы расы к характеристикам: «СИЛ +2, ТЕЛ +1» или выбор по названию.
 * В списке бонус ко всем шести пишется одной фразой.
 * @param abilities - бонусы из API
 * @param isShort - короткая подпись для карточки списка
 */
export function getRaceAbilitiesLabel(
  abilities?: Array<RaceAbility> | null,
  isShort = false,
): string {
  if (!abilities?.length) {
    return '';
  }

  if (isShort && abilities.length === ABILITIES_COUNT) {
    return RACE_TEXT.everyAbility;
  }

  return abilities
    .map(({ name, shortName, value }) => {
      if (!value) {
        return name;
      }

      return `${shortName ?? name} ${value > 0 ? `+${value}` : value}`;
    })
    .join(CHARACTER_LIST_SEPARATOR);
}

/**
 * Скорости расы: «30 фт., летая 50 фт.».
 * @param speed - скорости из API
 */
export function getRaceSpeedLabel(speed?: Array<RaceSpeed> | null): string {
  return (speed ?? [])
    .map(({ name, value }) =>
      [name, value, RACE_TEXT.feet].filter(Boolean).join(' '),
    )
    .join(CHARACTER_LIST_SEPARATOR);
}

/**
 * Короткие характеристики расы для карточки; тёмное зрение — если есть.
 * @param race - раса
 */
export function getRaceStats(race: RaceDetail): Array<RaceStat> {
  const stats: Array<RaceStat> = [
    { key: 'type', ...RACE_STATS.type, value: race.type ?? '' },
    {
      key: 'abilities',
      ...RACE_STATS.abilities,
      value: getRaceAbilitiesLabel(race.abilities),
    },
    { key: 'size', ...RACE_STATS.size, value: race.size ?? '' },
    { key: 'speed', ...RACE_STATS.speed, value: getRaceSpeedLabel(race.speed) },
  ];

  if (race.darkvision) {
    stats.push({
      key: 'darkvision',
      ...RACE_STATS.darkvision,
      value: `${race.darkvision} ${RACE_TEXT.feet}`,
    });
  }

  return stats;
}

/**
 * Порядок рас как в старом SPA: сначала основные по алфавиту, затем
 * группы (происхождения, UA, хомбрю…) по их порядку.
 * @param races - расы из списка
 */
export function sortRaces(races: Array<RaceLink>): Array<RaceLink> {
  return sortBy(races, [
    (race) => (race.group ? race.group.order + 1 : 0),
    (race) => race.name.rus,
  ]);
}

/**
 * Группа расы в списке; у основных рас подписи нет.
 * @param race - раса
 */
export function getRaceGroup(race: RaceLink): string {
  return race.group?.name ?? '';
}

/**
 * Разновидности расы, разбитые по типу книги в его порядке.
 * @param subraces - разновидности из списка
 */
export function groupSubraces(
  subraces?: Array<SubraceLink> | null,
): Array<SubraceGroup> {
  const groups = new Map<string, SubraceGroup & { order: number }>();

  for (const subrace of subraces ?? []) {
    const group = groups.get(subrace.type.name) ?? {
      name: subrace.type.name,
      order: subrace.type.order,
      items: [],
    };

    group.items.push(subrace);
    groups.set(subrace.type.name, group);
  }

  return sortBy([...groups.values()], [(group) => group.order]).map(
    ({ name, items }) => ({ name, items }),
  );
}

/**
 * Особенности расы в порядке старого SPA: сначала свёрнутые, особенности
 * разновидности — после особенностей самой расы.
 * @param race - раса
 */
export function sortRaceSkills(race: RaceDetail): RaceDetail['skills'] {
  return sortBy(race.skills ?? [], [
    (skill) => Boolean(skill.opened),
    (skill) => !skill.subrace,
  ]);
}

/**
 * Страница правки расы или разновидности в мастерской:
 * `/races/elf/high` правится на `/workshop/races/high/edit`.
 * @param path - адрес расы на сайте
 */
export function getRaceEditPath(path: string): string {
  const slug = path.split('/').at(-1) ?? '';

  return `${RACES_WORKSHOP_PATH}/${slug}${WORKSHOP_EDIT_SUFFIX}`;
}
