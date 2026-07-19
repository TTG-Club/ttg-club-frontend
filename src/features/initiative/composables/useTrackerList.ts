import { useToast } from 'vue-toastification';

import { ToastEventBus } from '@/shared/config';

import type {
  TrackerDetailed,
  TrackerListItem,
} from '@/features/initiative/model';
import {
  createTracker,
  deleteTracker,
  fetchTrackerList,
  getTrackerErrorMessage,
  MAX_AUTHORIZED_TRACKERS,
  renameTracker,
} from '@/features/initiative/model';

/**
 * Список трекеров авторизованного пользователя: активные + история удалённых.
 *
 * За один запрос (`includeDeleted=true`) получаем весь набор и делим его на
 * активные и удалённые по флагу `deleted`. Bearer-токен подставляет серверный
 * прокси из куки.
 */
export function useTrackerList() {
  const toast = useToast(ToastEventBus);

  const trackers = ref<Array<TrackerListItem>>([]);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const loadError = ref<unknown>(null);

  const activeTrackers = computed(() =>
    trackers.value.filter((tracker) => !tracker.deleted),
  );

  const deletedTrackers = computed(() =>
    trackers.value.filter((tracker) => tracker.deleted),
  );

  const canCreate = computed(
    () => activeTrackers.value.length < MAX_AUTHORIZED_TRACKERS,
  );

  /**
   * Показывает тост с ошибкой (текст берётся из ответа бэка).
   * @param error Пойманная ошибка.
   * @param title Заголовок тоста.
   */
  function notifyError(error: unknown, title: string): void {
    const description = getTrackerErrorMessage(error);

    toast.error(description ? `${title}. ${description}` : title);
  }

  /**
   * Загружает список трекеров (включая удалённые для истории).
   */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      trackers.value = await fetchTrackerList(true);
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Создаёт трекер и обновляет список. Возвращает созданный трекер или null.
   * @param name Имя трекера (опционально).
   */
  async function create(name?: string): Promise<TrackerDetailed | null> {
    isMutating.value = true;

    try {
      const created = await createTracker(name);

      await load();

      return created;
    } catch (error) {
      notifyError(error, 'Не удалось создать трекер');

      return null;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Переименовывает трекер и обновляет список.
   * @param id Идентификатор трекера.
   * @param name Новое имя.
   */
  async function rename(id: string, name: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await renameTracker(id, name);
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось переименовать трекер');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Удаляет трекер (мягко — уходит в историю) и обновляет список.
   * @param id Идентификатор трекера.
   */
  async function remove(id: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await deleteTracker(id);
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось удалить трекер');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    trackers,
    activeTrackers,
    deletedTrackers,
    canCreate,
    isLoading,
    isMutating,
    loadError,

    load,
    create,
    rename,
    remove,
  };
}
