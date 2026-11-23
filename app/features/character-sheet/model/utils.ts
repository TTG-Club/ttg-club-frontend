import type {
  AbilityBonuses,
  AbilityScores,
  CharacterSheet,
  ClassTableColumn,
  SheetClass,
  SheetDocument,
  SheetItem,
  SkillProficiency,
} from './schema';
import type {
  AbilityKey,
  ClassProgression,
  ExperienceProgress,
  HitDiceTotal,
  PactMagic,
  SheetSize,
  SkillKey,
  SkillRow,
  WeaponAttack,
} from './types';

import { clamp, range } from 'es-toolkit';

import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ABILITY_SCORE,
  CASTER_LEVEL_DIVIDER,
  CATALOG_API_PREFIX,
  CHARACTER_LEVEL,
  CHARACTER_SHEET_ROUTE,
  CLASS_TABLE_EMPTY,
  DEFAULT_WEAPON_ATTACK_ABILITY,
  EXPERIENCE_BY_LEVEL,
  HIT_DIE_AVERAGE_BONUS,
  MULTICLASS_SPELL_SLOTS,
  PACT_MAGIC_COLUMNS,
  SHEET_SIZE_INFO,
  SHEET_SIZE_KEYS,
  SHEET_TEXT,
  SKILL_INFO,
  SKILL_KEYS,
  SKILL_PROFICIENCY_CYCLE,
  SKILL_PROFICIENCY_MULTIPLIER,
  SPELL_SLOT_LEVELS,
} from './constants';
import { sheetDocumentSchema } from './schema';
import { getCustomBonusesTotal, getSkillAbility } from './skills';

/** Знак минуса для отрицательных модификаторов, как в книгах. */
const MINUS_SIGN = '−';

/** Одна кость в формуле бросателя кубиков: «1к» + грани. */
const SINGLE_DIE_PREFIX = '1к';

/** Граней у к20. */
const D20_SIDES = 20;

/** Сколько бонус мастерства растёт: +1 каждые 4 уровня, начиная с +2. */
const PROFICIENCY_STEP = 4;
const PROFICIENCY_BASE = 2;

/** Модификатор характеристики: (значение − 10) / 2 с округлением вниз. */
const ABILITY_MODIFIER_BASE = 10;

/** Сложность спасброска от заклинания: 8 + мастерство + модификатор. */
const SPELL_SAVE_DC_BASE = 8;

/** Пассивная проверка: 10 + бонус навыка. */
const PASSIVE_CHECK_BASE = 10;

/**
 * Новый идентификатор элемента листа (предмета, заметки, класса).
 * @returns случайный UUID
 */
export function createSheetElementId(): string {
  return crypto.randomUUID();
}

/**
 * Пустой документ листа: все поля с начальными значениями.
 * @returns документ нового персонажа
 */
export function createEmptySheetDocument(): SheetDocument {
  return sheetDocumentSchema.parse({});
}

/**
 * Адрес страницы листа.
 * @param id - идентификатор листа
 */
export function getSheetRoute(id: string): string {
  return `${CHARACTER_SHEET_ROUTE}/${encodeURIComponent(id)}`;
}

/**
 * Адрес API записи справочника по её адресу на сайте.
 * @param url - адрес записи, например `/classes/fighter`
 */
export function getCatalogApiPath(url: string): string {
  return `${CATALOG_API_PREFIX}${url}`;
}

/**
 * Модификатор характеристики.
 * @param score - значение характеристики
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - ABILITY_MODIFIER_BASE) / 2);
}

/**
 * Модификатор со знаком: «+2», «−1», «+0».
 * @param value - модификатор
 */
export function formatModifier(value: number): string {
  return value < 0 ? `${MINUS_SIGN}${Math.abs(value)}` : `+${value}`;
}

/**
 * Формула броска одной кости с бонусом для бросателя кубиков: «1к8+2».
 * @param sides - граней у кости
 * @param bonus - бонус броска
 */
