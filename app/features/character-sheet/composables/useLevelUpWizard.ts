import type { ClassLink } from '~character/model';

import type {
  ClassDetails,
  HitPointsGainMode,
  LevelUpFeature,
  SheetClass,
  SheetDocument,
  SheetSource,
} from '../model';

import { z } from 'zod';

import { CLASSES_SECTION, classLinkSchema } from '~character/model';
import { buildListRequest, SECTION_PAGE_SIZE_ALL } from '~section/model';
import { getApiErrorMessage } from '~user/model';

import {
  addSources,
  applyLevelUpStep,
  CHARACTER_LEVEL,
  createClassFeatureSource,
  createSheetElementId,
  createSource,
  findSource,
  getAbilityModifier,
  getClassLevelFeatures,
  getFirstClassMechanics,
  getHitPointGain,
  getMulticlassMechanics,
  getSheetStats,
  LEVEL_UP_TEXT,
  loadClassDetails,
  loadFeatSource,
  parseHitDie,
  parseSavingThrows,
  removeSources,
  setSourceAnswers,
  toSkillKey,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useSheetRoll } from './useSheetRoll';

/** Шаг мастера: один взятый уровень класса. */
export interface LevelUpStep {
  classLevel: number;
  hitPointsMode: HitPointsGainMode;
  roll: number | null;
  subclass: { name: string; url: string } | null;
  /** Документ до шага и после него: выборы шага правят `after`. */
  before: SheetDocument;
  after: SheetDocument;
  features: Array<LevelUpFeature>;
  /** Источники, добавленные шагом. */
  sourceIds: Array<string>;
  /** Источник «Увеличения характеристик» или взятой вместо него черты. */
  improvementSourceId: string | null;
  isFeatImprovement: boolean;
  hitPointGain: number;
}

/**
 * Сумма уровней классов без нижней границы: у листа без классов — ноль.
 * @param document - лист или черновик
 */
function getRawLevel(document: SheetDocument): number {
  return document.classes.reduce(
    (sum, sheetClass) => sum + sheetClass.level,
    0,
  );
}

/**
 * Источник класса: у первого класса — спасброски и навыки класса, у
 * следующих — владения по таблице мультиклассирования.
 * @param details - карточка класса
 * @param sheetClass - класс листа
 * @param isFirst - класс взят первым
 */
function createClassSource(
  details: ClassDetails,
  sheetClass: SheetClass,
  isFirst: boolean,
): SheetSource {
  const traits = details.detail.traits;

  const fallback = {
    savingThrows: parseSavingThrows(traits?.savingThrows),
    skills: (details.detail.availableSkillsRaw ?? []).flatMap((value) => {
      const skill = toSkillKey(value);

      return skill ? [skill] : [];
    }),
    skillCount: traits?.skillAvailableCount ?? 0,
  };

  return createSource({
    kind: 'class',
    name: sheetClass.name,
    url: sheetClass.url,
    classId: sheetClass.id,
    level: 1,
    mechanics: isFirst
      ? getFirstClassMechanics(details.mechanics.mechanics, fallback)
      : getMulticlassMechanics(
          sheetClass.url,
          details.mechanics.mechanics,
          fallback,
        ),
    activeEffects: details.mechanics.activeEffects,
  });
}

/**
 * Мастер повышения уровня — порт `useLevelUpWizard` core-app в упрощённом
 * виде. Каждый шаг — один уровень класса: прирост хитов (среднее, бросок,
 * максимум), подкласс на его уровне, умения уровня с выборами и
 * «Увеличение характеристик» (характеристики или черта). Шаги применяются к
 * черновику листа по очереди, а «Применить» переносит черновик в лист.
 * Добавление класса — тот же мастер с первого уровня нового класса.
 */
