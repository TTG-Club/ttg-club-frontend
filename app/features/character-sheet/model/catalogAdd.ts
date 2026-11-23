import type { SectionConfig } from '~section/model';

import type { ItemSearchKind } from './catalog';
import type { CatalogRow } from './types';

import { z } from 'zod';

import {
  armorLinkSchema,
  ARMORS_SECTION,
  itemLinkSchema,
  ITEMS_SECTION,
  MAGIC_ITEMS_SECTION,
  magicItemLinkSchema,
  weaponLinkSchema,
  WEAPONS_SECTION,
} from '~inventory/model';

import { KEYBOARD_LAYOUT_EN, KEYBOARD_LAYOUT_RU } from './constants';

/** Раздел справочника для окна добавления предметов. */
export interface CatalogAddSource {
  section: SectionConfig;
  /** Строки окна из ответа ручки списка. */
  parseRows: (raw: unknown) => Array<CatalogRow>;
}

/** Разделы справочника по виду предмета. */
export const CATALOG_ADD_SOURCES: Record<ItemSearchKind, CatalogAddSource> = {
  weapon: {
    section: WEAPONS_SECTION,
    parseRows: (raw) =>
      z
        .array(weaponLinkSchema)
        .parse(raw)
        .map((entry) => ({
          url: entry.url,
          name: entry.name.rus,
          nameEng: entry.name.eng,
          group: entry.type.name,
          groupOrder: entry.type.order,
          caption: [entry.damage?.dice, entry.damage?.type]
            .filter(Boolean)
            .join(' '),
          price: entry.price ?? '',
          source: entry.source?.shortName ?? '',
        })),
  },
  armor: {
    section: ARMORS_SECTION,
    parseRows: (raw) =>
      z
        .array(armorLinkSchema)
        .parse(raw)
        .map((entry) => ({
          url: entry.url,
          name: entry.name.rus,
          nameEng: entry.name.eng,
          group: entry.type.name,
          groupOrder: entry.type.order,
          caption: entry.armorClass ? `КД ${entry.armorClass}` : '',
          price: entry.price ?? '',
          source: entry.source?.shortName ?? '',
        })),
  },
  item: {
    section: ITEMS_SECTION,
    parseRows: (raw) =>
      z
        .array(itemLinkSchema)
        .parse(raw)
        .map((entry) => {
          const group = entry.categoryGroups?.[0];

          return {
            url: entry.url,
            name: entry.name.rus,
            nameEng: entry.name.eng,
            group: group?.name ?? '',
            groupOrder: group?.order ?? Number.MAX_SAFE_INTEGER,
            caption: '',
            price: '',
            source: entry.source?.shortName ?? '',
          };
        }),
  },
  magic: {
    section: MAGIC_ITEMS_SECTION,
    parseRows: (raw) =>
      z
        .array(magicItemLinkSchema)
        .parse(raw)
        .map((entry, index) => ({
          url: entry.url,
          name: entry.name.rus,
          nameEng: entry.name.eng,
          group: entry.rarity.name,
          // Ручка отдаёт предметы по редкости: порядок первого появления
          groupOrder: index,
          caption: entry.customization ? 'Требует настройки' : '',
          price: '',
          source: entry.source?.shortName ?? '',
        })),
  },
};

/**
 * Текст, набранный в другой раскладке: «ljcgt[» → «доспех».
 * @param text - набранный текст
 */
export function switchKeyboardLayout(text: string): string {
  return [...text]
    .map((char) => {
      const lower = char.toLowerCase();
      const index = KEYBOARD_LAYOUT_EN.indexOf(lower);

      if (index >= 0) {
        return KEYBOARD_LAYOUT_RU[index] ?? char;
      }

      const back = KEYBOARD_LAYOUT_RU.indexOf(lower);

      return back >= 0 ? (KEYBOARD_LAYOUT_EN[back] ?? char) : char;
    })
    .join('');
}

/**
 * Строки, подходящие под поиск: по русскому и английскому названию, с
 * подстановкой, если поиск набран не в той раскладке.
 * @param rows - строки окна
 * @param term - поиск
 */
export function searchCatalogRows(
  rows: ReadonlyArray<CatalogRow>,
  term: string,
): Array<CatalogRow> {
  const query = term.trim().toLowerCase();

  if (!query) {
    return [...rows];
  }

  const switched = switchKeyboardLayout(query);

  return rows.filter((row) => {
    const haystack = `${row.name} ${row.nameEng}`.toLowerCase();

    return haystack.includes(query) || haystack.includes(switched);
  });
}

/**
 * Строки группами в порядке справочника.
 * @param rows - строки окна
 */
export function groupCatalogRows(
  rows: ReadonlyArray<CatalogRow>,
): Array<{ title: string; rows: Array<CatalogRow> }> {
  const groups = new Map<string, { order: number; rows: Array<CatalogRow> }>();

  for (const row of rows) {
    const group = groups.get(row.group);

    if (group) {
      group.rows.push(row);
      group.order = Math.min(group.order, row.groupOrder);
    } else {
      groups.set(row.group, { order: row.groupOrder, rows: [row] });
    }
  }

  return [...groups.entries()]
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([title, group]) => ({ title, rows: group.rows }));
}
