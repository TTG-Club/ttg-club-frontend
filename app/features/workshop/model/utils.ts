import type { WorkshopSection } from './constants';

import {
  WORKSHOP_CREATE_SUFFIX,
  WORKSHOP_EDIT_SUFFIX,
  WORKSHOP_ROUTE,
  WORKSHOP_SECTIONS,
  WORKSHOP_SLUG_SEPARATOR,
  WORKSHOP_SLUG_SPACES,
} from './constants';

/**
 * Сегмент адреса записи из английского названия, как в старом SPA:
 * `Fire Bolt` → `Fire_Bolt`.
 * @param englishName - английское название
 */
export function getWorkshopSlug(englishName: string): string {
  return englishName
    .trim()
    .replace(WORKSHOP_SLUG_SPACES, WORKSHOP_SLUG_SEPARATOR);
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
