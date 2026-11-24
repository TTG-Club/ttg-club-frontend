import type {
  CatalogMechanics,
  MechanicsAbilityBonus,
  MechanicsChoice,
} from './mechanics';
import type { AbilityBonuses, SheetDocument, SheetSource } from './schema';
import type {
  AbilityKey,
  ChoiceContext,
  ChoiceKind,
  ChoiceListedOption,
  GrantedProficiencies,
  PendingChoice,
  SheetChoice,
  SheetChoiceOption,
  SkillKey,
} from './types';

import { uniq } from 'es-toolkit';

import {
  ABILITY_BONUS_CHOICE_PREFIX,
  ABILITY_IMPROVEMENT_LIMIT,
  ABILITY_KEYS,
  ABILITY_LABELS,
  ABILITY_SCORE,
  ABILITY_VARIANT_SEPARATOR,
  ARMOR_PROFICIENCY_LABELS,
  CHOICE_GRANT_EXPERTISE,
  CHOICE_HINTS,
  CHOICE_KIND_BY_API_TYPE,
  CHOICE_KIND_LABELS,
  DAMAGE_TYPE_CHOICE_KEYS,
  DAMAGE_TYPE_INFO,
  LANGUAGE_CHOICE_KEYS,
  SKILL_INFO,
  SKILL_KEYS,
} from './constants';
import {
  createEmptyGrantedProficiencies,
  getGrantedProficiencyLists,
  getLanguageLabel,
  getMechanicsProficiencies,
  mergeGrantedProficiencies,
  toArmorGroupNames,
} from './grants';
import {
  getCharacterLevel,
  getProficiencyBonus,
  isSkillProficient,
  toAbilityKey,
  toSkillKey,
} from './utils';

/*
 * Единая система выборов. Выбор приходит из механики записи справочника
 * (`mechanics.choices`) или из её повышения характеристик
 * (`mechanics.abilityBonuses`), приводится к виду листа, ответы игрока
 * хранятся в источнике по ключу выбора, а из ответов собираются выдачи
 * владений и прибавки к характеристикам.
 */

/** Вид выбора по типу бэкенда; незнакомый тип — null. */
const CHOICE_KIND_ENTRIES: ReadonlyArray<[string, ChoiceKind]> = Object.entries(
  CHOICE_KIND_BY_API_TYPE,
);

/** Виды источников, у которых повышения характеристик складываются. */
const SUMMED_ABILITY_BONUS_KINDS: ReadonlySet<SheetSource['kind']> = new Set([
  'race',
  'subrace',
  'raceFeature',
]);

/**
 * Вид выбора листа по типу выбора бэкенда.
 * @param type - тип выбора (ChoiceType)
 */
export function toChoiceKind(
  type: string | null | undefined,
): ChoiceKind | null {
  return CHOICE_KIND_ENTRIES.find(([apiType]) => apiType === type)?.[1] ?? null;
}

/**
 * Сколько значений выбирают на уровне: ступени количества важнее числа,
 * «равно бонусу мастерства» важнее ступеней.
 * @param choice - выбор из механики
 * @param level - уровень, на котором считается количество
 */
export function resolveChoiceCount(
  choice: MechanicsChoice,
  level: number,
): number {
  if (choice.countEqualsProficiencyBonus) {
    return getProficiencyBonus(level);
  }

  const step = (choice.scaling ?? [])
    .filter((scaling) => scaling.level <= level)
    .sort((left, right) => right.level - left.level)[0];

  return Math.max(1, step?.count ?? choice.count ?? 1);
}

/**
 * Подпись варианта по значению и виду выбора.
 * @param kind - вид выбора
 * @param value - значение варианта
 */
