import type { CreatureSummary, TrackerParticipant } from '../model';

import { creatureDetailSchema } from '~bestiary/model';
import { getEntryApiPath } from '~section/model';

import { getCreatureRoute, toCreatureSummary } from '../model';

/**
 * Статблоки существ боя: аватар, КД, опасность и хиты. В участнике их нет,
 * поэтому каждое существо догружается из бестиария один раз, даже если в бою
 * несколько одинаковых.
 * @param getParticipants - текущие участники
 */
export function useCreatureSummaries(
  getParticipants: () => ReadonlyArray<TrackerParticipant>,
) {
  const summaries = ref<Record<string, CreatureSummary>>({});
  const requested = new Set<string>();

  /**
   * Грузит статблок; при ошибке существо запросится снова со следующим
   * изменением состава.
   * @param url - слаг существа
   */
  async function load(url: string): Promise<void> {
    requested.add(url);

    try {
      const creature = creatureDetailSchema.parse(
        await $fetch(getEntryApiPath(getCreatureRoute(url)), {
          method: 'POST',
        }),
      );

      summaries.value[url] = toCreatureSummary(creature);
    } catch {
      requested.delete(url);
    }
  }

  watch(
    () =>
      getParticipants().flatMap((participant) =>
        participant.creatureUrl ? [participant.creatureUrl] : [],
      ),
    (urls) => {
      for (const url of new Set(urls)) {
        if (!requested.has(url)) {
          load(url);
        }
      }
    },
    { immediate: true },
  );

  /**
   * Статблок участника; у игрока и пока грузится — `undefined`.
   * @param participant - участник
   */
  function getSummary(
    participant: TrackerParticipant,
  ): CreatureSummary | undefined {
    return participant.creatureUrl
      ? summaries.value[participant.creatureUrl]
      : undefined;
  }

  return { getSummary };
}
