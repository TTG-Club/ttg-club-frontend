import type {
  CatalogMechanics,
  ClassMechanicsDetail,
  MechanicsClassFeature,
} from './mechanics';
import type {
  SheetClass,
  SheetClassDetail,
  SheetDocument,
  SheetSource,
} from './schema';
import type {
  ClassFeatureEntry,
  ClassProgression,
  HitPointsGainMode,
  LevelUpFeature,
  SkillKey,
} from './types';

import {
  ABILITY_IMPROVEMENT_FEATURE_NAME,
  CLASS_FEATURE_SCALING_SEPARATOR,
  CLASS_SKILLS_CHOICE_KEY,
  HIT_DIE_AVERAGE_BONUS,
  KNOWN_CANTRIPS_COLUMN,
  KNOWN_SPELLS_COLUMN,
  MULTICLASS_PROFICIENCIES,
  MULTICLASS_SKILLS_CHOICE_KEY,
} from './constants';
import { catalogMechanicsSchema } from './mechanics';
import { addSources, createSource, removeSources } from './sources';
import {
  getCharacterLevel,
  getClassColumnValue,
  getPactMagic,
  parseSpellSlotCells,
} from './utils';

/*
 * Классы и уровни: источники класса, подкласса и умений уровня, прирост хитов
 * и снятие уровня. Мастер повышения собирает шаг за шагом то, что даёт
 * каждый уровень, а применяет готовое отсюда — так добавление класса,
 * повышение и снятие уровня считают одинаково.
 */

/** Разделитель адреса класса и идентификатора умения в адресе источника. */
const FEATURE_URL_SEPARATOR = '#';

/**
 * Конец адреса класса: `/classes/fighter` → `fighter`.
 * @param url - адрес класса
 */
export function getClassSlug(url: string | null): string {
  return (url ?? '').split('/').filter(Boolean).at(-1)?.toLowerCase() ?? '';
}

/**
 * Умение «Увеличение характеристик»: у старых данных нет флага, его узнают
 * по названию.
 * @param name - название умения
 */
export function isAbilityImprovementFeature(name: string): boolean {
  return name.trim().toLowerCase().startsWith(ABILITY_IMPROVEMENT_FEATURE_NAME);
}

/**
 * Умение карточки класса в виде мастера повышения.
 * @param feature - умение из карточки
 */
function toLevelUpFeature(feature: MechanicsClassFeature): LevelUpFeature {
  return {
    id: feature.id,
    name: feature.name,
    level: feature.level,
    isArchetype: Boolean(feature.archetypeFeature),
    isAbilityImprovement: isAbilityImprovementFeature(feature.name),
    mechanics: feature.mechanics,
    activeEffects: feature.activeEffects,
  };
}

/**
 * Умения уровня класса из карточки класса (или архетипа — в ней умения
 * класса уже вместе с умениями архетипа). Сам архетип умением не считается:
 * его источник — подкласс.
 * @param detail - механика карточки класса или архетипа
 * @param level - уровень класса
 */
export function getClassLevelFeatures(
  detail: ClassMechanicsDetail | undefined,
  level: number,
): Array<LevelUpFeature> {
  return (detail?.traits?.features ?? [])
    .filter((feature) => feature.level === level && !feature.archetypeRoot)
    .map(toLevelUpFeature);
}

/**
 * Умения до уровня класса включительно.
 * @param detail - механика карточки класса или архетипа
 * @param level - уровень класса
 */
export function getClassFeaturesUpTo(
  detail: ClassMechanicsDetail | undefined,
  level: number,
): Array<LevelUpFeature> {
  return (detail?.traits?.features ?? [])
    .filter((feature) => feature.level <= level && !feature.archetypeRoot)
    .map(toLevelUpFeature);
}

/**
 * Прирост максимума хитов за уровень. Первый уровень персонажа — максимум
 * кости; дальше среднее (половина кости + 1), бросок или максимум. Прирост
 * не меньше единицы.
 * @param mode - способ прироста
 * @param hitDie - кость хитов класса
 * @param constitutionModifier - модификатор Телосложения
 * @param rolled - результат броска кости; null — не брошена
 * @param isFirstCharacterLevel - первый уровень персонажа
 */
