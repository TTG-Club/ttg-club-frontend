import type { EXTRA_SPEED_KEYS } from './constants';
import type { MechanicsModifiers } from './mechanics';
import type { AbilityScores, SheetDocument } from './schema';
import type {
  AbilityKey,
  EffectCarrier,
  FormulaContext,
  SheetArmorState,
  SheetDefences,
  SheetSense,
  SheetStats,
  SkillKey,
  SpeedKey,
} from './types';

import { clamp, uniq } from 'es-toolkit';

import {
  ABILITY_EFFECT_KEYS,
  ABILITY_KEYS,
  ABILITY_SCORE,
  ARMOR_DEXTERITY_LIMIT,
  CONDITION_LABELS,
  DAMAGE_DEFENCE_KINDS,
  DAMAGE_TYPE_INFO,
  DARKVISION_SENSE,
  EFFECT_KEYS,
  OWN_SENSE_KEYS,
  SENSE_BY_EFFECT_KEY,
  SENSE_LABELS,
  SKILL_EFFECT_KEYS,
  SKILL_INFO,
  SKILL_KEYS,
  SPEED_ZERO_FLAG,
  UNARMORED_ARMOR_CLASS,
} from './constants';
import { createFormulaContext } from './counters';
import {
  applyCarriedChanges,
  collectAppliedEffects,
  collectEffectCarriers,
  getCarriedChanges,
  getEffectDefences,
  getEffectFlags,
  getEffectValue,
  getSheetArmorState,
  isSavingThrowAutoFailed,
} from './effects';
import {
  getAbilityModifier,
  getCharacterLevel,
  getProficiencyBonus,
  getSkillProficiency,
  getSkillProficiencyBonus,
} from './utils';

/*
 * Итоги листа с механикой: модификаторы источников (`mechanics.modifiers`) и
 * активные эффекты поверх значений, которые лист считал и раньше. Ручные
 * поля листа остаются основой: эффекты и механика их доводят, а не
 * заменяют.
 */

/** Пассивная проверка: 10 + бонус навыка. */
const PASSIVE_CHECK_BASE = 10;

/** Сложность спасброска от заклинаний: 8 + мастерство + модификатор. */
const SPELL_SAVE_DC_BASE = 8;

/** Модификаторы одного источника с тем, что нужно для их подсчёта. */
interface SourceModifiersEntry {
  modifiers: NonNullable<MechanicsModifiers>;
  characterLevel: number | null;
  choiceAnswers: Record<string, Array<string>>;
}

/**
 * Модификаторы всех источников листа.
 * @param document - лист персонажа
 */
function getSourceModifiers(
  document: SheetDocument,
): Array<SourceModifiersEntry> {
  return document.sources.flatMap((source) =>
    source.mechanics?.modifiers
      ? [
          {
            modifiers: source.mechanics.modifiers,
            characterLevel: source.characterLevel,
            choiceAnswers: source.choiceAnswers,
          },
        ]
      : [],
  );
}

/**
 * Характеристики после эффектов `ability.<характеристика>`. Формулы в них
 * считаются от исходных модификаторов — иначе прибавка к Силе зависела бы от
 * самой себя.
 * @param document - лист персонажа
 * @param carriers - носители эффектов
 * @param armor - состояние доспеха
 */
export function getEffectiveAbilities(
  document: SheetDocument,
  carriers: ReadonlyArray<EffectCarrier>,
  armor: SheetArmorState,
): AbilityScores {
  const context = createFormulaContext(document);

  const raise = (key: AbilityKey): number =>
    clamp(
      getEffectValue(
        carriers,
        `${EFFECT_KEYS.abilityPrefix}${ABILITY_EFFECT_KEYS[key]}`,
        document.abilities[key],
        armor,
        context,
      ),
      ABILITY_SCORE.min,
      ABILITY_SCORE.max,
    );

  return {
    STRENGTH: raise('STRENGTH'),
    DEXTERITY: raise('DEXTERITY'),
    CONSTITUTION: raise('CONSTITUTION'),
    INTELLIGENCE: raise('INTELLIGENCE'),
    WISDOM: raise('WISDOM'),
    CHARISMA: raise('CHARISMA'),
  };
}

