import { useToast } from 'vue-toastification';

import { ToastEventBus } from '@/shared/config';

import type {
  AddParticipantRequest,
  TrackerDetailed,
  UpdateParticipantRequest,
} from '@/features/initiative/model';
import {
  addParticipants,
  countParticipantsByType,
  deleteTracker,
  fetchTracker,
  getFetchStatus,
  getTrackerErrorMessage,
  MAX_CREATURES,
  MAX_PLAYERS,
  nextTurn,
  previousTurn,
  removeParticipant,
  renameTracker,
  rollParticipant as requestRollParticipant,
  resetTracker,
  rollInitiative,
  startTracker,
  updateParticipant,
} from '@/features/initiative/model';

import { useArmorClass } from './useArmorClass';
import { useHitPoints } from './useHitPoints';
import { useInitiativeStorage } from './useInitiativeStorage';

import type { MaybeRefOrGetter } from 'vue';

/**
 * Состояние одного трекера и все действия над ним.
 *
 * Любой ответ мутации — это полный `TrackerDetailed`, поэтому после каждого
 * действия просто заменяем состояние из ответа. Для анонимного владельца ключ
 * доступа (`X-Tracker-Key`) резолвится из localStorage по id трекера.
 *
 * @param trackerIdSource Идентификатор трекера (ref/getter — реагирует на смену
 * маршрута без размонтирования компонента).
 */
