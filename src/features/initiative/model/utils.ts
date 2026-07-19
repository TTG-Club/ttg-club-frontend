import { MAX_D20, MIN_D20 } from './constants';

import type { ParticipantType, TrackerParticipant } from './types';

/**
 * Считает участников заданного типа.
 * @param participants Список участников.
 * @param type Тип участника.
 */
export function countParticipantsByType(
  participants: Array<TrackerParticipant>,
  type: ParticipantType,
): number {
  return participants.filter((participant) => participant.type === type).length;
}

/**
 * Форматирует бонус инициативы со знаком: `+2`, `0`, `-1`.
 * @param bonus Числовой бонус.
 */
export function formatInitiativeBonus(bonus: number): string {
  return bonus > 0 ? `+${bonus}` : String(bonus);
}

/**
 * Признак того, что участнику уже прокинута инициатива.
 * @param participant Участник.
 */
export function isParticipantRolled(participant: TrackerParticipant): boolean {
  return typeof participant.initiativeTotal === 'number';
}

/**
 * Ссылка на статблок существа в бестиарии.
 * @param creatureUrl Слаг существа.
 */
export function getCreatureRoute(creatureUrl: string): string {
  return `/bestiary/${creatureUrl}`;
}

/**
 * Извлекает числовое значение КД из строки статблока:
 * `15 (кожаный доспех)` → `15`. Пустая строка — значение не распознано.
 * @param armorClass Строка КД из детального ответа бестиария.
 */
export function extractArmorClassValue(armorClass: string): string {
  return armorClass.match(/\d+/)?.[0] ?? '';
}

/**
 * Клиентский бросок к20 — для бросков с преимуществом/помехой, где нужны две
 * кости сразу (обычный одиночный бросок делает бэк).
 */
export function rollD20(): number {
  return Math.floor(Math.random() * MAX_D20) + MIN_D20;
}
