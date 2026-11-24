import type {
  AbilityKey,
  PreparedClassInput,
  SpellcastingRow,
  SpellSlotRowState,
} from '../model';

import {
  getCharacterPactMagic,
  getPreparedBreakdown,
  getSpellSlotOptions,
  getSpellSlotsMax,
  SPELL_TAB_TEXT,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useSheetClassData } from './useSheetClassData';
import { useSheetStats } from './useSheetStats';

/**
 * Заклинательство персонажа: характеристика, Сл и атака по каждому
 * классу-заклинателю, пределы подготовленных заклинаний и заговоров, ячейки
 * по кругам и магия договора.
 */
export const useSheetSpellcasting = createSharedComposable(() => {
  const { document } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { progressions, preparedClasses, classAbilities } = useSheetClassData();

  /**
   * Строка заклинательства от характеристики.
   * @param ability - характеристика
   */
  function getNumbers(
    ability: AbilityKey | null,
  ): Pick<SpellcastingRow, 'saveDc' | 'attack'> {
    if (!ability) {
      return { saveDc: null, attack: null };
    }

    const numbers = stats.value.spellcastingByAbility[ability];

    return { saveDc: numbers.saveDc, attack: numbers.attack };
  }

  /**
   * Характеристика класса по справочнику.
   * @param classId - класс листа
   */
  function getAutoAbility(classId: string): AbilityKey | null {
    return (
      classAbilities.value.find((entry) => entry.classId === classId)
        ?.autoAbility ?? null
    );
  }

  /**
   * Строки по классам-заклинателям; без них — одна строка персонажа с
   * общей характеристикой листа (заклинания вида и черт).
   */
  const rows = computed<Array<SpellcastingRow>>(() => {
    const casterRows = document.value.classes.flatMap((sheetClass) => {
      const autoAbility = getAutoAbility(sheetClass.id);
      const ability = sheetClass.spellcastingAbility ?? autoAbility;

      if (!ability) {
        return [];
      }

      return [
        {
          classId: sheetClass.id,
          className: sheetClass.name,
          ability,
          autoAbility,
          isCustom: sheetClass.spellcastingAbility !== null,
          ...getNumbers(ability),
        },
      ];
    });

    if (casterRows.length) {
      return casterRows;
    }

    const ability = document.value.spellcastingAbility;

    return [
      {
        classId: null,
        className: SPELL_TAB_TEXT.character,
        ability,
        autoAbility: null,
        isCustom: ability !== null,
        ...getNumbers(ability),
      },
    ];
  });

  /** Характеристика заклинаний без своей: первого класса-заклинателя. */
  const primaryAbility = computed(
    () => rows.value[0]?.ability ?? document.value.spellcastingAbility,
  );

  const preparedInputs = computed<Array<PreparedClassInput>>(() =>
    preparedClasses.value.map((entry) => {
      const sheetClass = document.value.classes.find(
        (candidate) => candidate.id === entry.classId,
      );

      const ability =
        sheetClass?.spellcastingAbility
        ?? getAutoAbility(entry.classId)
        ?? primaryAbility.value;

      return {
        ...entry,
        abilityModifier: ability
          ? stats.value.bonusContext.abilityModifiers[ability]
          : 0,
      };
    }),
  );

  const spellsLimit = computed(() =>
    getPreparedBreakdown(document.value, 'spells', preparedInputs.value),
  );

  const cantripsLimit = computed(() =>
    getPreparedBreakdown(document.value, 'cantrips', preparedInputs.value),
  );

  /** Обычные ячейки по кругам, где они есть. */
  const slotRows = computed<Array<SpellSlotRowState>>(() =>
    getSpellSlotsMax(progressions.value).flatMap((max, index) =>
      max
        ? [
            {
              level: index + 1,
              max,
              used: Math.min(document.value.spellSlotsUsed[index] ?? 0, max),
            },
          ]
        : [],
    ),
  );

  const pact = computed(() => getCharacterPactMagic(progressions.value));

  const pactUsed = computed(() =>
    pact.value ? Math.min(document.value.pactSlotsUsed, pact.value.slots) : 0,
  );

  /**
   * Ячейки, которыми можно сотворить заклинание круга.
   * @param spellLevel - круг заклинания
   */
  function getSlotOptions(spellLevel: number) {
    return getSpellSlotOptions(
      spellLevel,
      slotRows.value,
      pact.value,
      pactUsed.value,
    );
  }

  return {
    rows,
    primaryAbility,
    spellsLimit,
    cantripsLimit,
    slotRows,
    pact,
    pactUsed,
    getSlotOptions,
  };
});
