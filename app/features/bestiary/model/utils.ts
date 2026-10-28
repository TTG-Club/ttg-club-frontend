import type { CreatureDetail, CreatureHits, CreatureValue } from './schema';
import type {
  CreatureAbilityScore,
  CreatureAction,
  CreatureActionGroup,
  CreatureRoll,
} from './types';

import {
  ABILITY_D20_FORMULA,
  CREATURE_ABILITIES,
  CREATURE_TEXT,
  D20_FORMULA,
  LEGENDARY_DEFAULT_INTRO,
  LIST_SEPARATOR,
  LIST_SEPARATOR_STRONG,
  MINUS_SIGN,
  NO_CHALLENGE_RATING,
} from './constants';

/**
 * Группа существа в списке: его уровень опасности.
 * @param creature - существо из списка
 * @param creature.challengeRating - уровень опасности
 */
export function getChallengeRatingGroup(creature: {
  challengeRating: string;
}): string {
  return creature.challengeRating;
}

/**
 * Модификатор значения характеристики.
 * @param score - значение характеристики
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Модификатор со знаком, минус — типографский: «+2», «−1».
 * @param modifier - модификатор
 */
export function formatModifier(modifier: number): string {
  return `${modifier < 0 ? MINUS_SIGN : '+'}${Math.abs(modifier)}`;
}

/**
 * Характеристики существа для таблицы: «18 (+4)» и бросок «1к20+4».
 * @param creature - существо
 */
export function getAbilityScores(
  creature: Pick<CreatureDetail, 'ability'>,
): Array<CreatureAbilityScore> {
  return CREATURE_ABILITIES.map((ability) => {
    const score = creature.ability[ability.key];
    const modifier = formatModifier(getAbilityModifier(score));

    return {
      ...ability,
      formula: `${ABILITY_D20_FORMULA}${modifier}`,
      value: `${score} (${modifier})`,
    };
  });
}

/**
 * Значение бонуса строкой с дополнительным бонусом: «+5», «+3 (+1к4)».
 * @param item - спасбросок или навык
 */
function getBonusValue(item: CreatureValue): string {
  return `+${item.value ?? 0}${item.additional ?? ''}`;
}

/**
 * Спасброски существа: сокращение характеристики и бросок к20 с бонусом.
 * @param savingThrows - спасброски из API
 */
export function getSavingThrowRolls(
  savingThrows: ReadonlyArray<CreatureValue> | null | undefined,
): Array<CreatureRoll> {
  return (savingThrows ?? []).map((save, index) => ({
    key: `${save.shortName ?? save.name ?? index}`,
    label: save.shortName ?? save.name ?? '',
    rollLabel: `${CREATURE_TEXT.savingThrowRoll} ${save.name ?? ''}`.trim(),
    formula: `${D20_FORMULA}+${save.value ?? 0}`,
    value: getBonusValue(save),
  }));
}

/**
 * Навыки существа: название и бросок к20 с бонусом.
 * @param skills - навыки из API
 */
export function getSkillRolls(
  skills: ReadonlyArray<CreatureValue> | null | undefined,
): Array<CreatureRoll> {
  return (skills ?? []).map((skill, index) => ({
    key: `${skill.name ?? index}`,
    label: skill.name ?? '',
    rollLabel: `${CREATURE_TEXT.skillRoll} ${skill.name ?? ''}`.trim(),
    formula: skill.value ? `${D20_FORMULA}+${skill.value}` : D20_FORMULA,
    value: getBonusValue(skill),
  }));
}

/**
 * Перечисление через запятую; пункт с запятой внутри отделяется точкой
 * с запятой, как в книгах: «яд; дробящий, колющий и рубящий урон».
 * @param items - пункты перечисления
 */
export function joinCreatureList(items: ReadonlyArray<string>): string {
  return items
    .map((item, index) => {
      if (!index) {
        return item;
      }

      return `${item.includes(',') ? LIST_SEPARATOR_STRONG : LIST_SEPARATOR}${item}`;
    })
    .join('');
}

/**
 * Скорости через запятую: «30 фт., летая 60 фт. (парит)».
 * @param speed - скорости из API
 */
export function getSpeedLabel(
  speed: ReadonlyArray<CreatureValue> | null | undefined,
): string {
  return (speed ?? [])
    .map((item) => {
      const parts = [
        item.name,
        item.value || item.value === 0
          ? `${item.value} ${CREATURE_TEXT.feet}`
          : undefined,
        item.additional ? `(${item.additional})` : undefined,
      ];

      return parts.filter(Boolean).join(' ');
    })
    .join(LIST_SEPARATOR);
}

/**
 * Чувства и пассивная Внимательность через запятую.
 * @param creature - существо
 */
export function getSensesLabel(
  creature: Pick<CreatureDetail, 'senses'>,
): string {
  const senses = (creature.senses?.senses ?? []).map((sense) => {
    const label = `${sense.name ?? ''} ${sense.value ?? ''} ${CREATURE_TEXT.feet}`;

    return sense.additional ? `${label} (${sense.additional})` : label;
  });

  if (creature.senses?.passivePerception) {
    senses.push(
      `${CREATURE_TEXT.passivePerception} ${creature.senses.passivePerception}`,
    );
  }

  return senses.join(LIST_SEPARATOR);
}

