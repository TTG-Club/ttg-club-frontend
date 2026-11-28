import type { CatalogTreeEntry, CatalogTreeSource } from '../picker';
import type { SheetDocument } from '../schema';
import type { LssCharacter } from './types';

import { z } from 'zod';

import { buildListRequest, SECTION_PAGE_SIZE_ALL } from '~section/model';

import { BACKGROUND_TREE, CLASS_TREE, RACE_TREE } from '../picker';
import { getLssParenthetical, normalizeLssName } from './convert';

/**
 * Привязка импортированного листа к справочнику: своим классу, подклассу,
 * расе и предыстории подставляются адреса записей с тем же названием. С
 * адресом класса лист берёт из справочника его таблицу (ячейки заклинаний,
 * умения), остальное уже перенесено из файла. Отказ справочника не срывает
 * импорт — лист остаётся со своими записями.
 */

/** Запись справочника, к которой привязали название. */
interface CatalogMatch {
  name: string;
  url: string;
}

/**
 * Раздел справочника целиком; ошибка — пустой список.
 * @param source - раздел
 */
async function loadTree(
  source: CatalogTreeSource,
): Promise<Array<CatalogTreeEntry>> {
  try {
    const api = useApi();

    const links = z.array(source.schema).parse(
      await api(source.listUrl, {
        method: 'POST',
        body: buildListRequest({ page: 0, size: SECTION_PAGE_SIZE_ALL }),
      }),
    );

    return links.map(source.toEntry);
  } catch {
    return [];
  }
}

/**
 * Запись по названию: точное совпадение, затем без уточнения в скобках.
 * @param entries - записи раздела
 * @param name - название из файла
 */
function findByName(
  entries: ReadonlyArray<CatalogTreeEntry>,
  name: string,
): CatalogTreeEntry | undefined {
  const target = normalizeLssName(name);

  if (!target) {
    return undefined;
  }

  return entries.find((entry) => normalizeLssName(entry.name) === target);
}

/**
 * Раса с разновидностью: «Дварф (горный)» ищется как разновидность расы
 * «Дварф» с названием «горный» или «Горный дварф».
 * @param entries - расы с разновидностями
 * @param name - название из файла
 */
function findRace(
  entries: ReadonlyArray<CatalogTreeEntry>,
  name: string,
): CatalogMatch | null {
  const race = findByName(entries, name);

  if (!race) {
    return null;
  }

  const lineage = normalizeLssName(getLssParenthetical(name));

  const subrace = lineage
    ? race.children.find((child) =>
        normalizeLssName(child.name).includes(lineage),
      )
    : undefined;

  return subrace ?? race;
}

/**
 * Подставляет адреса справочника классу, подклассу, расе и предыстории.
 * @param document - документ после разбора файла
 * @param source - персонаж LSS
 */
export async function linkLssCatalog(
  document: SheetDocument,
  source: LssCharacter,
): Promise<SheetDocument> {
  const [classes, races, backgrounds] = await Promise.all([
    source.className ? loadTree(CLASS_TREE) : Promise.resolve([]),
    source.speciesName ? loadTree(RACE_TREE) : Promise.resolve([]),
    source.backgroundName ? loadTree(BACKGROUND_TREE) : Promise.resolve([]),
  ]);

  const classEntry = findByName(classes, source.className);

  const archetype =
    classEntry && source.subclassName
      ? findByName(classEntry.children, source.subclassName)
      : undefined;

  const race = findRace(races, source.speciesName);
  const background = findByName(backgrounds, source.backgroundName);

  return {
    ...document,
    classes: document.classes.map((sheetClass, index) =>
      index === 0 && classEntry
        ? {
            ...sheetClass,
            name: classEntry.name,
            url: classEntry.url,
            archetypeName: archetype?.name ?? sheetClass.archetypeName,
            archetypeUrl: archetype?.url ?? null,
          }
        : sheetClass,
    ),
    race:
      race && document.race
        ? { name: race.name, url: race.url }
        : document.race,
    background:
      background && document.background
        ? { name: background.name, url: background.url }
        : document.background,
  };
}
