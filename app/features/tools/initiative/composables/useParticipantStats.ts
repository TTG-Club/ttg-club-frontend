import type { TrackerParticipant } from '../model';

import { PARTICIPANT_STAT_STORAGE_KEY } from '../model';
import { useParticipantValues } from './useParticipantValues';

/**
 * Хиты и КД участников на устройстве ведущего. Максимум хитов пишется только
 * броском формулы статблока, без записи он равен средним хитам. КД хранится
 * для игроков: у существ он из статблока.
 * @param getTrackerId - идентификатор трекера
 * @param getParticipants - текущие участники
 */
export function useParticipantStats(
  getTrackerId: () => string,
  getParticipants: () => ReadonlyArray<TrackerParticipant>,
) {
  const hitPoints = useParticipantValues(
    PARTICIPANT_STAT_STORAGE_KEY.hitPoints,
    getTrackerId,
    getParticipants,
  );

  const maxHitPoints = useParticipantValues(
    PARTICIPANT_STAT_STORAGE_KEY.maxHitPoints,
    getTrackerId,
    getParticipants,
  );

  const armorClass = useParticipantValues(
    PARTICIPANT_STAT_STORAGE_KEY.armorClass,
    getTrackerId,
    getParticipants,
  );

  /**
   * Прокинутый максимум хитов: существо встаёт на полные хиты.
   * @param participantId - идентификатор участника
   * @param value - выпавший максимум
   */
  function setMaxHitPoints(participantId: string, value: number): void {
    const maximum = Math.max(1, value);

    maxHitPoints.setValue(participantId, maximum);
    hitPoints.setValue(participantId, maximum);
  }

  return {
    hitPoints: hitPoints.values,
    maxHitPoints: maxHitPoints.values,
    armorClass: armorClass.values,
    setHitPoints: hitPoints.setValue,
    setMaxHitPoints,
    setArmorClass: armorClass.setValue,
  };
}
