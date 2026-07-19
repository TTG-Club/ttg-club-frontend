import { getCreatureRoute } from '@/features/initiative/model';

/**
 * Открытие статблока существа из строки трекера.
 *
 * В core-app статблок открывался overlay-дровером поверх страницы. В этом
 * проекте детальная карточка существа рассчитана на собственную страницу
 * (`/bestiary/{url}`) и свой пайплайн данных, поэтому переиспользуем её
 * напрямую — клик по строке ведёт на страницу существа (бой хранится на бэке,
 * возврат ничего не теряет). Альтернатива «в новой вкладке» есть в меню строки.
 */
export function useCreatureDrawer() {
  const router = useRouter();

  /**
   * Открывает статблок существа по его слагу из бестиария.
   * @param url Слаг существа (`participant.creatureUrl`).
   */
  function openCreature(url: string): void {
    router.push(getCreatureRoute(url));
  }

  return { openCreature };
}
