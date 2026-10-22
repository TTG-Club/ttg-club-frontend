import type { CreatureAbilities } from './schema';

/** Ключ характеристики в ответе API. */
export type AbilityKey = keyof CreatureAbilities;

/** Бросок в строке спасбросков или навыков. */
export interface CreatureRoll {
  key: string;
  /** Подпись перед значением: «Лов», «Восприятие». */
  label: string;
  /** Подпись броска в истории. */
  rollLabel: string;
  formula: string;
  /** Значение со знаком и дополнительным бонусом. */
  value: string;
}

/** Характеристика существа в таблице: значение, модификатор и бросок. */
export interface CreatureAbilityScore {
  key: AbilityKey;
  label: string;
  name: string;
  rollLabel: string;
  formula: string;
  /** Значение с модификатором: «18 (+4)». */
  value: string;
}

/** Умение или действие существа: название и HTML описания. */
export interface CreatureAction {
  key: string;
  name: string;
  html: string;
}

/** Блок действий или логова: заголовок, вступление и список. */
export interface CreatureActionGroup {
  key: string;
  title: string;
  /** Вступление: HTML из базы. */
  intro?: string;
  /** Вступление обычным текстом, когда HTML в базе нет. */
  text?: string;
  items: Array<CreatureAction>;
}