export function useTrackerWorkspace(trackerIdSource: MaybeRefOrGetter<string>) {
  const toast = useToast(ToastEventBus);
  const { keyForTracker, clearSlot } = useInitiativeStorage();

  const trackerId = computed(() => toValue(trackerIdSource));
  const accessKey = computed(() => keyForTracker(trackerId.value));
  const isAnonymous = computed(() => Boolean(accessKey.value));

  const tracker = ref<TrackerDetailed | null>(null);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const loadError = ref<unknown>(null);

  const isPreparing = computed(() => tracker.value?.status === 'PREPARING');
  const isActive = computed(() => tracker.value?.status === 'ACTIVE');

  const participants = computed(() => tracker.value?.participants ?? []);

  const playerCount = computed(() =>
    countParticipantsByType(participants.value, 'PLAYER'),
  );

  const creatureCount = computed(() =>
    countParticipantsByType(participants.value, 'CREATURE'),
  );

  const canAddPlayer = computed(() => playerCount.value < MAX_PLAYERS);

  const remainingCreatures = computed(() =>
    Math.max(0, MAX_CREATURES - creatureCount.value),
  );

  const canAddCreature = computed(() => remainingCreatures.value > 0);

  const {
    currentByParticipant,
    maxByParticipant,
    setHitPoints,
    setMaxHitPoints,
  } = useHitPoints(
    () => trackerId.value,
    () => participants.value,
  );

  const { armorClassByParticipant, setArmorClass } = useArmorClass(
    () => trackerId.value,
    () => participants.value,
  );

  /**
   * Показывает тост с ошибкой (текст берётся из ответа бэка).
   * @param title Заголовок действия.
   * @param error Пойманная ошибка.
   */
  function notifyError(title: string, error: unknown): void {
    const description = getTrackerErrorMessage(error);

    toast.error(description ? `${title}. ${description}` : title);
  }

  /**
   * Обрабатывает ошибку доступа: для анонима 401/403/404 = ключ невалиден или
   * трекер уже удалён. Чистим слот, чтобы лендинг не пинал обратно редиректом
   * (без слота он показывает экран сборки нового боя).
   * @param error Пойманная ошибка.
   */
  function handleAccessError(error: unknown): void {
    const status = getFetchStatus(error);
    const isStaleSlot = status === 401 || status === 403 || status === 404;

    if (isStaleSlot && isAnonymous.value) {
      clearSlot();
    }
  }

  /**
   * Загружает актуальное состояние трекера.
   */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;
    // Сбрасываем прежнее состояние: при смене id без размонтирования компонента
    // иначе на экране остаётся старый трекер (спиннер завязан на !tracker).
    tracker.value = null;

    try {
      tracker.value = await fetchTracker(trackerId.value, accessKey.value);
    } catch (error) {
      handleAccessError(error);
      loadError.value = error;
      tracker.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выполняет мутацию и перерисовывает состояние из её ответа.
   * @param action Функция мутации, возвращающая полное состояние трекера.
   * @param errorTitle Заголовок тоста при ошибке.
   */
  async function runMutation(
    action: () => Promise<TrackerDetailed>,
    errorTitle: string,
  ): Promise<boolean> {
    isMutating.value = true;

    try {
      tracker.value = await action();

      return true;
    } catch (error) {
      // Признак фиксируем ДО handleAccessError: он вызывает clearSlot(), после
      // чего computed `isAnonymous` синхронно пересчитывается в false и проверка
      // ниже стала бы мёртвой (экран восстановления не показался бы).
      const wasAnonymous = isAnonymous.value;

      handleAccessError(error);

      if (getFetchStatus(error) === 403 && wasAnonymous) {
        loadError.value = error;
        tracker.value = null;
      } else {
        notifyError(errorTitle, error);
      }

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Переименовывает трекер.
   * @param name Новое имя.
   */
  function rename(name: string): Promise<boolean> {
    return runMutation(
      () => renameTracker(trackerId.value, name, accessKey.value),
      'Не удалось переименовать трекер',
    );
  }

  /**
   * Добавляет игрока.
   * @param name Имя игрока.
   * @param initiativeBonus Бонус инициативы.
   */
  function addPlayer(name: string, initiativeBonus: number): Promise<boolean> {
    return runMutation(
      () =>
        addParticipants(
          trackerId.value,
          { type: 'PLAYER', name, initiativeBonus },
          accessKey.value,
        ),
      'Не удалось добавить игрока',
    );
  }

  /**
   * Добавляет существ пачкой.
   * @param creatureUrl Слаг существа из бестиария.
   * @param count Количество.
   * @param name Переопределение базового имени (опционально).
   */
  function addCreatures(
    creatureUrl: string,
    count: number,
    name?: string,
  ): Promise<boolean> {
    const body: AddParticipantRequest = name
      ? { type: 'CREATURE', creatureUrl, count, name }
      : { type: 'CREATURE', creatureUrl, count };

    return runMutation(
      () => addParticipants(trackerId.value, body, accessKey.value),
      'Не удалось добавить существ',
    );
  }

  /**
   * Изменяет участника (только заполненные поля).
   * @param participantId Идентификатор участника.
   * @param patch Поля для изменения.
   */
  function editParticipant(
    participantId: string,
    patch: UpdateParticipantRequest,
  ): Promise<boolean> {
    return runMutation(
      () =>
        updateParticipant(
          trackerId.value,
          participantId,
          patch,
          accessKey.value,
        ),
      'Не удалось изменить участника',
    );
  }

  /**
   * Убирает участника из трекера (полное удаление).
   * @param participantId Идентификатор участника.
   */
  function deleteParticipant(participantId: string): Promise<boolean> {
    return runMutation(
      () => removeParticipant(trackerId.value, participantId, accessKey.value),
      'Не удалось убрать участника',
    );
  }

  /**
   * Помечает участника повержённым/живым (partial PUT `{ dead }`). Повержённый
   * остаётся в списке на своей позиции, но бэк пропускает его в очереди хода.
   * Если помечаем ТЕКУЩЕГО в бою — бэк указатель не сдвигает сам, поэтому сразу
   * передаём ход дальше.
   * @param participantId Идентификатор участника.
   * @param dead Новое состояние (true — повержен, false — вернуть в бой).
   */
  async function setDead(
    participantId: string,
    dead: boolean,
  ): Promise<boolean> {
    const shouldAdvanceTurn =
      dead &&
      isActive.value &&
      tracker.value?.currentParticipantId === participantId;

    const isUpdated = await editParticipant(participantId, { dead });

    if (isUpdated && shouldAdvanceTurn) {
      await advanceTurn();
    }

    return isUpdated;
  }

  /**
   * Прокидывает инициативу конкретному участнику (перебросить одного —
   * доступно и в подготовке, и в бою).
   * @param participantId Идентификатор участника.
   */
  function rollParticipant(participantId: string): Promise<boolean> {
    return runMutation(
      () =>
        requestRollParticipant(trackerId.value, participantId, accessKey.value),
      'Не удалось прокинуть инициативу участнику',
    );
  }

  /**
   * Прокидывает инициативу всем и начинает бой (или полностью ре-роллит).
   */
  function roll(): Promise<boolean> {
    return runMutation(
      () => rollInitiative(trackerId.value, accessKey.value),
      'Не удалось прокинуть инициативу',
    );
  }

  /**
   * Прокидывает инициативу только существам — игроки кидают свои кости сами.
   * Отдельного эндпоинта на бэке нет, поэтому последовательно зовём
   * per-participant `/roll` для каждого существа: каждый ответ — полное
   * состояние трекера, промежуточные сразу показываем (кубики оживают один за
   * другим). Ошибка на середине прервёт цикл — уже брошенное останется, а
   * повторный клик просто перебросит существ заново.
   */
  function rollCreatures(): Promise<boolean> {
    const [firstCreatureId, ...restCreatureIds] = participants.value
      .filter((participant) => participant.type === 'CREATURE')
      .map((participant) => participant.id);

    // Кнопка задизейблена без существ; guard заодно сужает тип первого id.
    if (!firstCreatureId) {
      return Promise.resolve(false);
    }

    return runMutation(async () => {
      let state = await requestRollParticipant(
        trackerId.value,
        firstCreatureId,
        accessKey.value,
      );

      for (const participantId of restCreatureIds) {
        tracker.value = state;

        state = await requestRollParticipant(
          trackerId.value,
          participantId,
          accessKey.value,
        );
      }

      return state;
    }, 'Не удалось прокинуть инициативу существам');
  }

  /**
   * Начинает бой, не перебрасывая уже брошенное (ручная раздача по одному).
   */
  function startCombat(): Promise<boolean> {
    return runMutation(
      () => startTracker(trackerId.value, accessKey.value),
      'Не удалось начать бой',
    );
  }

  /**
   * Передаёт ход следующему участнику.
   */
  function advanceTurn(): Promise<boolean> {
    return runMutation(
      () => nextTurn(trackerId.value, accessKey.value),
      'Не удалось передать ход',
    );
  }

  /**
   * Возвращает ход предыдущему участнику (откат случайного «Следующего хода»).
   */
  function rewindTurn(): Promise<boolean> {
    return runMutation(
      () => previousTurn(trackerId.value, accessKey.value),
      'Не удалось вернуть ход',
    );
  }

  /**
   * Завершает бой: броски очищаются, состав сохраняется, статус — PREPARING.
   */
  function reset(): Promise<boolean> {
    return runMutation(
      () => resetTracker(trackerId.value, accessKey.value),
      'Не удалось завершить бой',
    );
  }

  /**
   * Удаляет трекер. У анонима дополнительно очищается слот localStorage.
   */
  async function destroy(): Promise<boolean> {
    isMutating.value = true;

    try {
      const wasAnonymous = isAnonymous.value;

      await deleteTracker(trackerId.value, accessKey.value);

      if (wasAnonymous) {
        clearSlot();
      }

      return true;
    } catch (error) {
      notifyError('Не удалось удалить трекер', error);

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    tracker,
    isAnonymous,
    isLoading,
    isMutating,
    loadError,

    isPreparing,
    isActive,
    participants,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    currentHitPoints: currentByParticipant,
    maxHitPoints: maxByParticipant,
    armorClasses: armorClassByParticipant,

    load,
    rename,
    addPlayer,
    addCreatures,
    editParticipant,
    deleteParticipant,
    setDead,
    rollParticipant,
    roll,
    rollCreatures,
    startCombat,
    advanceTurn,
    rewindTurn,
    reset,
    destroy,
    setHitPoints,
    setMaxHitPoints,
    setArmorClass,
  };
}
