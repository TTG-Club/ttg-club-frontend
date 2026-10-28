import type { SelectOption } from '../types';
import type {
  CreatureAbilityKey,
  CreatureBlock,
  CreatureBonus,
  WorkshopCreature,
} from './types';

import { z } from 'zod';

import {
  WORKSHOP_LIST_JOINER,
  WORKSHOP_SKILL_OPTIONS,
  WORKSHOP_VALIDATION,
} from '../constants';
import { RACE_SIZE_OPTIONS } from '../races';
import {
  workshopNameSchema,
  workshopOptionalNotNegative,
  workshopOptionalPositive,
  workshopRequiredText,
  workshopSourceSchema,
} from '../schemas';
import {
  CREATURE_ABILITIES,
  CREATURE_ABILITY_LIMIT,
  CREATURE_ALIGNMENT_OPTIONS,
  CREATURE_ALIGNMENT_SEPARATOR,
  CREATURE_ARMOR_OPTIONS,
  CREATURE_BLIND_BEYOND,
  CREATURE_BYTE_MAX,
  CREATURE_CONDITION_OPTIONS,
  CREATURE_DAMAGE_OPTIONS,
  CREATURE_DEFAULT,
  CREATURE_ENVIRONMENT_OPTIONS,
  CREATURE_HIT_FORMULA,
  CREATURE_HOVER,
  CREATURE_SENSE_NAME,
  CREATURE_SPEED_NAME,
  CREATURE_TYPE_OPTIONS,
} from './constants';

/** Целое значение: бонус, скорость, класс доспеха. */
const creatureInteger = z
  .number(WORKSHOP_VALIDATION.required)
  .int(WORKSHOP_VALIDATION.required);

const nameValueSchema = z.object({
  name: z.string().nullish(),
  shortName: z.string().nullish(),
  englishName: z.string().nullish(),
  value: z.union([z.number(), z.string()]).nullish(),
  additional: z.union([z.number(), z.string()]).nullish(),
  markdown: z.boolean().nullish(),
  sharedUsageCount: z.number().nullish(),
});

type NameValue = z.infer<typeof nameValueSchema>;

const nameValueList = z.array(nameValueSchema).nullish();

const textList = z.array(z.string()).nullish();

const workshopCreatureSchema = z.object({
  id: z.number(),
  name: workshopNameSchema.extend({ alt: z.string().nullish() }),
  size: z.object({ eng: z.string() }).nullish(),
  type: z.object({ name: z.string() }).nullish(),
  alignment: z.string().nullish(),
  armorClass: z.number().nullish(),
  armorText: z.string().nullish(),
  armors: z.array(z.object({ name: z.string() })).nullish(),
  hits: z
    .object({ formula: z.string().nullish(), text: z.string().nullish() })
    .nullish(),
  speed: nameValueList,
  ability: z.record(z.string(), z.number()).nullish(),
  savingThrows: nameValueList,
  skills: nameValueList,
  damageResistances: textList,
  damageImmunities: textList,
  damageVulnerabilities: textList,
  conditionImmunities: textList,
  senses: z
    .object({
      passivePerception: z.string().nullish(),
      senses: nameValueList,
    })
    .nullish(),
  languages: textList,
  language: z.string().nullish(),
  challengeRating: z.string().nullish(),
  feats: nameValueList,
  actions: nameValueList,
  reactions: nameValueList,
  reaction: z.string().nullish(),
  bonusActions: nameValueList,
  legendary: z
    .object({ list: nameValueList, description: z.string().nullish() })
    .nullish(),
  mysticalActions: nameValueList,
  description: z.string().nullish(),
  tags: z.array(z.object({ name: z.string() })).nullish(),
  environment: textList,
  source: workshopSourceSchema,
});

type CreatureDetail = z.infer<typeof workshopCreatureSchema>;

/**
 * Код по подписи карточки без учёта регистра.
 * @param label - подпись из карточки
 * @param options - варианты выбора
 * @param fallback - код, если подпись не нашлась
 */
