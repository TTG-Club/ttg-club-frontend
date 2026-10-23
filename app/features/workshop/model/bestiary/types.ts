import type { CreatureForm } from './schemas';

/** Существо из бестиария, как его открывает редактор: поля уже в кодах бэкенда. */
export interface WorkshopCreature extends CreatureForm {
  id: number;
  /** Аббревиатура книги-источника. */
  source?: string;
}

/** Спасбросок или навык с бонусом. */
export interface CreatureBonus {
  /** Код характеристики или навыка. */
  key: string;
  value: number;
  additional: string;
}

/** Особенность или действие существа. */
export interface CreatureBlock {
  name: string;
  englishName: string;
  description: string;
  /** Описание в markdown: бэкенд превращает его в разметку при чтении. */
  markdown: boolean;
  /** Сколько существ делят это действие: правка заденет их всех. */
  sharedUsageCount?: number;
}

/** Легендарное действие: у них нет английского названия. */
export interface CreatureLegendaryAction {
  name: string;
  description: string;
}

/** Ключи списков особенностей и действий в форме существа. */
export type CreatureBlockField =
  'feats' | 'actions' | 'bonusActions' | 'reactions' | 'mysticalActions';

/** Поле характеристики в форме: как в ответе бэкенда. */
export type CreatureAbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wiz' | 'cha';