export function getHitPointGain(
  mode: HitPointsGainMode,
  hitDie: number,
  constitutionModifier: number,
  rolled: number | null,
  isFirstCharacterLevel: boolean,
): number {
  let die = hitDie / 2 + HIT_DIE_AVERAGE_BONUS;

  if (isFirstCharacterLevel || mode === 'max') {
    die = hitDie;
  } else if (mode === 'roll') {
    die = rolled ?? die;
  }

  return Math.max(1, die + constitutionModifier);
}

/**
 * Адрес источника умения класса: адрес класса и идентификатор умения.
 * @param classUrl - адрес класса
 * @param featureId - идентификатор умения в карточке
 */
export function getClassFeatureSourceUrl(
  classUrl: string | null,
  featureId: string,
): string {
  return `${classUrl ?? ''}${FEATURE_URL_SEPARATOR}${featureId}`;
}

/**
 * Источник умения класса.
 * @param sheetClass - класс листа
 * @param feature - умение уровня
 * @param characterLevel - уровень персонажа на момент получения
 */
export function createClassFeatureSource(
  sheetClass: SheetClass,
  feature: LevelUpFeature,
  characterLevel: number,
): SheetSource {
  return createSource({
    kind: 'classFeature',
    name: feature.name,
    url: getClassFeatureSourceUrl(sheetClass.url, feature.id),
    classId: sheetClass.id,
    level: feature.level,
    characterLevel,
    mechanics: feature.mechanics,
    activeEffects: feature.activeEffects,
  });
}

/** Что известно о классе, если механики в справочнике нет. */
export interface ClassFallback {
  /** Спасброски, разобранные из текста карточки. */
  savingThrows: ReadonlyArray<string>;
  /** Навыки на выбор (ключи SkillType). */
  skills: ReadonlyArray<SkillKey>;
  skillCount: number;
}

/**
 * Механика класса, взятого первым. Нет механики в справочнике — она
 * собирается из текстовых полей карточки (спасброски и навыки на выбор).
 * @param mechanics - механика карточки класса
 * @param fallback - текстовые поля карточки
 */
export function getFirstClassMechanics(
  mechanics: CatalogMechanics,
  fallback: ClassFallback,
): CatalogMechanics {
  const hasSaves = Boolean(mechanics?.proficiencies?.savingThrows?.length);

  const hasSkills = (mechanics?.choices ?? []).some(
    (choice) => choice.key === CLASS_SKILLS_CHOICE_KEY,
  );

  if (hasSaves && hasSkills) {
    return mechanics;
  }

  return catalogMechanicsSchema.parse({
    ...mechanics,
    proficiencies: {
      ...mechanics?.proficiencies,
      savingThrows: hasSaves
        ? mechanics?.proficiencies?.savingThrows
        : fallback.savingThrows,
    },
    choices: [
      ...(mechanics?.choices ?? []),
      ...(hasSkills || !fallback.skillCount
        ? []
        : [
            {
              key: CLASS_SKILLS_CHOICE_KEY,
              type: 'SKILL',
              count: fallback.skillCount,
              options: fallback.skills.map((skill) => ({ value: skill })),
            },
          ]),
    ],
  });
}

/**
 * Механика класса, взятого не первым (PHB, гл. 6): спасбросков нет,
 * владения — по таблице мультиклассирования, навык на выбор — из навыков
 * класса. Ресурсы, модификаторы и заклинания класса остаются.
 * @param url - адрес класса
 * @param mechanics - механика карточки класса
 * @param fallback - текстовые поля карточки
 */
