import type {
  SheetDocument,
  SheetItem,
  SheetProficiencyGroup,
  SheetToolProficiency,
} from './schema';

import { uniq } from 'es-toolkit';

import {
  ARMOR_PROFICIENCY_LABELS,
  UNPROFICIENT_ARMOR_ABILITIES,
  WEAPON_CATEGORY_GROUPS,
  WEAPON_CATEGORY_LABELS,
  WEAPON_PROFICIENCY_NO,
  WEAPON_PROFICIENCY_YES,
} from './constants';

/*
 * Владения листа: выданное источниками (журнал выдач) вместе со своими
 * записями игрока. По ним считаются владение оружием в атаке и доспех без
 * владения (правила 2014: помеха к броскам Силы и Ловкости, колдовать нельзя).
 *
 * Листы до журнала выдач и до списков владений ничего о владениях не знают:
 * у них оружие по-прежнему считается освоенным, а доспех — подходящим.
 */

/** Категории оружия бэкенда: простое и воинское, рукопашное и дальнобойное. */
const SIMPLE_MELEE = 'SIMPLE_MELE';
const SIMPLE_RANGED = 'SIMPLE_RANGED';
const MARTIAL_MELEE = 'WAR_MELE';
const MARTIAL_RANGED = 'WAR_RANGED';

/**
 * Название для сравнения: без регистра, лишних пробелов и различия «ё/е».
 * @param name - название
 */
export function normalizeProficiencyName(name: string): string {
  return name.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
}

/**
 * Названия владений группы: выданные источниками и свои.
 * @param document - лист персонажа
 * @param group - группа владений
 */
export function getProficiencyNames(
  document: SheetDocument,
  group: SheetProficiencyGroup,
): Array<string> {
  const granted = document.proficiencyGrants.flatMap((grant) => grant[group]);

  const manual =
    group === 'tools'
      ? document.proficiencies.tools.map((tool) => tool.name)
      : document.proficiencies[group];

  return uniq([...granted, ...manual]);
}

/**
 * Знает ли лист о владениях: есть журнал выдач или свои записи. Без этого
 * лист старый, и владения по нему не проверяются.
 * @param document - лист персонажа
 */
export function hasProficiencyData(document: SheetDocument): boolean {
  return (
    document.proficiencyGrants.length > 0
    || Object.values(document.proficiencies).some((list) => list.length > 0)
  );
}

/**
 * Набор нормализованных названий группы.
 * @param document - лист персонажа
 * @param group - группа владений
 */
function getNameSet(
  document: SheetDocument,
  group: SheetProficiencyGroup,
): Set<string> {
  return new Set(
    getProficiencyNames(document, group).map(normalizeProficiencyName),
  );
}

/**
 * Подписи групп, которые покрывают оружие: «Простое оружие» и «Простое
 * рукопашное оружие» для простого рукопашного и так далее.
 * @param isMartial - воинское оружие
 * @param isRanged - дальнобойное оружие
 */
function getWeaponGroupLabels(
  isMartial: boolean,
  isRanged: boolean,
): Array<string> {
  const [melee, ranged] = isMartial
    ? [MARTIAL_MELEE, MARTIAL_RANGED]
    : [SIMPLE_MELEE, SIMPLE_RANGED];

  const category = isRanged ? ranged : melee;

  const pair = WEAPON_CATEGORY_GROUPS.find((group) =>
    group.categories.includes(category),
  );

  return [pair?.label, WEAPON_CATEGORY_LABELS[category]].filter(
    (label): label is string => Boolean(label),
  );
}

/**
 * Владеет ли персонаж оружием: ручная отметка предмета, иначе само оружие
 * или его группа в владениях листа.
 * @param document - лист персонажа
 * @param item - оружие из снаряжения
 */
export function isWeaponProficient(
  document: SheetDocument,
  item: SheetItem,
): boolean {
  const { weapon } = item;

  if (!weapon) {
    return false;
  }

  if (weapon.proficiency === WEAPON_PROFICIENCY_YES) {
    return true;
  }

  if (weapon.proficiency === WEAPON_PROFICIENCY_NO) {
    return false;
  }

  if (!hasProficiencyData(document)) {
    return true;
  }

  const names = getNameSet(document, 'weapons');

  return [
    item.name,
    ...getWeaponGroupLabels(weapon.isMartial, weapon.isRanged),
  ].some((name) => names.has(normalizeProficiencyName(name)));
}

/**
 * Владеет ли персонаж доспехом или щитом: группа его категории в владениях
 * листа («Лёгкие доспехи», «Щиты») или сам предмет по названию.
 * @param document - лист персонажа
 * @param item - доспех или щит из снаряжения
 */
export function isArmorProficient(
  document: SheetDocument,
  item: SheetItem,
): boolean {
  if (!item.armor || !hasProficiencyData(document)) {
    return true;
  }

  const names = getNameSet(document, 'armor');
  const label = ARMOR_PROFICIENCY_LABELS[item.armor.category];

  return [item.name, label].some(
    (name) => name !== undefined && names.has(normalizeProficiencyName(name)),
  );
}

/**
 * Надетые доспехи и щиты, которыми персонаж не владеет.
 * @param document - лист персонажа
 */
export function getUnproficientArmor(
  document: SheetDocument,
): Array<SheetItem> {
  return document.inventory.filter(
    (item) =>
      item.isEquipped
      && item.armor
      && item.quantity > 0
      && !isArmorProficient(document, item),
  );
}

/**
 * Флаги доспеха без владения: помеха к проверкам, спасброскам и атакам
 * Силы и Ловкости. Атаки помечаются целиком: оружейные атаки идут от Силы
 * или Ловкости, а заклинания в таком доспехе не накладываются.
 * @param flags - уже собранные флаги
 * @param isUnproficient - надет доспех без владения
 */
export function withUnproficientArmorFlags(
  flags: ReadonlySet<string>,
  isUnproficient: boolean,
): ReadonlySet<string> {
  if (!isUnproficient) {
    return flags;
  }

  return new Set([
    ...flags,
    'attack.disadvantage',
    ...UNPROFICIENT_ARMOR_ABILITIES.flatMap((ability) => [
      `abilityCheck.disadvantage.${ability}`,
      `save.disadvantage.${ability}`,
    ]),
  ]);
}

/**
 * Своё владение инструментом без повторов по названию.
 * @param tools - свои инструменты
 * @param tool - добавляемый инструмент
 */
export function addToolProficiency(
  tools: ReadonlyArray<SheetToolProficiency>,
  tool: SheetToolProficiency,
): Array<SheetToolProficiency> {
  const key = normalizeProficiencyName(tool.name);

  return tools.some((entry) => normalizeProficiencyName(entry.name) === key)
    ? [...tools]
    : [...tools, tool];
}
