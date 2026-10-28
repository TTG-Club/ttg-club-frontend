import type { TrackerParticipant } from '../model';

import { PARTICIPANT_STAT_STORAGE_KEY } from '../model';
import { useParticipantValues } from './useParticipantValues';

/**
 * Хиты и КД участников на устройстве ведущего. Максимум хитов пишется только
 * броском формулы статблока, без записи он равен средним хитам. Временные
 * хиты урон снимает первыми. КД хранится
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

  const temporaryHitPoints = useParticipantValues(
    PARTICIPANT_STAT_STORAGE_KEY.temporaryHitPoints,
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

  /**
   * Хиты после урона или лечения. Временные хиты пишутся, только когда урон
   * снял часть из них.
   * @param participantId - идентификатор участника
   * @param value - новые хиты
   * @param temporary - остаток временных хитов
   */
  function setHitPoints(
    participantId: string,
    value: number,
    temporary?: number,
  ): void {
    hitPoints.setValue(participantId, value);

    if (temporary !== undefined) {
      temporaryHitPoints.setValue(participantId, Math.max(0, temporary));
    }
  }

  return {
    hitPoints: hitPoints.values,
    temporaryHitPoints: temporaryHitPoints.values,
    maxHitPoints: maxHitPoints.values,
    armorClass: armorClass.values,
    setHitPoints,
    setTemporaryHitPoints: temporaryHitPoints.setValue,
    setMaxHitPoints,
    setArmorClass: armorClass.setValue,
  };
}