export function getMulticlassMechanics(
  url: string | null,
  mechanics: CatalogMechanics,
  fallback: ClassFallback,
): CatalogMechanics {
  const table = MULTICLASS_PROFICIENCIES[getClassSlug(url)];

  const classSkills =
    (mechanics?.choices ?? []).find(
      (choice) => choice.key === CLASS_SKILLS_CHOICE_KEY,
    )?.options
    ?? fallback.skills.map((skill) => ({ value: skill, name: null }));

  return catalogMechanicsSchema.parse({
    ...mechanics,
    proficiencies: table
      ? {
          armorCategories: table.armor,
          weaponCategories: table.weapons,
          tools: table.tools.map((name) => ({ url: '', name })),
        }
      : null,
    choices: table?.skillCount
      ? [
          {
            key: MULTICLASS_SKILLS_CHOICE_KEY,
            type: 'SKILL',
            count: table.skillCount,
            options: classSkills,
          },
        ]
      : null,
  });
}

/** Итог одного шага мастера повышения уровня. */
export interface LevelUpStepResult {
  classId: string;
  /** Класс, который этот шаг добавляет в лист (первый уровень класса). */
  newClass: SheetClass | null;
  /** Уровень класса после шага. */
  classLevel: number;
  hitPointGain: number;
  /** Подкласс, выбранный на шаге. */
  subclass: { name: string; url: string } | null;
  /** Источники шага: класс, подкласс, умения, увеличение характеристик, черта. */
  sources: Array<SheetSource>;
}

/**
 * Применяет шаг повышения уровня: уровень класса, подкласс, прирост хитов и
 * источники шага.
 * @param document - лист персонажа
 * @param step - итог шага
 */
export function applyLevelUpStep(
  document: SheetDocument,
  step: LevelUpStepResult,
): SheetDocument {
  const classes = step.newClass
    ? [...document.classes, step.newClass]
    : document.classes;

  const updated: SheetDocument = {
    ...document,
    classes: classes.map((sheetClass) => {
      if (sheetClass.id !== step.classId) {
        return sheetClass;
      }

      const gains = [...sheetClass.hitPointGains];

      gains[step.classLevel - 1] = step.hitPointGain;

      return {
        ...sheetClass,
        level: step.classLevel,
        archetypeName: step.subclass?.name ?? sheetClass.archetypeName,
        archetypeUrl: step.subclass?.url ?? sheetClass.archetypeUrl,
        hitPointGains: Array.from(gains, (gain) => gain ?? 0),
      };
    }),
    health: {
      ...document.health,
      max: document.health.max + step.hitPointGain,
      current: document.health.current + step.hitPointGain,
    },
  };

  return addSources(updated, step.sources);
}

/**
 * Снимает верхний уровень класса: прирост хитов этого уровня, умения,
 * подкласс, черты и увеличения характеристик, полученные на нём. Последний
 * уровень снимает класс целиком.
 * @param document - лист персонажа
 * @param classId - класс листа
 */
export function removeClassLevel(
  document: SheetDocument,
  classId: string,
): SheetDocument {
  const sheetClass = document.classes.find(
    (candidate) => candidate.id === classId,
  );

  if (!sheetClass) {
    return document;
  }

  if (sheetClass.level <= 1) {
    return removeClass(document, classId);
  }

  const nextLevel = sheetClass.level - 1;
  const gain = sheetClass.hitPointGains[nextLevel] ?? 0;

  const removed = document.sources.filter(
    (source) =>
      source.classId === classId
      && source.level !== null
      && source.level > nextLevel,
  );

  const losesSubclass = removed.some((source) => source.kind === 'subclass');

  const stripped = removeSources(
    document,
    removed.map((source) => source.id),
  );

  const max = Math.max(0, stripped.health.max - gain);

  return {
    ...stripped,
    classes: stripped.classes.map((candidate) =>
      candidate.id === classId
        ? {
            ...candidate,
            level: nextLevel,
            hitPointGains: candidate.hitPointGains.slice(0, nextLevel),
            archetypeName: losesSubclass ? null : candidate.archetypeName,
            archetypeUrl: losesSubclass ? null : candidate.archetypeUrl,
          }
        : candidate,
    ),
    health: {
      ...stripped.health,
      max,
      current: Math.min(
        stripped.health.current,
        max || stripped.health.current,
      ),
    },
  };
}