export function getChoiceValueLabel(kind: ChoiceKind, value: string): string {
  if (kind === 'skill' || kind === 'expertise') {
    const skill = toSkillKey(value);

    return skill ? SKILL_INFO[skill].names[0] : value;
  }

  if (
    kind === 'savingThrow'
    || kind === 'ability'
    || kind === 'spellcastingAbility'
  ) {
    const ability = toAbilityKey(value);

    return ability ? ABILITY_LABELS[ability].name : value;
  }

  if (kind === 'language') {
    return getLanguageLabel(value);
  }

  if (kind === 'damageType') {
    return DAMAGE_TYPE_INFO[value]?.label ?? value;
  }

  if (kind === 'armor') {
    return ARMOR_PROFICIENCY_LABELS[value] ?? value;
  }

  return value;
}

/**
 * Выбор механики в виде листа; выбор незнакомого вида — null.
 * @param raw - выбор из механики
 * @param level - уровень источника
 */
export function toSheetChoice(
  raw: MechanicsChoice,
  level: number,
): SheetChoice | null {
  const baseKind = toChoiceKind(raw.type ?? raw.types?.[0]);

  if (!baseKind || !raw.key) {
    return null;
  }

  const kind: ChoiceKind =
    baseKind === 'skill' && raw.grants === CHOICE_GRANT_EXPERTISE
      ? 'expertise'
      : baseKind;

  const filter = raw.spellFilter;

  return {
    key: raw.key,
    kind,
    label: raw.label || CHOICE_KIND_LABELS[kind],
    count: resolveChoiceCount(raw, level),
    // Вариант умения открывается со своего уровня класса
    options: (raw.options ?? [])
      .filter((option) => option.value && (option.level ?? 0) <= level)
      .map((option) => ({
        value: option.value,
        label: option.name || getChoiceValueLabel(kind, option.value),
      })),
    requiredLevel: raw.requiredLevel ?? null,
    onlyIfNotProficient: Boolean(raw.onlyIfNotProficient),
    onlyIfProficient: Boolean(raw.onlyIfProficient),
    expertiseIfProficient: Boolean(raw.expertiseIfProficient),
    spellFilter:
      filter || kind === 'cantrip'
        ? {
            level: kind === 'cantrip' ? 0 : (filter?.level ?? null),
            maxLevel: filter?.maxLevel ?? null,
            classes: filter?.classes ?? [],
            classesFromChoiceKey: filter?.classesFromChoiceKey ?? null,
          }
        : null,
    alwaysPrepared: Boolean(raw.alwaysPrepared),
    abilityBonus: null,
  };
}

/**
 * Характеристики повышения: перечисленные либо все шесть.
 * @param bonus - повышение из механики
 */
function getBonusAbilities(bonus: MechanicsAbilityBonus): Array<AbilityKey> {
  const listed = (bonus.abilities ?? []).flatMap((value) => {
    const key = toAbilityKey(value);

    return key ? [key] : [];
  });

  return listed.length ? listed : [...ABILITY_KEYS];
}

/**
 * Фиксированное ли повышение: характеристик столько, сколько нужно выбрать.
 * @param bonus - повышение из механики
 */
function isFixedAbilityBonus(bonus: MechanicsAbilityBonus): boolean {
  const listed = bonus.abilities ?? [];

  return (
    !bonus.fromChoiceKey
    && listed.length > 0
    && (bonus.count ?? 1) >= listed.length
  );
}

/**
 * Подпись повышения характеристики: «Сила +1».
 * @param ability - характеристика
 * @param bonus - прибавка
 */
function getAbilityBonusLabel(ability: AbilityKey, bonus: number): string {
  return `${ABILITY_LABELS[ability].name} +${bonus}`;
}

/**
 * Выборы повышения характеристик. У расы элементы складываются: каждый
 * нефиксированный — свой выбор. У черты элементы — варианты «или»: один
 * выбор из пар «вариант: характеристика».
 * @param mechanics - механика записи
 * @param isSummed - элементы складываются (раса), а не выбираются (черта)
 */
