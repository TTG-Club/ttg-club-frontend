import type {
  ClassMechanicsDetail,
  ClassTableValue,
  SheetClass,
  SheetClassDetail,
} from '../model';

import { uniq } from 'es-toolkit';

import {
  CLASS_TABLE_EMPTY,
  getClassFeatureEntries,
  getClassProgression,
  KNOWN_CANTRIPS_COLUMN,
  KNOWN_SPELLS_COLUMN,
  loadClassDetails,
  syncFeatureOptionChoices,
  toAbilityKey,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Значения колонок таблицы класса на его уровне: «Ярость: 3».
 * @param sheetClass - класс персонажа
 * @param base - запись класса
 * @param archetype - запись подкласса
 */
function getTableValues(
  sheetClass: SheetClass,
  base: SheetClassDetail | undefined,
  archetype: SheetClassDetail | undefined,
): Array<ClassTableValue> {
  const traits = archetype?.traits ?? base?.traits;
  const row = traits?.levels?.[sheetClass.level - 1];

  if (!traits || !row) {
    return [];
  }

  const classColumns = (traits.classFeatureLevels ?? []).map(
    (column, index) => ({
      name: column.name,
      value: row.classFeatureValues[index] ?? '',
    }),
  );

  const archetypeColumns = (traits.archetypeFeatureLevels ?? []).map(
    (column, index) => ({
      name: column.name,
      value: row.archetypeFeatureValues[index] ?? '',
    }),
  );

  return [...classColumns, ...archetypeColumns].filter(
    (column) => column.value && column.value !== CLASS_TABLE_EMPTY,
  );
}

/**
 * Механика классов открытого листа из справочника: ячейки заклинаний, магия
 * договора, умения по уровням и значения таблицы класса. Записи классов и
 * подклассов загружаются один раз и живут, пока открыт лист.
 */
export const useSheetClassData = createSharedComposable(() => {
  const { document, update } = useCharacterSheet();

  const details = shallowRef<ReadonlyMap<string, SheetClassDetail>>(new Map());

  const mechanics = shallowRef<ReadonlyMap<string, ClassMechanicsDetail>>(
    new Map(),
  );

  const isLoading = ref(false);

  const urls = computed(() =>
    uniq(
      document.value.classes.flatMap((sheetClass) =>
        [sheetClass.url, sheetClass.archetypeUrl].filter((url): url is string =>
          Boolean(url),
        ),
      ),
    ),
  );

  /**
   * Загружает записи, которых ещё нет; ошибка одной не мешает остальным.
   * @param list - адреса классов и подклассов
   */
  async function loadMissing(list: ReadonlyArray<string>): Promise<void> {
    const missing = list.filter((url) => !details.value.has(url));

    if (!missing.length) {
      return;
    }

    isLoading.value = true;

    const loaded = await Promise.allSettled(
      missing.map(async (url) => ({ url, ...(await loadClassDetails(url)) })),
    );

    const next = new Map(details.value);
    const nextMechanics = new Map(mechanics.value);

    for (const result of loaded) {
      if (result.status === 'fulfilled') {
        next.set(result.value.url, result.value.detail);
        nextMechanics.set(result.value.url, result.value.mechanics);
      }
    }

    details.value = next;
    mechanics.value = nextMechanics;
    isLoading.value = false;
  }

  watch(urls, loadMissing, { immediate: true });

  // Источники умений, созданные до появления вариантов, получают выбор из
  // текущей карточки класса (ответы сохраняются по ключу выбора)
  watch([mechanics, () => document.value.sources], () => {
    const next = syncFeatureOptionChoices(document.value, (url) =>
      url ? mechanics.value.get(url) : undefined,
    );

    if (next) {
      update(() => next);
    }
  });

  /**
   * Запись класса или подкласса, если она уже загружена.
   * @param url - адрес записи
   */
  function getDetail(url: string | null): SheetClassDetail | undefined {
    return url ? details.value.get(url) : undefined;
  }

  /**
   * Запись класса и подкласса для класса персонажа.
   * @param sheetClass - класс персонажа
   */
  function getPair(
    sheetClass: SheetClass,
  ): [SheetClassDetail | undefined, SheetClassDetail | undefined] {
    return [getDetail(sheetClass.url), getDetail(sheetClass.archetypeUrl)];
  }

  const progressions = computed(() =>
    document.value.classes.map((sheetClass) =>
      getClassProgression(sheetClass, ...getPair(sheetClass)),
    ),
  );

  const features = computed(() =>
    document.value.classes
      .flatMap((sheetClass) =>
        getClassFeatureEntries(sheetClass, ...getPair(sheetClass)),
      )
      .sort((left, right) => left.level - right.level),
  );

  const tableValues = computed(() =>
    document.value.classes.map((sheetClass) => ({
      id: sheetClass.id,
      name: sheetClass.archetypeName
        ? `${sheetClass.name} (${sheetClass.archetypeName})`
        : sheetClass.name,
      values: getTableValues(sheetClass, ...getPair(sheetClass)),
    })),
  );

  /**
   * Механика карточки класса или архетипа, если она уже загружена.
   * @param url - адрес записи
   */
  function getMechanics(url: string | null): ClassMechanicsDetail | undefined {
    return url ? mechanics.value.get(url) : undefined;
  }

  /** Классы листа с колонкой известных заклинаний — для предела. */
  const preparedClasses = computed(() =>
    document.value.classes.map((sheetClass) => {
      const table = tableValues.value.find(
        (candidate) => candidate.id === sheetClass.id,
      );

      /**
       * Число из колонки таблицы класса.
       * @param name - название колонки
       */
      const getColumn = (name: string): number | null => {
        const column = table?.values.find((entry) => entry.name === name);
        const parsed = column ? Number.parseInt(column.value, 10) : Number.NaN;

        return Number.isNaN(parsed) ? null : parsed;
      };

      return {
        classId: sheetClass.id,
        url: sheetClass.url,
        level: sheetClass.level,
        knownSpells: getColumn(KNOWN_SPELLS_COLUMN),
        knownCantrips: getColumn(KNOWN_CANTRIPS_COLUMN),
      };
    }),
  );

  /**
   * Заклинательная характеристика классов по справочнику: у подкласса
   * (мистический рыцарь) она своя, иначе — класса.
   */
  const classAbilities = computed(() =>
    document.value.classes.map((sheetClass) => {
      const [base, archetype] = getPair(sheetClass);

      return {
        classId: sheetClass.id,
        autoAbility: toAbilityKey(
          archetype?.spellAbility ?? base?.spellAbility ?? null,
        ),
      };
    }),
  );

  return {
    isLoading,
    getDetail,
    getMechanics,
    preparedClasses,
    classAbilities,
    loadMissing,
    progressions,
    features,
    tableValues,
  };
});