/**
 * КД тела по надетой броне: лучшая броня с Ловкостью в пределах категории,
 * без брони — 10 + Ловкость.
 * @param document - лист персонажа
 * @param dexterity - модификатор Ловкости
 */
function getBodyArmorClass(document: SheetDocument, dexterity: number): number {
  const best = document.inventory
    .flatMap((item) =>
      item.isEquipped
      && item.quantity > 0
      && item.armor
      && item.armor.category !== 'SHIELD'
        ? [item.armor]
        : [],
    )
    .reduce<{ value: number; limit: number | null } | null>((result, armor) => {
      const value = armor.baseArmorClass + armor.bonus;

      return !result || value > result.value
        ? { value, limit: ARMOR_DEXTERITY_LIMIT[armor.category] }
        : result;
    }, null);

  if (!best) {
    return UNARMORED_ARMOR_CLASS + dexterity;
  }

  return (
    best.value
    + (best.limit === null ? dexterity : Math.min(dexterity, best.limit))
  );
}

/**
 * Прибавка надетых щитов.
 * @param document - лист персонажа
 */
function getShieldArmorClass(document: SheetDocument): number {
  return document.inventory.reduce(
    (sum, item) =>
      item.isEquipped && item.quantity > 0 && item.armor?.category === 'SHIELD'
        ? sum + item.armor.baseArmorClass + item.armor.bonus
        : sum,
    0,
  );
}

/**
 * КД с эффектами. Своё значение игрока — итог без расчёта. Иначе тело
 * считается по броне, затем эффекты задают его заменой («Защита без
 * доспехов» — `10+@mod.dex+@mod.con` при `self.armor === none`), сверху —
 * щиты, свой бонус, модификаторы источников и прибавки эффектов. Числовая
 * замена без условия («КД не ниже 16») применяется к итогу.
 * @param document - лист с характеристиками после эффектов
 * @param carriers - носители эффектов
 * @param armor - состояние доспеха
 * @param context - значения листа для формул
 */
export function getEffectiveArmorClass(
  document: SheetDocument,
  carriers: ReadonlyArray<EffectCarrier>,
  armor: SheetArmorState,
  context: FormulaContext,
): { value: number; source: string | null } {
  if (document.armorClassOverride !== null) {
    return { value: document.armorClassOverride, source: null };
  }

  const changes = getCarriedChanges(carriers, EFFECT_KEYS.armorClass, armor);

  const isTotalChange = (entry: (typeof changes)[number]): boolean =>
    entry.change.mode !== 'add'
    && !entry.change.condition
    && /^-?\d+$/.test(entry.change.value.trim());

  const body = applyCarriedChanges(
    getBodyArmorClass(document, context.abilityModifiers.DEXTERITY),
    changes.filter(
      (entry) => entry.change.mode !== 'add' && !isTotalChange(entry),
    ),
    context,
  );

  const modifierBonus = getSourceModifiers(document).reduce(
    (sum, entry) => sum + (entry.modifiers.armorClassBonus ?? 0),
    0,
  );

  const withAdds = applyCarriedChanges(
    body.value
      + getShieldArmorClass(document)
      + document.armorClassBonus
      + modifierBonus,
    changes.filter((entry) => entry.change.mode === 'add'),
    context,
  );

  const total = applyCarriedChanges(
    withAdds.value,
    changes.filter(isTotalChange),
    context,
  );

  return { value: total.value, source: total.replacedBy ?? body.replacedBy };
}

/**
 * Защиты от урона из модификаторов источников и выборов типа урона.
 * @param document - лист персонажа
 */
function getModifierDefences(document: SheetDocument): SheetDefences {
  const result: SheetDefences = {
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditionImmunities: [],
  };

  const label = (key: string): string => DAMAGE_TYPE_INFO[key]?.label ?? key;

  for (const { modifiers, choiceAnswers } of getSourceModifiers(document)) {
    const damage = modifiers.damage;

    result.resistances.push(...(damage?.resistances ?? []).map(label));
    result.immunities.push(...(damage?.immunities ?? []).map(label));
    result.vulnerabilities.push(...(damage?.vulnerabilities ?? []).map(label));

    for (const defence of damage?.defenseChoices ?? []) {
      const field = Object.entries(DAMAGE_DEFENCE_KINDS).find(
        ([kind]) => kind === defence.kind,
      )?.[1];

      if (field) {
        result[field].push(
          ...(choiceAnswers[defence.choiceKey] ?? []).map(label),
        );
      }
    }

    if (damage?.resistanceFromChoiceKey) {
      result.resistances.push(
        ...(choiceAnswers[damage.resistanceFromChoiceKey] ?? []).map(label),
      );
    }

    result.conditionImmunities.push(
      ...(modifiers.conditionImmunities ?? []).map(
        (condition) => CONDITION_LABELS[condition] ?? condition,
      ),
    );
  }

  return result;
}