/**
 * Языки существа или прочерк, если их нет.
 * @param creature - существо
 */
export function getLanguagesLabel(
  creature: Pick<CreatureDetail, 'languages' | 'language'>,
): string {
  const languages = [
    ...(creature.languages ?? []),
    ...(creature.language ? [creature.language] : []),
  ];

  return languages.join(LIST_SEPARATOR) || CREATURE_TEXT.empty;
}

/**
 * Уровень опасности с опытом: «5 (1 800 опыта)», «0 (0 или 10 опыта)».
 * @param creature - существо
 */
export function getChallengeRatingLabel(
  creature: Pick<CreatureDetail, 'challengeRating' | 'experience'>,
): string {
  if (creature.challengeRating === NO_CHALLENGE_RATING) {
    return creature.challengeRating;
  }

  if (!creature.experience) {
    return `${creature.challengeRating} (${CREATURE_TEXT.zeroExperience})`;
  }

  return `${creature.challengeRating} (${creature.experience.toLocaleString('ru-RU')} ${CREATURE_TEXT.experience})`;
}

/**
 * Формула хитов с бонусом: «4к8 + 8»; без кубиков — `undefined`.
 * @param hits - хиты из API
 */
export function getHitsFormula(hits: CreatureHits): string | undefined {
  if (!hits.formula) {
    return undefined;
  }

  return hits.bonus
    ? `${hits.formula}${hits.sign ?? ' + '}${Math.abs(hits.bonus)}`
    : hits.formula;
}

/**
 * Класс доспеха с пояснением: «15 (кожаный доспех, щит)» без ссылок.
 * @param creature - существо
 */
export function getArmorClassLabel(
  creature: Pick<CreatureDetail, 'armorClass' | 'armorText'>,
): string {
  return [creature.armorClass, creature.armorText]
    .filter((part) => part !== undefined && part !== null && part !== '')
    .join(' ');
}

/**
 * Подпись типа в плашке: «Средний гуманоид (человек), законно-добрый».
 * @param creature - существо
 */
export function getCreatureTypeLabel(
  creature: Pick<CreatureDetail, 'size' | 'type' | 'alignment'>,
): string {
  const tags = creature.type.tags?.length
    ? ` (${creature.type.tags.join(LIST_SEPARATOR)})`
    : '';

  const alignment = creature.alignment
    ? `${LIST_SEPARATOR}${creature.alignment}`
    : '';

  const size = [creature.size.eng, creature.size.cell]
    .filter(Boolean)
    .join(' ');

  return `${creature.size.rus} ${creature.type.name}${tags}${alignment} / ${size}`;
}

/**
 * Стандартное вступление легендарных действий с именем существа.
 * @param name - имя существа
 */
export function getLegendaryIntro(name: string): string {
  return `${name} ${LEGENDARY_DEFAULT_INTRO.start} ${name} ${LEGENDARY_DEFAULT_INTRO.end}`;
}

/**
 * Умения или действия существа: название и HTML описания.
 * @param items - умения или действия из API
 */
export function getCreatureActions(
  items: ReadonlyArray<CreatureValue> | null | undefined,
): Array<CreatureAction> {
  return (items ?? []).map((item, index) => ({
    key: `${index}-${item.name ?? ''}`,
    name: item.name ?? '',
    html: `${item.value ?? ''}`,
  }));
}

/**
 * Блоки действий существа по порядку: действия, бонусные, реакции,
 * легендарные и мифические, затем логово. Пустые блоки не выводятся.
 * @param creature - существо
 */
export function getCreatureActionGroups(
  creature: CreatureDetail,
): Array<CreatureActionGroup> {
  const groups: Array<CreatureActionGroup> = [
    {
      key: 'actions',
      title: CREATURE_TEXT.actions,
      items: getCreatureActions(creature.actions),
    },
    {
      key: 'bonusActions',
      title: CREATURE_TEXT.bonusActions,
      items: getCreatureActions(creature.bonusActions),
    },
    {
      key: 'reactions',
      title: CREATURE_TEXT.reactions,
      intro: creature.reaction ?? undefined,
      items: getCreatureActions(creature.reactions),
    },
    {
      key: 'legendary',
      title: CREATURE_TEXT.legendary,
      intro: creature.legendary?.description ?? undefined,
      text: creature.legendary?.description
        ? undefined
        : getLegendaryIntro(creature.name.rus),
      items: getCreatureActions(creature.legendary?.list),
    },
    {
      key: 'mystical',
      title: CREATURE_TEXT.mystical,
      items: getCreatureActions(creature.mysticalActions),
    },
  ];

  const lair: Array<CreatureActionGroup> = [
    {
      key: 'lair',
      title: CREATURE_TEXT.lair,
      intro: creature.lair?.description ?? undefined,
      items: [],
    },
    {
      key: 'lairActions',
      title: CREATURE_TEXT.lairActions,
      intro: creature.lair?.action ?? undefined,
      items: [],
    },
    {
      key: 'regionalEffects',
      title: CREATURE_TEXT.regionalEffects,
      intro: creature.lair?.effect ?? undefined,
      items: [],
    },
  ];

  return [
    ...groups.filter((group) => group.items.length),
    ...lair.filter((group) => group.intro),
  ];
}