function getValueByLabel(
  label: string | null | undefined,
  options: ReadonlyArray<SelectOption>,
  fallback: string,
): string {
  const search = label?.trim().toLowerCase();

  return (
    options.find((option) => option.label.toLowerCase() === search)?.value
    ?? fallback
  );
}

/**
 * Коды по подписям карточки: неизвестные подписи отбрасываются.
 * @param labels - подписи из карточки
 * @param options - варианты выбора
 */
function getValuesByLabels(
  labels: ReadonlyArray<string> | null | undefined,
  options: ReadonlyArray<SelectOption>,
): Array<string> {
  return (labels ?? []).flatMap((label) => {
    const option = options.find(
      (item) => item.label === label || item.value === label,
    );

    return option ? [option.value] : [];
  });
}

/**
 * Число из значения карточки: скорость и чувства приходят числами.
 * @param value - значение из карточки
 */
function toNumberOrNull(value: NameValue['value']): number | null {
  const number = Number(value);

  return value === null
    || value === undefined
    || value === ''
    || Number.isNaN(number)
    ? null
    : number;
}

/**
 * Текст дополнения из карточки.
 * @param value - дополнение спасброска, навыка или чувства
 */
function toText(value: NameValue['additional']): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Значение скорости или чувства по подписи; без подписи — ходьба.
 * @param items - скорости или чувства из карточки
 * @param name - подпись
 */
function findByName(
  items: ReadonlyArray<NameValue> | null | undefined,
  name: string | undefined,
): NameValue | undefined {
  return items?.find((item) => (item.name ?? undefined) === name);
}

/**
 * Размер из английского названия: `small or medium` → `SMALL_MEDIUM`.
 * @param size - размер из карточки
 */
function getSizeValue(size: CreatureDetail['size']): string {
  const value = size?.eng.toUpperCase().replace(' OR ', '_');

  return (
    RACE_SIZE_OPTIONS.find((option) => option.value === value)?.value
    ?? CREATURE_DEFAULT.size
  );
}

/**
 * Количество костей хитов из формулы карточки.
 * @param formula - `2к8 + 4`
 */
function getDiceCount(formula: string | null | undefined): number | null {
  const match = formula?.match(CREATURE_HIT_FORMULA);

  return match ? Number(match[1]) : null;
}

/**
 * Спасброски: карточка подписывает их полным или кратким названием.
 * @param items - спасброски из карточки
 */
function getSavingThrows(
  items: ReadonlyArray<NameValue> | null | undefined,
): Array<CreatureBonus> {
  return (items ?? []).flatMap((item) => {
    const ability = CREATURE_ABILITIES.find(
      ({ label, short }) => label === item.name || short === item.shortName,
    );

    return ability
      ? [
          {
            key: ability.value,
            value: Number(item.value) || 0,
            additional: toText(item.additional),
          },
        ]
      : [];
  });
}

/**
 * Навыки: карточка подписывает их по-русски.
 * @param items - навыки из карточки
 */
function getSkills(
  items: ReadonlyArray<NameValue> | null | undefined,
): Array<CreatureBonus> {
  return (items ?? []).flatMap((item) => {
    const skill = WORKSHOP_SKILL_OPTIONS.find(
      (option) => option.label === item.name,
    );

    return skill
      ? [
          {
            key: skill.value,
            value: Number(item.value) || 0,
            additional: toText(item.additional),
          },
        ]
      : [];
  });
}

/**
 * Особенности и действия для формы.
 * @param items - блоки из карточки
 */
function getBlocks(
  items: ReadonlyArray<NameValue> | null | undefined,
): Array<CreatureBlock> {
  return (items ?? []).map((item) => ({
    name: item.name ?? '',
    englishName: item.englishName ?? '',
    description: toText(item.value),
    markdown: item.markdown ?? true,
    sharedUsageCount: item.sharedUsageCount ?? undefined,
  }));
}

/**
 * Значение характеристики; пустое — 10, как в старом SPA.
 * @param ability - характеристики из карточки
 * @param key - поле характеристики
 */
function getAbility(
  ability: CreatureDetail['ability'],
  key: CreatureAbilityKey,
): number {
  return ability?.[key] || CREATURE_DEFAULT.ability;
}

