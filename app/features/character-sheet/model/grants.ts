import type { CatalogMechanics, MechanicsProficiencies } from './mechanics';
import type {
  ProficiencyGrant,
  SheetDocument,
  SkillProficiencies,
} from './schema';
import type { AbilityKey, GrantedProficiencies, SkillKey } from './types';

import { uniq } from 'es-toolkit';

import {
  ARMOR_PROFICIENCY_LABELS,
  LANGUAGE_LABELS,
  WEAPON_CATEGORY_GROUPS,
  WEAPON_CATEGORY_LABELS,
} from './constants';
import { toAbilityKey, toSkillKey } from './utils';

/*
 * Журнал выдач владений. Каждый источник (класс, умение, раса, предыстория,
 * черта) записывает, что именно он выдал; снятие источника забирает ровно
 * своё, если того же не выдаёт другой источник. Навыки и спасброски журнал
 * применяет к самому листу (отметки владения), а доспехи, оружие,
 * инструменты и языки лист показывает объединением записей журнала.
 *
 * У листов до журнала записей нет: всё отмеченное там считается ручным и
 * снятием источников не трогается.
 */

/**
 * Пустой набор владений.
 * @returns владения без единой записи
 */
export function createEmptyGrantedProficiencies(): GrantedProficiencies {
  return {
    skills: [],
    expertise: [],
    savingThrows: [],
    armor: [],
    weapons: [],
    tools: [],
    languages: [],
  };
}

/**
 * Объединение наборов владений без повторов.
 * @param parts - наборы владений
 */
export function mergeGrantedProficiencies(
  ...parts: ReadonlyArray<GrantedProficiencies>
): GrantedProficiencies {
  return {
    skills: uniq(parts.flatMap((part) => part.skills)),
    expertise: uniq(parts.flatMap((part) => part.expertise)),
    savingThrows: uniq(parts.flatMap((part) => part.savingThrows)),
    armor: uniq(parts.flatMap((part) => part.armor)),
    weapons: uniq(parts.flatMap((part) => part.weapons)),
    tools: uniq(parts.flatMap((part) => part.tools)),
    languages: uniq(parts.flatMap((part) => part.languages)),
  };
}

/**
 * Пустой ли набор владений.
 * @param granted - владения
 */
export function isGrantEmpty(granted: GrantedProficiencies): boolean {
  return Object.values(granted).every((values) => values.length === 0);
}

/**
 * Названия групп оружия по категориям бэкенда: пара «рукопашное +
 * дальнобойное» одного вида читается одной группой («Простое оружие»).
 * @param categories - категории оружия (WeaponType)
 */
export function toWeaponGroupNames(
  categories: ReadonlyArray<string>,
): Array<string> {
  const rest = new Set(categories);
  const names: Array<string> = [];

  for (const group of WEAPON_CATEGORY_GROUPS) {
    if (group.categories.every((category) => rest.has(category))) {
      names.push(group.label);
      group.categories.forEach((category) => rest.delete(category));
    }
  }

  return [
    ...names,
    ...[...rest].map(
      (category) => WEAPON_CATEGORY_LABELS[category] ?? category,
    ),
  ];
}

/**
 * Названия групп доспехов по категориям бэкенда.
 * @param categories - категории доспехов (ArmorCategory)
 */
export function toArmorGroupNames(
  categories: ReadonlyArray<string>,
): Array<string> {
  return categories.map(
    (category) => ARMOR_PROFICIENCY_LABELS[category] ?? category,
  );
}

/**
 * Название языка по ключу перечисления; незнакомый ключ — сам ключ.
 * @param key - язык (LanguageType) или название
 */
export function getLanguageLabel(key: string): string {
  return LANGUAGE_LABELS[key] ?? key;
}

/**
 * Владения без выбора из блока `proficiencies` механики.
 * @param proficiencies - блок владений записи
 */
export function toGrantedProficiencies(
  proficiencies: MechanicsProficiencies,
): GrantedProficiencies {
  if (!proficiencies) {
    return createEmptyGrantedProficiencies();
  }

  return {
    skills: (proficiencies.skills ?? []).flatMap((value) => {
      const key = toSkillKey(value);

      return key ? [key] : [];
    }),
    expertise: [],
    savingThrows: (proficiencies.savingThrows ?? []).flatMap((value) => {
      const key = toAbilityKey(value);

      return key ? [key] : [];
    }),
    armor: toArmorGroupNames(proficiencies.armorCategories ?? []),
    weapons: [
      ...toWeaponGroupNames(proficiencies.weaponCategories ?? []),
      ...(proficiencies.weapons ?? []).map((weapon) => weapon.name),
    ].filter(Boolean),
    tools: (proficiencies.tools ?? []).map((tool) => tool.name).filter(Boolean),
    languages: (proficiencies.languages ?? []).map(getLanguageLabel),
  };
}

