import type { Tracker, TrackerListItem } from '../model';

import { getErrorStatus } from '~user/model';

import {
  createTracker,
  deleteTracker,
  fetchTrackerList,
  getTrackerErrorMessage,
  INITIATIVE_LIMIT,
  INITIATIVE_TEXT,
  requestTracker,
} from '../model';

/**
 * Бои пользователя: активные и история удалённых за один запрос. Бэкенд
 * узнаёт пользователя по cookie.
 */
export function useTrackerList() {
  const toast = useToast();

  const trackers = shallowRef<Array<TrackerListItem>>([]);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const isLoaded = ref(false);

  /** HTTP-статус ошибки загрузки; `0` — ошибка без статуса. */
  const errorStatus = ref<number>();

  const activeTrackers = computed(() =>
    trackers.value.filter((tracker) => !tracker.deleted),
  );

  const deletedTrackers = computed(() =>
    trackers.value.filter((tracker) => tracker.deleted),
  );

  const canCreate = computed(
    () => activeTrackers.value.length < INITIATIVE_LIMIT.trackers,
  );

  /**
   * Показывает ошибку с текстом бэкенда.
   * @param title - что не получилось
   * @param error - пойманная ошибка
   */
  function notify(title: string, error: unknown): void {
    toast.add({
      title: getTrackerErrorMessage(title, error),
      color: 'error',
    });
  }

  async function load(): Promise<void> {
    isLoading.value = true;
    errorStatus.value = undefined;

    try {
      trackers.value = await fetchTrackerList();
    } catch (error) {
      errorStatus.value = getErrorStatus(error) ?? 0;
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  /**
   * Выполняет изменение и перечитывает список.
   * @param action - изменение
   * @param title - текст ошибки
   * @returns удалось ли изменение
   */
  async function mutate(
    action: () => Promise<unknown>,
    title: string,
  ): Promise<boolean> {
    isMutating.value = true;

    try {
      await action();
      await load();

      return true;
    } catch (error) {
      notify(title, error);

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Создаёт трекер.
   * @param name - имя трекера
   * @returns созданный трекер или `undefined`
   */
  async function create(name = ''): Promise<Tracker | undefined> {
    let created: Tracker | undefined;

    await mutate(async () => {
      created = await createTracker(name);
    }, INITIATIVE_TEXT.errorCreate);

    return created;
  }

  /**
   * Переименовывает трекер.
   * @param id - идентификатор трекера
   * @param name - новое имя
   */
  function rename(id: string, name: string): Promise<boolean> {
    return mutate(
      () => requestTracker(id, { method: 'PUT', body: { name } }),
      INITIATIVE_TEXT.errorRename,
    );
  }

  /**
   * Убирает трекер в историю.
   * @param id - идентификатор трекера
   */
  function remove(id: string): Promise<boolean> {
    return mutate(() => deleteTracker(id), INITIATIVE_TEXT.errorRemove);
  }

  return {
    activeTrackers,
    deletedTrackers,
    canCreate,
    isLoading,
    isLoaded,
    isMutating,
    errorStatus,
    load,
    create,
    rename,
    remove,
  };
}
