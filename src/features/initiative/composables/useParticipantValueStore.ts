import type { TrackerParticipant } from '@/features/initiative/model';

/** Значения участников по трекерам: `{ [trackerId]: { [participantId]: N } }`. */
type ParticipantValueStore = Record<string, Record<string, number>>;

/**
 * Числовое значение участников трекера в localStorage (текущие и максимальные
 * хиты, КД игроков). На бэке этих полей нет, поэтому значения живут на
 * устройстве мастера (на другом устройстве счётчики начнутся с дефолтов —
 * приемлемо для инструмента одного ведущего).
 * Ключи — id участников (уникальны между трекерами), но бакеты разделены по
 * трекерам, чтобы чистка не задевала чужие бои.
 * @param storageKey Ключ localStorage в формате `domain:key-name`.
 * @param trackerIdGetter Геттер идентификатора трекера.
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useParticipantValueStore(
  storageKey: string,
  trackerIdGetter: () => string,
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const store = useLocalStorage<ParticipantValueStore>(storageKey, {});

  /** Значения участников активного трекера (нет записи — дефолт потребителя). */
  const valueByParticipant = computed<Record<string, number>>(
    () => store.value[trackerIdGetter()] ?? {},
  );

  /**
   * Записывает значение участника в бакет активного трекера.
   * @param participantId Идентификатор участника.
   * @param value Новое значение.
   */
  function setValue(participantId: string, value: number): void {
    const trackerId = trackerIdGetter();
    const bucket = store.value[trackerId] ?? {};

    store.value = {
      ...store.value,
      [trackerId]: { ...bucket, [participantId]: value },
    };
  }

  // Чистка записей удалённых участников. Пустой список пропускаем: во время
  // загрузки participants ещё [], и без guard-а бакет стёрся бы до прихода
  // данных (последний участник, убранный вручную, оставит запись до следующего
  // добавления — это безвредно).
  watch(
    () => participantsGetter().map((participant) => participant.id),
    (ids) => {
      if (!ids.length) {
        return;
      }

      const trackerId = trackerIdGetter();
      const bucket = store.value[trackerId];

      if (!bucket) {
        return;
      }

      const activeIds = new Set(ids);

      const prunedEntries = Object.entries(bucket).filter(([participantId]) =>
        activeIds.has(participantId),
      );

      if (prunedEntries.length !== Object.keys(bucket).length) {
        store.value = {
          ...store.value,
          [trackerId]: Object.fromEntries(prunedEntries),
        };
      }
    },
  );

  return { valueByParticipant, setValue };
}