export function getDiceFormula(sides: number, bonus: number): string {
  const dice = `${SINGLE_DIE_PREFIX}${sides}`;

  return bonus ? `${dice}${bonus < 0 ? '-' : '+'}${Math.abs(bonus)}` : dice;
}

/**
 * Формула броска к20 с бонусом: «1к20+3».
 * @param bonus - бонус броска
 */
export function getD20Formula(bonus: number): string {
  return getDiceFormula(D20_SIDES, bonus);
}

/**
 * Формула урона для бросателя кубиков: знак минуса — обычный дефис.
 * @param damage - урон с модификатором из листа
 */
export function getDamageFormula(damage: string): string {
  return damage.replaceAll(MINUS_SIGN, '-').replaceAll(' ', '');
}

/**
 * Общий уровень персонажа — сумма уровней классов, не меньше первого.
 * @param classes - классы персонажа
 */
export function getCharacterLevel(classes: ReadonlyArray<SheetClass>): number {
  const total = classes.reduce((sum, sheetClass) => sum + sheetClass.level, 0);

  return clamp(total, CHARACTER_LEVEL.min, CHARACTER_LEVEL.max);
}

/**
 * Бонус мастерства по общему уровню.
 * @param level - общий уровень персонажа
 */
export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / PROFICIENCY_STEP) + PROFICIENCY_BASE - 1;
}

/**
 * Уровень, которого персонаж достиг по опыту.
 * @param experience - очки опыта
 */
export function getLevelByExperience(experience: number): number {
  const index = EXPERIENCE_BY_LEVEL.findLastIndex(
    (threshold) => experience >= threshold,
  );

  return clamp(index + 1, CHARACTER_LEVEL.min, CHARACTER_LEVEL.max);
}

/**
 * Опыт, нужный для следующего уровня; null — уровень последний.
 * @param level - текущий общий уровень
 */
export function getNextLevelExperience(level: number): number | null {
  return EXPERIENCE_BY_LEVEL[level] ?? null;
}

/**
 * Путь к следующему уровню по опыту.
 * @param experience - очки опыта
 * @param level - текущий общий уровень
 */
export function getExperienceProgress(
  experience: number,
  level: number,
): ExperienceProgress {
  const from = EXPERIENCE_BY_LEVEL[level - 1] ?? 0;
  const to = getNextLevelExperience(level);

  if (to === null || to <= from) {
    return { to, percent: 100, remaining: 0 };
  }

  return {
    to,
    percent: clamp(((experience - from) / (to - from)) * 100, 0, 100),
    remaining: Math.max(0, to - experience),
  };
}

/**
 * Модификатор характеристики персонажа.
 * @param abilities - значения характеристик
 * @param ability - характеристика
 */
export function getModifierOf(
  abilities: AbilityScores,
  ability: AbilityKey,
): number {
  return getAbilityModifier(abilities[ability]);
}

/**
 * Владение навыком; навыка нет в листе — владения нет.
 * @param document - лист персонажа
 * @param skill - навык
 */
export function getSkillProficiency(
  document: SheetDocument,
  skill: SkillKey,
): SkillProficiency {
  return document.skills[skill] ?? 'none';
}

/**
 * Владеет ли персонаж навыком: половина бонуса владением не считается.
 * @param proficiency - уровень владения
 */
export function isSkillProficient(
  proficiency: SkillProficiency | undefined,
): boolean {
  return proficiency === 'proficient' || proficiency === 'expertise';
}

/**
 * Бонус мастерства, который навык получает от уровня владения; половина
 * округляется вниз.
 * @param proficiency - уровень владения
 * @param proficiencyBonus - бонус мастерства
 */
export function getSkillProficiencyBonus(
  proficiency: SkillProficiency,
  proficiencyBonus: number,
): number {
  return Math.floor(
    proficiencyBonus * SKILL_PROFICIENCY_MULTIPLIER[proficiency],
  );
}