/**
 * Владения механики записи без выбора.
 * @param mechanics - механика записи
 */
export function getMechanicsProficiencies(
  mechanics: CatalogMechanics,
): GrantedProficiencies {
  return toGrantedProficiencies(mechanics?.proficiencies ?? null);
}

/**
 * Навыки после снятия записи журнала: владение уходит, если его не выдаёт
 * никто другой; компетентность опускается до владения, когда владение
 * остаётся (выдано другим или отмечено вручную).
 * @param skills - навыки листа
 * @param removed - снимаемая запись
 * @param remaining - оставшиеся записи
 */
function stripSkills(
  skills: SkillProficiencies,
  removed: ProficiencyGrant,
  remaining: ReadonlyArray<ProficiencyGrant>,
): SkillProficiencies {
  const keptSkills = new Set(remaining.flatMap((grant) => grant.skills));
  const keptExpertise = new Set(remaining.flatMap((grant) => grant.expertise));
  const next: SkillProficiencies = { ...skills };

  for (const skill of removed.expertise) {
    if (keptExpertise.has(skill) || next[skill] !== 'expertise') {
      continue;
    }

    const keepsProficiency =
      keptSkills.has(skill) || !removed.skills.includes(skill);

    next[skill] = keepsProficiency ? 'proficient' : 'none';
  }

  for (const skill of removed.skills) {
    if (
      !keptSkills.has(skill)
      && !keptExpertise.has(skill)
      && next[skill] === 'proficient'
    ) {
      next[skill] = 'none';
    }
  }

  return next;
}

/**
 * Снимает запись журнала источника: убирает её выдачи с листа, если их не
 * выдаёт другой источник.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 */
export function removeProficiencyGrant(
  document: SheetDocument,
  sourceId: string,
): SheetDocument {
  const removed = document.proficiencyGrants.find(
    (grant) => grant.sourceId === sourceId,
  );

  if (!removed) {
    return document;
  }

  const remaining = document.proficiencyGrants.filter(
    (grant) => grant.sourceId !== sourceId,
  );

  const keptSaves = new Set(remaining.flatMap((grant) => grant.savingThrows));

  return {
    ...document,
    proficiencyGrants: remaining,
    skills: stripSkills(document.skills, removed, remaining),
    savingThrows: document.savingThrows.filter(
      (ability) =>
        keptSaves.has(ability) || !removed.savingThrows.includes(ability),
    ),
  };
}

/**
 * Записывает выдачи источника в журнал и отмечает навыки и спасброски.
 * Прежняя запись того же источника сначала снимается — так пересчёт выборов
 * не оставляет следов старого ответа.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 * @param granted - что источник выдаёт
 */
export function applyProficiencyGrant(
  document: SheetDocument,
  sourceId: string,
  granted: GrantedProficiencies,
): SheetDocument {
  const stripped = removeProficiencyGrant(document, sourceId);

  if (isGrantEmpty(granted)) {
    return stripped;
  }

  const skills: SkillProficiencies = { ...stripped.skills };

  for (const skill of granted.skills) {
    if ((skills[skill] ?? 'none') === 'none') {
      skills[skill] = 'proficient';
    }
  }

  for (const skill of granted.expertise) {
    skills[skill] = 'expertise';
  }

  return {
    ...stripped,
    proficiencyGrants: [
      ...stripped.proficiencyGrants,
      { sourceId, ...granted },
    ],
    skills,
    savingThrows: uniq([...stripped.savingThrows, ...granted.savingThrows]),
  };
}

/**
 * Все выданные журналом владения одним набором — для показа на листе.
 * @param grants - журнал выдач
 */
export function getGrantedProficiencyLists(
  grants: ReadonlyArray<ProficiencyGrant>,
): GrantedProficiencies {
  return mergeGrantedProficiencies(...grants);
}

/**
 * Выдаёт ли журнал навык (владением или компетентностью).
 * @param grants - журнал выдач
 * @param skill - навык
 */
export function isSkillGranted(
  grants: ReadonlyArray<ProficiencyGrant>,
  skill: SkillKey,
): boolean {
  return grants.some(
    (grant) => grant.skills.includes(skill) || grant.expertise.includes(skill),
  );
}

/**
 * Выдаёт ли журнал спасбросок.
 * @param grants - журнал выдач
 * @param ability - характеристика спасброска
 */
export function isSavingThrowGranted(
  grants: ReadonlyArray<ProficiencyGrant>,
  ability: AbilityKey,
): boolean {
  return grants.some((grant) => grant.savingThrows.includes(ability));
}
