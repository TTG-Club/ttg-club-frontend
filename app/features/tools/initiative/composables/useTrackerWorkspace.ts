import type { MaybeRefOrGetter } from 'vue';

import type {
  AddParticipantRequest,
  Tracker,
  UpdateParticipantRequest,
} from '../model';

import { getErrorStatus } from '~user/model';

import {
  countParticipants,
  deleteTracker,
  getTrackerErrorMessage,
  INITIATIVE_LIMIT,
  INITIATIVE_TEXT,
  requestTracker,
  TRACKER_LOST_STATUSES,
} from '../model';
import { useTrackerSlot } from './useTrackerSlot';

/**
 * Один трекер и все действия над ним. Любой ответ бэкенда — полное
 * состояние трекера, поэтому после действия оно просто заменяется. Гость
 * передаёт ключ доступа из localStorage.
 * @param trackerId - идентификатор трекера
 */
export function useTrackerWorkspace(trackerId: MaybeRefOrGetter<string>) {
  const toast = useToast();
  const { getAccessKey, clearSlot } = useTrackerSlot();

  const id = computed(() => toValue(trackerId));
  const accessKey = computed(() => getAccessKey(id.value));
  const isGuest = computed(() => !!accessKey.value);

  const tracker = shallowRef<Tracker>();
  const isLoading = ref(false);
  const isMutating = ref(false);

  /** HTTP-статус ошибки загрузки; `0` — ошибка без статуса. */
  const errorStatus = ref<number>();

  const isActive = computed(() => tracker.value?.status === 'ACTIVE');
  const participants = computed(() => tracker.value?.participants ?? []);

  const canAddPlayer = computed(
    () =>
      countParticipants(participants.value, 'PLAYER')
      < INITIATIVE_LIMIT.players,
  );

  const remainingCreatures = computed(() =>
    Math.max(
      0,
      INITIATIVE_LIMIT.creatures
        - countParticipants(participants.value, 'CREATURE'),
    ),
  );

  const hasCreatures = computed(
    () => remainingCreatures.value < INITIATIVE_LIMIT.creatures,
  );

  /**
   * Ключ гостя больше не подходит или трекер удалён: забываем слот, чтобы
   * страница инструмента не отправляла обратно.
   * @param status - HTTP-статус ошибки
   */
  function forgetLostSlot(status: number | undefined): void {
    if (status && isGuest.value && TRACKER_LOST_STATUSES.includes(status)) {
      clearSlot();
    }
  }

  async function load(): Promise<void> {
    isLoading.value = true;
    errorStatus.value = undefined;
    tracker.value = undefined;

    try {
      tracker.value = await requestTracker(id.value, {
        accessKey: accessKey.value,
      });
    } catch (error) {
      const status = getErrorStatus(error);

      forgetLostSlot(status);
      errorStatus.value = status ?? 0;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выполняет действие и показывает трекер из ответа.
   * @param action - действие, возвращающее состояние трекера
   * @param title - текст ошибки
   * @returns удалось ли действие
   */
  async function run(
    action: () => Promise<Tracker>,
    title: string,
  ): Promise<boolean> {
    isMutating.value = true;

    try {
      tracker.value = await action();

      return true;
    } catch (error) {
      const status = getErrorStatus(error);

      forgetLostSlot(status);

      toast.add({
        title: getTrackerErrorMessage(title, error),
        color: 'error',
      });

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Запрос действия над текущим трекером.
   * @param path - путь действия после `/{id}`
   * @param method - метод
   * @param body - тело запроса
   */
  function request(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: object,
  ): Promise<Tracker> {
    return requestTracker(id.value, {
      path,
      method,
      body,
      accessKey: accessKey.value,
    });
  }

  /**
   * Переименовывает трекер.
   * @param name - новое имя
   */
  function rename(name: string): Promise<boolean> {
    return run(() => request('', 'PUT', { name }), INITIATIVE_TEXT.errorRename);
  }

  /**
   * Добавляет игрока или существ.
   * @param body - кого добавить
   */
  function addParticipant(body: AddParticipantRequest): Promise<boolean> {
    return run(
      () => request('/participants', 'POST', body),
      INITIATIVE_TEXT.errorAdd,
    );
  }

  /**
   * Меняет участника.
   * @param participantId - идентификатор участника
   * @param patch - изменённые поля
   */
  function editParticipant(
    participantId: string,
    patch: UpdateParticipantRequest,
  ): Promise<boolean> {
    return run(
      () => request(`/participants/${participantId}`, 'PUT', patch),
      INITIATIVE_TEXT.errorEdit,
    );
  }

  /**
   * Убирает участника; если сейчас его ход, бэкенд передаёт ход дальше.
   * @param participantId - идентификатор участника
   */
  function removeParticipant(participantId: string): Promise<boolean> {
    return run(
      () => request(`/participants/${participantId}`, 'DELETE'),
      INITIATIVE_TEXT.errorEdit,
    );
  }

  /** Передаёт ход следующему; после последнего — новый раунд. */
  function next(): Promise<boolean> {
    return run(() => request('/turn/next'), INITIATIVE_TEXT.errorTurn);
  }

  /** Возвращает ход предыдущему. */
  function previous(): Promise<boolean> {
    return run(() => request('/turn/prev'), INITIATIVE_TEXT.errorTurn);
  }

  /**
   * Отмечает участника поверженным или возвращает в бой. Бэкенд не двигает
   * ход сам, поэтому если повержен тот, чей ход, ход передаётся дальше.
   * @param participantId - идентификатор участника
   * @param isDead - повержен ли
   */
  async function setDead(
    participantId: string,
    isDead: boolean,
  ): Promise<boolean> {
    const isCurrent =
      isDead
      && isActive.value
      && tracker.value?.currentParticipantId === participantId;

    const isUpdated = await editParticipant(participantId, { dead: isDead });

    if (isUpdated && isCurrent) {
      return next();
    }

    return isUpdated;
  }

  /**
   * Прокидывает инициативу одному участнику.
   * @param participantId - идентификатор участника
   */
  function rollParticipant(participantId: string): Promise<boolean> {
    return run(
      () => request(`/participants/${participantId}/roll`),
      INITIATIVE_TEXT.errorRoll,
    );
  }

  /** Прокидывает инициативу всем и начинает бой. */
  function rollAll(): Promise<boolean> {
    return run(() => request('/roll'), INITIATIVE_TEXT.errorRoll);
  }

  /**
   * Прокидывает инициативу только существам: игроки бросают сами. Отдельной
   * ручки нет, поэтому существа бросаются по одному, и каждый ответ сразу
   * показывается.
   */
  function rollCreatures(): Promise<boolean> {
    const creatureIds = participants.value
      .filter((participant) => participant.type === 'CREATURE')
      .map((participant) => participant.id);

    return run(async () => {
      let state = tracker.value;

      for (const participantId of creatureIds) {
        state = await request(`/participants/${participantId}/roll`);
        tracker.value = state;
      }

      if (!state) {
        throw new Error(INITIATIVE_TEXT.errorRoll);
      }

      return state;
    }, INITIATIVE_TEXT.errorRoll);
  }

  /** Начинает бой, не перебрасывая уже брошенное. */
  function start(): Promise<boolean> {
    return run(() => request('/start'), INITIATIVE_TEXT.errorRoll);
  }

  /** Завершает бой: броски очищаются, состав остаётся. */
  function reset(): Promise<boolean> {
    return run(() => request('/reset'), INITIATIVE_TEXT.errorReset);
  }

  /** Удаляет трекер; у гостя заодно забывается слот. */
  async function destroy(): Promise<boolean> {
    isMutating.value = true;

    try {
      const wasGuest = isGuest.value;

      await deleteTracker(id.value, accessKey.value);

      if (wasGuest) {
        clearSlot();
      }

      return true;
    } catch (error) {
      toast.add({
        title: getTrackerErrorMessage(INITIATIVE_TEXT.errorRemove, error),
        color: 'error',
      });

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    tracker,
    isGuest,
    isLoading,
    isMutating,
    errorStatus,
    isActive,
    participants,
    canAddPlayer,
    remainingCreatures,
    hasCreatures,
    load,
    rename,
    addParticipant,
    editParticipant,
    removeParticipant,
    setDead,
    rollParticipant,
    rollAll,
    rollCreatures,
    start,
    next,
    previous,
    reset,
    destroy,
  };
}
