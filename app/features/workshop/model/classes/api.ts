import { WORKSHOP_API_PATH } from '../constants';
import { CLASSES_WORKSHOP_KEY } from './constants';

/**
 * Архетип в виде формы мастерской: справочник отдаёт его вместе с
 * классом, а мастерская — отдельно.
 * @param classSlug - сегмент адреса класса
 * @param archetypeSlug - сегмент адреса архетипа
 */
export async function fetchWorkshopArchetype(
  classSlug: string,
  archetypeSlug: string,
): Promise<unknown> {
  return await $fetch<unknown>(
    `${WORKSHOP_API_PATH}/${CLASSES_WORKSHOP_KEY}/${classSlug}/${archetypeSlug}`,
    { method: 'POST' },
  );
}