export function getAbilityBonusChoices(
  mechanics: CatalogMechanics,
  isSummed: boolean,
): Array<SheetChoice> {
  const bonuses = mechanics?.abilityBonuses ?? [];

  if (!bonuses.length) {
    return [];
  }

  const baseChoice = {
    requiredLevel: null,
    onlyIfNotProficient: false,
    onlyIfProficient: false,
    expertiseIfProficient: false,
    spellFilter: null,
    alwaysPrepared: false,
  };

  if (isSummed || bonuses.length === 1) {
    return bonuses.flatMap((bonus, index) => {
      if (isFixedAbilityBonus(bonus) || bonus.fromChoiceKey) {
        return [];
      }

      const amount = bonus.bonus ?? 1;

      return [
        {
          ...baseChoice,
          key: `${ABILITY_BONUS_CHOICE_PREFIX}${index}`,
          kind: 'abilityBonus' as const,
          label: `${CHOICE_KIND_LABELS.abilityBonus} +${amount}`,
          count: Math.max(1, bonus.count ?? 1),
          options: getBonusAbilities(bonus).map((ability) => ({
            value: ability,
            label: getAbilityBonusLabel(ability, amount),
          })),
          abilityBonus: {
            bonus: amount,
            upto:
              bonus.upto
              ?? (isSummed ? ABILITY_SCORE.max : ABILITY_IMPROVEMENT_LIMIT),
          },
        },
      ];
    });
  }

  return [
    {
      ...baseChoice,
      key: `${ABILITY_BONUS_CHOICE_PREFIX}variant`,
      kind: 'abilityBonus',
      label: CHOICE_KIND_LABELS.abilityBonus,
      count: 1,
      options: bonuses.flatMap((bonus, index) =>
        getBonusAbilities(bonus).map((ability) => ({
          value: `${index}${ABILITY_VARIANT_SEPARATOR}${ability}`,
          label: getAbilityBonusLabel(ability, bonus.bonus ?? 1),
        })),
      ),
      abilityBonus: { bonus: 1, upto: ABILITY_IMPROVEMENT_LIMIT },
    },
  ];
}

/**
 * Уровень, на котором считается источник: у класса и его умений — уровень
 * класса, у остального — уровень персонажа.
 * @param document - лист персонажа
 * @param source - источник механики
 */
export function getSourceLevel(
  document: SheetDocument,
  source: SheetSource,
): number {
  const owner = source.classId
    ? document.classes.find((sheetClass) => sheetClass.id === source.classId)
    : undefined;

  return owner?.level ?? getCharacterLevel(document.classes);
}

/**
 * Все выборы источника на уровне: из механики и повышения характеристик.
 * Выборы, открывающиеся позже, не показываются.
 * @param source - источник механики
 * @param level - уровень источника
 */
export function getSourceChoices(
  source: SheetSource,
  level: number,
): Array<SheetChoice> {
  const choices = (source.mechanics?.choices ?? []).flatMap((raw) => {
    const choice = toSheetChoice(raw, level);

    return choice && (choice.requiredLevel ?? 0) <= level ? [choice] : [];
  });

  return [
    ...getAbilityBonusChoices(
      source.mechanics,
      SUMMED_ABILITY_BONUS_KINDS.has(source.kind),
    ),
    ...choices,
  ];
}

/**
 * Что уже есть у персонажа без учёта самого источника: по этому выбор
 * помечает варианты.
 * @param document - лист персонажа
 * @param sourceId - источник, чьи выдачи не учитываются; null — учитывать все
 */