/**
 * Скорости: ходьба листа с прибавками источников, особые скорости — лучшая из
 * своей, механики («равна скорости ходьбы») и эффектов. Флаг `speed.zero`
 * обнуляет все.
 * @param document - лист персонажа
 * @param carriers - носители эффектов
 * @param armor - состояние доспеха
 * @param context - значения листа для формул
 * @param flags - флаги персонажа
 */
function getEffectiveSpeeds(
  document: SheetDocument,
  carriers: ReadonlyArray<EffectCarrier>,
  armor: SheetArmorState,
  context: FormulaContext,
  flags: ReadonlySet<string>,
): Record<SpeedKey, number> {
  const modifiers = getSourceModifiers(document).map(
    (entry) => entry.modifiers.speed,
  );

  const walkBase =
    document.speed
    + modifiers.reduce((sum, speed) => sum + (speed?.walkBonus ?? 0), 0);

  const walk = getEffectValue(
    carriers,
    `${EFFECT_KEYS.movementPrefix}walk`,
    walkBase,
    armor,
    context,
  );

  const extra = (key: (typeof EXTRA_SPEED_KEYS)[number]): number => {
    const fromModifiers = modifiers.reduce((best, speed) => {
      if (!speed || key === 'burrow') {
        return best;
      }

      const equalsWalk = {
        fly: speed.flyEqualsWalk,
        climb: speed.climbEqualsWalk,
        swim: speed.swimEqualsWalk,
      }[key];

      return Math.max(best, speed[key] ?? 0, equalsWalk ? walk : 0);
    }, 0);

    return getEffectValue(
      carriers,
      `${EFFECT_KEYS.movementPrefix}${key}`,
      Math.max(document.speeds[key], fromModifiers),
      armor,
      context,
    );
  };

  const speeds: Record<SpeedKey, number> = {
    walk,
    fly: extra('fly'),
    climb: extra('climb'),
    swim: extra('swim'),
    burrow: extra('burrow'),
  };

  if (flags.has(SPEED_ZERO_FLAG)) {
    return { walk: 0, fly: 0, climb: 0, swim: 0, burrow: 0 };
  }

  return {
    walk: Math.max(0, speeds.walk),
    fly: Math.max(0, speeds.fly),
    climb: Math.max(0, speeds.climb),
    swim: Math.max(0, speeds.swim),
    burrow: Math.max(0, speeds.burrow),
  };
}

/**
 * Чувства: тёмное зрение листа и чувства механики — лучшая дальность каждого,
 * затем эффекты `sense.<чувство>`.
 * @param document - лист персонажа
 * @param carriers - носители эффектов
 * @param armor - состояние доспеха
 * @param context - значения листа для формул
 */
function getEffectiveSenses(
  document: SheetDocument,
  carriers: ReadonlyArray<EffectCarrier>,
  armor: SheetArmorState,
  context: FormulaContext,
): Array<SheetSense> {
  const ranges = new Map<string, number>();

  if (document.darkvision) {
    ranges.set(DARKVISION_SENSE, document.darkvision);
  }

  for (const key of OWN_SENSE_KEYS) {
    const range = document.ownSenses[key] ?? 0;

    if (range > 0) {
      ranges.set(key, range);
    }
  }

  for (const { modifiers } of getSourceModifiers(document)) {
    for (const sense of modifiers.senses ?? []) {
      if (sense.type) {
        ranges.set(
          sense.type,
          Math.max(ranges.get(sense.type) ?? 0, sense.range),
        );
      }
    }
  }

  for (const [effectKey, senseKey] of Object.entries(SENSE_BY_EFFECT_KEY)) {
    const value = getEffectValue(
      carriers,
      `${EFFECT_KEYS.sensePrefix}${effectKey}`,
      ranges.get(senseKey) ?? 0,
      armor,
      context,
    );

    if (value > 0) {
      ranges.set(senseKey, value);
    }
  }

  return [...ranges.entries()]
    .filter(([, range]) => range > 0)
    .map(([key, range]) => ({ key, label: SENSE_LABELS[key] ?? key, range }));
}

