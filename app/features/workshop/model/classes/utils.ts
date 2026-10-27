import type { ClassDetail } from '~character/model';

import type { ArchetypeForm, ClassForm } from './schemas';
import type {
  ClassTableColumn,
  ClassTrait,
  WorkshopArchetype,
  WorkshopClass,
} from './types';

import { WORKSHOP_EDIT_SUFFIX, WORKSHOP_ROUTE } from '../constants';
import { toOptionalNumber, toOptionalText } from '../utils';
import {
  CLASS_DEFAULT,
  CLASS_LEVELS,
  CLASSES_REFERENCE_PATH,
  CLASSES_WORKSHOP_KEY,
  EMPTY_CLASS_TABLE_VALUE,
} from './constants';

/** Новое умение первого уровня. */
export function createClassTrait(): ClassTrait {
  return {
    name: '',
    suffix: '',
    level: CLASS_DEFAULT.level,
    description: '',
    optional: false,
    child: '',
  };
}

/** Новая колонка таблицы: пустые ячейки на всех уровнях. */
export function createClassTableColumn(): ClassTableColumn {
  return {
    name: '',
    prefix: '',
    suffix: '',
    levels: CLASS_LEVELS.map(() => EMPTY_CLASS_TABLE_VALUE),
  };
}

/**
 * Копия умений для формы.
 * @param traits - умения записи
 */
function copyTraits(traits: ReadonlyArray<ClassTrait>): Array<ClassTrait> {
  return traits.map((trait) => ({ ...trait }));
}

/**
 * Копия колонок для формы.
 * @param columns - колонки записи
 */
function copyColumns(
  columns: ReadonlyArray<ClassTableColumn>,
): Array<ClassTableColumn> {
  return columns.map((column) => ({ ...column, levels: [...column.levels] }));
}

/**
 * Умения для бэкенда: пустые суффикс и якорь не отправляются.
 * @param traits - проверенные умения
 */
function getTraitsPayload(
  traits: ReadonlyArray<ClassTrait>,
): Array<Record<string, unknown>> {
  return traits.map((trait) => ({
    ...trait,
    name: trait.name.trim(),
    suffix: toOptionalText(trait.suffix),
    description: trait.description.trim(),
    child: toOptionalText(trait.child),
  }));
}

/**
 * Колонки для бэкенда: пустая ячейка уходит нулём, его карточка покажет
 * как «—».
 * @param columns - проверенные колонки
 */
function getColumnsPayload(
  columns: ReadonlyArray<ClassTableColumn>,
): Array<Record<string, unknown>> {
  return columns.map((column) => ({
    ...column,
    name: column.name.trim(),
    prefix: toOptionalText(column.prefix),
    suffix: toOptionalText(column.suffix),
    levels: column.levels.map((value) => value ?? EMPTY_CLASS_TABLE_VALUE),
  }));
}

/**
 * Форма класса: значения старого SPA для создания или заполненная записью.
 * @param heroClass - запись справочника
 */
export function createClassForm(heroClass?: WorkshopClass): ClassForm {
  return {
    name: heroClass?.name ?? '',
    englishName: heroClass?.englishName ?? '',
    accusativeName: heroClass?.accusativeName ?? '',
    diceHp: heroClass?.diceHp ?? CLASS_DEFAULT.diceHp,
    primaryAbilities: [...(heroClass?.primaryAbilities ?? [])],
    savingThrows: heroClass?.savingThrows ?? '',
    skillAvailableCount: heroClass?.skillAvailableCount ?? 0,
    availableSkills: [...(heroClass?.availableSkills ?? [])],
    spellcasterType:
      heroClass?.spellcasterType ?? CLASS_DEFAULT.spellcasterType,
    spellAbility: heroClass?.spellAbility || undefined,
    archetypeName: heroClass?.archetypeName ?? '',
    enabledArhitypeLevel: heroClass?.enabledArhitypeLevel ?? 0,
    optionType: heroClass?.optionType || undefined,
    slotsReset: heroClass?.slotsReset || undefined,
    icon: heroClass?.icon ?? '',
    page: heroClass?.page ?? null,
    sidekick: heroClass?.sidekick ?? false,
    armor: heroClass?.armor ?? '',
    weapon: heroClass?.weapon ?? '',
    tools: heroClass?.tools ?? '',
    equipment: heroClass?.equipment ?? '',
    description: heroClass?.description ?? '',
    classTraits: copyTraits(heroClass?.classTraits ?? []),
    tableColumns: copyColumns(heroClass?.tableColumns ?? []),
  };
}