/**
 * Следующее владение навыком по кругу: нет → половина → владение →
 * компетентность.
 * @param current - текущее владение
 */
export function getNextSkillProficiency(
  current: SkillProficiency,
): SkillProficiency {
  const index = SKILL_PROFICIENCY_CYCLE.indexOf(current);

  return (
    SKILL_PROFICIENCY_CYCLE[(index + 1) % SKILL_PROFICIENCY_CYCLE.length]
    ?? 'none'
  );
}

/**
 * Бонус навыка.
 * @param document - лист персонажа
 * @param skill - навык
 * @param proficiencyBonus - бонус мастерства
 */
export function getSkillBonus(
  document: SheetDocument,
  skill: SkillKey,
  proficiencyBonus: number,
): number {
  const proficiency = getSkillProficiency(document, skill);

  return (
    getModifierOf(document.abilities, getSkillAbility(document, skill))
    + getSkillProficiencyBonus(proficiency, proficiencyBonus)
    + getCustomBonusesTotal(document.skillBonuses[skill] ?? [], {
      abilityModifiers: {
        STRENGTH: getModifierOf(document.abilities, 'STRENGTH'),
        DEXTERITY: getModifierOf(document.abilities, 'DEXTERITY'),
        CONSTITUTION: getModifierOf(document.abilities, 'CONSTITUTION'),
        INTELLIGENCE: getModifierOf(document.abilities, 'INTELLIGENCE'),
        WISDOM: getModifierOf(document.abilities, 'WISDOM'),
        CHARISMA: getModifierOf(document.abilities, 'CHARISMA'),
      },
      proficiencyBonus,
      level: getCharacterLevel(document.classes),
      classes: document.classes,
    })
  );
}

/**
 * Строки навыков для листа, по алфавиту названий.
 * @param document - лист персонажа
 * @param proficiencyBonus - бонус мастерства
 */
