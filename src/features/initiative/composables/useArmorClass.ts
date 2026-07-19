import type { TrackerParticipant } from '@/features/initiative/model';
import { ARMOR_CLASS_STORAGE_KEY } from '@/features/initiative/model';

import { useParticipantValueStore } from './useParticipantValueStore';

/**
 * КД игроков трекера в localStorage мастера. Существа берут КД из статблока,
 * а у игроков его негде взять — мастер задаёт значение вручную (диапазон
 * держит контрол — composable правил не знает).
 * @param trackerIdGetter Геттер идентификатора трекера.
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useArmorClass(
  trackerIdGetter: () => string,
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const { valueByParticipant, setValue } = useParticipantValueStore(
    ARMOR_CLASS_STORAGE_KEY,
    trackerIdGetter,
    participantsGetter,
  );

  return {
    armorClassByParticipant: valueByParticipant,
    setArmorClass: setValue,
  };
}