export function buildChoiceContext(
  document: SheetDocument,
  sourceId: string | null,
): ChoiceContext {
  const own = document.proficiencyGrants.find(
    (grant) => grant.sourceId === sourceId,
  );

  const skills = { ...document.skills };

  for (const skill of own?.skills ?? []) {
    if (skills[skill] === 'proficient') {
      skills[skill] = 'none';
    }
  }

  for (const skill of own?.expertise ?? []) {
    if (skills[skill] === 'expertise') {
      skills[skill] = own?.skills.includes(skill) ? 'none' : 'proficient';
    }
  }

  const others = getGrantedProficiencyLists(
    document.proficiencyGrants.filter((grant) => grant.sourceId !== sourceId),
  );

  return {
    skills,
    savingThrows: document.savingThrows.filter(
      (ability) => !own?.savingThrows.includes(ability),
    ),
    languages: others.languages,
    tools: others.tools,
    spellNames: document.spells
      .filter((spell) => spell.sourceId !== sourceId)
      .map((spell) => spell.name.toLowerCase()),
    takenValues: [],
  };
}

/**
 * Пометка навыка в выборе.
 * @param choice - выбор
 * @param context - что уже есть у персонажа
 * @param skill - навык варианта
 */
function getSkillOptionState(
  choice: SheetChoice,
  context: ChoiceContext,
  skill: SkillKey,
): Pick<SheetChoiceOption, 'hint' | 'disabled'> {
  const proficiency = context.skills[skill] ?? 'none';

  if (choice.kind === 'expertise') {
    if (proficiency === 'expertise') {
      return { hint: CHOICE_HINTS.expertise, disabled: true };
    }

    return proficiency === 'proficient' ? {} : { disabled: true };
  }

  if (!isSkillProficient(proficiency)) {
    return choice.onlyIfProficient ? { disabled: true } : {};
  }

  if (choice.expertiseIfProficient && proficiency === 'proficient') {
    return { hint: CHOICE_HINTS.becomesExpertise };
  }

  return {
    hint:
      proficiency === 'expertise'
        ? CHOICE_HINTS.expertise
        : CHOICE_HINTS.proficient,
    disabled: choice.onlyIfNotProficient,
  };
}

/**
 * Значения выбора по его виду, когда запись их не перечислила; null — пул
 * собирается поиском по справочнику.
 * @param kind - вид выбора
 */
function getDefaultChoiceValues(kind: ChoiceKind): Array<string> | null {
  switch (kind) {
    case 'skill':
    case 'expertise': {
      return [...SKILL_KEYS];
    }
    case 'savingThrow':
    case 'ability':
    case 'spellcastingAbility': {
      return [...ABILITY_KEYS];
    }
    case 'language': {
      return [...LANGUAGE_CHOICE_KEYS];
    }
    case 'damageType': {
      return [...DAMAGE_TYPE_CHOICE_KEYS];
    }
    case 'armor': {
      return Object.keys(ARMOR_PROFICIENCY_LABELS);
    }
    default: {
      return null;
    }
  }
}

/**
 * Пометка варианта: уже есть у персонажа или взят соседним выбором.
 * @param choice - выбор
 * @param context - что уже есть у персонажа
 * @param option - вариант
 */
function decorateChoiceOption(
  choice: SheetChoice,
  context: ChoiceContext,
  option: ChoiceListedOption,
): SheetChoiceOption {
  if (context.takenValues.includes(option.value)) {
    return { ...option, hint: CHOICE_HINTS.taken, disabled: true };
  }

  const skill = toSkillKey(option.value);

  if ((choice.kind === 'skill' || choice.kind === 'expertise') && skill) {
    return { ...option, ...getSkillOptionState(choice, context, skill) };
  }

  if (choice.kind === 'savingThrow') {
    const ability = toAbilityKey(option.value);

    return ability && context.savingThrows.includes(ability)
      ? {
          ...option,
          hint: CHOICE_HINTS.proficient,
          disabled: choice.onlyIfNotProficient,
        }
      : option;
  }

  if (choice.kind === 'language' || choice.kind === 'tool') {
    const owned =
      choice.kind === 'language' ? context.languages : context.tools;

    const isOwned = owned.some(
      (name) => name.toLowerCase() === option.label.toLowerCase(),
    );

    return isOwned
      ? { ...option, hint: CHOICE_HINTS.known, disabled: true }
      : option;
  }

  if (choice.kind === 'spell' || choice.kind === 'cantrip') {
    return context.spellNames.includes(option.label.toLowerCase())
      ? { ...option, hint: CHOICE_HINTS.known, disabled: true }
      : option;
  }

  return option;
}