/**
 * Снимает класс целиком: его источники со всеми выдачами и прирост хитов
 * всех его уровней.
 * @param document - лист персонажа
 * @param classId - класс листа
 */
export function removeClass(
  document: SheetDocument,
  classId: string,
): SheetDocument {
  const sheetClass = document.classes.find(
    (candidate) => candidate.id === classId,
  );

  if (!sheetClass) {
    return document;
  }

  const stripped = removeSources(
    document,
    document.sources
      .filter((source) => source.classId === classId)
      .map((source) => source.id),
  );

  const gains = sheetClass.hitPointGains.reduce((sum, gain) => sum + gain, 0);
  const max = Math.max(0, stripped.health.max - gains);

  return {
    ...stripped,
    classes: stripped.classes.filter((candidate) => candidate.id !== classId),
    health: {
      ...stripped.health,
      max,
      current: Math.min(
        stripped.health.current,
        max || stripped.health.current,
      ),
    },
  };
}

/**
 * Источники умений класса, которых на листе ещё нет, — для листов, созданных
 * до механики: умения до текущего уровня без прироста хитов.
 * @param document - лист персонажа
 * @param sheetClass - класс листа
 * @param detail - механика карточки класса (или архетипа)
 */
export function getMissingClassFeatureSources(
  document: SheetDocument,
  sheetClass: SheetClass,
  detail: ClassMechanicsDetail | undefined,
): Array<SheetSource> {
  const present = new Set(
    document.sources
      .filter((source) => source.classId === sheetClass.id)
      .map((source) => source.url),
  );

  const level = getCharacterLevel(document.classes);

  return getClassFeaturesUpTo(detail, sheetClass.level)
    .filter(
      (feature) =>
        !present.has(getClassFeatureSourceUrl(sheetClass.url, feature.id)),
    )
    .map((feature) => createClassFeatureSource(sheetClass, feature, level));
}

/** Таблицы класса, нужные для роста заклинаний: колонки и ячейки по уровням. */
type ClassSpellTables = Pick<SheetClassDetail, 'tableColumns'> & {
  traits?: {
    levels?: ReadonlyArray<{ spellSlots: ReadonlyArray<string> }> | null;
  } | null;
};

/**
 * Сколько заговоров и заклинаний класс узнаёт на уровне — по приросту
 * колонок «Известные заговоры» и «Известные заклинания» таблицы класса, — и
 * наибольший круг его ячеек на этом уровне. Таблица подкласса важнее
 * (у мистического рыцаря ячейки только в ней). У подготавливающих классов
 * колонки известных заклинаний нет: прирост — ноль.
 * @param base - карточка класса
 * @param archetype - карточка подкласса
 * @param classLevel - уровень класса после шага
 */
export function getClassSpellGrowth(
  base: ClassSpellTables,
  archetype: ClassSpellTables | null,
  classLevel: number,
): { cantrips: number; spells: number; maxLevel: number } {
  const columns = archetype?.tableColumns?.length
    ? archetype.tableColumns
    : (base.tableColumns ?? []);

  const levels = archetype?.traits?.levels ?? base.traits?.levels ?? [];

  /**
   * Прирост колонки на уровне.
   * @param name - название колонки
   */
  const growth = (name: string): number => {
    const now = getClassColumnValue(columns, name, classLevel) ?? 0;

    const before =
      classLevel > 1
        ? (getClassColumnValue(columns, name, classLevel - 1) ?? 0)
        : 0;

    return Math.max(0, now - before);
  };

  const slots = parseSpellSlotCells(levels[classLevel - 1]?.spellSlots ?? []);

  const slotLevel = slots.reduce(
    (max, count, index) => (count > 0 ? index + 1 : max),
    0,
  );

  return {
    cantrips: growth(KNOWN_CANTRIPS_COLUMN),
    spells: growth(KNOWN_SPELLS_COLUMN),
    maxLevel: Math.max(
      slotLevel,
      getPactMagic(columns, classLevel)?.level ?? 0,
    ),
  };
}

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
export function getClassProgression(
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
export function getClassFeatureEntries(
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