export function getSkillRows(
  document: SheetDocument,
  proficiencyBonus: number,
): Array<SkillRow> {
  return SKILL_KEYS.map((key) => ({
    key,
    name: SKILL_INFO[key].names[0],
    abilityShort: ABILITY_LABELS[SKILL_INFO[key].ability].short,
    proficiency: getSkillProficiency(document, key),
    bonus: getSkillBonus(document, key, proficiencyBonus),
  })).sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Пассивная Внимательность: 10 + бонус навыка.
 * @param document - лист персонажа
 * @param proficiencyBonus - бонус мастерства
 */
export function getPassivePerception(
  document: SheetDocument,
  proficiencyBonus: number,
): number {
  return (
    PASSIVE_CHECK_BASE + getSkillBonus(document, 'PERCEPTION', proficiencyBonus)
  );
}

/**
 * Бонус инициативы: модификатор Ловкости и свой бонус.
 * @param document - лист персонажа
 */
export function getInitiativeBonus(document: SheetDocument): number {
  return (
    getModifierOf(document.abilities, 'DEXTERITY') + document.initiativeBonus
  );
}

/**
 * Атака оружием: дальнобойное — Ловкость, фехтовальное — лучшая из базовой
 * характеристики и Ловкости, остальное — базовая (по правилам — Сила, но её
 * можно сменить в настройках листа).
 * @param document - лист персонажа
 * @param item - оружие из снаряжения
 * @param proficiencyBonus - бонус мастерства
 */
export function getWeaponAttack(
  document: SheetDocument,
  item: SheetItem,
  proficiencyBonus: number,
): WeaponAttack | null {
  const { weapon } = item;

  if (!weapon) {
    return null;
  }

  const base = getModifierOf(
    document.abilities,
    document.weaponAttackAbility ?? DEFAULT_WEAPON_ATTACK_ABILITY,
  );

  const dexterity = getModifierOf(document.abilities, 'DEXTERITY');

  let abilityModifier = base;

  if (weapon.isRanged) {
    abilityModifier = dexterity;
  } else if (weapon.isFinesse) {
    abilityModifier = Math.max(base, dexterity);
  }

  const damageBonus = abilityModifier + weapon.bonus;

  const damageModifier = damageBonus
    ? ` ${damageBonus < 0 ? MINUS_SIGN : '+'} ${Math.abs(damageBonus)}`
    : '';

  return {
    id: item.id,
    name: item.name,
    url: item.url,
    attackBonus:
      abilityModifier
      + weapon.bonus
      + (weapon.isProficient ? proficiencyBonus : 0),
    damage: weapon.damage ? `${weapon.damage}${damageModifier}` : '',
    damageType: weapon.damageType,
  };
}

/**
 * Атаки всем оружием из снаряжения.
 * @param document - лист персонажа
 * @param proficiencyBonus - бонус мастерства
 */
export function getWeaponAttacks(
  document: SheetDocument,
  proficiencyBonus: number,
): Array<WeaponAttack> {
  return document.inventory.flatMap((item) => {
    const attack = getWeaponAttack(document, item, proficiencyBonus);

    return attack ? [attack] : [];
  });
}

/**
 * Сложность спасброска от заклинаний; null — базовая характеристика не выбрана.
 * @param document - лист персонажа
 * @param proficiencyBonus - бонус мастерства
 */
export function getSpellSaveDc(
  document: SheetDocument,
  proficiencyBonus: number,
): number | null {
  const ability = document.spellcastingAbility;

  return ability
    ? SPELL_SAVE_DC_BASE
        + proficiencyBonus
        + getModifierOf(document.abilities, ability)
    : null;
}

/**
 * Бонус атаки заклинанием; null — базовая характеристика не выбрана.
 * @param document - лист персонажа
 * @param proficiencyBonus - бонус мастерства
 */
export function getSpellAttackBonus(
  document: SheetDocument,
  proficiencyBonus: number,
): number | null {
  const ability = document.spellcastingAbility;

  return ability
    ? proficiencyBonus + getModifierOf(document.abilities, ability)
    : null;
}

/**
 * Ячейки строки таблицы класса: «—» — ноль.
 * @param cells - ячейки 1–N кругов текстом
 */
export function parseSpellSlotCells(cells: ReadonlyArray<string>): number[] {
  return cells.map((cell) => {
    const value = Number.parseInt(cell, 10);

    return cell === CLASS_TABLE_EMPTY || Number.isNaN(value) ? 0 : value;
  });
}

/**
 * Значение колонки таблицы класса на уровне; колонки нет — null.
 * @param columns - колонки таблицы класса
 * @param name - название колонки
 * @param level - уровень класса
 */
export function getClassColumnValue(
  columns: ReadonlyArray<ClassTableColumn>,
  name: string,
  level: number,
): number | null {
  const column = columns.find((candidate) => candidate.name === name);

  return column ? (column.levels[level - 1] ?? null) : null;
}

/**
 * Магия договора по таблице класса; у класса без неё — null.
 * @param columns - колонки таблицы класса
 * @param level - уровень класса
 */
export function getPactMagic(
  columns: ReadonlyArray<ClassTableColumn>,
  level: number,
): PactMagic | null {
  const slots = getClassColumnValue(columns, PACT_MAGIC_COLUMNS.slots, level);

  const slotLevel = getClassColumnValue(
    columns,
    PACT_MAGIC_COLUMNS.level,
    level,
  );

  return slots && slotLevel ? { slots, level: slotLevel } : null;
}

/**
 * Наибольшие ячейки 1–9 кругов персонажа. Один заклинательный класс — ячейки
 * его таблицы; несколько — таблица мультикласса по сумме уровней заклинателя
 * (PHB, гл. 6). Магия договора считается отдельно.
 * @param progressions - заклинательные данные классов
 */
export function getSpellSlotsMax(
  progressions: ReadonlyArray<ClassProgression>,
): number[] {
  const casters = progressions.filter((progression) =>
    progression.spellSlots.some((slots) => slots > 0),
  );

  let slots: ReadonlyArray<number> = [];

  if (casters.length === 1) {
    slots = casters[0]?.spellSlots ?? [];
  } else if (casters.length > 1) {
    const casterLevel = casters.reduce((sum, progression) => {
      const divider = CASTER_LEVEL_DIVIDER[progression.maxSlotLevel] ?? 0;

      return divider ? sum + Math.floor(progression.level / divider) : sum;
    }, 0);

    slots = MULTICLASS_SPELL_SLOTS[casterLevel - 1] ?? [];
  }

  return range(SPELL_SLOT_LEVELS).map((index) => slots[index] ?? 0);
}

/**
 * Магия договора персонажа: по первому классу, у которого она есть.
 * @param progressions - заклинательные данные классов
 */
export function getCharacterPactMagic(
  progressions: ReadonlyArray<ClassProgression>,
): PactMagic | null {
  return progressions.find((progression) => progression.pact)?.pact ?? null;
}

/**
 * Характеристики из текста спасбросков класса: «Сила, Телосложение».
 * @param text - спасброски текстом
 */
export function parseSavingThrows(
  text: string | null | undefined,
): AbilityKey[] {
  if (!text) {
    return [];
  }

  const normalized = text.toLowerCase();

  return ABILITY_KEYS.filter((key) =>
    normalized.includes(ABILITY_LABELS[key].name.toLowerCase()),
  );
}

/**
 * Навык по русскому названию из справочника; незнакомое название — null.
 * @param name - название навыка
 */
export function findSkillByName(name: string): SkillKey | null {
  const normalized = name.trim().toLowerCase();

  return (
    SKILL_KEYS.find((key) =>
      SKILL_INFO[key].names.some(
        (candidate) => candidate.toLowerCase() === normalized,
      ),
    ) ?? null
  );
}

/**
 * Навык по ключу перечисления бэкенда; незнакомый ключ — null.
 * @param value - ключ, например `STEALTH`
 */
export function toSkillKey(value: string): SkillKey | null {
  return SKILL_KEYS.find((key) => key === value) ?? null;
}

/**
 * Характеристика по ключу перечисления бэкенда; выбор («к другой») — null.
 * @param value - ключ, например `STRENGTH`
 */
export function toAbilityKey(
  value: string | null | undefined,
): AbilityKey | null {
  return ABILITY_KEYS.find((key) => key === value) ?? null;
}

/**
 * Кость хитов из подписи класса: «к10» → 10.
 * @param dice - подпись кости
 */
export function parseHitDie(dice: string | null | undefined): number | null {
  const value = Number.parseInt((dice ?? '').replace(/\D/g, ''), 10);

  return Number.isNaN(value) ? null : value;
}

/**
 * Кости хитов по размеру: всего по уровням классов и дополнительным костям,
 * сколько потрачено.
 * @param document - лист персонажа
 */
export function getHitDiceTotals(document: SheetDocument): Array<HitDiceTotal> {
  const totals = new Map<number, number>();

  for (const sheetClass of document.classes) {
    totals.set(
      sheetClass.hitDie,
      (totals.get(sheetClass.hitDie) ?? 0) + sheetClass.level,
    );
  }

  // Дополнительные кости тратятся вместе с костями того же размера
  for (const extra of document.extraHitDice) {
    totals.set(extra.die, (totals.get(extra.die) ?? 0) + extra.count);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => right - left)
    .map(([die, total]) => ({
      die,
      total,
      used: Math.min(document.hitDiceUsed[String(die)] ?? 0, total),
    }));
}

/**
 * Хиты первого уровня класса: максимум кости и модификатор Телосложения.
 * @param hitDie - кость хитов
 * @param constitutionModifier - модификатор Телосложения
 */
export function getFirstLevelHitPoints(
  hitDie: number,
  constitutionModifier: number,
): number {
  return Math.max(1, hitDie + constitutionModifier);
}

/**
 * Средние хиты за уровень: половина кости + 1 и модификатор Телосложения.
 * @param hitDie - кость хитов
 * @param constitutionModifier - модификатор Телосложения
 */
export function getAverageLevelHitPoints(
  hitDie: number,
  constitutionModifier: number,
): number {
  return Math.max(1, hitDie / 2 + HIT_DIE_AVERAGE_BONUS + constitutionModifier);
}

/**
 * Средний максимум хитов по классам: первый уровень первого класса — максимум
 * кости, остальные — среднее.
 * @param document - лист персонажа
 */
export function getSuggestedMaxHitPoints(document: SheetDocument): number {
  const constitution = getModifierOf(document.abilities, 'CONSTITUTION');

  return document.classes.reduce((sum, sheetClass, classIndex) => {
    const average = getAverageLevelHitPoints(sheetClass.hitDie, constitution);

    if (classIndex === 0) {
      return (
        sum
        + getFirstLevelHitPoints(sheetClass.hitDie, constitution)
        + average * (sheetClass.level - 1)
      );
    }

    return sum + average * sheetClass.level;
  }, 0);
}

/**
 * Характеристики с бонусами новой расы вместо бонусов прежней.
 * @param abilities - текущие значения
 * @param previous - бонусы прежней расы
 * @param next - бонусы новой расы
 */
export function replaceRaceBonuses(
  abilities: AbilityScores,
  previous: AbilityBonuses,
  next: AbilityBonuses,
): AbilityScores {
  const result = { ...abilities };

  for (const key of ABILITY_KEYS) {
    result[key] = clamp(
      abilities[key] - (previous[key] ?? 0) + (next[key] ?? 0),
      ABILITY_SCORE.min,
      ABILITY_SCORE.max,
    );
  }

  return result;
}

/**
 * Бонусы расы к характеристикам из записи справочника; выборы («к другой»)
 * игрок распределяет сам.
 * @param abilities - бонусы из справочника
 */
export function getRaceAbilityBonuses(
  abilities: ReadonlyArray<{ key?: string | null; value?: number | null }>,
): AbilityBonuses {
  const bonuses: AbilityBonuses = {};

  for (const ability of abilities) {
    const key = toAbilityKey(ability.key);

    if (key && ability.value) {
      bonuses[key] = (bonuses[key] ?? 0) + ability.value;
    }
  }

  return bonuses;
}

/**
 * Подпись классов для карточки: «Воин 3 / Волшебник 2».
 * @param classes - классы персонажа
 */
export function getClassesLabel(classes: ReadonlyArray<SheetClass>): string {
  if (!classes.length) {
    return SHEET_TEXT.noClass;
  }

  return classes
    .map((sheetClass) => `${sheetClass.name} ${sheetClass.level}`)
    .join(' / ');
}

/**
 * Подпись листа для карточки: раса и классы.
 * @param sheet - лист персонажа
 */
export function getSheetSummary(sheet: CharacterSheet): string {
  return [sheet.data.race?.name, getClassesLabel(sheet.data.classes)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Размер по подписи карточки расы: «Средний», «Маленький или Средний» — берётся
 * первый упомянутый.
 * @param text - подпись размера
 */
export function findSheetSize(
  text: string | null | undefined,
): SheetSize | null {
  const lower = text?.toLowerCase() ?? '';

  let found: SheetSize | null = null;
  let foundAt = Number.POSITIVE_INFINITY;

  for (const key of SHEET_SIZE_KEYS) {
    const position = lower.indexOf(SHEET_SIZE_INFO[key].name.toLowerCase());

    if (position !== -1 && position < foundAt) {
      found = key;
      foundAt = position;
    }
  }

  return found;
}
