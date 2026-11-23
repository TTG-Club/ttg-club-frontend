import type { ActiveEffect } from '~active-effects/model';

import type { CatalogMechanics } from './mechanics';
import type {
  AbilityBonuses,
  SheetDocument,
  SheetSource,
  SheetSpell,
  SourceKind,
} from './schema';

import { clamp } from 'es-toolkit';

import {
  getSourceAbilityIncreases,
  getSourceAbilityLimit,
  getSourceChoices,
  getSourceGrantedProficiencies,
  getSourceLevel,
} from './choices';
import { ABILITY_KEYS, ABILITY_SCORE } from './constants';
import { syncSourceResources } from './counters';
import { applyProficiencyGrant, removeProficiencyGrant } from './grants';
import { createSheetElementId, toAbilityKey } from './utils';

/*
 * Источники механики на листе: добавление, пересчёт после ответа на выбор и
 * снятие. Источник применяет к листу владения (через журнал выдач),
 * прибавки к характеристикам, ресурсы своих счётчиков и заклинательную
 * характеристику; снятие забирает ровно своё — и у всех источников, которые
 * появились из его выборов (черта умения, вариант умения).
 */

/** Поля нового источника; необязательные получают пустые значения. */
export interface SourceDraft {
  kind: SourceKind;
  name: string;
  url?: string | null;
  parentId?: string | null;
  choiceKey?: string | null;
  classId?: string | null;
  level?: number | null;
  characterLevel?: number | null;
  mechanics?: CatalogMechanics;
  activeEffects?: Array<ActiveEffect>;
  choiceAnswers?: Record<string, Array<string>>;
}

/**
 * Новый источник механики.
 * @param draft - поля источника
 */
export function createSource(draft: SourceDraft): SheetSource {
  return {
    id: createSheetElementId(),
    kind: draft.kind,
    name: draft.name,
    url: draft.url ?? null,
    parentId: draft.parentId ?? null,
    choiceKey: draft.choiceKey ?? null,
    classId: draft.classId ?? null,
    level: draft.level ?? null,
    characterLevel: draft.characterLevel ?? null,
    mechanics: draft.mechanics ?? null,
    activeEffects: draft.activeEffects ?? [],
    disabledEffects: [],
    choiceAnswers: draft.choiceAnswers ?? {},
    abilityIncreases: {},
  };
}

/**
 * Источник листа по идентификатору.
 * @param document - лист персонажа
 * @param id - идентификатор источника
 */
export function findSource(
  document: SheetDocument,
  id: string,
): SheetSource | undefined {
  return document.sources.find((source) => source.id === id);
}

/**
 * Меняет источник листа.
 * @param document - лист персонажа
 * @param id - идентификатор источника
 * @param change - новый источник из текущего
 */
function patchSource(
  document: SheetDocument,
  id: string,
  change: (source: SheetSource) => SheetSource,
): SheetDocument {
  return {
    ...document,
    sources: document.sources.map((source) =>
      source.id === id ? change(source) : source,
    ),
  };
}

/**
 * Характеристики после замены прибавок источника: прежние снимаются, новые
 * применяются с пределом. Применённое число запоминается — снятие вернёт
 * ровно его, даже если прибавка упёрлась в предел.
 * @param document - лист персонажа
 * @param source - источник механики
 */
function applySourceAbilityIncreases(
  document: SheetDocument,
  source: SheetSource,
): SheetDocument {
  const wanted = getSourceAbilityIncreases(source);
  const limit = getSourceAbilityLimit(source);
  const abilities = { ...document.abilities };
  const applied: AbilityBonuses = {};

  for (const key of ABILITY_KEYS) {
    const reverted = abilities[key] - (source.abilityIncreases[key] ?? 0);
    const increase = wanted[key] ?? 0;

    const next = increase
      ? Math.max(reverted, Math.min(reverted + increase, limit))
      : reverted;

    abilities[key] = clamp(next, ABILITY_SCORE.min, ABILITY_SCORE.max);

    if (next !== reverted) {
      applied[key] = next - reverted;
    }
  }

  return patchSource({ ...document, abilities }, source.id, (current) => ({
    ...current,
    abilityIncreases: applied,
  }));
}

/**
 * Заклинательная характеристика из источника, если у листа её ещё нет: из
 * выдачи заклинаний механики или из ответа на выбор характеристики.
 * @param document - лист персонажа
 * @param source - источник механики
 */
function applySourceSpellcastingAbility(
  document: SheetDocument,
  source: SheetSource,
): SheetDocument {
  if (document.spellcastingAbility) {
    return document;
  }

  const choice = getSourceChoices(
    source,
    getSourceLevel(document, source),
  ).find((candidate) => candidate.kind === 'spellcastingAbility');

  const ability =
    toAbilityKey(source.mechanics?.spells?.spellcastingAbility)
    ?? toAbilityKey(choice ? source.choiceAnswers[choice.key]?.[0] : null);

  return ability ? { ...document, spellcastingAbility: ability } : document;
}

/**
 * Применяет источник к листу заново: владения, прибавки к характеристикам,
 * ресурсы и заклинательную характеристику.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 */