/**
 * Тело запроса сохранения класса: пустые необязательные поля не
 * отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getClassPayload(
  form: ClassForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    accusativeName: toOptionalText(form.accusativeName),
    savingThrows: toOptionalText(form.savingThrows),
    spellAbility: toOptionalText(form.spellAbility),
    archetypeName: toOptionalText(form.archetypeName),
    optionType: toOptionalText(form.optionType),
    slotsReset: toOptionalText(form.slotsReset),
    icon: toOptionalText(form.icon),
    page: toOptionalNumber(form.page),
    armor: toOptionalText(form.armor),
    weapon: toOptionalText(form.weapon),
    tools: toOptionalText(form.tools),
    equipment: toOptionalText(form.equipment),
    classTraits: getTraitsPayload(form.classTraits),
    tableColumns: getColumnsPayload(form.tableColumns),
  };
}

/**
 * Форма архетипа, заполненная записью.
 * @param archetype - архетип из мастерской
 */
export function createArchetypeForm(
  archetype: WorkshopArchetype,
): ArchetypeForm {
  return {
    name: archetype.name,
    englishName: archetype.englishName,
    genitiveName: archetype.genitiveName,
    level: archetype.level,
    spellLevelType: archetype.spellLevelType,
    page: archetype.page,
    description: archetype.description,
    traits: copyTraits(archetype.traits),
    tableColumns: copyColumns(archetype.tableColumns),
  };
}

/**
 * Тело запроса сохранения архетипа. Тип заклинателя и особенности форма
 * не меняет: они уходят такими, какими пришли, иначе бэкенд их сотрёт.
 * @param form - проверенная форма
 * @param archetype - архетип из мастерской
 */
export function getArchetypePayload(
  form: ArchetypeForm,
  archetype: WorkshopArchetype,
): Record<string, unknown> {
  return {
    ...form,
    spellcasterType: archetype.spellcasterType,
    optionType: archetype.optionType,
    genitiveName: toOptionalText(form.genitiveName),
    page: toOptionalNumber(form.page),
    traits: getTraitsPayload(form.traits),
    tableColumns: getColumnsPayload(form.tableColumns),
  };
}

/**
 * Адрес правки архетипа: `/workshop/classes/fighter/champion/edit`.
 * @param classSlug - сегмент адреса класса
 * @param archetypeSlug - сегмент адреса архетипа
 */
export function getArchetypeEditRoute(
  classSlug: string,
  archetypeSlug: string,
): string {
  return `${WORKSHOP_ROUTE}/${CLASSES_WORKSHOP_KEY}/${classSlug}/${archetypeSlug}${WORKSHOP_EDIT_SUFFIX}`;
}

/**
 * Страница архетипа в справочнике: туда ведёт отмена правки.
 * @param classSlug - сегмент адреса класса
 * @param archetypeSlug - сегмент адреса архетипа
 */
export function getArchetypeReferencePath(
  classSlug: string,
  archetypeSlug: string,
): string {
  return `${CLASSES_REFERENCE_PATH}/${classSlug}/${archetypeSlug}`;
}

/**
 * Описания умений для проверки разметки: `classTraits.0.description`.
 * @param fieldName - поле формы со списком умений
 * @param traits - умения формы
 */
function getTraitHtmlFields(
  fieldName: string,
  traits: ReadonlyArray<ClassTrait> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (traits ?? []).map((trait, index) => [
      `${fieldName}.${index}.description`,
      trait.description,
    ]),
  );
}

/**
 * HTML-поля формы класса с именами для показа ошибок.
 * @param form - состояние формы
 */
export function getClassHtmlFields(
  form: Partial<ClassForm>,
): Record<string, string> {
  return {
    armor: form.armor ?? '',
    weapon: form.weapon ?? '',
    tools: form.tools ?? '',
    equipment: form.equipment ?? '',
    description: form.description ?? '',
    ...getTraitHtmlFields('classTraits', form.classTraits),
  };
}

/**
 * HTML-поля формы архетипа с именами для показа ошибок.
 * @param form - состояние формы
 */
export function getArchetypeHtmlFields(
  form: Partial<ArchetypeForm>,
): Record<string, string> {
  return {
    description: form.description ?? '',
    ...getTraitHtmlFields('traits', form.traits),
  };
}

/**
 * Адрес архетипа в карточке класса: по нему карточка понимает, что открыт
 * архетип, а не сам класс.
 * @param entry - карточка архетипа из предпросмотра
 * @param englishName - английское название архетипа из формы
 */
export function getArchetypePreviewPath(
  entry: ClassDetail,
  englishName: string,
): string {
  const name = englishName.trim();

  return (
    entry.archetypes?.find((link) => link.name.eng === name)?.url ?? entry.url
  );
}
