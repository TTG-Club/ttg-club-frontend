import type { ComputedRef } from 'vue';
import type { FilterDefinition, FilterPayload } from '~section/model';

import type {
  EncounterCreatureOption,
  EncounterResult,
  EncounterSelectItem,
  GenerationContext,
  GenerationDifficulty,
} from '../model';

import { consola } from 'consola';

import { BESTIARY_SECTION } from '~bestiary/model';
import {
  applyExcludedSources,
  buildFilterPayload,
  buildListRequest,
  filterResponseSchema,
  getDefaultSelection,
  normalizeFilter,
  SECTION_PAGE_SIZE_ALL,
} from '~section/model';

import {
  generateCreatures,
  GENERATION_FILTER_PARAM,
  GENERATION_TEXT,
  getAffordableChallengeRatings,
  getGenerationCreatureLimit,
  getGenerationWindow,
  getMaxCandidateExperience,
  parseCreatureOptions,
} from '../model';

/**
 * Фильтр бестиария для генератора: источники по умолчанию без книг, снятых
 * в профиле, плюс подходящие уровни опасности и среда обитания.
 * @param definition Фильтр бестиария из API.
 * @param excludedSources Книги, снятые пользователем.
 * @param challengeRatings Уровни опасности кандидатов.
 * @param environment Среда обитания; пусто — любая.
 */
function buildGenerationFilter(
  definition: FilterDefinition,
  excludedSources: ReadonlyArray<string>,
  challengeRatings: Array<string>,
  environment: string | undefined,
): FilterPayload {
  const prepared = applyExcludedSources(definition, excludedSources);

  return buildFilterPayload(prepared, {
    ...getDefaultSelection(prepared),
    [GENERATION_FILTER_PARAM.challengeRating]: challengeRatings,
    [GENERATION_FILTER_PARAM.environment]: environment ? [environment] : [],
  });
}

/**
 * Генератор столкновений: добирает случайных существ из бестиария до
 * выбранной сложности с учётом уже добавленных существ (их число меняет
 * множитель) и источников профиля.
 * @param result Текущий итог калькулятора.
 * @param addCreature Добавляет существо в калькулятор.
 */
export function useEncounterGenerator(
  result: ComputedRef<EncounterResult>,
  addCreature: (option: EncounterCreatureOption, count: number) => void,
) {
  const api = useApi();
  const toast = useToast();
  const { user } = useUser();

  const definition = shallowRef<FilterDefinition>();
  const isGenerating = ref(false);

  /** Среды обитания из фильтра бестиария. */
  const environmentItems = computed<Array<EncounterSelectItem>>(() => {
    const group = definition.value?.other.find(
      ({ param }) => param === GENERATION_FILTER_PARAM.environment,
    );

    return (group?.values ?? []).map((value) => ({
      value: String(value.key),
      label: value.label,
    }));
  });

  /** Грузит фильтр бестиария один раз: в нём источники и среды обитания. */
  async function loadDefinition(): Promise<FilterDefinition> {
    if (definition.value) {
      return definition.value;
    }

    const loaded = normalizeFilter(
      filterResponseSchema.parse(
        await api(BESTIARY_SECTION.filterUrl ?? '', { method: 'POST' }),
      ),
    );

    definition.value = loaded;

    return loaded;
  }

  /**
   * Показывает предупреждение генератора.
   * @param title Заголовок.
   * @param description Пояснение.
   */
  function warn(title: string, description: string): void {
    toast.add({
      title,
      description,
      color: 'warning',
      icon: 'tabler:alert-triangle',
    });
  }

  /**
   * Подбирает и добавляет существ.
   * @param difficulty Целевая сложность.
   * @param environment Среда обитания (ключ фильтра); пусто — любая.
   */
  async function generate(
    difficulty: GenerationDifficulty,
    environment: string | undefined,
  ): Promise<void> {
    const { thresholds, adjustedExperience, totalExperience, creatureCount } =
      result.value;

    const experienceWindow = getGenerationWindow(
      difficulty,
      thresholds,
      adjustedExperience,
    );

    if (!experienceWindow) {
      warn(
        GENERATION_TEXT.budgetSpentTitle,
        GENERATION_TEXT.budgetSpentDescription,
      );

      return;
    }

    const context: GenerationContext = {
      window: experienceWindow,
      baseExperience: totalExperience,
      baseCount: creatureCount,
      characterCount: result.value.characterCount,
      creatureLimit: getGenerationCreatureLimit(result.value.characterCount),
    };

    const challengeRatings = getAffordableChallengeRatings(
      getMaxCandidateExperience(context),
    );

    if (!challengeRatings.length) {
      warn(GENERATION_TEXT.notFoundTitle, GENERATION_TEXT.notFoundDescription);

      return;
    }

    isGenerating.value = true;

    try {
      const filter = buildGenerationFilter(
        await loadDefinition(),
        user.value?.excludedSources ?? [],
        challengeRatings,
        environment,
      );

      const response = await api(BESTIARY_SECTION.listUrl, {
        method: 'POST',
        body: buildListRequest({
          page: 0,
          size: SECTION_PAGE_SIZE_ALL,
          filter,
        }),
      });

      const picks = generateCreatures(parseCreatureOptions(response), context);

      if (!picks.length) {
        warn(
          GENERATION_TEXT.notFoundTitle,
          GENERATION_TEXT.notFoundDescription,
        );

        return;
      }

      picks.forEach(({ candidate, count }) => addCreature(candidate, count));
    } catch (error) {
      consola.error('Ошибка генерации столкновения:', error);

      toast.add({
        title: GENERATION_TEXT.errorTitle,
        description: GENERATION_TEXT.errorDescription,
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isGenerating.value = false;
    }
  }

  return {
    isGenerating,
    environmentItems,
    loadDefinition,
    generate,
  };
}
