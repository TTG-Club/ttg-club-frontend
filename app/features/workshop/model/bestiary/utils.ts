import type { CreatureForm } from './schemas';
import type {
  CreatureBlock,
  CreatureBonus,
  CreatureLegendaryAction,
  WorkshopCreature,
} from './types';

import { splitList, toOptionalNumber, toOptionalText } from '../utils';
import {
  CREATURE_BLIND_BEYOND,
  CREATURE_DEFAULT,
  CREATURE_HIT_DICE,
  CREATURE_HOVER,
  CREATURE_SENSE_NAME,
  CREATURE_SPEED_NAME,
} from './constants';

/** Хиты существа, посчитанные по размеру, телосложению и числу костей. */
export interface CreatureHits {
  average: number;
  /** `4d8+8`; пустая строка без костей. */
  formula: string;
}

/** Скорость или чувство в запросе сохранения. */
interface CreatureNameValue {
  name?: string;
  value: number;
  additional?: string;
}

/** Новый спасбросок или навык. */
export function createCreatureBonus(): CreatureBonus {
  return { key: '', value: 0, additional: '' };
}

/** Новая особенность или действие: описание по умолчанию в markdown. */
export function createCreatureBlock(): CreatureBlock {
  return { name: '', englishName: '', description: '', markdown: true };
}

/** Новое легендарное действие. */
export function createCreatureLegendaryAction(): CreatureLegendaryAction {
  return { name: '', description: '' };
}

/**
 * Форма существа: значения старого SPA для создания или копия записи.
 * @param creature - существо из бестиария
 */
export function createCreatureForm(creature?: WorkshopCreature): CreatureForm {
  if (creature) {
    return structuredClone({ ...creature, id: undefined, source: undefined });
  }

  return {
    name: '',
    englishName: '',
    altName: '',
    size: CREATURE_DEFAULT.size,
    type: CREATURE_DEFAULT.type,
    alignment: CREATURE_DEFAULT.alignment,
    challengeRating: CREATURE_DEFAULT.challengeRating,
    armorClass: CREATURE_DEFAULT.armorClass,
    armorText: '',
    armors: [],
    diceCount: null,
    hitText: '',
    speed: CREATURE_DEFAULT.speed,
    fly: null,
    hover: false,
    swim: null,
    climb: null,
    dig: null,
    ability: {
      str: CREATURE_DEFAULT.ability,
      dex: CREATURE_DEFAULT.ability,
      con: CREATURE_DEFAULT.ability,
      int: CREATURE_DEFAULT.ability,
      wiz: CREATURE_DEFAULT.ability,
      cha: CREATURE_DEFAULT.ability,
    },
    savingThrows: [],
    skills: [],
    passivePerception: CREATURE_DEFAULT.passivePerception,
    darkvision: null,
    truesight: null,
    blindsight: null,
    blindBeyond: false,
    tremorsense: null,
    languages: '',
    language: '',
    tags: '',
    damageResistances: [],
    damageImmunities: [],
    damageVulnerabilities: [],
    conditionImmunities: [],
    environment: [],
    description: '',
    feats: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    reaction: '',
    mysticalActions: [],
    legendaryDescription: '',
    legendary: [],
    npc: false,
  };
}

/**
 * Средние хиты и формула: кость по размеру, бонус — модификатор
 * телосложения за каждую кость, как в старом SPA.
 * @param size - код размера
 * @param constitution - значение телосложения
 * @param diceCount - количество костей хитов
 */
export function getCreatureHits(
  size: string,
  constitution: number | null | undefined,
  diceCount: number | null | undefined,
): CreatureHits {
  const hitDice = CREATURE_HIT_DICE[size] ?? CREATURE_HIT_DICE.MEDIUM;
  const count = diceCount ?? 0;

  if (!hitDice || !count) {
    return { average: 0, formula: '' };
  }

  const modifier = Math.floor(((constitution ?? 0) - 10) / 2);
  const bonus = modifier * count;
  const average = Math.floor(count * hitDice.average + bonus);
  const base = `${count}${hitDice.dice}`;

  if (!bonus) {
    return { average, formula: base };
  }

  const sign = bonus > 0 ? '+' : '-';

  return { average, formula: `${base}${sign}${Math.abs(bonus)}` };
}

/**
 * Скорость или чувство для запроса, если поле заполнено.
 * @param name - подпись бэкенда
 * @param value - значение поля
 * @param additional - пометка: «парит»
 */
function toNameValue(
  name: string,
  value: number | null,
  additional?: string,
): Array<CreatureNameValue> {
  const number = toOptionalNumber(value);

  return number === undefined ? [] : [{ name, value: number, additional }];
}

