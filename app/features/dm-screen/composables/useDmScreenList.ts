import type { DmScreenDetail, DmScreenSummary, DmScreenWindow } from '../model';

import { getApiErrorMessage, getErrorStatus } from '~user/model';

import {
  createDmScreen,
  deleteDmScreen,
  DM_SCREEN_TEXT,
  fetchDmScreenList,
  renameDmScreen,
} from '../model';

/**
 * Ширмы пользователя на сервере: список, сколько создано и сколько можно,
 * создание, переименование и удаление. Пользователя сервер узнаёт по
 * cookie сессии.
 */
export function useDmScreenList() {
  const toast = useToast();

  const screens = shallowRef<Array<DmScreenSummary>>([]);
  const used = ref(0);
  const limit = ref(0);

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isMutating = ref(false);

  /** HTTP-статус ошибки загрузки; `0` — ошибка без статуса. */
  const errorStatus = ref<number>();

  const canCreate = computed(() => used.value < limit.value);

  async function load(): Promise<void> {
    isLoading.value = true;
    errorStatus.value = undefined;

    try {
      const list = await fetchDmScreenList();

      screens.value = list.items;
      used.value = list.used;
      limit.value = list.limit;
    } catch (error) {
      errorStatus.value = getErrorStatus(error) ?? 0;
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  }

  /**
   * Выполняет изменение и перечитывает список; ошибку показывает с текстом
   * сервера (например, о лимите ширм).
   * @param action - изменение
   * @param title - что не получилось
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
      toast.add({ title: getApiErrorMessage(error, title), color: 'error' });

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Создаёт ширму.
   * @param name - имя ширмы
   * @param windows - окна, с которыми ширма создаётся
   * @returns созданная ширма или `undefined`
   */
  async function create(
    name: string,
    windows: ReadonlyArray<DmScreenWindow> = [],
  ): Promise<DmScreenDetail | undefined> {
    let created: DmScreenDetail | undefined;

    await mutate(async () => {
      created = await createDmScreen(name, windows);
    }, DM_SCREEN_TEXT.errorCreate);

    return created;
  }

  /**
   * Переименовывает ширму.
   * @param id - идентификатор ширмы
   * @param name - новое имя
   */
  function rename(id: string, name: string): Promise<boolean> {
    return mutate(() => renameDmScreen(id, name), DM_SCREEN_TEXT.errorRename);
  }

  /**
   * Удаляет ширму.
   * @param id - идентификатор ширмы
   */
  function remove(id: string): Promise<boolean> {
    return mutate(() => deleteDmScreen(id), DM_SCREEN_TEXT.errorDelete);
  }

  return {
    screens,
    used,
    limit,
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