/**
 * Прибавка к максимуму хитов от модификаторов источников: постоянная, за
 * уровни на момент взятия и за уровни после него.
 * @param document - лист персонажа
 * @param level - уровень персонажа
 */
export function getModifierHitPointsBonus(
  document: SheetDocument,
  level: number,
): number {
  return getSourceModifiers(document).reduce((sum, entry) => {
    const hitPoints = entry.modifiers.hitPoints;

    if (!hitPoints) {
      return sum;
    }

    const acquired = entry.characterLevel ?? level;

    return (
      sum
      + (hitPoints.flat ?? 0)
      + (hitPoints.perAcquisitionLevel ?? 0) * acquired
      + (hitPoints.perLevelAfterAcquisition ?? 0)
        * Math.max(0, level - acquired)
    );
  }, 0);
}

/**
 * Итоги листа с механикой, эффектами и истощением.
 * @param document - лист персонажа
 */
export function getSheetStats(document: SheetDocument): SheetStats {
  const carriers = collectEffectCarriers(document);
  const armor = getSheetArmorState(document);
  const flags = getEffectFlags(carriers, document);
  const abilities = getEffectiveAbilities(document, carriers, armor);
  const effective: SheetDocument = { ...document, abilities };
  const level = getCharacterLevel(document.classes);
  const baseContext = createFormulaContext(effective, abilities);

  const proficiencyBonus = getEffectValue(
    carriers,
    EFFECT_KEYS.proficiencyBonus,
    getProficiencyBonus(level),
    armor,
    baseContext,
  );

  const context: FormulaContext = { ...baseContext, proficiencyBonus };
  const modifiers = getSourceModifiers(document);
  const mod = (key: AbilityKey): number => getAbilityModifier(abilities[key]);

  const savingThrows = Object.fromEntries(
    ABILITY_KEYS.map((key) => {
      const effectKey = ABILITY_EFFECT_KEYS[key];

      const base =
        mod(key) + (document.savingThrows.includes(key) ? proficiencyBonus : 0);

      return [
        key,
        {
          bonus: getEffectValue(
            carriers,
            `${EFFECT_KEYS.savePrefix}${effectKey}`,
            base,
            armor,
            context,
          ),
          isAutoFail: isSavingThrowAutoFailed(flags, effectKey),
        },
      ];
    }),
  );

  const skills = Object.fromEntries(
    SKILL_KEYS.map((key) => {
      const base =
        mod(SKILL_INFO[key].ability)
        + getSkillProficiencyBonus(
          getSkillProficiency(document, key),
          proficiencyBonus,
        );

      return [
        key,
        getEffectValue(
          carriers,
          `${EFFECT_KEYS.skillPrefix}${SKILL_EFFECT_KEYS[key]}`,
          base,
          armor,
          context,
        ),
      ];
    }),
  );

  const initiativeBase =
    mod('DEXTERITY')
    + document.initiativeBonus
    + modifiers.reduce(
      (sum, entry) =>
        sum
        + (entry.modifiers.initiativeBonus ?? 0)
        + (entry.modifiers.initiativeProficiencyBonus ? proficiencyBonus : 0),
      0,
    );

  const effectDefences = getEffectDefences(
    flags,
    collectAppliedEffects(document),
  );

  const modifierDefences = getModifierDefences(document);

  const hitPointsMax = Math.max(
    0,
    getEffectValue(
      carriers,
      EFFECT_KEYS.hitPointsMax,
      document.health.max + getModifierHitPointsBonus(document, level),
      armor,
      context,
    ),
  );

  const spellAbility = document.spellcastingAbility;

  const armorClass = getEffectiveArmorClass(
    effective,
    carriers,
    armor,
    context,
  );

  return {
    level,
    proficiencyBonus,
    abilities,
    armorClass: armorClass.value,
    armorClassSource: armorClass.source,
    initiative: getEffectValue(
      carriers,
      EFFECT_KEYS.initiative,
      initiativeBase,
      armor,
      context,
    ),
    savingThrows: {
      STRENGTH: savingThrows.STRENGTH ?? { bonus: 0, isAutoFail: false },
      DEXTERITY: savingThrows.DEXTERITY ?? { bonus: 0, isAutoFail: false },
      CONSTITUTION: savingThrows.CONSTITUTION ?? {
        bonus: 0,
        isAutoFail: false,
      },
      INTELLIGENCE: savingThrows.INTELLIGENCE ?? {
        bonus: 0,
        isAutoFail: false,
      },
      WISDOM: savingThrows.WISDOM ?? { bonus: 0, isAutoFail: false },
      CHARISMA: savingThrows.CHARISMA ?? { bonus: 0, isAutoFail: false },
    },
    skills: toSkillRecord(skills),
    passivePerception: PASSIVE_CHECK_BASE + (skills.PERCEPTION ?? 0),
    speeds: getEffectiveSpeeds(document, carriers, armor, context, flags),
    senses: getEffectiveSenses(document, carriers, armor, context),
    telepathy: Math.max(
      0,
      ...modifiers.map((entry) => entry.modifiers.telepathyRange ?? 0),
      getEffectValue(
        carriers,
        `${EFFECT_KEYS.sensePrefix}telepathy`,
        0,
        armor,
        context,
      ),
    ),
    defences: {
      resistances: uniq([
        ...modifierDefences.resistances,
        ...effectDefences.resistances,
      ]),
      immunities: uniq([
        ...modifierDefences.immunities,
        ...effectDefences.immunities,
      ]),
      vulnerabilities: uniq([
        ...modifierDefences.vulnerabilities,
        ...effectDefences.vulnerabilities,
      ]),
      conditionImmunities: uniq([
        ...modifierDefences.conditionImmunities,
        ...effectDefences.conditionImmunities,
      ]),
    },
    hitPointsMax,
    spellSaveDc: spellAbility
      ? getEffectValue(
          carriers,
          EFFECT_KEYS.spellSaveDc,
          SPELL_SAVE_DC_BASE + proficiencyBonus + mod(spellAbility),
          armor,
          context,
        )
      : null,
    spellAttack: spellAbility
      ? getEffectValue(
          carriers,
          EFFECT_KEYS.spellAttack,
          proficiencyBonus + mod(spellAbility),
          armor,
          context,
        )
      : null,
    meleeAttackBonus: getEffectValue(
      carriers,
      EFFECT_KEYS.meleeAttack,
      0,
      armor,
      context,
    ),
    rangedAttackBonus: getEffectValue(
      carriers,
      EFFECT_KEYS.rangedAttack,
      0,
      armor,
      context,
    ),
    flags,
  };
}

