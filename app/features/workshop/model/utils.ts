import type { WorkshopSection } from './constants';

import { getApiErrorMessage } from '~user/model';

import {
  WORKSHOP_CREATE_SUFFIX,
  WORKSHOP_EDIT_SUFFIX,
  WORKSHOP_LIST_SEPARATOR,
  WORKSHOP_NO_REQUIREMENT,
  WORKSHOP_ROUTE,
  WORKSHOP_SECTIONS,
  WORKSHOP_SLUG_SEPARATOR,
  WORKSHOP_SLUG_SPACES,
} from './constants';

/**
 * Сегмент адреса записи из английского названия, как в старом SPA:
 * `Fire Bolt` → `Fire_Bolt`.
 * @param englishName - английское название
 * @param isLowercase - привести к нижнему регистру (особенности, боги)
 */
export function getWorkshopSlug(
  englishName: string,
  isLowercase = false,
): string {
  const slug = englishName
    .trim()
    .replace(WORKSHOP_SLUG_SPACES, WORKSHOP_SLUG_SEPARATOR);

  return isLowercase ? slug.toLowerCase() : slug;
}

/**
 * Адрес раздела мастерской.
 * @param sectionKey - ключ раздела
 */
export function getWorkshopSectionRoute(sectionKey: string): string {
  return `${WORKSHOP_ROUTE}/${sectionKey}`;
}

/**
 * Адрес создания записи.
 * @param sectionKey - ключ раздела
 */
export function getWorkshopCreateRoute(sectionKey: string): string {
  return `${getWorkshopSectionRoute(sectionKey)}${WORKSHOP_CREATE_SUFFIX}`;
}

/**
 * Адрес правки записи.
 * @param sectionKey - ключ раздела
 * @param slug - сегмент адреса записи
 */
export function getWorkshopEditRoute(sectionKey: string, slug: string): string {
  return `${getWorkshopSectionRoute(sectionKey)}/${slug}${WORKSHOP_EDIT_SUFFIX}`;
}

/**
 * Раздел мастерской по ключу.
 * @param sectionKey - ключ из адреса
 */
export function findWorkshopSection(
  sectionKey: unknown,
): WorkshopSection | undefined {
  return WORKSHOP_SECTIONS.find((section) => section.key === sectionKey);
}

/**
 * Сегмент записи из параметра маршрута.
 * @param value - параметр `slug`
 */
export function getRouteSlug(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Пустую строку необязательного поля бэкенд должен получить как отсутствие
 * значения, а не как пустой текст.
 * @param value - значение поля формы
 */
export function toOptionalText(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

/**
 * Необязательное число: пустое поле или ноль бэкенд должен получить как
 * отсутствие значения.
 * @param value - значение поля формы
 */
export function toOptionalNumber(
  value: number | null | undefined,
): number | undefined {
  return value || undefined;
}

/**
 * Необязательное количество: ноль — это значение (бесплатно, невесомо), а
 * пустое поле бэкенд должен получить как отсутствие значения.
 * @param value - значение поля формы
 */
export function toOptionalAmount(
  value: number | null | undefined,
): number | undefined {
  return value ?? undefined;
}

/**
 * Требования из карточки: «Нет» в форме — пустое поле.
 * @param value - требования из карточки
 */
export function getRequirementText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';

  return trimmed === WORKSHOP_NO_REQUIREMENT ? '' : trimmed;
}

/**
 * Список из строки через запятую, без пустых элементов.
 * @param text - «Общий, Эльфийский»
 */
export function splitList(text: string): Array<string> {
  return text
    .split(WORKSHOP_LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Причина ошибки бэкенда для уведомления. HTML-страница ошибки (ответ
 * прокси) в причину не выводится.
 * @param error - пойманная ошибка
 */
export function getWorkshopErrorReason(error: unknown): string | undefined {
  const reason = getApiErrorMessage(error, '').trim();

  return reason && !reason.startsWith('<') ? reason : undefined;
}

/**
 * Вкладка редактора, на которой лежит поле. Поля списков вида
 * `classTraits.2.name` ищутся по корню.
 * @param fieldTabs - вкладки полей формы
 * @param fieldName - имя поля из ошибки проверки
 */
export function getWorkshopFieldTab(
  fieldTabs: Readonly<Record<string, string>>,
  fieldName: string,
): string | undefined {
  const [rootField = fieldName] = fieldName.split('.');

  return fieldTabs[rootField];
}

/**
 * Номера элементов списка, в полях которых есть ошибки.
 * @param fieldNames - имена полей с ошибками
 * @param listField - поле формы со списком
 */
export function getWorkshopErrorIndexes(
  fieldNames: Array<string>,
  listField: string,
): Array<number> {
  const prefix = `${listField}.`;

  return fieldNames.flatMap((fieldName) => {
    if (!fieldName.startsWith(prefix)) {
      return [];
    }

    const index = Number.parseInt(fieldName.slice(prefix.length), 10);

    return Number.isNaN(index) ? [] : [index];
  });
}

/**
 * Номера раскрытых элементов после удаления одного из них: следующие
 * сдвигаются на его место, иначе раскрытым оказался бы сосед.
 * @param indexes - номера раскрытых элементов
 * @param removedIndex - номер удалённого элемента
 */
export function shiftIndexesAfterRemoval(
  indexes: ReadonlySet<number>,
  removedIndex: number,
): Set<number> {
  return new Set(
    [...indexes]
      .filter((index) => index !== removedIndex)
      .map((index) => (index > removedIndex ? index - 1 : index)),
  );
}
