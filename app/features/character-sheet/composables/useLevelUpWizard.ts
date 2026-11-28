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
  getClassSpellGrowth,
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

/** Шаг мастера: один взятый уровень одного из классов. */
export interface LevelUpStep {
  /** Класс листа, которому шаг добавляет уровень. */
  classId: string;
  className: string;
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
  /** Сколько заговоров и заклинаний класс узнаёт на этом уровне. */
  spellGrowth: { cantrips: number; spells: number; maxLevel: number };
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
 * Мастер повышения уровня — порт `useLevelUpWizard` core-app. Каждый шаг —
 * один уровень одного класса: прирост хитов (среднее, бросок, максимум),
 * подкласс на его уровне, умения уровня с выборами, «Увеличение
 * характеристик» (характеристики или черта) и новые заклинания. Шаги
 * применяются к черновику листа по очереди, и следующий шаг можно отдать
 * любому классу — за один заход поднимаются несколько классов. «Применить»
 * переносит черновик в лист. Новый класс — тот же мастер с первого уровня
 * нового класса; окно выбора класса показывает его шаг у себя.
 */
export const useLevelUpWizard = createSharedComposable(() => {
  const api = useApi();
  const toast = useToast();
  const { document, update } = useCharacterSheet();
  const { rollFormula } = useSheetRoll();

  const isOpen = ref(false);
  const isLoading = ref(false);
  const classList = shallowRef<Array<ClassLink>>([]);
  const details = shallowRef<ReadonlyMap<string, ClassDetails>>(new Map());
  const newClass = shallowRef<SheetClass | null>(null);
  const steps = shallowRef<Array<LevelUpStep>>([]);

  const currentStep = computed(() => steps.value.at(-1) ?? null);

  const draft = computed(() => currentStep.value?.after ?? document.value);

  const sheetClass = computed(
    () =>
      draft.value.classes.find(
        (candidate) => candidate.id === currentStep.value?.classId,
      ) ?? null,
  );

  /**
   * Карточка класса из загруженных.
   * @param url - адрес класса или архетипа
   */
  function getDetails(url: string | null | undefined): ClassDetails | null {
    return url ? (details.value.get(url) ?? null) : null;
  }

  const subclassLevel = computed(
    () =>
      getDetails(sheetClass.value?.url)?.detail.enabledArhitypeLevel ?? null,
  );

  const archetypeOptions = computed(() =>
    (
      classList.value.find((link) => link.url === sheetClass.value?.url)
        ?.archetypes ?? []
    ).map((link) => ({ label: link.name.rus, value: link.url })),
  );

  /** Классы черновика, которым можно взять ещё уровень мастером. */
  const classOptions = computed(() =>
    draft.value.classes
      .filter((candidate) => candidate.url)
      .map((candidate) => ({
        label: `${candidate.name} ${candidate.level + 1}`,
        value: candidate.id,
      })),
  );

  const canAddStep = computed(
    () => getRawLevel(draft.value) < CHARACTER_LEVEL.max,
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
   * Догружает карточки классов и архетипов, которых ещё нет.
   * @param urls - адреса записей
   */
  async function ensureDetails(
    urls: ReadonlyArray<string | null | undefined>,
  ): Promise<void> {
    const missing = [
      ...new Set(
        urls.filter(
          (url): url is string => Boolean(url) && !details.value.has(url ?? ''),
        ),
      ),
    ];

    if (!missing.length) {
      return;
    }

    const loaded = await Promise.all(missing.map(loadClassDetails));
    const next = new Map(details.value);

    missing.forEach((url, index) => {
      const entry = loaded[index];

      if (entry) {
        next.set(url, entry);
      }
    });

    details.value = next;
  }

  /**
   * Собирает шаг: уровень класса, хиты, подкласс, умения уровня,
   * «Увеличение характеристик» и рост заклинаний.
   * @param before - документ до шага
   * @param classId - класс листа
   * @param hitPointsMode - способ прироста хитов
   * @param roll - результат броска кости
   * @param subclass - подкласс, выбранный на шаге
   */
  function buildStep(
    before: SheetDocument,
    classId: string,
    hitPointsMode: HitPointsGainMode,
    roll: number | null,
    subclass: { name: string; url: string } | null,
  ): LevelUpStep | null {
    const existing = before.classes.find(
      (candidate) => candidate.id === classId,
    );

    const owner =
      existing ?? (newClass.value?.id === classId ? newClass.value : null);

    const base = getDetails(owner?.url);

    if (!owner || !base) {
      return null;
    }

    const archetype = getDetails(subclass?.url ?? owner.archetypeUrl);
    const classLevel = (existing?.level ?? 0) + 1;
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
      (archetype ?? base).mechanics,
      classLevel,
    );

    const sources: Array<SheetSource> = [
      ...(existing
        ? []
        : [createClassSource(base, ownerAtLevel, rawLevel === 0)]),
      ...(subclass && archetype
        ? [
            createSource({
              kind: 'subclass',
              name: subclass.name,
              url: subclass.url,
              classId: owner.id,
              level: classLevel,
              characterLevel,
              mechanics: archetype.mechanics.mechanics,
              activeEffects: archetype.mechanics.activeEffects,
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
      classId: owner.id,
      className: owner.name,
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
      spellGrowth: getClassSpellGrowth(
        base.detail,
        archetype?.detail ?? null,
        classLevel,
      ),
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
      step.classId,
      patch.hitPointsMode ?? step.hitPointsMode,
      patch.roll === undefined ? step.roll : patch.roll,
      patch.subclass === undefined ? step.subclass : patch.subclass,
    );

    if (rebuilt) {
      steps.value = [...steps.value.slice(0, -1), rebuilt];
    }
  }

  /**
   * Показывает ошибку загрузки.
   * @param error - ошибка запроса
   */
  function notifyFailure(error: unknown): void {
    toast.add({
      title: getApiErrorMessage(error, LEVEL_UP_TEXT.loadFailed),
      color: 'error',
    });
  }

  /**
   * Добавляет шаг уровня класса от текущего черновика.
   * @param classId - класс листа
   */
  async function addStep(classId: string): Promise<void> {
    const before = draft.value;

    const owner =
      before.classes.find((candidate) => candidate.id === classId)
      ?? (newClass.value?.id === classId ? newClass.value : null);

    if (!owner || !canAddStep.value) {
      return;
    }

    isLoading.value = true;

    try {
      await ensureDetails([owner.url, owner.archetypeUrl]);

      const step = buildStep(
        before,
        classId,
        currentStep.value?.hitPointsMode ?? 'average',
        null,
        null,
      );

      if (step) {
        steps.value = [...steps.value, step];
      }
    } catch (error) {
      notifyFailure(error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Открывает мастер повышения уровня класса.
   * @param id - класс листа
   */
  async function startLevelUp(id: string): Promise<void> {
    newClass.value = null;
    steps.value = [];
    isOpen.value = true;

    await loadClassList();
    await addStep(id);

    if (!steps.value.length) {
      isOpen.value = false;
    }
  }

  /**
   * Готовит шаг нового класса: первый уровень класса. Подкласс,
   * выбранный в списке, ставится сразу, если класс выбирает его на первом
   * уровне.
   * @param url - адрес класса
   * @param subclassUrl - адрес подкласса из списка
   * @returns удалось ли подготовить шаг
   */
  async function prepareNewClass(
    url: string,
    subclassUrl: string | null = null,
  ): Promise<boolean> {
    steps.value = [];
    isLoading.value = true;

    try {
      await Promise.all([ensureDetails([url, subclassUrl]), loadClassList()]);

      const base = getDetails(url);

      if (!base) {
        return false;
      }

      newClass.value = {
        id: createSheetElementId(),
        name: base.detail.name.rus,
        url,
        archetypeName: null,
        archetypeUrl: null,
        level: CHARACTER_LEVEL.min,
        hitDie:
          base.detail.traits?.diceHp ?? parseHitDie(base.detail.dice) ?? 8,
        hitPointGains: [],
        spellcastingAbility: null,
      };

      const archetype = getDetails(subclassUrl);

      const subclass =
        subclassUrl
        && archetype
        && (base.detail.enabledArhitypeLevel ?? CHARACTER_LEVEL.max)
          <= CHARACTER_LEVEL.min
          ? { name: archetype.detail.name.rus, url: subclassUrl }
          : null;

      const step = buildStep(
        document.value,
        newClass.value.id,
        'average',
        null,
        subclass,
      );

      steps.value = step ? [step] : [];

      return Boolean(step);
    } catch (error) {
      notifyFailure(error);

      return false;
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
      await ensureDetails([url]);
      rebuildCurrent({ subclass: { name: option.label, url } });
    } catch (error) {
      notifyFailure(error);
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

    if (!step?.improvementSourceId) {
      return;
    }

    isLoading.value = true;

    try {
      const feat = await loadFeatSource('feat', url, {
        classId: step.classId,
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
      notifyFailure(error);
    } finally {
      isLoading.value = false;
    }
  }

  /** Возвращает «Увеличение характеристик» вместо взятой черты. */
  function resetImprovement(): void {
    rebuildCurrent({});
  }

  /** Предыдущий шаг: последний шаг снимается целиком. */
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
    newClass.value = null;
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
    classOptions,
    canAddStep,
    loadClassList,
    startLevelUp,
    prepareNewClass,
    addStep,
    setHitPointsMode,
    rollHitDie,
    setSubclass,
    setDraft,
    setImprovementAbilities,
    setImprovementFeat,
    resetImprovement,
    back,
    apply,
    close,
    getDraftSource,
    getDetails,
  };
});
