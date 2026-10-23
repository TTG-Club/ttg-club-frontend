import type { BackgroundForm } from './schemas';
import type { PersonalizationTable, WorkshopBackground } from './types';

import { WORKSHOP_LIST_JOINER, WORKSHOP_SKILL_OPTIONS } from '../constants';
import { splitList, toOptionalText } from '../utils';
import {
  PERSONALIZATION_TEXT_COLUMN,
  PERSONALIZATION_TYPE_OPTIONS,
} from './constants';

/** Навыки предыстории: коды из списка и всё остальное текстом. */
export interface BackgroundSkills {
  values: Array<string>;
  other: string;
}

/**
 * Разбирает навыки карточки: известные названия становятся кодами,
 * остальное — «другими навыками».
 * @param names - названия из карточки
 */
export function getBackgroundSkills(names: Array<string>): BackgroundSkills {
  const values: Array<string> = [];
  const other: Array<string> = [];

  for (const name of names) {
    const normalized = name.trim().toLowerCase();

    const option = WORKSHOP_SKILL_OPTIONS.find(
      ({ label, value }) =>
        label.toLowerCase() === normalized
        || value.toLowerCase() === normalized,
    );

    if (option) {
      values.push(option.value);
    } else if (normalized) {
      other.push(name.trim());
    }
  }

  return { values, other: other.join(WORKSHOP_LIST_JOINER) };
}

/**
 * Строки таблицы персонализации из карточки: `[номер, текст]` → текст.
 * @param rows - тело таблицы
 */
export function getPersonalizationValues(
  rows: Array<Array<string>>,
): Array<string> {
  return rows.flatMap((row) => {
    const text = row[PERSONALIZATION_TEXT_COLUMN]?.trim();

    return text ? [text] : [];
  });
}

/**
 * Первая таблица персонализации, которой ещё нет у предыстории.
 * @param tables - таблицы предыстории
 */
export function findFreePersonalizationType(
  tables: ReadonlyArray<PersonalizationTable>,
): string | undefined {
  return PERSONALIZATION_TYPE_OPTIONS.find(
    ({ value }) => !tables.some((table) => table.type === value),
  )?.value;
}

/**
 * Форма предыстории: пустая для создания или заполненная записью.
 * @param background - запись справочника
 */
export function createBackgroundForm(
  background?: WorkshopBackground,
): BackgroundForm {
  return {
    name: background?.name ?? '',
    englishName: background?.englishName ?? '',
    altName: background?.altName ?? '',
    skills: [...(background?.skills ?? [])],
    otherSkills: background?.otherSkills ?? '',
    toolOwnership: background?.toolOwnership ?? '',
    equipments: background?.equipments ?? '',
    startGold: background?.startGold ?? null,
    languages: background?.languages ?? '',
    language: background?.language ?? '',
    lifeStyle: background?.lifeStyle || undefined,
    description: background?.description ?? '',
    skillName: background?.skillName ?? '',
    skillDescription: background?.skillDescription ?? '',
    personalization: background?.personalization ?? '',
    personalizationTables: (background?.personalizationTables ?? []).map(
      (table) => ({ type: table.type, values: [...table.values] }),
    ),
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются,
 * языки уходят списком.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getBackgroundPayload(
  form: BackgroundForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    otherSkills: toOptionalText(form.otherSkills),
    toolOwnership: toOptionalText(form.toolOwnership),
    equipments: toOptionalText(form.equipments),
    startGold: form.startGold ?? undefined,
    languages: splitList(form.languages),
    language: toOptionalText(form.language),
    lifeStyle: toOptionalText(form.lifeStyle),
    skillName: toOptionalText(form.skillName),
    skillDescription: toOptionalText(form.skillDescription),
    personalization: toOptionalText(form.personalization),
    personalizationTables: form.personalizationTables.map((table) => ({
      type: table.type,
      values: table.values.map((value) => value.trim()),
    })),
  };
}
