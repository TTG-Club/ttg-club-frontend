import type { ScreenForm } from './schemas';
import type { WorkshopScreen } from './types';

import { getWorkshopSlug, toOptionalAmount, toOptionalText } from '../utils';
import { SCREENS_REFERENCE_PATH } from './constants';

/**
 * Форма раздела ширмы, заполненная записью.
 * @param screen - запись справочника
 */
export function createScreenForm(screen: WorkshopScreen): ScreenForm {
  return {
    name: screen.name,
    englishName: screen.englishName,
    altName: screen.altName,
    category: screen.category,
    icon: screen.icon,
    order: screen.order,
    description: screen.description,
  };
}

/**
 * Тело запроса сохранения: родитель не правится и отправляется прежним,
 * иначе раздел станет корневым.
 * @param form - проверенная форма
 * @param screen - запись справочника
 * @param source - аббревиатура книги-источника
 */
export function getScreenPayload(
  form: ScreenForm,
  screen: WorkshopScreen,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    altName: toOptionalText(form.altName),
    category: toOptionalText(form.category),
    icon: toOptionalText(form.icon),
    order: toOptionalAmount(form.order),
    description: toOptionalText(form.description),
    source: toOptionalText(source),
    parentId: screen.parent?.id,
  };
}

/**
 * Страница раздела в справочнике: туда ведёт отмена правки.
 * @param screen - запись справочника
 */
export function getScreenReferenceRoute(screen: WorkshopScreen): string {
  return `${SCREENS_REFERENCE_PATH}/${getWorkshopSlug(screen.englishName, true)}`;
}
