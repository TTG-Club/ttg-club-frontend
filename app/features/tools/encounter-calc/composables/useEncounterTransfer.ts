import type { ComputedRef } from 'vue';

import type { EncounterCreature, EncounterTransferTracker } from '../model';

import { consola } from 'consola';

import { useTrackerSlot } from '~tools/initiative/composables';
import {
  countParticipants,
  createTracker,
  fetchTrackerList,
  getTrackerErrorMessage,
  getTrackerRoute,
  INITIATIVE_LIMIT,
  requestTracker,
  TRACKER_LOST_STATUSES,
} from '~tools/initiative/model';
import { getErrorStatus } from '~user/model';

import {
  countCustomCreatures,
  getTransferBatches,
  TRANSFER_LABELS,
} from '../model';

/** Трекер, куда пойдут существа, и ключ доступа гостя. */
interface ResolvedTracker {
  id: string;
  accessKey?: string;

  /** Сколько существ в трекере уже есть. */
  creatureCount: number;
}

/**
 * Перенос существ калькулятора столкновений в трекер инициативы: новый или
 * один из уже собранных.
 *
 * Пользователь выбирает из своих трекеров. Гость владеет одним трекером (его
 * ключ лежит в localStorage): переносить можно в него, а если его нет или он
 * пропал — в новый.
 * @param creatures Существа калькулятора.
 */
export function useEncounterTransfer(
  creatures: ComputedRef<Array<EncounterCreature>>,
) {
  const toast = useToast();
  const { isLoggedIn } = useUser();
  const { slot, saveSlot, clearSlot, getAccessKey } = useTrackerSlot();

  const trackers = ref<Array<EncounterTransferTracker>>([]);
  const isLoading = ref(false);
  const isTransferring = ref(false);
  const loadError = ref<string>();

  const batches = computed(() => getTransferBatches(creatures.value));

  const transferCount = computed(() =>
    batches.value.reduce((sum, { count }) => sum + count, 0),
  );

  // Своих монстров трекер не принимает (нужен адрес существа в бестиарии) —
  // их пропускаем и говорим об этом в окне переноса.
  const skippedCount = computed(() => countCustomCreatures(creatures.value));

  // Гость не заводит второй трекер, пока жив первый; у пользователя — общий
  // лимит трекеров.
  const canCreate = computed(() =>
    isLoggedIn.value
      ? trackers.value.length < INITIATIVE_LIMIT.trackers
      : trackers.value.length === 0,
  );

  const createLimitHint = computed(() =>
    isLoggedIn.value
      ? TRANSFER_LABELS.newTrackerLimit
      : TRANSFER_LABELS.anonymousLimit,
  );

  /** Загружает трекеры, в которые можно перенести существ. */
  async function loadTrackers(): Promise<void> {
    isLoading.value = true;
    loadError.value = undefined;

    try {
      if (isLoggedIn.value) {
        const list = await fetchTrackerList();

        trackers.value = list
          .filter(({ deleted }) => !deleted)
          .map(({ id, name, status }) => ({
            id,
            name,
            isActive: status === 'ACTIVE',
          }));

        return;
      }

      trackers.value = [];

      if (!slot.value) {
        return;
      }

      const tracker = await requestTracker(slot.value.trackerId, {
        accessKey: slot.value.accessKey,
      });

      trackers.value = [
        {
          id: tracker.id,
          name: tracker.name,
          isActive: tracker.status === 'ACTIVE',
        },
      ];
    } catch (error) {
      if (
        !isLoggedIn.value
        && TRACKER_LOST_STATUSES.includes(getErrorStatus(error) ?? 0)
      ) {
        clearSlot();

        return;
      }

      loadError.value = getTrackerErrorMessage(
        TRANSFER_LABELS.loadError,
        error,
      );
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Находит или создаёт трекер для переноса.
   * @param trackerId Идентификатор существующего трекера; нет — создать новый.
   * @param name Имя нового трекера; пусто — имя по умолчанию.
   */
  async function resolveTracker(
    trackerId: string | undefined,
    name: string,
  ): Promise<ResolvedTracker> {
    if (!trackerId) {
      const created = await createTracker(name);
      const accessKey = created.accessKey ?? undefined;

      if (accessKey) {
        saveSlot(created.id, accessKey);
      }

      return { id: created.id, accessKey, creatureCount: 0 };
    }

    const accessKey = getAccessKey(trackerId);
    const tracker = await requestTracker(trackerId, { accessKey });

    return {
      id: tracker.id,
      accessKey,
      creatureCount: countParticipants(tracker.participants, 'CREATURE'),
    };
  }

  /**
   * Сообщает, что существа в трекер не поместятся.
   * @param free Сколько мест для существ осталось.
   */
  function notifyCapacity(free: number): void {
    toast.add({
      title: TRANSFER_LABELS.capacityTitle,
      description: `В трекере может быть не больше ${INITIATIVE_LIMIT.creatures} существ, свободно ${free}, а переносится ${transferCount.value}.`,
      color: 'warning',
      icon: 'tabler:alert-triangle',
    });
  }

  /**
   * Переносит существ и открывает трекер.
   * @param trackerId Идентификатор существующего трекера; нет — новый трекер.
   * @param name Имя нового трекера.
   * @returns Удалось ли перенести всех существ.
   */
  async function transfer(
    trackerId: string | undefined,
    name: string,
  ): Promise<boolean> {
    // Новый трекер с заведомо лишними существами создавать незачем.
    if (!trackerId && transferCount.value > INITIATIVE_LIMIT.creatures) {
      notifyCapacity(INITIATIVE_LIMIT.creatures);

      return false;
    }

    isTransferring.value = true;

    let target: ResolvedTracker | undefined;
    let added = 0;

    try {
      target = await resolveTracker(trackerId, name);

      const free = INITIATIVE_LIMIT.creatures - target.creatureCount;

      if (transferCount.value > free) {
        notifyCapacity(free);

        return false;
      }

      for (const { creatureUrl, count } of batches.value) {
        await requestTracker(target.id, {
          path: '/participants',
          method: 'POST',
          body: { type: 'CREATURE', creatureUrl, count },
          accessKey: target.accessKey,
        });

        added += count;
      }

      await navigateTo(getTrackerRoute(target.id));

      return true;
    } catch (error) {
      consola.error('Ошибка переноса существ в трекер инициативы:', error);

      const title = added
        ? `${TRANSFER_LABELS.partialTitle}: ${added} из ${transferCount.value}`
        : TRANSFER_LABELS.errorTitle;

      toast.add({
        title: getTrackerErrorMessage(title, error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      // Часть существ уже в трекере — открываем его, чтобы мастер видел, что
      // успело добавиться.
      if (target && added) {
        await navigateTo(getTrackerRoute(target.id));
      }

      return false;
    } finally {
      isTransferring.value = false;
    }
  }

  return {
    trackers,
    canCreate,
    createLimitHint,
    transferCount,
    skippedCount,
    isLoading,
    isTransferring,
    loadError,
    loadTrackers,
    transfer,
  };
}