export const useLevelUpWizard = createSharedComposable(() => {
  const api = useApi();
  const toast = useToast();
  const { document, update } = useCharacterSheet();
  const { rollFormula } = useSheetRoll();

  const isOpen = ref(false);
  const isLoading = ref(false);
  const classList = shallowRef<Array<ClassLink>>([]);
  const base = shallowRef<ClassDetails | null>(null);
  const archetype = shallowRef<ClassDetails | null>(null);
  const classId = ref<string | null>(null);
  const newClass = shallowRef<SheetClass | null>(null);
  const targetLevel = ref<number>(CHARACTER_LEVEL.min);
  const steps = shallowRef<Array<LevelUpStep>>([]);

  const currentStep = computed(() => steps.value.at(-1) ?? null);

  const draft = computed(() => currentStep.value?.after ?? document.value);

  const sheetClass = computed(
    () =>
      draft.value.classes.find((candidate) => candidate.id === classId.value)
      ?? newClass.value,
  );

  const subclassLevel = computed(
    () => base.value?.detail.enabledArhitypeLevel ?? null,
  );

  const archetypeOptions = computed(() =>
    (
      classList.value.find((link) => link.url === sheetClass.value?.url)
        ?.archetypes ?? []
    ).map((link) => ({ label: link.name.rus, value: link.url })),
  );

  const maxTargetLevel = computed(() => {
    const start = steps.value[0]?.before ?? document.value;

    const own =
      start.classes.find((candidate) => candidate.id === classId.value)?.level
      ?? 0;

    return Math.min(
      CHARACTER_LEVEL.max,
      CHARACTER_LEVEL.max - getRawLevel(start) + own,
    );
  });

  const isLastStep = computed(
    () => (currentStep.value?.classLevel ?? 0) >= targetLevel.value,
  );

  /** Загружает список классов один раз. */
  async function loadClassList(): Promise<void> {
    if (classList.value.length) {
      return;
    }

    try {
      classList.value = z.array(classLinkSchema).parse(
        await api(CLASSES_SECTION.listUrl, {
          method: 'POST',
          body: buildListRequest({ page: 0, size: SECTION_PAGE_SIZE_ALL }),
        }),
      );
    } catch {
      classList.value = [];
    }
  }

  /**
   * Собирает шаг: уровень класса, хиты, подкласс, умения уровня и
   * «Увеличение характеристик».
   * @param before - документ до шага
   * @param classLevel - уровень класса после шага
   * @param hitPointsMode - способ прироста хитов
   * @param roll - результат броска кости
   * @param subclass - подкласс, выбранный на шаге
   */
  function buildStep(
    before: SheetDocument,
    classLevel: number,
    hitPointsMode: HitPointsGainMode,
    roll: number | null,
    subclass: { name: string; url: string } | null,
  ): LevelUpStep | null {
    const details = base.value;

    const existing = before.classes.find(
      (candidate) => candidate.id === classId.value,
    );

    const owner = existing ?? newClass.value;

    if (!details || !owner) {
      return null;
    }

    const rawLevel = getRawLevel(before);

    const constitution = getAbilityModifier(
      getSheetStats(before).abilities.CONSTITUTION,
    );

    const hitPointGain = getHitPointGain(
      hitPointsMode,
      owner.hitDie,
      constitution,
      roll,
      rawLevel === 0,
    );

    const characterLevel = rawLevel + 1;
    const ownerAtLevel = { ...owner, level: classLevel };

    const features = getClassLevelFeatures(
      (subclass || owner.archetypeUrl ? archetype.value : null)?.mechanics
        ?? details.mechanics,
      classLevel,
    );

    const sources: Array<SheetSource> = [
      ...(existing
        ? []
        : [createClassSource(details, ownerAtLevel, rawLevel === 0)]),
      ...(subclass && archetype.value
        ? [
            createSource({
              kind: 'subclass',
              name: subclass.name,
              url: subclass.url,
              classId: owner.id,
              level: classLevel,
              characterLevel,
              mechanics: archetype.value.mechanics.mechanics,
              activeEffects: archetype.value.mechanics.activeEffects,
            }),
          ]
        : []),
      ...features.map((feature) =>
        createClassFeatureSource(ownerAtLevel, feature, characterLevel),
      ),
    ];

    const improvement = features.some((feature) => feature.isAbilityImprovement)
      ? createSource({
          kind: 'asi',
          name: LEVEL_UP_TEXT.abilityImprovement,
          classId: owner.id,
          level: classLevel,
          characterLevel,
        })
      : null;

    const allSources = improvement ? [...sources, improvement] : sources;

    return {
      classLevel,
      hitPointsMode,
      roll,
      subclass,
      before,
      after: applyLevelUpStep(before, {
        classId: owner.id,
        newClass: existing ? null : owner,
        classLevel,
        hitPointGain,
        subclass,
        sources: allSources,
      }),
      features,
      sourceIds: allSources.map((source) => source.id),
      improvementSourceId: improvement?.id ?? null,
      isFeatImprovement: false,
      hitPointGain,
    };
  }

  /**
   * Заменяет текущий шаг собранным заново.
   * @param patch - изменённые настройки шага
   */
  function rebuildCurrent(
    patch: Partial<Pick<LevelUpStep, 'hitPointsMode' | 'roll' | 'subclass'>>,
  ): void {
    const step = currentStep.value;

    if (!step) {
      return;
    }

    const rebuilt = buildStep(
      step.before,
      step.classLevel,
      patch.hitPointsMode ?? step.hitPointsMode,
      patch.roll === undefined ? step.roll : patch.roll,
      patch.subclass === undefined ? step.subclass : patch.subclass,
    );

    if (rebuilt) {
      steps.value = [...steps.value.slice(0, -1), rebuilt];
    }
  }

  /**
   * Добавляет следующий шаг от текущего черновика.
   * @param mode - способ прироста хитов
   */
  function pushStep(mode: HitPointsGainMode): void {
    const before = draft.value;

    const level =
      (before.classes.find((candidate) => candidate.id === classId.value)?.level
        ?? 0) + 1;

    const step = buildStep(before, level, mode, null, null);

    if (step) {
      steps.value = [...steps.value, step];
    }
  }

  /**
   * Открывает мастер повышения уровня класса.
   * @param id - класс листа
   */
  async function startLevelUp(id: string): Promise<void> {
    const owner = document.value.classes.find(
      (candidate) => candidate.id === id,
    );

    if (!owner?.url) {
      return;
    }

    classId.value = id;
    newClass.value = null;
    isOpen.value = true;
    isLoading.value = true;
    steps.value = [];

    try {
      const [details, archetypeDetails] = await Promise.all([
        loadClassDetails(owner.url),
        owner.archetypeUrl ? loadClassDetails(owner.archetypeUrl) : null,
        loadClassList(),
      ]);

      base.value = details;
      archetype.value = archetypeDetails;
      targetLevel.value = Math.min(owner.level + 1, maxTargetLevel.value);
      pushStep('average');
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, LEVEL_UP_TEXT.loadFailed),
        color: 'error',
      });

      isOpen.value = false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Открывает мастер нового класса: первый уровень класса.
   * @param url - адрес класса
   */
  async function startNewClass(url: string): Promise<void> {
    isOpen.value = true;
    isLoading.value = true;
    steps.value = [];
    archetype.value = null;

    try {
      const [details] = await Promise.all([
        loadClassDetails(url),
        loadClassList(),
      ]);

      base.value = details;
      classId.value = createSheetElementId();

      newClass.value = {
        id: classId.value,
        name: details.detail.name.rus,
        url,
        archetypeName: null,
        archetypeUrl: null,
        level: CHARACTER_LEVEL.min,
        hitDie:
          details.detail.traits?.diceHp
          ?? parseHitDie(details.detail.dice)
          ?? 8,
        hitPointGains: [],
      };

      targetLevel.value = CHARACTER_LEVEL.min;
      pushStep('average');
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, LEVEL_UP_TEXT.loadFailed),
        color: 'error',
      });

      isOpen.value = false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Способ прироста хитов текущего шага.
   * @param mode - способ прироста
   */
  function setHitPointsMode(mode: HitPointsGainMode): void {
    rebuildCurrent({ hitPointsMode: mode });
  }

  /** Бросает кость хитов текущего шага. */
  function rollHitDie(): void {
    const die = sheetClass.value?.hitDie;

    if (die) {
      rebuildCurrent({
        hitPointsMode: 'roll',
        roll: rollFormula(LEVEL_UP_TEXT.hitPoints, `1к${die}`),
      });
    }
  }

  /**
   * Выбирает подкласс на текущем шаге: карточка архетипа догружается, и
   * шаг собирается заново с умениями архетипа.
   * @param url - адрес архетипа
   */
  async function setSubclass(url: string): Promise<void> {
    const option = archetypeOptions.value.find((item) => item.value === url);

    if (!option) {
      return;
    }

    isLoading.value = true;

    try {
      archetype.value = await loadClassDetails(url);
      rebuildCurrent({ subclass: { name: option.label, url } });
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, LEVEL_UP_TEXT.loadFailed),
        color: 'error',
      });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Подменяет черновик текущего шага — после ответа на выбор.
   * @param next - новый черновик
   */
  function setDraft(next: SheetDocument): void {
    const step = currentStep.value;

    if (step) {
      steps.value = [...steps.value.slice(0, -1), { ...step, after: next }];
    }
  }

  /**
   * Характеристики «Увеличения характеристик»: две прибавки по +1 (одна и
   * та же характеристика дважды — это +2).
   * @param abilities - характеристики прибавок
   */
  function setImprovementAbilities(abilities: ReadonlyArray<string>): void {
    const step = currentStep.value;

    if (step?.improvementSourceId && !step.isFeatImprovement) {
      setDraft(
        setSourceAnswers(
          step.after,
          step.improvementSourceId,
          'asi',
          abilities,
        ),
      );
    }
  }

  /**
   * Черта вместо «Увеличения характеристик»: источник увеличения снимается,
   * черта становится источником уровня класса.
   * @param url - адрес черты
   */
  async function setImprovementFeat(url: string): Promise<void> {
    const step = currentStep.value;
    const owner = sheetClass.value;

    if (!step?.improvementSourceId || !owner) {
      return;
    }

    isLoading.value = true;

    try {
      const feat = await loadFeatSource('feat', url, {
        classId: owner.id,
        level: step.classLevel,
        characterLevel: getRawLevel(step.before) + 1,
      });

      const next = addSources(
        removeSources(step.after, [step.improvementSourceId]),
        [feat],
      );

      steps.value = [
        ...steps.value.slice(0, -1),
        {
          ...step,
          after: next,
          improvementSourceId: feat.id,
          isFeatImprovement: true,
        },
      ];
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, LEVEL_UP_TEXT.loadFailed),
        color: 'error',
      });
    } finally {
      isLoading.value = false;
    }
  }

  /** Возвращает «Увеличение характеристик» вместо взятой черты. */
  function resetImprovement(): void {
    rebuildCurrent({});
  }

  /** Следующий уровень. */
  function goNext(): void {
    if (!isLastStep.value) {
      pushStep(currentStep.value?.hitPointsMode ?? 'average');
    }
  }

  /** Предыдущий уровень: шаг снимается целиком. */
  function back(): void {
    if (steps.value.length > 1) {
      steps.value = steps.value.slice(0, -1);
    }
  }

  /** Переносит черновик в лист и закрывает мастер. */
  function apply(): void {
    const result = currentStep.value?.after;

    if (result) {
      update(() => result);
    }

    close();
  }

  function close(): void {
    isOpen.value = false;
    steps.value = [];
  }

  /**
   * Источник шага по идентификатору в черновике.
   * @param id - идентификатор источника
   */
  function getDraftSource(id: string): SheetSource | undefined {
    return findSource(draft.value, id);
  }

  return {
    isOpen,
    isLoading,
    classList,
    steps,
    currentStep,
    draft,
    sheetClass,
    subclassLevel,
    archetypeOptions,
    targetLevel,
    maxTargetLevel,
    isLastStep,
    loadClassList,
    startLevelUp,
    startNewClass,
    setHitPointsMode,
    rollHitDie,
    setSubclass,
    setDraft,
    setImprovementAbilities,
    setImprovementFeat,
    resetImprovement,
    next: goNext,
    back,
    apply,
    close,
    getDraftSource,
  };
});