/**
 * Бонусы навыков записью по всем навыкам.
 * @param values - бонусы, собранные по ключам
 */
function toSkillRecord(
  values: Partial<Record<string, number>>,
): Record<SkillKey, number> {
  return {
    ACROBATICS: values.ACROBATICS ?? 0,
    ANIMAL_HANDLING: values.ANIMAL_HANDLING ?? 0,
    ARCANA: values.ARCANA ?? 0,
    ATHLETICS: values.ATHLETICS ?? 0,
    DECEPTION: values.DECEPTION ?? 0,
    HISTORY: values.HISTORY ?? 0,
    INSIGHT: values.INSIGHT ?? 0,
    INTIMIDATION: values.INTIMIDATION ?? 0,
    INVESTIGATION: values.INVESTIGATION ?? 0,
    MEDICINE: values.MEDICINE ?? 0,
    NATURE: values.NATURE ?? 0,
    PERCEPTION: values.PERCEPTION ?? 0,
    PERFORMANCE: values.PERFORMANCE ?? 0,
    PERSUASION: values.PERSUASION ?? 0,
    RELIGION: values.RELIGION ?? 0,
    SLEIGHT_OF_HAND: values.SLEIGHT_OF_HAND ?? 0,
    STEALTH: values.STEALTH ?? 0,
    SURVIVAL: values.SURVIVAL ?? 0,
  };
}
