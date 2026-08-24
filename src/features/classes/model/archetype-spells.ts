import type { ArchetypeSpellLevelType } from '@/shared/types/character/Classes';

export const ARCHETYPE_SPELL_LEVEL_TYPE_OPTIONS: Array<{
  label: string;
  value: ArchetypeSpellLevelType;
}> = [
  { label: 'Уровень класса', value: 'CLASS_LEVEL' },
  { label: 'Уровень заклинания', value: 'SPELL_LEVEL' },
];

/** Возвращает заголовок колонки уровня для таблицы заклинаний подкласса. */
export const getArchetypeSpellLevelHeader = (
  levelType: ArchetypeSpellLevelType,
  classNameGenitive: string,
): string =>
  levelType === 'SPELL_LEVEL'
    ? 'Уровень заклинания'
    : `Уровень ${classNameGenitive}`;