/**
 * Существо из бестиария для редактора. Карточка отдаёт подписи, а
 * бэкенд ждёт коды, поэтому подписи переводятся обратно, как в старом SPA.
 * @param input - ответ сервера
 */
export function parseWorkshopCreature(input: unknown): WorkshopCreature {
  const creature = workshopCreatureSchema.parse(input);
  const senses = creature.senses?.senses;
  const fly = findByName(creature.speed, CREATURE_SPEED_NAME.fly);
  const blindsight = findByName(senses, CREATURE_SENSE_NAME.blindsight);

  return {
    id: creature.id,
    name: creature.name.rus,
    englishName: creature.name.eng,
    altName: creature.name.alt ?? '',
    size: getSizeValue(creature.size),
    type: getValueByLabel(
      creature.type?.name,
      CREATURE_TYPE_OPTIONS,
      CREATURE_DEFAULT.type,
    ),
    alignment: getValueByLabel(
      creature.alignment?.split(CREATURE_ALIGNMENT_SEPARATOR)[0],
      CREATURE_ALIGNMENT_OPTIONS,
      CREATURE_DEFAULT.alignment,
    ),
    challengeRating:
      creature.challengeRating ?? CREATURE_DEFAULT.challengeRating,
    armorClass: creature.armorClass ?? CREATURE_DEFAULT.armorClass,
    armorText: creature.armorText ?? '',
    armors: getValuesByLabels(
      creature.armors?.map((armor) => armor.name),
      CREATURE_ARMOR_OPTIONS,
    ),
    diceCount: getDiceCount(creature.hits?.formula),
    hitText: creature.hits?.text ?? '',
    speed:
      toNumberOrNull(findByName(creature.speed, undefined)?.value)
      ?? CREATURE_DEFAULT.speed,
    fly: toNumberOrNull(fly?.value),
    hover: fly?.additional === CREATURE_HOVER,
    swim: toNumberOrNull(
      findByName(creature.speed, CREATURE_SPEED_NAME.swim)?.value,
    ),
    climb: toNumberOrNull(
      findByName(creature.speed, CREATURE_SPEED_NAME.climb)?.value,
    ),
    dig: toNumberOrNull(
      findByName(creature.speed, CREATURE_SPEED_NAME.dig)?.value,
    ),
    ability: {
      str: getAbility(creature.ability, 'str'),
      dex: getAbility(creature.ability, 'dex'),
      con: getAbility(creature.ability, 'con'),
      int: getAbility(creature.ability, 'int'),
      wiz: getAbility(creature.ability, 'wiz'),
      cha: getAbility(creature.ability, 'cha'),
    },
    savingThrows: getSavingThrows(creature.savingThrows),
    skills: getSkills(creature.skills),
    passivePerception:
      creature.senses?.passivePerception ?? CREATURE_DEFAULT.passivePerception,
    darkvision: toNumberOrNull(
      findByName(senses, CREATURE_SENSE_NAME.darkvision)?.value,
    ),
    truesight: toNumberOrNull(
      findByName(senses, CREATURE_SENSE_NAME.truesight)?.value,
    ),
    blindsight: toNumberOrNull(blindsight?.value),
    blindBeyond: toText(blindsight?.additional) === CREATURE_BLIND_BEYOND,
    tremorsense: toNumberOrNull(
      findByName(senses, CREATURE_SENSE_NAME.tremorsense)?.value,
    ),
    languages: (creature.languages ?? []).join(WORKSHOP_LIST_JOINER),
    language: creature.language ?? '',
    tags: (creature.tags ?? [])
      .map((tag) => tag.name)
      .join(WORKSHOP_LIST_JOINER),
    damageResistances: getValuesByLabels(
      creature.damageResistances,
      CREATURE_DAMAGE_OPTIONS,
    ),
    damageImmunities: getValuesByLabels(
      creature.damageImmunities,
      CREATURE_DAMAGE_OPTIONS,
    ),
    damageVulnerabilities: getValuesByLabels(
      creature.damageVulnerabilities,
      CREATURE_DAMAGE_OPTIONS,
    ),
    conditionImmunities: getValuesByLabels(
      creature.conditionImmunities,
      CREATURE_CONDITION_OPTIONS,
    ),
    environment: getValuesByLabels(
      creature.environment,
      CREATURE_ENVIRONMENT_OPTIONS,
    ),
    description: creature.description ?? '',
    feats: getBlocks(creature.feats),
    actions: getBlocks(creature.actions),
    bonusActions: getBlocks(creature.bonusActions),
    reactions: getBlocks(creature.reactions),
    reaction: creature.reaction ?? '',
    mysticalActions: getBlocks(creature.mysticalActions),
    legendaryDescription: creature.legendary?.description ?? '',
    legendary: (creature.legendary?.list ?? []).map((item) => ({
      name: item.name ?? '',
      description: toText(item.value),
    })),
    npc: false,
    source: creature.source?.shortName,
  };
}

