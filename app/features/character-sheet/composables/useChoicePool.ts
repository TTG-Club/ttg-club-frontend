import type {
  CatalogSearchSource,
  SheetChoice,
  SheetChoiceOption,
  SheetDocument,
  SheetSource,
} from '../model';

import { range, uniq } from 'es-toolkit';

import {
  buildChoiceContext,
  decorateChoiceOptions,
  FEAT_SEARCH,
  getStaticChoiceOptions,
  ITEM_SEARCH,
  loadClassDetails,
  OPTION_SEARCH,
  SPELL_LEVEL,
  SPELL_SEARCH,
  WEAPON_SEARCH,
} from '../model';
import { useCatalogSearch } from './useCatalogSearch';

/** Числовые идентификаторы классов по адресу: для фильтра заклинаний. */
const classIdCache = new Map<string, number | null>();

/**
 * Числовой идентификатор класса — фильтр заклинаний по классу ждёт его, а
 * механика называет класс адресом.
 * @param url - адрес класса
 */
async function resolveClassId(url: string): Promise<number | null> {
  if (!classIdCache.has(url)) {
    try {
      classIdCache.set(url, (await loadClassDetails(url)).mechanics.id ?? null);
    } catch {
      classIdCache.set(url, null);
    }
  }

  return classIdCache.get(url) ?? null;
}

/**
 * Круги заклинаний для фильтра поиска по ограничению выбора.
 * @param choice - выбор заклинания или заговора
 */
function getSpellLevels(choice: SheetChoice): Array<number> {
  const filter = choice.spellFilter;

  if (filter?.level !== null && filter?.level !== undefined) {
    return [filter.level];
  }

  if (filter?.maxLevel) {
    return range(SPELL_LEVEL.min + 1, filter.maxLevel + 1);
  }

  return [];
}

/**
 * Раздел справочника, в котором ищут варианты выбора; null — поиск не нужен.
 * @param choice - выбор
 */
function getChoiceSearch(choice: SheetChoice): CatalogSearchSource | null {
  switch (choice.kind) {
    case 'spell':
    case 'cantrip': {
      return SPELL_SEARCH;
    }
    case 'feat': {
      return FEAT_SEARCH;
    }
    case 'option': {
      return OPTION_SEARCH;
    }
    case 'tool': {
      return ITEM_SEARCH;
    }
    case 'weapon': {
      return WEAPON_SEARCH;
    }
    default: {
      return null;
    }
  }
}

/**
 * Варианты выбора: перечисленные записью и значения вида — сразу, заклинания,
 * черты, особенности и инструменты без списка — поиском по справочнику.
 * Заклинания ищутся с фильтром круга и класса из ограничения выбора.
 * @param document - лист или черновик мастера
 * @param source - источник выбора
 * @param choice - выбор
 */
export function useChoicePool(
  document: MaybeRefOrGetter<SheetDocument>,
  source: MaybeRefOrGetter<SheetSource>,
  choice: MaybeRefOrGetter<SheetChoice>,
) {
  const classIds = ref<Array<number>>([]);

  const context = computed(() => {
    const currentSource = toValue(source);
    const currentChoice = toValue(choice);

    return {
      ...buildChoiceContext(toValue(document), currentSource.id),
      takenValues: Object.entries(currentSource.choiceAnswers)
        .filter(([key]) => key !== currentChoice.key)
        .flatMap(([, values]) => values),
    };
  });

  const staticOptions = computed(() =>
    getStaticChoiceOptions(toValue(choice), context.value),
  );

  const searchSource = computed<CatalogSearchSource>(() => {
    const currentChoice = toValue(choice);
    const base = getChoiceSearch(currentChoice) ?? SPELL_SEARCH;

    if (base !== SPELL_SEARCH) {
      return base;
    }

    const levels = getSpellLevels(currentChoice);

    return {
      ...base,
      filter: {
        ...(levels.length ? { level: levels } : {}),
        ...(classIds.value.length ? { class: classIds.value } : {}),
      },
    };
  });

  const needsSearch = computed(
    () =>
      staticOptions.value === null && getChoiceSearch(toValue(choice)) !== null,
  );

  const {
    searchTerm,
    options: found,
    isLoading,
    reset,
  } = useCatalogSearch(searchSource);

  /** Найденное поиском: у заклинаний и черт значение — адрес, у прочего — название. */
  const searchOptions = computed<Array<SheetChoiceOption>>(() => {
    const currentChoice = toValue(choice);

    const byName =
      currentChoice.kind === 'tool' || currentChoice.kind === 'weapon';

    return decorateChoiceOptions(
      currentChoice,
      context.value,
      found.value.map((option) => ({
        value: byName ? option.name : option.url,
        label: option.name,
        caption: option.caption,
      })),
    );
  });

  const options = computed(() => staticOptions.value ?? searchOptions.value);

  watch(
    () => {
      const currentChoice = toValue(choice);
      const filter = currentChoice.spellFilter;

      const fromChoice = filter?.classesFromChoiceKey
        ? (toValue(source).choiceAnswers[filter.classesFromChoiceKey] ?? [])
        : [];

      return uniq([
        ...(filter?.classes ?? []).map((ref) => ref.url),
        ...fromChoice,
      ])
        .filter(Boolean)
        .join('|');
    },
    async (joined) => {
      const urls = joined ? joined.split('|') : [];
      const ids = await Promise.all(urls.map(resolveClassId));

      classIds.value = ids.filter((id): id is number => id !== null);
    },
    { immediate: true },
  );

  return { options, needsSearch, searchTerm, isLoading, reset };
}
