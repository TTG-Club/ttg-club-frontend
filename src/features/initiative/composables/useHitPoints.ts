import type { TrackerParticipant } from '@/features/initiative/model';
import {
  HIT_POINTS_STORAGE_KEY,
  MAX_HIT_POINTS_STORAGE_KEY,
} from '@/features/initiative/model';

import { useParticipantValueStore } from './useParticipantValueStore';

/**
 * Текущие и максимальные хиты существ трекера в localStorage мастера.
 * Максимум хранится отдельно и заполняется только броском формулы статблока;
 * нет записи — максимум равен среднему значению из статблока.
 * @param trackerIdGetter Геттер идентификатора трекера.
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useHitPoints(
  trackerIdGetter: () => string,
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const current = useParticipantValueStore(
    HIT_POINTS_STORAGE_KEY,
    trackerIdGetter,
    participantsGetter,
  );

  const max = useParticipantValueStore(
    MAX_HIT_POINTS_STORAGE_KEY,
    trackerIdGetter,
    participantsGetter,
  );

  /**
   * Записывает текущие хиты участника (минимум 0; максимум держит контрол —
   * composable статблоков не знает).
   * @param participantId Идентификатор участника.
   * @param value Новое значение хитов.
   */
  function setHitPoints(participantId: string, value: number): void {
    current.setValue(participantId, Math.max(0, value));
  }

  /**
   * Записывает прокинутый максимум хитов участника и поднимает текущие хиты до
   * него: свежий бросок формулы статблока означает «существо на полных хитах».
   * @param participantId Идентификатор участника.
   * @param value Прокинутый максимум (минимум 1 — существо живо).
   */
  function setMaxHitPoints(participantId: string, value: number): void {
    const maximum = Math.max(1, value);

    max.setValue(participantId, maximum);
    current.setValue(participantId, maximum);
  }

  return {
    currentByParticipant: current.valueByParticipant,
    maxByParticipant: max.valueByParticipant,
    setHitPoints,
    setMaxHitPoints,
  };
}
