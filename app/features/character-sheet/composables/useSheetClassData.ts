import type {
  ClassFeatureEntry,
  ClassMechanicsDetail,
  ClassProgression,
  ClassTableValue,
  SheetClass,
  SheetClassDetail,
} from '../model';

import { uniq } from 'es-toolkit';

import {
  CLASS_FEATURE_SCALING_SEPARATOR,
  CLASS_TABLE_EMPTY,
  getPactMagic,
  KNOWN_CANTRIPS_COLUMN,
  KNOWN_SPELLS_COLUMN,
  loadClassDetails,
  parseSpellSlotCells,
  syncFeatureOptionChoices,
  toAbilityKey,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';

/**
 * Наибольший круг ячеек в строке таблицы класса.
 * @param cells - ячейки строки текстом
 */
function getMaxSlotLevel(cells: ReadonlyArray<string>): number {
  return parseSpellSlotCells(cells).findLastIndex((slots) => slots > 0) + 1;
}

/**
 * Заклинательные данные класса на его уровне. Таблица подкласса важнее
 * таблицы класса: у мистического рыцаря ячейки есть только в ней.
 * @param sheetClass - класс персонажа
 * @param base - запись класса
 * @param archetype - запись подкласса
 */
function getProgression(
  sheetClass: SheetClass,
  base: SheetClassDetail | undefined,
  archetype: SheetClassDetail | undefined,
): ClassProgression {
  const levels = archetype?.traits?.levels ?? base?.traits?.levels ?? [];
  const lastLevel = levels.at(-1);

  return {
    classId: sheetClass.id,
    level: sheetClass.level,
    spellSlots: parseSpellSlotCells(
      levels[sheetClass.level - 1]?.spellSlots ?? [],
    ),
    maxSlotLevel: getMaxSlotLevel(lastLevel?.spellSlots ?? []),
    pact: getPactMagic(base?.tableColumns ?? [], sheetClass.level),
  };
}

/**
 * Умения класса и подкласса, полученные к уровню класса.
 * @param sheetClass - класс персонажа
 * @param base - запись класса
 * @param archetype - запись подкласса: в ней умения класса уже вместе с умениями подкласса
 */
function getFeatures(
  sheetClass: SheetClass,
  base: SheetClassDetail | undefined,
  archetype: SheetClassDetail | undefined,
): Array<ClassFeatureEntry> {
  const features = archetype?.traits?.features ?? base?.traits?.features ?? [];

  return features.flatMap((feature) => {
    const className = feature.archetypeFeature
      ? (sheetClass.archetypeName ?? sheetClass.name)
      : sheetClass.name;

    const isArchetype = Boolean(feature.archetypeFeature);

    // Рост по уровням: повтор умения — отдельная запись своего уровня
    const repeats = feature.scaling.map((row) => ({
      id: `${sheetClass.id}:${feature.id}${CLASS_FEATURE_SCALING_SEPARATOR}${row.level}`,
      name: [row.name || feature.name, row.additional]
        .filter(Boolean)
        .join(' '),
      level: row.level,
      className,
      isArchetype,
      description: row.description ?? null,
    }));

    return [
      {
        id: `${sheetClass.id}:${feature.id}`,
        name: feature.name,
        level: feature.level,
        className,
        isArchetype,
        description: feature.description ?? null,
      },
      ...repeats,
    ].filter((entry) => entry.level <= sheetClass.level);
  });
}

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
      getProgression(sheetClass, ...getPair(sheetClass)),
    ),
  );

  const features = computed(() =>
    document.value.classes
      .flatMap((sheetClass) => getFeatures(sheetClass, ...getPair(sheetClass)))
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