const creatureBonusSchema = z.object({
  key: workshopRequiredText,
  value: creatureInteger,
  additional: z.string(),
});

const creatureBlockSchema = z.object({
  name: workshopRequiredText,
  englishName: z.string(),
  description: z.string(),
  markdown: z.boolean(),
  sharedUsageCount: z.number().optional(),
});

const creatureAbilityValue = z
  .number(WORKSHOP_VALIDATION.abilityValue)
  .int(WORKSHOP_VALIDATION.abilityValue)
  .min(CREATURE_ABILITY_LIMIT.min, WORKSHOP_VALIDATION.abilityValue)
  .max(CREATURE_ABILITY_LIMIT.max, WORKSHOP_VALIDATION.abilityValue);

const creatureAbilitiesSchema = z.object({
  str: creatureAbilityValue,
  dex: creatureAbilityValue,
  con: creatureAbilityValue,
  int: creatureAbilityValue,
  wiz: creatureAbilityValue,
  cha: creatureAbilityValue,
});

/** Форма существа: поля запроса бестиария в виде, удобном для правки. */
export const creatureFormSchema = z.object({
  name: workshopRequiredText,
  englishName: workshopRequiredText,
  altName: z.string(),
  size: workshopRequiredText,
  type: workshopRequiredText,
  alignment: workshopRequiredText,
  challengeRating: workshopRequiredText,
  armorClass: creatureInteger
    .min(0, WORKSHOP_VALIDATION.notNegative)
    .max(CREATURE_BYTE_MAX, WORKSHOP_VALIDATION.byteValue),
  armorText: z.string(),
  armors: z.array(z.string()),
  diceCount: workshopOptionalPositive.refine(
    (value): boolean => value !== null,
    WORKSHOP_VALIDATION.required,
  ),
  hitText: z.string(),
  speed: creatureInteger.min(0, WORKSHOP_VALIDATION.notNegative),
  fly: workshopOptionalNotNegative,
  hover: z.boolean(),
  swim: workshopOptionalNotNegative,
  climb: workshopOptionalNotNegative,
  dig: workshopOptionalNotNegative,
  ability: creatureAbilitiesSchema,
  savingThrows: z.array(creatureBonusSchema),
  skills: z.array(creatureBonusSchema),
  passivePerception: z.string(),
  darkvision: workshopOptionalNotNegative,
  truesight: workshopOptionalNotNegative,
  blindsight: workshopOptionalNotNegative,
  blindBeyond: z.boolean(),
  tremorsense: workshopOptionalNotNegative,
  languages: z.string(),
  language: z.string(),
  tags: z.string(),
  damageResistances: z.array(z.string()),
  damageImmunities: z.array(z.string()),
  damageVulnerabilities: z.array(z.string()),
  conditionImmunities: z.array(z.string()),
  environment: z.array(z.string()),
  description: z.string(),
  feats: z.array(creatureBlockSchema),
  actions: z.array(creatureBlockSchema),
  bonusActions: z.array(creatureBlockSchema),
  reactions: z.array(creatureBlockSchema),
  reaction: z.string(),
  mysticalActions: z.array(creatureBlockSchema),
  legendaryDescription: z.string(),
  legendary: z.array(
    z.object({ name: workshopRequiredText, description: z.string() }),
  ),
  npc: z.boolean(),
});

export type CreatureForm = z.infer<typeof creatureFormSchema>;
