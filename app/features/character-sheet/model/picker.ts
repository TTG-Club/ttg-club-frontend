import type { z } from 'zod';

import type { TypedLink } from '~character/model';

import type { LevelUpStepResult } from './levelUp';
import type { SheetClass, SheetDocument } from './schema';
import type { CatalogOption } from './types';

import {
  CLASSES_SECTION,
  classLinkSchema,
  raceLinkSchema,
  RACES_SECTION,
} from '~character/model';

import { CATALOG_TREE_COLLATOR_LOCALE, CHARACTER_LEVEL } from './constants';
import { getHitPointGain } from './levelUp';
import { getSheetStats } from './stats';
import { createSheetElementId, getAbilityModifier } from './utils';

/** Запись дерева справочника: класс с подклассами или раса с разновидностями. */
export interface CatalogTreeEntry {
  name: string;
  url: string;
  /** Короткое название книги: PHB, XGE… */
  sourceLabel: string | null;
  /** Русское и английское название в нижнем регистре — по нему ищут. */
  searchText: string;
  children: Array<CatalogTreeEntry>;
}

/** Раздел справочника, который выбирают деревом: ручка списка, схема, запись. */
export interface CatalogTreeSource<Schema extends z.ZodType = z.ZodType> {
  listUrl: string;
  schema: Schema;
  toEntry: (entry: z.infer<Schema>) => CatalogTreeEntry;
}

/** Запись после поиска: `isChildMatch` — подошли только вложенные записи. */
export interface CatalogTreeMatch {
  entry: CatalogTreeEntry;
  isChildMatch: boolean;
}

/** Найденная запись дерева и её родитель, если она вложенная. */
export interface CatalogTreeLookup {
  entry: CatalogTreeEntry;
  parent: CatalogTreeEntry | null;
}

const collator = new Intl.Collator(CATALOG_TREE_COLLATOR_LOCALE);

/**
 * Записи по алфавиту, вложенные тоже.
 * @param entries - записи дерева
 */
export function sortCatalogTree(
  entries: ReadonlyArray<CatalogTreeEntry>,
): Array<CatalogTreeEntry> {
  return [...entries]
    .sort((left, right) => collator.compare(left.name, right.name))
    .map((entry) => ({ ...entry, children: sortCatalogTree(entry.children) }));
}

/**
 * Запись дерева из ссылки справочника.
 * @param link - ссылка на запись
 * @param children - вложенные записи
 */
function toTreeEntry(
  link: Pick<TypedLink, 'name' | 'url' | 'source'>,
  children: Array<CatalogTreeEntry>,
): CatalogTreeEntry {
  return {
    name: link.name.rus,
    url: link.url,
    sourceLabel: link.source?.shortName ?? null,
    searchText: `${link.name.rus} ${link.name.eng}`.toLocaleLowerCase(),
    children,
  };
}

/** Классы с подклассами. */
export const CLASS_TREE: CatalogTreeSource<typeof classLinkSchema> = {
  listUrl: CLASSES_SECTION.listUrl,
  schema: classLinkSchema,
  toEntry: (link) =>
    toTreeEntry(
      link,
      (link.archetypes ?? []).map((archetype) => toTreeEntry(archetype, [])),
    ),
};

/** Расы с разновидностями. */
export const RACE_TREE: CatalogTreeSource<typeof raceLinkSchema> = {
  listUrl: RACES_SECTION.listUrl,
  schema: raceLinkSchema,
  toEntry: (link) =>
    toTreeEntry(
      link,
      (link.subraces ?? []).map((subrace) => toTreeEntry(subrace, [])),
    ),
};

/**
 * Поиск по дереву без учёта регистра. Подошла запись — остаётся со всеми
 * вложенными; не подошла — остаётся, только если подошли вложенные, и с ними
 * одними.
 * @param entries - записи дерева
 * @param term - строка поиска
 */
export function filterCatalogTree(
  entries: ReadonlyArray<CatalogTreeEntry>,
  term: string,
): Array<CatalogTreeMatch> {
  const query = term.trim().toLocaleLowerCase();

  if (!query) {
    return entries.map((entry) => ({ entry, isChildMatch: false }));
  }

  return entries.flatMap<CatalogTreeMatch>((entry) => {
    if (entry.searchText.includes(query)) {
      return [{ entry, isChildMatch: false }];
    }

    const children = entry.children.filter((child) =>
      child.searchText.includes(query),
    );

    return children.length
      ? [{ entry: { ...entry, children }, isChildMatch: true }]
      : [];
  });
}

/**
 * Запись дерева по адресу вместе с родителем.
 * @param entries - записи дерева
 * @param url - адрес записи
 */
export function findCatalogTreeEntry(
  entries: ReadonlyArray<CatalogTreeEntry>,
  url: string | null,
): CatalogTreeLookup | null {
  if (!url) {
    return null;
  }

  for (const entry of entries) {
    if (entry.url === url) {
      return { entry, parent: null };
    }

    const child = entry.children.find((candidate) => candidate.url === url);

    if (child) {
      return { entry: child, parent: entry };
    }
  }

  return null;
}

/**
 * Выбранная запись дерева как запись справочника: у вложенной в подписи —
 * родитель.
 * @param lookup - найденная запись
 */
export function toCatalogOption(lookup: CatalogTreeLookup): CatalogOption {
  return {
    name: lookup.entry.name,
    url: lookup.entry.url,
    caption: lookup.parent?.name ?? '',
  };
}

/**
 * Прирост хитов своего класса: среднее кости, на первом уровне персонажа —
 * максимум.
 * @param document - лист до шага
 * @param hitDie - кость хитов
 */
function getCustomHitPointGain(
  document: SheetDocument,
  hitDie: number,
): number {
  return getHitPointGain(
    'average',
    hitDie,
    getAbilityModifier(getSheetStats(document).abilities.CONSTITUTION),
    null,
    document.classes.length === 0,
  );
}

/**
 * Шаг «свой класс первым уровнем»: класса нет в справочнике, поэтому без
 * умений и владений — только уровень и хиты.
 * @param document - лист персонажа
 * @param name - название класса
 * @param hitDie - кость хитов
 */
export function createCustomClassStep(
  document: SheetDocument,
  name: string,
  hitDie: number,
): LevelUpStepResult {
  const newClass: SheetClass = {
    id: createSheetElementId(),
    name,
    url: null,
    archetypeName: null,
    archetypeUrl: null,
    level: CHARACTER_LEVEL.min,
    hitDie,
    hitPointGains: [],
  };

  return {
    classId: newClass.id,
    newClass,
    classLevel: CHARACTER_LEVEL.min,
    hitPointGain: getCustomHitPointGain(document, hitDie),
    subclass: null,
    sources: [],
  };
}

/**
 * Шаг повышения уровня своего класса: мастер справочника ему не подходит,
 * поэтому уровень растёт сразу, хиты — по среднему кости.
 * @param document - лист персонажа
 * @param classId - класс листа
 */
export function createCustomLevelStep(
  document: SheetDocument,
  classId: string,
): LevelUpStepResult | null {
  const sheetClass = document.classes.find(
    (candidate) => candidate.id === classId,
  );

  if (!sheetClass || sheetClass.level >= CHARACTER_LEVEL.max) {
    return null;
  }

  return {
    classId,
    newClass: null,
    classLevel: sheetClass.level + 1,
    hitPointGain: getCustomHitPointGain(document, sheetClass.hitDie),
    subclass: null,
    sources: [],
  };
}