/**
 * Спасброски и навыки для запроса.
 * @param items - строки формы
 */
function toBonuses(items: ReadonlyArray<CreatureBonus>): Array<unknown> {
  return items.map((item) => ({
    key: item.key,
    value: item.value,
    additional: toOptionalText(item.additional),
  }));
}

/**
 * Особенности и действия для запроса.
 * @param blocks - блоки формы
 */
function toDescriptions(blocks: ReadonlyArray<CreatureBlock>): Array<unknown> {
  return blocks.map((block) => ({
    name: { rus: block.name.trim(), eng: block.englishName.trim() },
    description: toOptionalText(block.description),
    markdown: block.markdown,
  }));
}

/**
 * Тело запроса сохранения существа.
 * @param form - проверенная форма
 * @param id - идентификатор существа при правке
 * @param source - аббревиатура книги-источника
 */
export function getCreaturePayload(
  form: CreatureForm,
  id: number | undefined,
  source: string | undefined,
): Record<string, unknown> {
  const hits = getCreatureHits(form.size, form.ability.con, form.diceCount);

  return {
    id,
    name: {
      rus: form.name.trim(),
      eng: form.englishName.trim(),
      alt: toOptionalText(form.altName),
    },
    size: form.size,
    type: form.type,
    alignment: form.alignment,
    armorClass: form.armorClass,
    armorText: toOptionalText(form.armorText),
    armors: form.armors,
    hits: {
      average: hits.average,
      diceCount: form.diceCount ?? undefined,
      text: toOptionalText(form.hitText),
    },
    speed: [
      { value: form.speed },
      ...toNameValue(
        CREATURE_SPEED_NAME.fly,
        form.fly,
        form.hover ? CREATURE_HOVER : undefined,
      ),
      ...toNameValue(CREATURE_SPEED_NAME.swim, form.swim),
      ...toNameValue(CREATURE_SPEED_NAME.climb, form.climb),
      ...toNameValue(CREATURE_SPEED_NAME.dig, form.dig),
    ],
    ability: form.ability,
    savingThrows: toBonuses(form.savingThrows),
    skills: toBonuses(form.skills),
    damageResistances: form.damageResistances,
    damageImmunities: form.damageImmunities,
    damageVulnerabilities: form.damageVulnerabilities,
    conditionImmunities: form.conditionImmunities,
    senses: {
      passivePerception: form.passivePerception.trim(),
      senses: [
        ...toNameValue(CREATURE_SENSE_NAME.darkvision, form.darkvision),
        ...toNameValue(CREATURE_SENSE_NAME.truesight, form.truesight),
        ...toNameValue(
          CREATURE_SENSE_NAME.blindsight,
          form.blindsight,
          form.blindBeyond ? CREATURE_BLIND_BEYOND : undefined,
        ),
        ...toNameValue(CREATURE_SENSE_NAME.tremorsense, form.tremorsense),
      ],
    },
    languages: splitList(form.languages),
    language: toOptionalText(form.language),
    challengeRating: form.challengeRating.trim(),
    feats: toDescriptions(form.feats),
    actions: toDescriptions(form.actions),
    bonusActions: toDescriptions(form.bonusActions),
    reactions: toDescriptions(form.reactions),
    reaction: toOptionalText(form.reaction),
    mysticalActions: toDescriptions(form.mysticalActions),
    legendary: {
      list: form.legendary.map((action) => ({
        name: action.name.trim(),
        value: action.description.trim(),
      })),
      count: CREATURE_DEFAULT.legendaryCount,
      description: toOptionalText(form.legendaryDescription),
    },
    description: toOptionalText(form.description),
    tags: splitList(form.tags),
    environment: form.environment,
    npc: form.npc,
    source: toOptionalText(source),
  };
}

/**
 * HTML-поля формы существа с именами для показа ошибок.
 * @param form - состояние формы
 */
export function getCreatureHtmlFields(
  form: Partial<CreatureForm>,
): Record<string, string> {
  const blockFields = (
    [
      'feats',
      'actions',
      'bonusActions',
      'reactions',
      'mysticalActions',
    ] as const
  ).flatMap((field) =>
    (form[field] ?? []).map((block, index): [string, string] => [
      `${field}.${index}.description`,
      block.description,
    ]),
  );

  return {
    description: form.description ?? '',
    reaction: form.reaction ?? '',
    legendaryDescription: form.legendaryDescription ?? '',
    ...Object.fromEntries(blockFields),
    ...Object.fromEntries(
      (form.legendary ?? []).map((action, index) => [
        `legendary.${index}.description`,
        action.description,
      ]),
    ),
  };
}
