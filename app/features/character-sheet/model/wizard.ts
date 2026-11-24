import type { SheetDocument } from './schema';
import type { AbilityKey } from './types';

import { uniq } from 'es-toolkit';

import { getSourceAbilityIncreases } from './choices';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  MULTICLASS_MIN_SCORE,
  MULTICLASS_REQUIREMENTS,
  SKILL_INFO,
  WIZARD_GRANT_LABELS,
  WIZARD_TEXT,
} from './constants';
import { findSource } from './sources';
import { getSheetStats } from './stats';

/** Строка «Что даёт» в итоге мастера. */
export interface WizardGrantRow {
  key: keyof typeof WIZARD_GRANT_LABELS;
  label: string;
  values: Array<string>;
}

/**
 * Что дали источники мастера без выборов и с уже сделанными выборами:
 * прибавки к характеристикам и владения из журнала выдач.
 * @param document - черновик мастера
 * @param sourceIds - источники, добавленные мастером
 */
export function getWizardGrantRows(
  document: SheetDocument,
  sourceIds: ReadonlyArray<string>,
): Array<WizardGrantRow> {
  const ids = new Set(sourceIds);

  const grants = document.proficiencyGrants.filter((grant) =>
    ids.has(grant.sourceId),
  );

  const increases = new Map<AbilityKey, number>();

  for (const id of sourceIds) {
    const source = findSource(document, id);

    if (!source) {
      continue;
    }

    for (const [ability, bonus] of Object.entries(
      getSourceAbilityIncreases(source),
    )) {
      const key = ABILITY_KEYS.find((candidate) => candidate === ability);

      if (key && bonus) {
        increases.set(key, (increases.get(key) ?? 0) + bonus);
      }
    }
  }

  const rows: Array<WizardGrantRow> = [
    {
      key: 'abilities',
      label: WIZARD_GRANT_LABELS.abilities,
      values: [...increases.entries()].map(
        ([ability, bonus]) =>
          `${ABILITY_LABELS[ability].name} ${bonus > 0 ? '+' : ''}${bonus}`,
      ),
    },
    {
      key: 'skills',
      label: WIZARD_GRANT_LABELS.skills,
      values: uniq(
        grants.flatMap((grant) =>
          grant.skills.map((skill) => SKILL_INFO[skill].names[0]),
        ),
      ),
    },
    {
      key: 'expertise',
      label: WIZARD_GRANT_LABELS.expertise,
      values: uniq(
        grants.flatMap((grant) =>
          grant.expertise.map((skill) => SKILL_INFO[skill].names[0]),
        ),
      ),
    },
    {
      key: 'savingThrows',
      label: WIZARD_GRANT_LABELS.savingThrows,
      values: uniq(
        grants.flatMap((grant) =>
          grant.savingThrows.map((ability) => ABILITY_LABELS[ability].name),
        ),
      ),
    },
    {
      key: 'armor',
      label: WIZARD_GRANT_LABELS.armor,
      values: uniq(grants.flatMap((grant) => grant.armor)),
    },
    {
      key: 'weapons',
      label: WIZARD_GRANT_LABELS.weapons,
      values: uniq(grants.flatMap((grant) => grant.weapons)),
    },
    {
      key: 'tools',
      label: WIZARD_GRANT_LABELS.tools,
      values: uniq(grants.flatMap((grant) => grant.tools)),
    },
    {
      key: 'languages',
      label: WIZARD_GRANT_LABELS.languages,
      values: uniq(grants.flatMap((grant) => grant.languages)),
    },
  ];

  return rows.filter((row) => row.values.length > 0);
}

/**
 * Не выполненные условия мультиклассирования класса: группы характеристик,
 * в которых ни одна не набрала 13.
 * @param document - лист
 * @param classUrl - адрес класса
 */
function getUnmetRequirements(
  document: SheetDocument,
  classUrl: string | null,
): Array<ReadonlyArray<AbilityKey>> {
  const groups = classUrl ? MULTICLASS_REQUIREMENTS[classUrl] : undefined;

  if (!groups) {
    return [];
  }

  const { abilities } = getSheetStats(document);

  return groups.filter((group) =>
    group.every((ability) => abilities[ability] < MULTICLASS_MIN_SCORE),
  );
}

/**
 * Предупреждение о мультиклассировании по правилам 2014 года: условия нужны
 * и для нового класса, и для уже взятых. Первый класс условий не требует.
 * @param document - лист
 * @param classUrl - адрес нового класса
 * @returns текст предупреждения; null — условия выполнены
 */
export function getMulticlassWarning(
  document: SheetDocument,
  classUrl: string,
): string | null {
  if (!document.classes.length) {
    return null;
  }

  const unmet = uniq(
    [classUrl, ...document.classes.map((sheetClass) => sheetClass.url)]
      .flatMap((url) => getUnmetRequirements(document, url))
      .map((group) =>
        group.map((ability) => ABILITY_LABELS[ability].name).join(' или '),
      ),
  );

  return unmet.length
    ? `${WIZARD_TEXT.multiclassWarning}: ${unmet.join(', ')}.`
    : null;
}