/**
 * Варианты выбора, которые известны без запроса к справочнику: перечисленные
 * записью или все значения вида. null — пул нужно искать в справочнике
 * (заклинания, черты, особенности, инструменты без списка).
 * @param choice - выбор
 * @param context - что уже есть у персонажа
 */
export function getStaticChoiceOptions(
  choice: SheetChoice,
  context: ChoiceContext,
): Array<SheetChoiceOption> | null {
  const listed = choice.options.length
    ? choice.options
    : getDefaultChoiceValues(choice.kind)?.map((value) => ({
        value,
        label: getChoiceValueLabel(choice.kind, value),
      }));

  if (!listed) {
    return null;
  }

  return listed.map((option) => decorateChoiceOption(choice, context, option));
}

/**
 * Помечает варианты пула из справочника тем, что у персонажа уже есть.
 * @param choice - выбор
 * @param context - что уже есть у персонажа
 * @param options - варианты пула
 */
export function decorateChoiceOptions(
  choice: SheetChoice,
  context: ChoiceContext,
  options: ReadonlyArray<SheetChoiceOption>,
): Array<SheetChoiceOption> {
  return options.map((option) => ({
    ...option,
    ...decorateChoiceOption(choice, context, option),
  }));
}

/**
 * Выдачи владений из ответа на выбор. Навык, которым персонаж уже владеет,
 * при `expertiseIfProficient` становится компетентностью.
 * @param choice - выбор
 * @param answers - выбранные значения
 * @param context - что уже есть у персонажа без источника
 */
export function getChoiceGrantedProficiencies(
  choice: SheetChoice,
  answers: ReadonlyArray<string>,
  context: ChoiceContext,
): GrantedProficiencies {
  const granted = createEmptyGrantedProficiencies();

  const skills = answers.flatMap((value) => {
    const key = toSkillKey(value);

    return key ? [key] : [];
  });

  switch (choice.kind) {
    case 'skill': {
      return {
        ...granted,
        skills: skills.filter(
          (skill) =>
            !choice.expertiseIfProficient
            || !isSkillProficient(context.skills[skill]),
        ),
        expertise: choice.expertiseIfProficient
          ? skills.filter((skill) => context.skills[skill] === 'proficient')
          : [],
      };
    }
    case 'expertise': {
      return { ...granted, expertise: skills };
    }
    case 'savingThrow': {
      return {
        ...granted,
        savingThrows: answers.flatMap((value) => {
          const key = toAbilityKey(value);

          return key ? [key] : [];
        }),
      };
    }
    case 'language': {
      return { ...granted, languages: answers.map(getLanguageLabel) };
    }
    case 'tool': {
      return { ...granted, tools: [...answers] };
    }
    case 'weapon': {
      return { ...granted, weapons: [...answers] };
    }
    case 'armor': {
      return { ...granted, armor: toArmorGroupNames(answers) };
    }
    default: {
      return granted;
    }
  }
}

/**
 * Ответы источника на выбор, ограниченные нужным количеством.
 * @param source - источник механики
 * @param choice - выбор
 */
export function getChoiceAnswers(
  source: SheetSource,
  choice: SheetChoice,
): Array<string> {
  return (source.choiceAnswers[choice.key] ?? []).slice(0, choice.count);
}

/**
 * Всё, что источник выдаёт: владения без выбора и выбранное игроком.
 * @param document - лист персонажа
 * @param source - источник механики
 */
export function getSourceGrantedProficiencies(
  document: SheetDocument,
  source: SheetSource,
): GrantedProficiencies {
  const level = getSourceLevel(document, source);
  const context = buildChoiceContext(document, source.id);

  const chosen = getSourceChoices(source, level).map((choice) =>
    getChoiceGrantedProficiencies(
      choice,
      getChoiceAnswers(source, choice),
      context,
    ),
  );

  return mergeGrantedProficiencies(
    getMechanicsProficiencies(source.mechanics),
    ...chosen,
  );
}