export function applySource(
  document: SheetDocument,
  sourceId: string,
): SheetDocument {
  const source = findSource(document, sourceId);

  if (!source) {
    return document;
  }

  const granted = applyProficiencyGrant(
    document,
    source.id,
    getSourceGrantedProficiencies(document, source),
  );

  const withAbilities = applySourceAbilityIncreases(granted, source);
  const current = findSource(withAbilities, sourceId) ?? source;

  return applySourceSpellcastingAbility(
    syncSourceResources(withAbilities, current),
    current,
  );
}

/**
 * Добавляет источники и применяет их по порядку.
 * @param document - лист персонажа
 * @param sources - новые источники
 */
export function addSources(
  document: SheetDocument,
  sources: ReadonlyArray<SheetSource>,
): SheetDocument {
  return sources.reduce(
    (current, source) =>
      applySource(
        { ...current, sources: [...current.sources, source] },
        source.id,
      ),
    document,
  );
}

/**
 * Источник и все, кто появился из его выборов, — по цепочке родителей.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 */
export function getSourceTree(
  document: SheetDocument,
  sourceId: string,
): Array<string> {
  const ids = [sourceId];

  for (let index = 0; index < ids.length; index++) {
    const parentId = ids[index];

    for (const source of document.sources) {
      if (source.parentId === parentId && !ids.includes(source.id)) {
        ids.push(source.id);
      }
    }
  }

  return ids;
}

/**
 * Снимает источники и всё, что появилось из их выборов: владения, прибавки
 * к характеристикам, ресурсы и заклинания.
 * @param document - лист персонажа
 * @param sourceIds - идентификаторы источников
 */
export function removeSources(
  document: SheetDocument,
  sourceIds: ReadonlyArray<string>,
): SheetDocument {
  const ids = new Set(sourceIds.flatMap((id) => getSourceTree(document, id)));

  const stripped = [...ids].reduce((current, id) => {
    const source = findSource(current, id);

    if (!source) {
      return current;
    }

    const abilities = { ...current.abilities };

    for (const key of ABILITY_KEYS) {
      abilities[key] = clamp(
        abilities[key] - (source.abilityIncreases[key] ?? 0),
        ABILITY_SCORE.min,
        ABILITY_SCORE.max,
      );
    }

    return { ...removeProficiencyGrant(current, id), abilities };
  }, document);

  return {
    ...stripped,
    sources: stripped.sources.filter((source) => !ids.has(source.id)),
    resources: stripped.resources.filter(
      (resource) => !resource.sourceId || !ids.has(resource.sourceId),
    ),
    spells: stripped.spells.filter(
      (spell) => !spell.sourceId || !ids.has(spell.sourceId),
    ),
  };
}

/**
 * Меняет ответ на выбор источника и применяет источник заново. Источники,
 * появившиеся из прежнего ответа и не названные в новом, снимаются.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 * @param key - ключ выбора
 * @param values - выбранные значения
 */
export function setSourceAnswers(
  document: SheetDocument,
  sourceId: string,
  key: string,
  values: ReadonlyArray<string>,
): SheetDocument {
  const orphans = document.sources
    .filter(
      (source) =>
        source.parentId === sourceId
        && source.choiceKey === key
        && !values.includes(source.url ?? ''),
    )
    .map((source) => source.id);

  const answered = patchSource(
    removeSources(document, orphans),
    sourceId,
    (source) => ({
      ...source,
      choiceAnswers: { ...source.choiceAnswers, [key]: [...values] },
    }),
  );

  return applySource(answered, sourceId);
}

/**
 * Заменяет заклинания выбора источника: снятые ответом уходят, новые
 * добавляются с пометкой источника.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 * @param removedUrls - адреса заклинаний, снятых с ответа
 * @param added - новые заклинания
 */
export function replaceSourceSpells(
  document: SheetDocument,
  sourceId: string,
  removedUrls: ReadonlyArray<string>,
  added: ReadonlyArray<SheetSpell>,
): SheetDocument {
  const kept = document.spells.filter(
    (spell) =>
      spell.sourceId !== sourceId || !removedUrls.includes(spell.url ?? ''),
  );

  const fresh = added.filter(
    (spell) =>
      !kept.some(
        (candidate) =>
          candidate.sourceId === sourceId && candidate.url === spell.url,
      ),
  );

  return {
    ...document,
    spells: [...kept, ...fresh.map((spell) => ({ ...spell, sourceId }))],
  };
}

/**
 * Включает или выключает эффект источника.
 * @param document - лист персонажа
 * @param sourceId - идентификатор источника
 * @param effectId - идентификатор эффекта
 */
export function toggleSourceEffect(
  document: SheetDocument,
  sourceId: string,
  effectId: string,
): SheetDocument {
  return patchSource(document, sourceId, (source) => ({
    ...source,
    disabledEffects: source.disabledEffects.includes(effectId)
      ? source.disabledEffects.filter((id) => id !== effectId)
      : [...source.disabledEffects, effectId],
  }));
}

/**
 * Применяет все источники заново — после смены уровня, когда растут
 * количества выборов и максимумы ресурсов.
 * @param document - лист персонажа
 */
export function reapplySources(document: SheetDocument): SheetDocument {
  return document.sources.reduce(
    (current, source) => applySource(current, source.id),
    document,
  );
}