/**
 * Прибавка к характеристикам: складывает прибавку к каждой названной.
 * @param target - накопленные прибавки
 * @param abilities - характеристики
 * @param bonus - прибавка
 */
function addAbilityBonus(
  target: AbilityBonuses,
  abilities: ReadonlyArray<AbilityKey>,
  bonus: number,
): AbilityBonuses {
  return abilities.reduce<AbilityBonuses>(
    (result, ability) => ({
      ...result,
      [ability]: (result[ability] ?? 0) + bonus,
    }),
    target,
  );
}

/**
 * Прибавки к характеристикам, которые источник хочет применить: фиксированные
 * повышения, выбранные игроком и (у «Увеличения характеристик») названные в
 * ответе.
 * @param source - источник механики
 */
export function getSourceAbilityIncreases(source: SheetSource): AbilityBonuses {
  const answersOf = (key: string): Array<AbilityKey> =>
    (source.choiceAnswers[key] ?? []).flatMap((value) => {
      const ability = toAbilityKey(value);

      return ability ? [ability] : [];
    });

  if (source.kind === 'asi') {
    return addAbilityBonus({}, answersOf(source.kind), 1);
  }

  const bonuses = source.mechanics?.abilityBonuses ?? [];
  const isSummed = SUMMED_ABILITY_BONUS_KINDS.has(source.kind);

  if (!isSummed && bonuses.length > 1) {
    return (
      source.choiceAnswers[`${ABILITY_BONUS_CHOICE_PREFIX}variant`] ?? []
    ).reduce<AbilityBonuses>((result, value) => {
      const [indexText, abilityText] = value.split(ABILITY_VARIANT_SEPARATOR);
      const ability = toAbilityKey(abilityText);
      const bonus = bonuses[Number(indexText)];

      return ability && bonus
        ? addAbilityBonus(result, [ability], bonus.bonus ?? 1)
        : result;
    }, {});
  }

  return bonuses.reduce<AbilityBonuses>((result, bonus, index) => {
    const amount = bonus.bonus ?? 1;

    if (bonus.fromChoiceKey) {
      return addAbilityBonus(result, answersOf(bonus.fromChoiceKey), amount);
    }

    if (isFixedAbilityBonus(bonus)) {
      return addAbilityBonus(result, getBonusAbilities(bonus), amount);
    }

    return addAbilityBonus(
      result,
      uniq(answersOf(`${ABILITY_BONUS_CHOICE_PREFIX}${index}`)).slice(
        0,
        Math.max(1, bonus.count ?? 1),
      ),
      amount,
    );
  }, {});
}

/**
 * Предел характеристики для прибавок источника: у расы — общий предел
 * характеристики, у черт и «Увеличения характеристик» — 20.
 * @param source - источник механики
 */
export function getSourceAbilityLimit(source: SheetSource): number {
  const explicit = (source.mechanics?.abilityBonuses ?? []).find(
    (bonus) => bonus.upto,
  )?.upto;

  if (explicit) {
    return explicit;
  }

  return SUMMED_ABILITY_BONUS_KINDS.has(source.kind)
    ? ABILITY_SCORE.max
    : ABILITY_IMPROVEMENT_LIMIT;
}

/**
 * Невыполненные выборы всех источников листа.
 * @param document - лист персонажа
 */
export function getPendingChoices(
  document: SheetDocument,
): Array<PendingChoice> {
  return document.sources.flatMap((source) =>
    getSourceChoices(source, getSourceLevel(document, source)).flatMap(
      (choice) => {
        const missing = choice.count - getChoiceAnswers(source, choice).length;

        return missing > 0 ? [{ source, choice, missing }] : [];
      },
    ),
  );
}
