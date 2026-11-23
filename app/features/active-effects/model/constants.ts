/**
 * Справочники и подписи редактора активных эффектов.
 *
 * Снято с системы dnd5e-2024 версии `EFFECT_SYSTEM_VERSION` и приведено к
 * правилам 2014 года (старый сайт): шаблоны состояний — по PHB 2014, Истощение —
 * шестиступенчатая таблица, приёмов оружия нет. Значения (`value`)
 * совпадают со словарями VTTG, чтобы экспорт был pass-through. Подписи формы
 * взяты дословно из окна эффекта системы: автор на сайте и мастер в VTTG видят
 * одни и те же слова. Названия состояний, типов урона и характеристик — свои,
 * из справочника сайта: в каталоге они уже так называются.
 *
 * Состав словарей сверяется скриптом `scripts/compare-effect-dictionaries.mjs`
 * и тестом `test/active-effects/dictionaries.test.ts`: он падает, если счётчики
 * разошлись с записанной версией системы.
 *
 * Зеркало: dnd5-test-migrate/src/engine/activeEffectTypes.ts,
 * src/client/ui/effect/constants.ts, src/client/ui/effect/triggerLabels.ts.
 */

/** Версия системы dnd5e-2024, с которой снят порт справочников и подписей. */
import type { EffectChangeStepPeriod } from './changeSteps';
import type {
  EffectDelivery,
  EffectFormContext,
  EffectFormStep,
  EffectSaveUnavailableReason,
  EffectSuccessOutcome,
  EffectTriggerActionType,
  EffectTriggerPreset,
  InertEffectField,
} from './layout';
import type {
  TriggerAttackKind,
  TriggerConditionKind,
  TriggerConditionParameter,
} from './triggerConditions';
import type {
  EffectActionCost,
  EffectCastOwner,
  EffectNotifyTarget,
  EffectRestoreKind,
  EffectTempHpMode,
  EffectTriggerActionGate,
  EffectTriggerAreaShiftKind,
  EffectTriggerAreaTarget,
  EffectTriggerAttackRole,
  EffectTriggerChooser,
  EffectTriggerEvent,
  EffectTriggerLimitPeriod,
  EffectTriggerMaxHpRestEnd,
  EffectTriggerMoveKind,
  EffectTriggerMoveOrigin,
  EffectTriggerRecipient,
  EffectTriggerRestType,
  EffectTriggerSaveMode,
  EffectTriggerTurnOwner,
} from './triggerTypes';
import type {
  EffectAbility,
  EffectActivationMode,
  EffectAreaTrigger,
  EffectAttackTrigger,
  EffectAuraTarget,
  EffectChange,
  EffectChangeMode,
  EffectConditionKey,
  EffectDamagePartTarget,
  EffectDamageType,
  EffectDurationType,
  EffectEscapeActor,
  EffectEscapeOutcome,
  EffectHealKind,
  EffectSaveOutcome,
  EffectSaveTiming,
  EffectTurnAnchor,
  EffectTurnTiming,
  EffectVariantPick,
} from './types';

import {
  APPLIER_TRIGGER_RECIPIENT,
  AREA_TRIGGER_RECIPIENT,
  CHOICE_TRIGGER_RECIPIENT,
  DEFAULT_EFFECT_TAG,
  MAX_HP_REDUCTION_NEVER_ENDS,
} from './triggerTypes';
import { DEFAULT_EFFECT_CHANGE_PRIORITY } from './types';

export const EFFECT_SYSTEM_VERSION = '0.8.66';

/** Переменная урона события в формулах срабатывания. */
export const EVENT_DAMAGE_VARIABLE = 'damage';

/** «На сколько» нового действия «Уменьшить максимум хитов». */
export const DEFAULT_MAX_HP_REDUCTION = `@${EVENT_DAMAGE_VARIABLE}`;

interface Option<Value extends string> {
  label: string;
  value: Value;
}

/** Режимы применения числового изменения — подписи выбора в строке. */
export const EFFECT_CHANGE_MODE_OPTIONS: Array<Option<EffectChangeMode>> = [
  { label: 'Добавить (+)', value: 'add' },
  { label: 'Умножить (×)', value: 'multiply' },
  { label: 'Заменить (=)', value: 'override' },
  { label: 'Не меньше (max)', value: 'upgrade' },
  { label: 'Не больше (min)', value: 'downgrade' },
  { label: 'Особый', value: 'custom' },
];

/** Режимы изменения словом — для описаний («заменить 60»). */
export const EFFECT_CHANGE_MODE_LABELS: Record<EffectChangeMode, string> = {
  add: 'Добавить',
  multiply: 'Умножить',
  override: 'Заменить',
  upgrade: 'Повысить до',
  downgrade: 'Понизить до',
  custom: 'Особое',
};

/** Названия типов длительности. */
export const EFFECT_DURATION_LABELS: Record<EffectDurationType, string> = {
  permanent: 'Постоянно',
  rounds: 'Раунды',
  minutes: 'Минуты',
  hours: 'Часы',
  days: 'Дни',
  turn: 'До хода (точно)',
  special: 'Особое',
};

/** Чей ход прекращает точную «ходовую» длительность. */
export const EFFECT_TURN_ANCHOR_LABELS: Record<EffectTurnAnchor, string> = {
  carrier: 'носителя (цели)',
  source: 'источника (кастера)',
};

/** Момент хода длительности «до хода», когда в данных он не записан. */
export const DEFAULT_EFFECT_TURN_TIMING: EffectTurnTiming = 'end';

/** Чей ход считает длительность «до хода», когда в данных это не записано. */
export const DEFAULT_EFFECT_TURN_ANCHOR: EffectTurnAnchor = 'carrier';

/** Момент хода якоря для точной «ходовой» длительности. */
export const EFFECT_TURN_TIMING_LABELS: Record<EffectTurnTiming, string> = {
  start: 'в начале хода',
  end: 'в конце хода',
};

/**
 * Момент хода урона каждый ход и повторного спасброска — те же слова, что у
 * момента хода длительности.
 */
export const EFFECT_SAVE_TIMING_LABELS: Record<EffectSaveTiming, string> = {
  startOfTurn: EFFECT_TURN_TIMING_LABELS.start,
  endOfTurn: EFFECT_TURN_TIMING_LABELS.end,
};

/** Названия моментов срабатывания области или ауры. */
export const EFFECT_AREA_TRIGGER_LABELS: Record<EffectAreaTrigger, string> = {
  stay: 'Пока внутри',
  enter: 'При входе',
  exit: 'При выходе',
};

/** Названия снятия после атаки. */
export const EFFECT_ATTACK_TRIGGER_LABELS: Record<EffectAttackTrigger, string> =
  {
    carrierAttack: 'Снять после своей атаки',
    attackOnCarrier: 'Снять после атаки по цели',
  };

/** Характеристики (полные имена — словарь VTTG). */
export const EFFECT_ABILITY_OPTIONS: Array<Option<EffectAbility>> = [
  { label: 'Сила', value: 'strength' },
  { label: 'Ловкость', value: 'dexterity' },
  { label: 'Телосложение', value: 'constitution' },
  { label: 'Интеллект', value: 'intelligence' },
  { label: 'Мудрость', value: 'wisdom' },
  { label: 'Харизма', value: 'charisma' },
];

/** Ключи характеристик — для проверки значения части условия. */
const EFFECT_ABILITY_KEYS: ReadonlySet<string> = new Set(
  EFFECT_ABILITY_OPTIONS.map((ability) => ability.value),
);

/**
 * Ключ ли характеристики эта строка.
 *
 * @param ability строка из условия.
 * @returns `true`, если это ключ характеристики словаря VTTG.
 */
export function isEffectAbility(ability: string): boolean {
  return EFFECT_ABILITY_KEYS.has(ability);
}

/** Характеристики в родительном падеже — «спасбросок Телосложения». */
export const EFFECT_ABILITY_GENITIVE_LABELS: Record<EffectAbility, string> = {
  strength: 'Силы',
  dexterity: 'Ловкости',
  constitution: 'Телосложения',
  intelligence: 'Интеллекта',
  wisdom: 'Мудрости',
  charisma: 'Харизмы',
};

/** Кого задевает аура — в сводке и описании. */
export const EFFECT_AURA_TARGET_SCENARIO_LABELS: Record<
  EffectAuraTarget,
  string
> = {
  allies: 'союзники',
  enemies: 'враги',
  all: 'все существа',
};

/**
 * Ключи стандартных состояний D&D 5e.
 *
 * Названия — как в остальном каталоге сайта (`CONDITION_LABELS` листа,
 * `CONDITION_CATALOG` трекера, справочник `/dictionaries/conditions`); там они
 * совпадают с `CONDITIONS` системы VTTG. Своей формы слова здесь не заводится:
 * одно состояние, названное в двух местах по-разному, читается как два.
 */
export const EFFECT_CONDITION_OPTIONS: Array<Option<EffectConditionKey>> = [
  { label: 'Ослеплённый', value: 'blinded' },
  { label: 'Очарованный', value: 'charmed' },
  { label: 'Оглохший', value: 'deafened' },
  { label: 'Истощённый', value: 'exhaustion' },
  { label: 'Испуганный', value: 'frightened' },
  { label: 'Схваченный', value: 'grappled' },
  { label: 'Недееспособный', value: 'incapacitated' },
  { label: 'Невидимый', value: 'invisible' },
  { label: 'Парализованный', value: 'paralyzed' },
  { label: 'Окаменевший', value: 'petrified' },
  { label: 'Отравленный', value: 'poisoned' },
  { label: 'Лежащий ничком', value: 'prone' },
  { label: 'Опутанный', value: 'restrained' },
  { label: 'Ошеломлённый', value: 'stunned' },
  { label: 'Бессознательный', value: 'unconscious' },
];

/**
 * Типы существ для условий эффекта — зеркало `CREATURE_CATEGORIES` из VTTG.
 * Свой список, а не словарь сайта: у справочника бестиария ключи другие
 * (`SLIME`, пять видов `SWARM_OF_*`), а условие сверяет ровно тип VTTG.
 */
export const EFFECT_CREATURE_CATEGORY_OPTIONS: Array<Option<string>> = [
  { label: 'Аберрация', value: 'aberration' },
  { label: 'Зверь', value: 'beast' },
  { label: 'Небожитель', value: 'celestial' },
  { label: 'Конструкт', value: 'construct' },
  { label: 'Дракон', value: 'dragon' },
  { label: 'Элементаль', value: 'elemental' },
  { label: 'Фея', value: 'fey' },
  { label: 'Исчадие', value: 'fiend' },
  { label: 'Великан', value: 'giant' },
  { label: 'Гуманоид', value: 'humanoid' },
  { label: 'Чудовище', value: 'monstrosity' },
  { label: 'Слизь', value: 'ooze' },
  { label: 'Растение', value: 'plant' },
  { label: 'Нежить', value: 'undead' },
  { label: 'Рой', value: 'swarm' },
];

/** Ключи типов существ — для проверки строки из данных. */
const EFFECT_CREATURE_CATEGORY_KEYS: ReadonlySet<string> = new Set(
  EFFECT_CREATURE_CATEGORY_OPTIONS.map((creatureType) => creatureType.value),
);

/**
 * Проверяет, что строка — тип существа VTTG.
 *
 * @param creatureType строка из данных или поля формы.
 * @returns `true` для известного типа существа.
 */
export function isEffectCreatureCategory(creatureType: string): boolean {
  return EFFECT_CREATURE_CATEGORY_KEYS.has(creatureType);
}

/** Размеры существ (ключи — словарь VTTG, lowercase). */
export const EFFECT_CREATURE_SIZE_OPTIONS: Array<Option<string>> = [
  { label: 'Крошечный', value: 'tiny' },
  { label: 'Маленький', value: 'small' },
  { label: 'Средний', value: 'medium' },
  { label: 'Большой', value: 'large' },
  { label: 'Огромный', value: 'huge' },
  { label: 'Громадный', value: 'gargantuan' },
];

/** Ключи размеров существ — для проверки строки из данных. */
const EFFECT_CREATURE_SIZE_KEYS: ReadonlySet<string> = new Set(
  EFFECT_CREATURE_SIZE_OPTIONS.map((creatureSize) => creatureSize.value),
);

/**
 * Проверяет, что строка — размер существа VTTG.
 *
 * @param creatureSize строка из данных или поля формы.
 * @returns `true` для известного размера.
 */
export function isEffectCreatureSize(creatureSize: string): boolean {
  return EFFECT_CREATURE_SIZE_KEYS.has(creatureSize);
}

/**
 * Описывает размер существа: ключ VTTG словами.
 *
 * @param creatureSize ключ размера.
 * @returns подпись либо сам ключ, если он не из словаря.
 */
export function describeEffectCreatureSize(creatureSize: string): string {
  return (
    EFFECT_CREATURE_SIZE_OPTIONS.find((option) => option.value === creatureSize)
      ?.label ?? creatureSize
  );
}

/**
 * Типы урона (ключи — словарь VTTG, lowercase).
 *
 * Названия — как в справочнике типов урона сайта: поле
 * урона эффекта берёт подписи оттуда, и короткая форма рядом («Огонь» против
 * «Огненный») читалась бы как другой тип.
 */
export const EFFECT_DAMAGE_TYPE_OPTIONS: Array<Option<EffectDamageType>> = [
  { label: 'Рубящий', value: 'slashing' },
  { label: 'Колющий', value: 'piercing' },
  { label: 'Дробящий', value: 'bludgeoning' },
  { label: 'Огненный', value: 'fire' },
  { label: 'Холодный', value: 'cold' },
  { label: 'Электрический', value: 'lightning' },
  { label: 'Звуковой', value: 'thunder' },
  { label: 'Ядовитый', value: 'poison' },
  { label: 'Кислотный', value: 'acid' },
  { label: 'Некротический', value: 'necrotic' },
  { label: 'Излучение', value: 'radiant' },
  { label: 'Силовое поле', value: 'force' },
  { label: 'Психический', value: 'psychic' },
];

/** Приставка типа урона в токене формулы без `@`: `dmg.fire`. */
export const EFFECT_DAMAGE_TYPE_TOKEN_PREFIX = 'dmg.';

/** Типы урона токенами формулы: `@dmg.fire` вместо отдельного поля. */
export const EFFECT_DAMAGE_TYPE_TOKEN_OPTIONS: Array<Option<string>> =
  EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType) => ({
    label: damageType.label,
    value: `${EFFECT_DAMAGE_TYPE_TOKEN_PREFIX}${damageType.value}`,
  }));

/** Ключи типов урона — для проверки строки из данных. */
const EFFECT_DAMAGE_TYPE_KEYS: ReadonlySet<string> = new Set(
  EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType) => damageType.value),
);

/**
 * Проверяет, что строка — тип урона, к которому применимы защиты.
 *
 * @param damageType строка из данных или поля формы.
 * @returns `true` для известного типа урона.
 */
export function isEffectDamageType(
  damageType: string,
): damageType is EffectDamageType {
  return EFFECT_DAMAGE_TYPE_KEYS.has(damageType);
}

/**
 * Типы урона в сводке — «2к6 ядом», «1к10 огненный». Зеркало
 * `getShortDamageTypeLabel` системы: полная подпись без слова «урон».
 */
export const EFFECT_DAMAGE_TYPE_SHORT_LABELS: Record<EffectDamageType, string> =
  {
    slashing: 'рубящий',
    piercing: 'колющий',
    bludgeoning: 'дробящий',
    fire: 'огненный',
    cold: 'холодом',
    lightning: 'молнией',
    thunder: 'звуком (гром)',
    poison: 'ядом',
    acid: 'кислотой',
    necrotic: 'некротический',
    radiant: 'излучением',
    force: 'силовой',
    psychic: 'психический',
  };

/**
 * Навыки D&D 5e — зеркало `SKILLS_LABELS` из системы. Один список на всё, что
 * про навыки: и ключи изменений (`skill.` с ключом навыка), и флаги преимущества с
 * помехой. Второй перечень разъехался бы с первым при первом переименовании.
 */
export const EFFECT_SKILL_OPTIONS: Array<Option<string>> = [
  { value: 'acrobatics', label: 'Акробатика' },
  { value: 'investigation', label: 'Анализ' },
  { value: 'arcana', label: 'Аркана' },
  { value: 'athletics', label: 'Атлетика' },
  { value: 'perception', label: 'Внимательность' },
  { value: 'survival', label: 'Выживание' },
  { value: 'performance', label: 'Выступление' },
  { value: 'intimidation', label: 'Запугивание' },
  { value: 'history', label: 'История' },
  { value: 'sleightOfHand', label: 'Ловкость рук' },
  { value: 'medicine', label: 'Медицина' },
  { value: 'deception', label: 'Обман' },
  { value: 'nature', label: 'Природа' },
  { value: 'insight', label: 'Проницательность' },
  { value: 'religion', label: 'Религия' },
  { value: 'stealth', label: 'Скрытность' },
  { value: 'persuasion', label: 'Убеждение' },
  { value: 'animalHandling', label: 'Уход за животными' },
];

/** Цель части урона эффекта. */
export const EFFECT_DAMAGE_TARGET_OPTIONS: Array<
  Option<EffectDamagePartTarget>
> = [
  { label: 'Выбранная цель', value: 'selected' },
  { label: 'На себя', value: 'self' },
  { label: 'Указать отдельно', value: 'choose' },
];

/**
 * Библиотека ключей атрибутов (для поля change.key) — зеркало
 * `EFFECT_TARGET_SUGGESTIONS` из VTTG. Список закрыт: неизвестный ключ движок
 * молча пропускает, и эффект выглядел бы настроенным, ничего не делая.
 */
export const EFFECT_TARGET_KEY_SUGGESTIONS: Array<Option<string>> = [
  // Базовые параметры
  { value: 'armorClass', label: 'Класс доспеха (AC)' },
  { value: 'initiative', label: 'Инициатива (бонус)' },
  { value: 'proficiencyBonus', label: 'Бонус мастерства' },
  { value: 'spellSaveDC', label: 'Сложность спасброска от заклинаний' },
  { value: 'hitPoints.max', label: 'Макс. здоровье (HP)' },

  // Местность
  {
    value: 'terrain.movementCost',
    label: 'Труднопроходимость (цена клетки)',
  },

  // Тип существа: его читают гейты урона «только по нежити» и условия
  { value: 'creatureType', label: 'Тип существа' },

  // Критические попадания
  {
    value: 'critThreshold',
    label:
      'Порог крита атаками оружием (режим «Не больше»: 19 — крит на 19–20)',
  },

  // Скорости
  { value: 'movement.walk', label: 'Скорость (ходьба)' },
  { value: 'movement.fly', label: 'Скорость (полёт)' },
  { value: 'movement.swim', label: 'Скорость (плавание)' },
  { value: 'movement.climb', label: 'Скорость (лазание)' },
  { value: 'movement.burrow', label: 'Скорость (копание)' },

  // Чувства (дальность в футах)
  { value: 'sense.darkvision', label: 'Чувство: Тёмное зрение' },
  { value: 'sense.blindsight', label: 'Чувство: Слепое зрение' },
  { value: 'sense.truesight', label: 'Чувство: Истинное зрение' },
  { value: 'sense.tremorsense', label: 'Чувство: Чувство вибрации' },
  { value: 'sense.telepathy', label: 'Чувство: Телепатия' },

  // Характеристики
  { value: 'ability.strength', label: 'Сила (очки)' },
  { value: 'ability.dexterity', label: 'Ловкость (очки)' },
  { value: 'ability.constitution', label: 'Телосложение (очки)' },
  { value: 'ability.intelligence', label: 'Интеллект (очки)' },
  { value: 'ability.wisdom', label: 'Мудрость (очки)' },
  { value: 'ability.charisma', label: 'Харизма (очки)' },

  // Спасброски
  { value: 'save.strength', label: 'Спасбросок (Сила)' },
  { value: 'save.dexterity', label: 'Спасбросок (Ловкость)' },
  { value: 'save.constitution', label: 'Спасбросок (Телосложение)' },
  { value: 'save.intelligence', label: 'Спасбросок (Интеллект)' },
  { value: 'save.wisdom', label: 'Спасбросок (Мудрость)' },
  { value: 'save.charisma', label: 'Спасбросок (Харизма)' },
  { value: 'save.concentration', label: 'Спасбросок концентрации' },
  { value: 'deathSave', label: 'Спасбросок от смерти' },

  // Проверки
  { value: 'abilityCheck', label: 'Все проверки характеристик (и навыков)' },

  // Атаки
  { value: 'attack.melee', label: 'Атака: рукопашное оружие' },
  { value: 'attack.ranged', label: 'Атака: дальнобойное оружие' },
  { value: 'attack.spell', label: 'Атака: заклинание' },
  { value: 'attacksAgainst', label: 'Атаки по носителю: прибавка атакующему' },

  // Урон
  { value: 'damage.melee', label: 'Урон: рукопашное оружие' },
  { value: 'damage.ranged', label: 'Урон: дальнобойное оружие' },
  { value: 'damage.spell', label: 'Урон: заклинание' },
  { value: 'damage.all', label: 'Урон: весь наносимый' },
  { value: 'damage.weapon', label: 'Урон: только этим предметом' },
  { value: 'attack.weapon', label: 'Атака: только этим предметом' },

  // Навыки — из общего списка, чтобы ключ и флаг навыка не разъехались
  ...EFFECT_SKILL_OPTIONS.map((skill): Option<string> => ({
    value: `skill.${skill.value}`,
    label: `Навык (${skill.label})`,
  })),
];

/** Библиотека значений/формул (для поля change.value). */
export const EFFECT_VALUE_SUGGESTIONS: Array<Option<string>> = [
  // Характеристики и модификаторы
  { value: '@mod.spell', label: 'Модификатор заклинательной хар-ки' },
  { value: '@mod.str', label: 'Модификатор Силы' },
  { value: '@mod.dex', label: 'Модификатор Ловкости' },
  { value: '@mod.con', label: 'Модификатор Телосложения' },
  { value: '@mod.int', label: 'Модификатор Интеллекта' },
  { value: '@mod.wis', label: 'Модификатор Мудрости' },
  { value: '@mod.cha', label: 'Модификатор Харизмы' },
  { value: '@prof', label: 'Бонус мастерства (@prof)' },
  { value: '@level', label: 'Уровень персонажа (@level)' },
  {
    value: '@classLevel',
    label: 'Уровень в классе умения (@classLevel; у своего эффекта — общий)',
  },

  // Скорости листа: ими задаётся «полёт равен скорости ходьбы»
  { value: '@speed.walk', label: 'Скорость ходьбы листа' },
  { value: '@speed.fly', label: 'Скорость полёта листа' },
  { value: '@speed.swim', label: 'Скорость плавания листа' },
  { value: '@speed.climb', label: 'Скорость лазания листа' },
  { value: '@speed.burrow', label: 'Скорость копания листа' },

  // Типы урона
  { value: '1к6@dmg.fire', label: 'Урон: Огненный (1к6)' },
  { value: '1к6@dmg.cold', label: 'Урон: Холодный' },
  { value: '1к6@dmg.lightning', label: 'Урон: Электрический' },
  { value: '1к6@dmg.thunder', label: 'Урон: Звуковой' },
  { value: '1к6@dmg.acid', label: 'Урон: Кислотный' },
  { value: '1к6@dmg.poison', label: 'Урон: Ядовитый' },
  { value: '1к6@dmg.necrotic', label: 'Урон: Некротический' },
  { value: '1к6@dmg.radiant', label: 'Урон: Излучение' },
  { value: '1к6@dmg.force', label: 'Урон: Силовое поле' },
  { value: '1к6@dmg.psychic', label: 'Урон: Психический' },
  { value: '1к6@dmg.bludgeoning', label: 'Урон: Дробящий' },
  { value: '1к6@dmg.piercing', label: 'Урон: Колющий' },
  { value: '1к6@dmg.slashing', label: 'Урон: Рубящий' },

  // Лечение
  { value: '1к8@heal', label: 'Лечение (1к8)' },
  { value: '1к8@heal.temp', label: 'Временные хиты (Temp HP)' },

  // Условия по цели прямо в формуле
  { value: '1к6@target.full', label: 'Формула: только при полном HP цели' },
  { value: '1к6@target.notFull', label: 'Формула: только по раненой цели' },
];

/** Приставка условий по типу НОСИТЕЛЯ эффекта. */
export const EFFECT_CARRIER_TYPE_CONDITION_PREFIX = 'self.creatureType === ';

/** Приставка условий по типу ЦЕЛИ. */
export const EFFECT_TARGET_TYPE_CONDITION_PREFIX = 'target.creatureType === ';

/**
 * Разделитель условий, соединённых «и»: `self.armor === "none" && ...`.
 *
 * Это не выражение и не шаг к нему: каждая часть остаётся строкой из закрытого
 * перечня, а `&&` только позволяет требовать нескольких условий разом — «нет
 * доспеха И нет щита» у наручей защиты. Другой связки (`||`, отрицания,
 * скобок) намеренно нет: разбирать их пришлось бы парсером.
 */
export const EFFECT_CONDITION_AND_SEPARATOR = '&&';

/**
 * Части составного условия.
 *
 * Одиночное условие — тоже список, из одного элемента: так весь дальнейший
 * разбор работает единообразно, без ветки «а если разделителя нет».
 *
 * @param condition условие изменения.
 * @returns непустые части, каждая обрезана по краям.
 */
export function splitConditionParts(condition: string): string[] {
  return condition
    .split(EFFECT_CONDITION_AND_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Приставка условия по надетому доспеху носителя. */
export const EFFECT_CARRIER_ARMOR_CONDITION_PREFIX = 'self.armor === ';

/**
 * Условие «цель помечена мной»: цель несёт эффект с флагом `mark.bySource`,
 * наложенный носителем условия (Метка охотника, Сглаз).
 */
export const EFFECT_MARKED_BY_SELF_CONDITION = 'target.markedBySelf';

/** Условие «бросок с преимуществом» — у модификаторов и у срабатываний. */
export const EFFECT_ROLL_ADVANTAGE_CONDITION = 'roll.hasAdvantage === true';

/** Условие «бросок с помехой» — у модификаторов и у срабатываний. */
export const EFFECT_ROLL_DISADVANTAGE_CONDITION =
  'roll.hasDisadvantage === true';

/** Приставка условия срабатывания «урон этого типа». */
export const EFFECT_DAMAGE_TYPE_CONDITION_PREFIX = 'damage.type === ';

/** Приставка условия срабатывания «урон без этого типа». */
export const EFFECT_DAMAGE_TYPE_NOT_CONDITION_PREFIX = 'damage.type !== ';

/** Приставка условия срабатывания «на носителе отметка». */
export const EFFECT_CARRIER_TAG_CONDITION_PREFIX = 'self.tag === ';

/** Приставка условия срабатывания «на носителе нет отметки». */
export const EFFECT_CARRIER_TAG_NOT_CONDITION_PREFIX = 'self.tag !== ';

/** Части условия срабатывания без значения — строкой целиком. */
export const EFFECT_TRIGGER_FIXED_CONDITIONS: Partial<
  Record<TriggerConditionKind, string>
> = {
  damageCritical: 'damage.isCritical === true',
  damageNotCritical: 'damage.isCritical === false',
  selfBloodied: 'self.hp.value <= (self.hp.max / 2)',
  selfWounded: 'self.hp.value < self.hp.max',
  rollAdvantage: EFFECT_ROLL_ADVANTAGE_CONDITION,
  rollDisadvantage: EFFECT_ROLL_DISADVANTAGE_CONDITION,
  otherMarkedBySelf: EFFECT_MARKED_BY_SELF_CONDITION,
  selfTempHpZero: 'self.hp.temp === 0',
  selfGrounded: 'self.grounded === true',
  otherIsSource: 'target.isSource === true',
  otherBloodied: 'target.hp.value <= (target.hp.max / 2)',
  attackLanded: 'attack.landed === true',
  attackMissed: 'attack.landed === false',
  movementOwn: 'move.forced === false',
  movementForced: 'move.forced === true',
};

/**
 * Условия по доспеху носителя — зеркало семейства `self.armor` из системы D&D.
 *
 * Считаются по самому листу, без броска: прибавка с таким условием попадает в
 * постоянные числа, и +1 к КД «Обороны» видно в блоке защиты.
 */
export const EFFECT_ARMOR_CONDITION_OPTIONS: Array<Option<string>> = [
  { value: 'any', label: 'в доспехе (любом)' },
  { value: 'none', label: 'без доспеха' },
  { value: 'light', label: 'в лёгком доспехе' },
  { value: 'medium', label: 'в среднем доспехе' },
  { value: 'heavy', label: 'в тяжёлом доспехе' },
  { value: 'shield', label: 'со щитом' },
  { value: 'noShield', label: 'без щита' },
];

/**
 * Собирает условия по типу существа: движок сверяет тип носителя или цели с
 * названным ключом.
 *
 * @param prefix приставка условия (носитель или цель).
 * @param labelPrefix приставка подписи пункта.
 * @returns условия по всем типам существ.
 */
function buildCreatureTypeConditions(
  prefix: string,
  labelPrefix: string,
): Array<Option<string>> {
  return EFFECT_CREATURE_CATEGORY_OPTIONS.map((creatureType) => ({
    value: `${prefix}"${creatureType.value}"`,
    label: `${labelPrefix}: ${creatureType.label}`,
  }));
}

/**
 * Условие «рядом с целью мой дееспособный союзник» («Тактика стаи»:
 * союзник в 5 фт от цели без состояния «Недееспособный»).
 */
export const EFFECT_TARGET_ALLY_ADJACENT_CONDITION = 'target.allyAdjacent';

/** Условие «рядом с целью мой союзник в любом состоянии». */
export const EFFECT_TARGET_ANY_ALLY_ADJACENT_CONDITION =
  'target.allyAdjacentAny';

/** Приставка условия «рядом с целью мой союзник в состоянии …». */
export const EFFECT_TARGET_ALLY_WITH_CONDITION_PREFIX =
  'target.allyAdjacentWith === ';

/** Приставка условия «рядом с целью мой союзник не в состоянии …». */
export const EFFECT_TARGET_ALLY_WITHOUT_CONDITION_PREFIX =
  'target.allyAdjacentWithout === ';

/** Приставка условия «входящую атаку делает существо такого типа». */
export const EFFECT_INCOMING_ATTACKER_TYPE_CONDITION_PREFIX =
  'incoming.attackerCreatureType === ';

/**
 * Какой союзник нужен рядом с целью: подписи без общей части «Цель: рядом с ней
 * мой союзник». Форма показывает их вторым полем, словарь условий — целиком.
 */
export const ADJACENT_ALLY_CONDITION_OPTIONS: Array<Option<string>> = [
  {
    value: EFFECT_TARGET_ALLY_ADJACENT_CONDITION,
    label: 'дееспособный (Тактика стаи)',
  },
  {
    value: EFFECT_TARGET_ANY_ALLY_ADJACENT_CONDITION,
    label: 'в любом состоянии',
  },
  ...EFFECT_CONDITION_OPTIONS.map((condition): Option<string> => ({
    value: `${EFFECT_TARGET_ALLY_WITH_CONDITION_PREFIX}"${condition.value}"`,
    label: `в состоянии «${condition.label}»`,
  })),
  ...EFFECT_CONDITION_OPTIONS.map((condition): Option<string> => ({
    value: `${EFFECT_TARGET_ALLY_WITHOUT_CONDITION_PREFIX}"${condition.value}"`,
    label: `не в состоянии «${condition.label}»`,
  })),
];

/** Общая часть подписи условий «союзник рядом с целью». */
export const ADJACENT_ALLY_CONDITION_LABEL = 'Цель: рядом с ней мой союзник';

/**
 * Условие ли это о союзнике рядом с целью.
 *
 * @param condition строка условия.
 * @returns `true` для условий семейства «союзник рядом».
 */
export function isAdjacentAllyCondition(condition: string): boolean {
  const trimmed = condition.trim();

  return (
    trimmed === EFFECT_TARGET_ALLY_ADJACENT_CONDITION
    || trimmed === EFFECT_TARGET_ANY_ALLY_ADJACENT_CONDITION
    || trimmed.startsWith(EFFECT_TARGET_ALLY_WITH_CONDITION_PREFIX)
    || trimmed.startsWith(EFFECT_TARGET_ALLY_WITHOUT_CONDITION_PREFIX)
  );
}

/**
 * Библиотека условий (для поля change.condition) — зеркало
 * `EFFECT_CONDITION_SUGGESTIONS` из VTTG.
 *
 * Список закрыт и содержит РОВНО те условия, которые движок умеет вычислять:
 * броски, состояние хитов цели, вид входящей атаки (только для `armorClass`) и
 * тип носителя/цели. Неизвестное условие движок молча не применяет — предлагать
 * такие строки нельзя, эффект выглядел бы настроенным и не работал.
 */
export const EFFECT_CONDITION_EXPR_SUGGESTIONS: Array<Option<string>> = [
  { value: EFFECT_ROLL_ADVANTAGE_CONDITION, label: 'Бросок: с преимуществом' },
  { value: EFFECT_ROLL_DISADVANTAGE_CONDITION, label: 'Бросок: с помехой' },
  {
    value: 'target.hp.value === target.hp.max',
    label: 'Цель: с полными хитами (Убийца)',
  },
  {
    value: 'target.hp.value < target.hp.max',
    label: 'Цель: ранена (неполные хиты)',
  },
  {
    value: 'target.hp.value <= (target.hp.max / 2)',
    label: 'Цель: не больше половины хитов (Окровавлен)',
  },
  {
    value: EFFECT_MARKED_BY_SELF_CONDITION,
    label: 'Цель помечена мной (Метка охотника, Сглаз)',
  },
  ...ADJACENT_ALLY_CONDITION_OPTIONS.map((ally): Option<string> => ({
    value: ally.value,
    label: `${ADJACENT_ALLY_CONDITION_LABEL} — ${ally.label}`,
  })),
  {
    value: 'incoming.attackType === "melee"',
    label: 'Защита: от рукопашных атак',
  },
  {
    value: 'incoming.attackType === "ranged"',
    label: 'Защита: от дальнобойных атак',
  },
  {
    value: 'incoming.attackType === "spell"',
    label: 'Защита: от атак заклинаниями',
  },
  ...EFFECT_CREATURE_CATEGORY_OPTIONS.map((creatureType): Option<string> => ({
    value: `${EFFECT_INCOMING_ATTACKER_TYPE_CONDITION_PREFIX}"${creatureType.value}"`,
    label: `Защита: атакующий — ${creatureType.label}`,
  })),
  ...buildCreatureTypeConditions(
    EFFECT_CARRIER_TYPE_CONDITION_PREFIX,
    'Носитель',
  ),
  ...buildCreatureTypeConditions(EFFECT_TARGET_TYPE_CONDITION_PREFIX, 'Цель'),
  ...EFFECT_ARMOR_CONDITION_OPTIONS.map((armor): Option<string> => ({
    value: `${EFFECT_CARRIER_ARMOR_CONDITION_PREFIX}"${armor.value}"`,
    label: `Носитель: ${armor.label}`,
  })),
];

/** Виды защит от урона: приставка ключа флага и подпись. */
export const EFFECT_DAMAGE_DEFENSE_KINDS: Array<Option<string>> = [
  { value: 'resistance', label: 'Сопротивление' },
  { value: 'immunity', label: 'Иммунитет' },
  { value: 'vulnerability', label: 'Уязвимость' },
];

/**
 * Собирает подписи флагов по всем характеристикам: помеха на спасброски и
 * проверки задаётся отдельно для каждой из шести.
 *
 * @param keyPrefix приставка ключа флага.
 * @param labelPrefix приставка подписи флага.
 * @returns пары «ключ флага → подпись».
 */
function buildAbilityFlagLabels(
  keyPrefix: string,
  labelPrefix: string,
): Array<[string, string]> {
  return EFFECT_ABILITY_OPTIONS.map((ability) => [
    `${keyPrefix}${ability.value}`,
    `${labelPrefix}: ${ability.label}`,
  ]);
}

/**
 * Собирает подписи флагов спасброска против состояния: преимущество и помеха
 * задаются отдельно для каждого из пятнадцати состояний.
 *
 * Семейством, а не перечислением: так написана половина видов справочника
 * («преимущество на спасброски, чтобы избежать состояния Отравлен»), и держать
 * их списком значило бы дописывать его при каждом новом виде.
 *
 * @param keyPrefix приставка ключа флага.
 * @param labelPrefix приставка подписи флага.
 * @returns пары «ключ флага → подпись».
 */
function buildSaveVsConditionFlagLabels(
  keyPrefix: string,
  labelPrefix: string,
): Array<[string, string]> {
  return EFFECT_CONDITION_OPTIONS.map((condition) => [
    `${keyPrefix}${condition.value.charAt(0).toUpperCase()}${condition.value.slice(1)}`,
    `${labelPrefix}: ${condition.label}`,
  ]);
}

/**
 * Собирает подписи понавыковых флагов: преимущество и помеха задаются отдельно
 * для каждого из восемнадцати навыков.
 *
 * @param keySuffix окончание ключа флага (`.advantage` либо `.disadvantage`).
 * @param labelPrefix приставка подписи флага.
 * @returns пары «ключ флага → подпись».
 */
function buildSkillFlagLabels(
  keySuffix: string,
  labelPrefix: string,
): Array<[string, string]> {
  return EFFECT_SKILL_OPTIONS.map((skill): [string, string] => [
    `skill.${skill.value}${keySuffix}`,
    `${labelPrefix}: ${skill.label}`,
  ]);
}

/**
 * Собирает подписи флагов «Увёртливость»: успешный спасбросок «половина урона»
 * отменяет урон целиком — по одному флагу на характеристику.
 *
 * @returns пары «ключ флага → подпись».
 */
function buildSaveEvasionFlagLabels(): Array<[string, string]> {
  return EFFECT_ABILITY_OPTIONS.map((ability): [string, string] => [
    `save.evasion.${ability.value}`,
    `Увёртливость: спасбросок ${EFFECT_ABILITY_GENITIVE_LABELS[ability.value]}`,
  ]);
}

/**
 * Собирает подписи флагов «свой урон игнорирует сопротивление» — по одному на
 * тип урона.
 *
 * @returns пары «ключ флага → подпись».
 */
function buildDamageIgnoreResistanceFlagLabels(): Array<[string, string]> {
  return EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType): [string, string] => [
    `damage.ignoreResistance.${damageType.value}`,
    `Свой урон (${damageType.label}) игнорирует сопротивление`,
  ]);
}

/**
 * Подписи флагов защит от урона: три вида защиты на каждый тип урона.
 *
 * @returns пары «ключ флага → подпись».
 */
function buildDamageDefenseFlagLabels(): Array<[string, string]> {
  return EFFECT_DAMAGE_DEFENSE_KINDS.flatMap((kind) =>
    EFFECT_DAMAGE_TYPE_OPTIONS.map((damageType): [string, string] => [
      `${kind.value}.${damageType.value}`,
      `${kind.label}: ${damageType.label}`,
    ]),
  );
}

/**
 * Локализованные названия флагов эффектов — зеркало `EFFECT_FLAG_LABELS` VTTG.
 * Единственный источник и для библиотеки флагов, и для меню «Готовые»: второй
 * список рано или поздно разошёлся бы с первым.
 */
export const EFFECT_FLAG_LABELS: Record<string, string> = Object.fromEntries([
  // Свои атаки
  ['attack.advantage', 'Преимущество на все атаки'],
  ['attack.disadvantage', 'Помеха на все атаки'],
  ['attack.melee.advantage', 'Преимущество на рукопашные атаки'],
  ['attack.melee.disadvantage', 'Помеха на рукопашные атаки'],
  ['attack.ranged.advantage', 'Преимущество на дальнобойные атаки'],
  ['attack.ranged.disadvantage', 'Помеха на дальнобойные атаки'],
  ['attack.spell.advantage', 'Преимущество на атаки заклинаниями'],
  ['attack.spell.disadvantage', 'Помеха на атаки заклинаниями'],

  // Атаки по носителю
  ['attacksAgainst.advantage', 'Преимущество атак по этому существу'],
  ['attacksAgainst.disadvantage', 'Помеха атак по этому существу'],
  [
    'attacksAgainst.melee.advantage',
    'Преимущество рукопашных атак по этому существу',
  ],
  [
    'attacksAgainst.melee.disadvantage',
    'Помеха рукопашных атак по этому существу',
  ],
  [
    'attacksAgainst.ranged.advantage',
    'Преимущество дальнобойных атак по этому существу',
  ],
  [
    'attacksAgainst.ranged.disadvantage',
    'Помеха дальнобойных атак по этому существу',
  ],
  [
    'attacksAgainst.spell.advantage',
    'Преимущество атак заклинаниями по этому существу',
  ],
  [
    'attacksAgainst.spell.disadvantage',
    'Помеха атак заклинаниями по этому существу',
  ],

  // Проверки характеристик
  ['abilityCheck.advantage', 'Преимущество на ВСЕ проверки характеристик'],
  ['abilityCheck.disadvantage', 'Помеха на ВСЕ проверки характеристик'],
  ...buildAbilityFlagLabels(
    'abilityCheck.advantage.',
    'Преимущество на проверки',
  ),
  ...buildAbilityFlagLabels('abilityCheck.disadvantage.', 'Помеха на проверки'),

  // Навыки
  ...buildSkillFlagLabels('.advantage', 'Преимущество на проверки'),
  ...buildSkillFlagLabels('.disadvantage', 'Помеха на проверки'),

  // Спасброски
  ['save.advantage', 'Преимущество на ВСЕ спасброски'],
  ['save.disadvantage', 'Помеха на ВСЕ спасброски'],
  [
    'save.advantage.vsMagic',
    'Преимущество на спасброски против заклинаний и магических эффектов',
  ],
  [
    'save.disadvantage.vsMagic',
    'Помеха на спасброски против заклинаний и магических эффектов',
  ],
  ['save.advantage.vsSpell', 'Преимущество на спасброски против заклинаний'],
  ['save.disadvantage.vsSpell', 'Помеха на спасброски против заклинаний'],
  ['save.advantage.death', 'Преимущество на спасброски от смерти'],
  ['save.disadvantage.death', 'Помеха на спасброски от смерти'],
  [
    'save.negateOnSuccess.vsMagic',
    'Успешный спасбросок против магии «половина урона» — урона нет',
  ],
  ['save.advantage.vsConcentration', 'Преимущество на спасброски концентрации'],
  ['save.disadvantage.vsConcentration', 'Помеха на спасброски концентрации'],
  ...buildAbilityFlagLabels('save.advantage.', 'Преимущество на спасброски'),
  ...buildAbilityFlagLabels('save.disadvantage.', 'Помеха на спасброски'),
  ...buildAbilityFlagLabels('save.autoFail.', 'Автопровал спасбросков'),

  // Спасброски против состояний
  ...buildSaveVsConditionFlagLabels(
    'save.advantage.vs',
    'Преимущество на спасброски против состояния',
  ),
  ...buildSaveVsConditionFlagLabels(
    'save.disadvantage.vs',
    'Помеха на спасброски против состояния',
  ),

  // Увёртливость
  ...buildSaveEvasionFlagLabels(),

  // Прочее
  ['speed.zero', 'Скорость равна нулю'],
  [
    'terrain.ignoreDifficult',
    'Игнорирует труднопроходимую местность (клетки зон стоят как обычные)',
  ],
  [
    'mark.bySource',
    'Метка наложившего: его условие «цель помечена мной» (Метка охотника, Сглаз)',
  ],
  ['incapacitated', 'Недееспособный (нет действий и реакций)'],
  ['initiative.advantage', 'Преимущество на бросок инициативы'],
  ['initiative.disadvantage', 'Помеха на бросок инициативы'],
  [
    'vision.blinded',
    'Ослеплённый (ничего не видит, автопровал проверок зрения)',
  ],
  ['vision.invisible', 'Невидимый (скрыт от глаз, преимущество на атаки)'],
  ['defense.critImmunity', 'Защита: иммунитет к критическим попаданиям'],
  [
    'defense.suppressAll',
    'Защиты от урона не действуют (сопротивления и иммунитеты сняты)',
  ],
  ['hitPoints.maxReductionBlocked', 'Максимум хитов нельзя уменьшать'],
  ['attacksAgainst.forceCritical', 'Попадание по этому существу — крит'],
  ['movement.teleportBlocked', 'Не может телепортироваться'],
  ['rest.noBenefit.short', 'Короткий отдых не приносит пользы'],
  ['rest.noBenefit.long', 'Продолжительный отдых не приносит пользы'],

  // Лечение
  ['healing.blocked', 'Не может восстанавливать хиты'],
  ['healing.tempBlocked', 'Не может получать временные хиты'],

  // Свой урон против сопротивлений
  ...buildDamageIgnoreResistanceFlagLabels(),

  // Защиты от урона
  ...buildDamageDefenseFlagLabels(),
]);

/**
 * Ключи флагов спасброска против состояния — по ним меню отделяет их от прочих
 * спасбросков: приставка `save.` у них общая, а список из тридцати позиций в
 * одном разделе с остальными не читается.
 */
export const SAVE_VS_CONDITION_FLAG_KEYS: ReadonlySet<string> = new Set(
  [
    ...buildSaveVsConditionFlagLabels('save.advantage.vs', ''),
    ...buildSaveVsConditionFlagLabels('save.disadvantage.vs', ''),
  ].map(([key]) => key),
);

/**
 * Ключ флага спасброска против состояния.
 *
 * Собирается здесь, а не у потребителя: строка обязана совпадать с ключом из
 * библиотеки флагов, и второе место сборки разошлось бы с ней на первом же
 * состоянии. Зеркало `buildSaveVsConditionFlag` системы VTTG.
 *
 * @param mode вид флага.
 * @param condition ключ состояния (`poisoned`).
 * @returns ключ флага.
 */
export function buildSaveVsConditionFlag(
  mode: 'advantage' | 'disadvantage',
  condition: string,
): string {
  return `save.${mode}.vs${condition.charAt(0).toUpperCase()}${condition.slice(1)}`;
}

/** Полная библиотека флагов для поля выбора. */
export const EFFECT_FLAG_OPTIONS: Array<Option<string>> = Object.entries(
  EFFECT_FLAG_LABELS,
).map(([value, label]) => ({ value, label }));

/** Готовый шаблон стандартного состояния D&D 5e для быстрого заполнения. */
export interface EffectConditionTemplate {
  key: EffectConditionKey;
  name: string;
  icon: string;
  description: string;
  flags: string[];
  changes: EffectChange[];
  conditionImmunities?: EffectConditionKey[];
}

/**
 * Следствия Недееспособности (PHB 2014): нет действий и реакций. Помехи на
 * инициативу, как в 2024, нет. Состояния, включающие Недееспособность,
 * наследуют их целиком.
 */
const INCAPACITATED_FLAGS: string[] = ['incapacitated'];

/**
 * Следствия беспомощности (PHB 2014): автопровал спасбросков Силы и Ловкости и
 * преимущество атак по существу.
 */
const HELPLESS_FLAGS: string[] = [
  'save.autoFail.strength',
  'save.autoFail.dexterity',
  'attacksAgainst.advantage',
];

/**
 * Поправки атак по лежащему (PHB 2014): вплотную — преимущество, издали —
 * помеха. Дистанцию движок в этом месте не знает, поэтому правило приближено по
 * виду атаки.
 */
const PRONE_ATTACKED_FLAGS: string[] = [
  'attacksAgainst.melee.advantage',
  'attacksAgainst.ranged.disadvantage',
];

/** Сопротивление всему урону — по флагу на каждый тип урона. */
const ALL_DAMAGE_RESISTANCE_FLAGS: string[] = EFFECT_DAMAGE_TYPE_OPTIONS.map(
  (damageType) => `resistance.${damageType.value}`,
);

/**
 * Шаблоны Active Effects для состояний D&D 5e по PHB 2014 — набор ключей и
 * флагов зеркалит `CONDITION_EFFECT_TEMPLATES` + `CONDITIONS` из VTTG, а
 * механика и описания приведены к правилам 2014 года. Истощение исключено: его
 * модификаторы зависят от степени — см. {@link EFFECT_EXHAUSTION_LEVELS}.
 */
export const EFFECT_CONDITION_TEMPLATES: EffectConditionTemplate[] = [
  {
    key: 'blinded',
    name: 'Ослеплённый',
    icon: 'tabler:eye-off',
    description:
      'Автоматический провал проверок, требующих зрение. Броски атаки против вас с преимуществом, ваши — с помехой.',
    flags: [
      'attack.disadvantage',
      'attacksAgainst.advantage',
      'vision.blinded',
    ],
    changes: [],
  },
  {
    key: 'charmed',
    name: 'Очарованный',
    icon: 'tabler:heart',
    description:
      'Нельзя атаковать или вредить очаровавшему. Очаровавший имеет преимущество на социальные проверки против вас.',
    flags: [],
    changes: [],
  },
  {
    key: 'deafened',
    name: 'Оглохший',
    icon: 'tabler:ear-off',
    description:
      'Не можете слышать. Автоматический провал проверок, требующих слух.',
    flags: [],
    changes: [],
  },
  {
    key: 'frightened',
    name: 'Испуганный',
    icon: 'tabler:mood-sad',
    description:
      'Помеха на проверки характеристик и броски атаки, пока источник страха в зоне видимости. Нельзя добровольно приблизиться к источнику.',
    flags: ['attack.disadvantage', 'abilityCheck.disadvantage'],
    changes: [],
  },
  {
    key: 'grappled',
    name: 'Схваченный',
    icon: 'tabler:hand-stop',
    description:
      'Скорость равна 0 и не может увеличиваться. Состояние оканчивается, если схвативший недееспособен или вас вывели из его досягаемости.',
    flags: ['speed.zero'],
    changes: [],
  },
  {
    key: 'incapacitated',
    name: 'Недееспособный',
    icon: 'tabler:ban',
    description: 'Не можете совершать действия и реакции.',
    flags: [...INCAPACITATED_FLAGS],
    changes: [],
  },
  {
    key: 'invisible',
    name: 'Невидимый',
    icon: 'tabler:eye-closed',
    description:
      'Вас невозможно увидеть без магии или особого чувства; для скрытности вы в сильно заслонённой местности. Атаки против вас с помехой, ваши — с преимуществом.',
    flags: [
      'attack.advantage',
      'attacksAgainst.disadvantage',
      'vision.invisible',
    ],
    changes: [],
  },
  {
    key: 'paralyzed',
    name: 'Парализованный',
    icon: 'tabler:user-minus',
    description:
      'Недееспособен, не может перемещаться и говорить. Автопровал спасбросков СИЛ и ЛОВ. Атаки по вам с преимуществом. Крит в пределах 5 фт.',
    flags: [...INCAPACITATED_FLAGS, 'speed.zero', ...HELPLESS_FLAGS],
    changes: [],
  },
  {
    key: 'petrified',
    name: 'Окаменевший',
    icon: 'tabler:diamond',
    description:
      'Превращение в камень. Недееспособен. Скорость 0. Автопровал спасбросков СИЛ и ЛОВ. Атаки с преимуществом. Сопротивление всему урону. Иммунитет к яду.',
    flags: [
      ...INCAPACITATED_FLAGS,
      'speed.zero',
      ...HELPLESS_FLAGS,
      ...ALL_DAMAGE_RESISTANCE_FLAGS,
    ],
    changes: [],
    // Иммунитет к Отравлению — само состояние; урон ядом лишь ослаблен выше.
    conditionImmunities: ['poisoned'],
  },
  {
    key: 'poisoned',
    name: 'Отравленный',
    icon: 'tabler:droplet',
    description: 'Помеха на броски атаки и проверки характеристик.',
    flags: ['attack.disadvantage', 'abilityCheck.disadvantage'],
    changes: [],
  },
  {
    key: 'prone',
    name: 'Лежащий ничком',
    icon: 'tabler:download',
    description:
      'Перемещаться можно только ползком, пока не встанете (подъём тратит половину скорости). Помеха на ваши атаки. Атаки по вам в пределах 5 фт с преимуществом, иначе с помехой.',
    flags: ['attack.disadvantage', ...PRONE_ATTACKED_FLAGS],
    changes: [],
  },
  {
    key: 'restrained',
    name: 'Опутанный',
    icon: 'tabler:link',
    description:
      'Скорость 0, не может быть увеличена. Атаки по вам с преимуществом, ваши — с помехой. Помеха на спасброски Ловкости.',
    flags: [
      'speed.zero',
      'attack.disadvantage',
      'attacksAgainst.advantage',
      'save.disadvantage.dexterity',
    ],
    changes: [],
  },
  {
    key: 'stunned',
    name: 'Ошеломлённый',
    icon: 'tabler:bolt',
    description:
      'Недееспособен, не может перемещаться, говорит запинаясь. Автопровал спасбросков СИЛ и ЛОВ. Атаки по вам с преимуществом.',
    // Скорость обнуляется: у Ошеломлённого 2014 есть пункт «не может
    // перемещаться» (в 2024 его убрали).
    flags: [...INCAPACITATED_FLAGS, 'speed.zero', ...HELPLESS_FLAGS],
    changes: [],
  },
  {
    key: 'unconscious',
    name: 'Бессознательный',
    icon: 'tabler:zzz',
    description:
      'Недееспособен, не может перемещаться и говорить, не осознаёт окружение. Роняет всё, что держит, и падает ничком. Автопровал СИЛ и ЛОВ. Атаки с преимуществом. Крит в пределах 5 фт.',
    flags: [
      ...INCAPACITATED_FLAGS,
      'speed.zero',
      ...HELPLESS_FLAGS,
      'attack.disadvantage',
      ...PRONE_ATTACKED_FLAGS,
    ],
    changes: [],
  },
];

/**
 * Русские названия состояний по ключу — из шаблонов состояний, как `nameRu`
 * системы. У Истощения шаблона нет — его название берётся отдельно.
 */
export const EFFECT_CONDITION_NAMES: Partial<
  Record<EffectConditionKey, string>
> = {
  exhaustion: 'Истощённый',
  ...Object.fromEntries(
    EFFECT_CONDITION_TEMPLATES.map((template) => [template.key, template.name]),
  ),
};

/** Ступень Истощения по PHB 2014: что добавляет именно эта ступень. */
export interface EffectExhaustionLevel {
  /** Номер ступени, 1–6. */
  level: number;
  /** Описание ступени словами PHB. */
  description: string;
  /** Флаги, которые добавляет ступень. */
  flags: string[];
  /** Числовые изменения, которые добавляет ступень. */
  changes: EffectChange[];
  /** Ступень убивает существо. */
  isDeath: boolean;
}

/** Максимальная ступень Истощения: на ней существо умирает. */
export const MAX_EXHAUSTION_LEVEL = 6;

/** Множитель «вдвое меньше» для скорости и максимума хитов на ступенях Истощения. */
const EXHAUSTION_HALF_MULTIPLIER = '0.5';

/** Ключи всех скоростей: вторая ступень Истощения уменьшает их вдвое. */
const EXHAUSTION_SPEED_KEYS: string[] = [
  'movement.walk',
  'movement.fly',
  'movement.swim',
  'movement.climb',
  'movement.burrow',
];

/**
 * Таблица Истощения PHB 2014 — шесть ступеней, эффекты накапливаются: у
 * существа со ступенью 3 действуют и ступени 1–2. Минус к броскам за ступень
 * (правило 2024) здесь не применяется.
 */
export const EFFECT_EXHAUSTION_LEVELS: EffectExhaustionLevel[] = [
  {
    level: 1,
    description: 'Помеха на проверки характеристик.',
    flags: ['abilityCheck.disadvantage'],
    changes: [],
    isDeath: false,
  },
  {
    level: 2,
    description: 'Скорость уменьшается вдвое.',
    flags: [],
    changes: EXHAUSTION_SPEED_KEYS.map((key) => ({
      key,
      mode: 'multiply',
      value: EXHAUSTION_HALF_MULTIPLIER,
      priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
    })),
    isDeath: false,
  },
  {
    level: 3,
    description: 'Помеха на броски атаки и спасброски.',
    flags: ['attack.disadvantage', 'save.disadvantage'],
    changes: [],
    isDeath: false,
  },
  {
    level: 4,
    description: 'Максимум хитов уменьшается вдвое.',
    flags: [],
    changes: [
      {
        key: 'hitPoints.max',
        mode: 'multiply',
        value: EXHAUSTION_HALF_MULTIPLIER,
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      },
    ],
    isDeath: false,
  },
  {
    level: 5,
    description: 'Скорость уменьшается до 0.',
    flags: ['speed.zero'],
    changes: [],
    isDeath: false,
  },
  {
    level: MAX_EXHAUSTION_LEVEL,
    description: 'Смерть.',
    flags: [],
    changes: [],
    isDeath: true,
  },
];

/** Ключи стандартных состояний — для проверки строки из данных. */
const EFFECT_CONDITION_KEYS: ReadonlySet<string> = new Set(
  EFFECT_CONDITION_OPTIONS.map((condition) => condition.value),
);

/**
 * Проверяет, что строка — ключ стандартного состояния D&D 5e, а не состояние,
 * заведённое в мире VTTG.
 *
 * @param conditionKey строка из данных.
 * @returns `true` для ключа стандартного состояния.
 */
export function isEffectConditionKey(
  conditionKey: string,
): conditionKey is EffectConditionKey {
  return EFFECT_CONDITION_KEYS.has(conditionKey);
}

/**
 * Общие части фраз описания, сводки и срабатываний: у всех трёх одни и те же
 * слова, и расходиться им нельзя.
 */
export const EFFECT_PHRASE_PARTS = {
  savePrefix: 'спасбросок ',
  nothing: 'ничего',
  halfDamage: 'половина урона',
  immunitiesPrefix: 'иммунитет к состояниям: ',
  feetSuffix: ' фт',
  listJoiner: ', ',
  andJoiner: ' и ',
  clauseJoiner: '; ',
} as const;

/** Что даёт успешный спасбросок против урона каждый ход — в описании эффекта. */
export const EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS: Record<
  EffectSaveOutcome,
  string
> = {
  negate: 'при успехе без урона',
  half: 'при успехе урон вдвое',
};

/** Что даёт успешный спасбросок при наложении — в описании эффекта. */
export const EFFECT_APPLY_SAVE_SUCCESS_LABELS: Record<
  EffectSaveOutcome,
  string
> = {
  negate: 'при успехе эффект отменяется',
  half: EFFECT_RECURRING_DAMAGE_SAVE_SUCCESS_LABELS.half,
};

/** Подписи лечения в описании части урона: `@heal` и `@heal.temp`. */
export const EFFECT_HEAL_KIND_LABELS: Record<EffectHealKind, string> = {
  hp: 'лечения',
  temp: 'временных хитов',
};

/** Когда срабатывает эффект зоны — в сводке. */
export const EFFECT_ZONE_MOMENT_LABELS: Record<EffectAreaTrigger, string> = {
  stay: 'Пока существо в зоне',
  enter: 'При входе в зону',
  exit: 'При выходе из зоны',
};

/** Когда срабатывает эффект зоны, которую оставляет заклинание, — в сводке. */
export const EFFECT_SPELL_ZONE_MOMENT_LABELS: Record<
  EffectAreaTrigger,
  string
> = {
  stay: 'Пока существо в зоне заклинания',
  enter: 'При входе в зону заклинания',
  exit: 'При выходе из зоны заклинания',
};

/** Начало фразы сводки у эффекта ауры — по моменту срабатывания. */
export const EFFECT_AURA_MOMENT_PREFIXES: Record<EffectAreaTrigger, string> = {
  stay: 'Существам в ауре ',
  enter: 'Когда существо входит в ауру ',
  exit: 'Когда существо выходит из ауры ',
};

/** Моменты сводки, которыми подписано сразу несколько мест формы. */
const EFFECT_SHARED_MOMENT_LABELS = {
  whileActive: 'Пока эффект активен',
  onHit: 'При попадании',
} as const;

/** Когда срабатывает эффект «на носителе» — в сводке, по месту формы. */
export const EFFECT_CARRIER_MOMENT_LABELS: Record<EffectFormContext, string> = {
  ownEffects: EFFECT_SHARED_MOMENT_LABELS.whileActive,
  feature: 'Постоянно у персонажа',
  item: 'Пока предмет надет',
  weapon: 'Пока оружие экипировано',
  spell: 'После сотворения — на заклинателе',
  creatureAction: 'При использовании действия',
  creatureTrait: 'Постоянно у существа',
  zone: EFFECT_ZONE_MOMENT_LABELS.stay,
  condition: 'Пока действует состояние',
  generic: EFFECT_SHARED_MOMENT_LABELS.whileActive,
};

/** Когда срабатывает эффект «на цели» — в сводке, по месту формы. */
export const EFFECT_TARGET_MOMENT_LABELS: Record<EffectFormContext, string> = {
  ownEffects: EFFECT_SHARED_MOMENT_LABELS.onHit,
  feature: EFFECT_SHARED_MOMENT_LABELS.onHit,
  item: EFFECT_SHARED_MOMENT_LABELS.onHit,
  weapon: 'При попадании оружием',
  spell: 'Когда заклинание задело цель',
  creatureAction: 'Когда действие задело цель',
  creatureTrait: EFFECT_SHARED_MOMENT_LABELS.onHit,
  zone: EFFECT_SHARED_MOMENT_LABELS.onHit,
  condition: EFFECT_SHARED_MOMENT_LABELS.onHit,
  generic: EFFECT_SHARED_MOMENT_LABELS.onHit,
};

/** Части фраз сводки. */
export const EFFECT_SCENARIO_LABELS = {
  failurePrefix: 'Провал — ',
  successPrefix: 'Успех — ',
  emptyEffect: 'эффект пока ничего не делает',
  actionSaveEffectAnyway: 'Эффект ложится и при успешном спасброске.',
  actionSaveOnlyOnSuccess: ', если цель прошла спасбросок',
  more: 'и ещё',
  variantPrefix: 'Вариант ',
  variantSuffix: '. ',
  landingConditionPrefix: ', если ',
  rollConditionPrefix: ', только в бросках, где ',
  auraWhileCapable: ', пока носитель дееспособен',
  counterPrefix: ', тратит «',
  counterSuffix: '»',
  counterAmountPrefix: ' ×',
} as const;

/** Когда срабатывает эффект, который накладывается применением. */
export const EFFECT_USE_MOMENT_LABELS = {
  carrier: 'После применения — на применившем',
  target: 'При применении — на выбранной цели',
} as const;

/** Когда действует эффект, который включают переключателем. */
export const EFFECT_TOGGLE_MOMENT_LABEL = 'Пока эффект включён';

/**
 * Сколько модификаторов и флагов сводка называет поимённо, прежде чем сказать
 * «и ещё».
 */
export const EFFECT_SCENARIO_MAX_NAMED_MODIFIERS = 3;

/** Что даёт успех спасброска против урона каждый ход — во фразе срабатывания. */
export const EFFECT_TRIGGER_RECURRING_DAMAGE_SUCCESS_LABELS: Record<
  EffectSaveOutcome,
  string
> = {
  negate: 'без урона',
  half: EFFECT_PHRASE_PARTS.halfDamage,
};

/** Снятие после атаки — продолжением перечисления, по роли носителя. */
export const EFFECT_TRIGGER_CONSUME_ON_PHRASES: Record<
  EffectTriggerAttackRole,
  string
> = {
  attacker: 'снимается после своей атаки',
  target: 'снимается после атаки по носителю',
};

/** Когда срабатывает — во фразе срабатывания, по событию. */
export const EFFECT_TRIGGER_EVENT_PHRASES: Record<EffectTriggerEvent, string> =
  {
    turnStart: EFFECT_TURN_TIMING_LABELS.start,
    turnEnd: EFFECT_TURN_TIMING_LABELS.end,
    enter: 'при входе',
    exit: 'при выходе',
    applied: 'при наложении',
    attackRoll: 'при броске атаки',
    damageTaken: 'при получении урона',
    healed: 'когда носителя лечат',
    hpZero: 'когда хиты падают до 0',
    downedOther: 'когда носитель сваливает цель',
    conditionLost: 'когда состояние снимается',
    rest: 'после отдыха',
    activate: 'при включении',
    castEnd: 'когда заклинание заканчивается',
    moved: 'когда носитель проходит путь',
  };

/** Бросок атаки во фразе срабатывания — по роли носителя. */
export const EFFECT_TRIGGER_ATTACK_ROLE_PHRASES: Record<
  EffectTriggerAttackRole,
  string
> = {
  attacker: 'после своей атаки',
  target: 'после атаки по носителю',
};

/** Части фраз срабатывания. */
export const EFFECT_TRIGGER_PHRASE_PARTS = {
  everyTurnPrefix: 'каждый ход ',
  applierTurnSuffix: ' источника',
  damageSaveSuccess: ': успех — ',
  recurringSavePrefix: 'повторный спасбросок ',
  recurringSaveSuffix: ' снимает эффект',
  failurePrefix: 'провал — ',
  successPrefix: 'успех — ',
  conditionPrefix: ', если ',
  effect: 'эффект',
  removeSelf: 'эффект снимается',
  tagPrefix: 'отметка ',
  setHpPrefix: 'хиты становятся ',
  setHpMax: 'хиты восстанавливаются полностью',
  removeConditionPrefix: 'снимается состояние ',
  removeAllConditions: 'снимаются все состояния',
  kill: 'получатель умирает',
  revivePrefix: 'получатель возвращается к жизни с ',
  reviveFull: 'получатель возвращается к жизни с полным запасом хитов',
  dropHeld: 'получатель роняет то, что держит',
  restoreSlotPrefix: 'возвращается ячейка круга ',
  restoreCounterPrefix: 'возвращается ресурс ',
  dispelPrefix: 'рассеиваются заклинания до круга ',
  grantInspiration: 'получатель получает вдохновение',
  moveSuffix: ' фт',
  endRecipientCast: 'каст получателя заканчивается',
  notifyPrefix: 'сообщение ',
  nextStage: 'эффект переходит на следующую ступень',
  endCast: 'каст заканчивается',
  dcFormulaPrefix: 'Сл = ',
  damageVariable: 'урон',
  pathStepPrefix: 'за каждые ',
  pathStepSuffix: ' фт пути',
  recipientOther: ', на другую сторону',
  recipientApplier: ', на наложившего',
  endsOnExitSuffix: ' до выхода из зоны',
  recipientChoicePrefix: ', на ',
  recipientChoiceTargetPrefix: ' из ',
  recipientChoiceSuffix: ' фт вокруг по выбору',
  recipientChoiceChooser: ' наложившего',
  recipientChoiceOptional: ' (можно отказаться)',
  recipientChoiceConditionPrefix: ', только ',
  nestedTriggerPrefix: ', у состояния ',
  recipientAreaPrefix: ', на ',
  recipientAreaSuffix: ' фт вокруг',
  limitPrefix: ', не чаще ',
  limitOnce: 'одного раза',
  limitTimes: ' раз',
  limitPeriodPrefix: ' за ',
  stackSuffix: ' +1',
  maxHpPrefix: 'максимум хитов −',
  saveModeAdvantage: ' с преимуществом',
  saveModeDisadvantage: ' с помехой',
} as const;

/** Кого задевает «всем в радиусе» — в фразе. */
export const EFFECT_TRIGGER_AREA_TARGET_PHRASES: Record<
  EffectTriggerAreaTarget,
  string
> = {
  all: 'всех',
  allies: 'союзников',
  enemies: 'врагов',
  allWithSelf: 'всех и себя',
  alliesWithSelf: 'союзников и себя',
};

/** Как двигает действие «Переместить» — в фразе. */
export const EFFECT_TRIGGER_MOVE_KIND_PHRASES: Record<
  EffectTriggerMoveKind,
  string
> = {
  push: 'отталкивает на ',
  pull: 'притягивает на ',
  teleport: 'переносит на ',
};

/** Как сдвигается зона — в фразе. */
export const EFFECT_TRIGGER_AREA_SHIFT_PHRASES: Record<
  EffectTriggerAreaShiftKind,
  string
> = {
  away: 'сдвигает зону от получателя на ',
  toward: 'сдвигает зону к получателю на ',
  follow: 'зона идёт за носителем',
};

/** Что делает действие с временными хитами — в фразе. */
export const EFFECT_TRIGGER_TEMP_HP_PHRASES: Record<EffectTempHpMode, string> =
  {
    set: 'временные хиты ',
    add: 'временные хиты +',
    spend: 'временные хиты −',
  };

/**
 * Виды атаки в фразе условия. Форма показывает их же с заглавной буквы —
 * таблица одна.
 */
export const TRIGGER_ATTACK_KIND_PHRASES: Record<TriggerAttackKind, string> = {
  melee: 'рукопашная',
  ranged: 'дальнобойная',
  weapon: 'оружием',
  spell: 'заклинанием',
  unarmed: 'безоружная',
};

/** Отдых срабатывания «после отдыха» — в фразе. */
export const EFFECT_TRIGGER_REST_EVENT_PHRASES: Record<
  EffectTriggerRestType,
  string
> = {
  long: 'после долгого отдыха',
  short: 'после короткого отдыха',
  any: 'после любого отдыха',
};

/** До какого отдыха держится уменьшение максимума хитов — в фразе. */
export const EFFECT_TRIGGER_REST_UNTIL_PHRASES: Record<
  EffectTriggerRestType,
  string
> = {
  long: ' до долгого отдыха',
  short: ' до короткого отдыха',
  any: ' до отдыха',
};

/**
 * Фразы частей условия срабатывания. Аргумент — подпись значения части: типа
 * урона, типа существа или ключ отметки; у частей без значения он не нужен.
 */
export const EFFECT_TRIGGER_CONDITION_PHRASES: Record<
  TriggerConditionKind,
  (valueLabel: string, amount: number) => string
> = {
  damageType: (damageTypeLabel) => `урон ${damageTypeLabel}`,
  damageTypeNot: (damageTypeLabel) => `урон не ${damageTypeLabel}`,
  damageCritical: () => 'критическое попадание',
  damageNotCritical: () => 'не критическое попадание',
  selfBloodied: () => 'у носителя не больше половины хитов',
  selfWounded: () => 'носитель ранен',
  selfCreatureType: (creatureTypeLabel) => `носитель — ${creatureTypeLabel}`,
  selfTag: (tag) => `на носителе отметка «${tag}»`,
  selfTagNot: (tag) => `на носителе нет отметки «${tag}»`,
  rollAdvantage: () => 'атака с преимуществом',
  rollDisadvantage: () => 'атака с помехой',
  otherCreatureType: (creatureTypeLabel) =>
    `другая сторона — ${creatureTypeLabel}`,
  otherMarkedBySelf: () => 'другая сторона помечена носителем',
  selfHpAtMost: (hitPoints) => `у носителя не больше ${hitPoints} хитов`,
  selfHpAtLeast: (hitPoints) => `у носителя не меньше ${hitPoints} хитов`,
  selfSizeAtMost: (sizeLabel) => `носитель размером не больше «${sizeLabel}»`,
  selfSizeAtLeast: (sizeLabel) => `носитель размером не меньше «${sizeLabel}»`,
  selfCondition: (conditionLabel) => `носитель в состоянии «${conditionLabel}»`,
  selfConditionNot: (conditionLabel) =>
    `носитель не в состоянии «${conditionLabel}»`,
  selfTagCountAtLeast: (tag, amount) =>
    `отметок «${tag}» на носителе не меньше ${amount}`,
  selfTagFromSource: (tag) => `на носителе отметка «${tag}» от наложившего`,
  selfTagFromSourceNot: (tag) =>
    `на носителе нет отметки «${tag}» от наложившего`,
  selfTempHpZero: () => 'у носителя нет временных хитов',
  selfGrounded: () => 'носитель не летит',
  selfSpecies: (species) => `раса носителя — «${species}»`,
  selfAbilityAtMost: (abilityLabel, amount) =>
    `${abilityLabel} носителя не больше ${amount}`,
  selfAbilityAtLeast: (abilityLabel, amount) =>
    `${abilityLabel} носителя не меньше ${amount}`,
  otherIsSource: () => 'другая сторона — тот, кто наложил эффект',
  otherBloodied: () => 'у другой стороны не больше половины хитов',
  otherHpAtMost: (hitPoints) => `у другой стороны не больше ${hitPoints} хитов`,
  damageAtLeast: (damage) => `урон не меньше ${damage}`,
  sourceWithin: (feet) => `наложивший в пределах ${feet} фт`,
  attackKind: (attackKindLabel) => `атака ${attackKindLabel}`,
  attackAbility: (abilityLabel) =>
    `атака считается характеристикой «${abilityLabel}»`,
  attackLanded: () => 'атака попала',
  attackMissed: () => 'атака промахнулась',
  combatRoundIs: (round) => `на ${round}-м раунде боя`,
  combatRoundAtLeast: (round) => `с ${round}-го раунда боя`,
  movementOwn: () => 'носитель шёл сам',
  movementForced: () => 'носителя переставили толчком или переносом',
};

/** Сообщения об ошибках разбора формулы — те же, что у системы. */
export const EFFECT_FORMULA_ERRORS = {
  empty: 'Формула не может быть пустой',
  invalid: 'Невалидная формула',
  missingVariable: (position: number) =>
    `Ожидалось имя переменной после @ на позиции ${position}`,
  unknownIdentifier: (identifier: string) =>
    `Неизвестный идентификатор: "${identifier}". Переменные должны начинаться с @`,
  unexpectedChar: (character: string, position: number) =>
    `Неожиданный символ "${character}" на позиции ${position}`,
  unexpectedEnd: 'Неожиданный конец формулы',
  missingFunctionParen: (functionName: string) =>
    `Ожидалась '(' после функции ${functionName}`,
  unclosedFunction: (functionName: string) =>
    `Ожидалась ')' после аргументов функции ${functionName}`,
  unclosedParen: 'Незакрытая скобка',
  unexpectedToken: (tokenValue: string) => `Неожиданный токен: "${tokenValue}"`,
  extraToken: (tokenValue: string) => `Лишний токен: "${tokenValue}"`,
} as const;

/** Название нового эффекта. */
export const EFFECT_NEW_NAME = 'Новый эффект';

/** Подписи блока активных эффектов и строк модификаторов, флагов и урона. */
export const ACTIVE_EFFECT_LABELS = {
  title: 'Активные эффекты',
  subtitle:
    'Считаются листом персонажа на сайте и переносятся в виртуальный стол VTTG',
  add: 'Добавить эффект',
  remove: 'Удалить эффект',
  unnamed: 'Эффект без названия',
  inertBadge: 'Не работает здесь: ',
  removeConfirmTitle: 'Удалить эффект?',
  removeConfirmText:
    'Эффект и все его настройки — модификаторы, флаги, урон — исчезнут из '
    + 'записи. Отменить это можно только не сохраняя форму.',
  removeConfirmCancel: 'Отмена',
  removeConfirmApply: 'Удалить',
  damagePartTarget: 'Цель',
  damagePartRequiresDamage: 'Только если по цели нанесён урон',
  damagePartRemove: 'Убрать часть урона',
  /** Кнопка добавления строки внутри блока — не путать с `add` («Добавить эффект»). */
  addRow: 'Добавить',

  // Строки модификаторов
  changeKey: 'Ключ атрибута',
  changeKeyPlaceholder: 'Напр.: armorClass',
  changeKeyRequired: 'Выбери, что меняется: без ключа строка не сохранится',
  changeMode: 'Режим',
  changeValue: 'Значение',
  changeValuePlaceholder: '+2, 1к4, @mod.spell',
  changeValueRequired: 'Без значения строка не сохранится',
  changePriority: 'Приоритет',
  changeCondition: 'Условие',
  changeConditionPlaceholder: `Напр.: ${EFFECT_ROLL_ADVANTAGE_CONDITION}`,
  changeRemove: 'Удалить модификатор',

  // Строки флагов
  flagPlaceholder: 'Напр.: vision.blinded',
  flagUnknown: 'Кастомный или неизвестный флаг',
  flagRemove: 'Убрать правило',
} as const;

/** Иконки блока активных эффектов: добавление, удаление и бейдж свёрнутой строки. */
export const ACTIVE_EFFECT_ICONS = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
  inertBadge: 'tabler:alert-triangle',
} as const;

/** Подписи шапки, сводки и общих частей формы эффекта. */
export const ACTIVE_EFFECT_FORM_LABELS = {
  name: 'Название',
  icon: 'Иконка',
  iconPlaceholder: 'Напр: tabler:sparkles',
  statusActive: 'Работает',
  statusDisabled: 'Отключён',
  conditionPreset: 'Шаблон состояния',
  conditionPresetHint:
    'Заполнить тем, что делает стандартное состояние. Когда эффект '
    + 'срабатывает, спасбросок, урон и длительность останутся как есть.',
  summaryHint: 'Так эффект сработает с текущими настройками',
  ability: 'Характеристика',
  saveDc: 'Сложность',
} as const;

/** Заголовки шагов формы. */
export const EFFECT_FORM_STEP_TITLES: Record<EffectFormStep, string> = {
  trigger: 'Когда срабатывает',
  save: 'Спасбросок',
  damage: 'Урон',
  modifiers: 'Что меняет',
  duration: 'Длительность',
  triggers: 'Срабатывания',
};

/** Иконки шагов формы. */
export const EFFECT_FORM_STEP_ICONS: Record<EffectFormStep, string> = {
  trigger: 'tabler:bolt',
  save: 'tabler:shield-half',
  damage: 'tabler:flame',
  modifiers: 'tabler:adjustments',
  duration: 'tabler:hourglass',
  triggers: 'tabler:repeat',
};

/** Заголовок шага «Что меняет» — по тому, на кого эффект ложится. */
export const EFFECT_MODIFIERS_STEP_TITLES: Record<EffectDelivery, string> = {
  carrier: EFFECT_FORM_STEP_TITLES.modifiers,
  target: 'Что получает цель',
  aura: 'Что получают существа в ауре',
  zone: 'Что получает существо в зоне',
};

/** Иконки вариантов доставки. */
export const EFFECT_DELIVERY_ICONS: Record<EffectDelivery, string> = {
  carrier: 'tabler:user-shield',
  target: 'tabler:crosshair',
  aura: 'tabler:circle-dotted',
  zone: 'tabler:hexagon',
};

/** Подписи доставки, которыми подписано сразу несколько мест формы. */
const EFFECT_SHARED_DELIVERY_LABELS = {
  owner: 'На владельце',
  creature: 'На существе',
  carrier: 'На носителе',
  targetOnHit: 'На цели при попадании',
  zone: 'В зоне',
} as const;

/** Подпись варианта «на носителе» — по месту формы. */
export const EFFECT_CARRIER_DELIVERY_LABELS: Record<EffectFormContext, string> =
  {
    ownEffects: 'На себе',
    feature: 'На персонаже',
    item: EFFECT_SHARED_DELIVERY_LABELS.owner,
    weapon: EFFECT_SHARED_DELIVERY_LABELS.owner,
    spell: 'На заклинателе',
    creatureAction: EFFECT_SHARED_DELIVERY_LABELS.creature,
    creatureTrait: EFFECT_SHARED_DELIVERY_LABELS.creature,
    zone: EFFECT_SHARED_DELIVERY_LABELS.zone,
    condition: EFFECT_SHARED_DELIVERY_LABELS.carrier,
    generic: EFFECT_SHARED_DELIVERY_LABELS.carrier,
  };

/** Подписи доставок эффекта, который накладывается применением. */
export const EFFECT_USE_DELIVERY_LABELS = {
  carrier: 'На применившем',
  target: 'На цели при применении',
} as const;

/** Пояснения доставок эффекта, который накладывается применением. */
export const EFFECT_USE_DELIVERY_HINTS = {
  carrier: 'Копия ложится на того, кто применил, и живёт своей длительностью.',
  target:
    'Копия ложится на выбранную цель при применении. Спасбросок и урон ниже '
    + 'относятся к цели.',
} as const;

/** Подпись варианта «на цели» — по месту формы. */
export const EFFECT_TARGET_DELIVERY_LABELS: Record<EffectFormContext, string> =
  {
    ownEffects: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    feature: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    item: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    weapon: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    spell: 'На цели заклинания',
    creatureAction: 'На цели действия',
    creatureTrait: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    zone: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    condition: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
    generic: EFFECT_SHARED_DELIVERY_LABELS.targetOnHit,
  };

/** Подписи вариантов доставки, не зависящие от места формы. */
export const EFFECT_DELIVERY_LABELS = {
  aura: 'Аурой вокруг',
  zone: EFFECT_SHARED_DELIVERY_LABELS.zone,
  /** Зона, которую заклинание оставляет на месте своего шаблона. */
  spellZone: 'Зоной на месте области',
} as const;

/** Пояснения под выбором доставки. */
export const EFFECT_DELIVERY_HINTS: Record<EffectDelivery, string> = {
  carrier:
    'Действует на того, у кого эффект: пока надет предмет, есть черта или '
    + 'висит сам эффект.',
  target:
    'Ложится на цель, когда атака попала или заклинание её задело. '
    + 'Спасбросок и урон ниже относятся к цели.',
  aura: 'Носитель излучает эффект на существ вокруг себя.',
  zone: 'Действует на существ в зоне.',
};

/**
 * Пояснение к зоне заклинания: где она появляется и когда пропадает. Урон и
 * эффекты при касте накладывает само заклинание, зона — то, что остаётся.
 */
export const EFFECT_SPELL_ZONE_DELIVERY_HINT =
  'После применения на месте шаблона остаётся зона: в бою она держится, пока '
  + 'длится заклинание, новая концентрация её снимает. Нужна область у '
  + 'заклинания.';

/** Подписи момента срабатывания зоны. */
export const EFFECT_ZONE_AREA_TRIGGER_LABELS: Record<
  EffectAreaTrigger,
  string
> = {
  stay: 'Пока в зоне',
  enter: EFFECT_AREA_TRIGGER_LABELS.enter,
  exit: EFFECT_AREA_TRIGGER_LABELS.exit,
};

/** Подписи момента срабатывания ауры. */
export const EFFECT_AURA_AREA_TRIGGER_LABELS: Record<
  EffectAreaTrigger,
  string
> = {
  stay: 'Пока в ауре',
  enter: 'При входе в ауру',
  exit: 'При выходе из ауры',
};

/** Пояснения под выбором момента срабатывания. */
export const EFFECT_AREA_TRIGGER_HINTS: Record<EffectAreaTrigger, string> = {
  stay:
    'Держится, пока существо внутри, и снимается на выходе. Спасброска и урона '
    + 'сразу у такого эффекта нет — только урон каждый ход.',
  enter:
    'Срабатывает один раз при каждом входе: спасбросок, урон и то, что '
    + 'останется на существе.',
  exit:
    'Срабатывает один раз при каждом выходе: спасбросок, урон и то, что '
    + 'останется на существе.',
};

/**
 * Классы ленты вкладок доставки и момента срабатывания. Лента прокручивается по
 * горизонтали: у заклинания вариантов четыре, и на телефоне сжатые вкладки
 * обрезали подписи до пары букв. Вкладка не ужимается — подпись видна целиком.
 */
export const EFFECT_SCROLLABLE_TABS_UI = {
  list: 'max-w-full overflow-x-auto overscroll-x-contain hidden-scrollbar',
  trigger: 'shrink-0',
} as const;

/** Подписи настроек ауры. */
export const EFFECT_AURA_LABELS = {
  radius: 'Радиус, фт',
  target: 'Кого задевает',
  applyToSelf: 'Действует и на носителя',
  visible: 'Круг на сцене',
  radiusFormula: 'Радиус формулой',
  radiusFormulaPlaceholder: '10 + 20 * floor(@classLevel / 18)',
  radiusFormulaHint: 'Считается от носителя и заменяет число радиуса',
  whileCapable: 'Гаснет, пока носитель недееспособен',
} as const;

/** Подписи выбора «кого задевает аура». */
export const EFFECT_AURA_TARGET_LABELS: Record<EffectAuraTarget, string> = {
  allies: 'Только союзников',
  enemies: 'Только врагов',
  all: 'Всех существ',
};

/** Шаг радиуса ауры, фт. */
export const EFFECT_AURA_RADIUS_STEP = 5;

/** Наименьший радиус ауры, фт. */
export const MIN_EFFECT_AURA_RADIUS = 0;

/** Подписи шага «Спасбросок». */
export const EFFECT_SAVE_STEP_LABELS = {
  toggle: 'Цель делает спасбросок',
  areaToggle: 'Существо делает спасбросок',
  toggleHint: 'Провал — эффект срабатывает полностью. Что даёт успех — ниже.',
  ownToggle: 'Отдельный спасбросок эффекта',
  ownToggleHint:
    'Обычно хватает спасброска самого заклинания или действия. Включите, если '
    + 'эффект требует свой — например, другой характеристики.',
  successTitle: 'Если спасбросок успешен',
  allowWilling: 'Согласная цель не бросает',
  allowWillingHint:
    'В окне броска появится «Не сопротивляюсь»: решает владелец цели',
} as const;

/** Шаг новой растущей строки: правило, ради которого его заводят, — убывающее. */
export const DEFAULT_CHANGE_STEP_BY = -1;

/** Шаг строки, пока автор набирает число: значение стоит на месте. */
export const IDLE_CHANGE_STEP_BY = 0;

/** Период шага новой растущей строки: каждый ход носителя. */
export const DEFAULT_CHANGE_STEP_PER: EffectChangeStepPeriod = 'turn';

/** Подписи периода шага строки модификатора. */
export const EFFECT_CHANGE_STEP_PER_LABELS: Record<
  EffectChangeStepPeriod,
  string
> = {
  turn: 'Каждый ход носителя',
  round: 'Каждый раунд боя',
};

/** Подписи шага строки модификатора. */
export const EFFECT_CHANGE_STEP_LABELS = {
  toggle: 'Меняется со временем',
  by: 'На сколько',
  per: 'Как часто',
  until: 'До',
  untilPlaceholder: 'Без предела',
  hint:
    'Значение строки двигается само: «−1 за каждый следующий ход, до −5». '
    + 'Работает только у обычного числа — формулу двигать нечем, её считают '
    + 'заново при каждом броске. Вне боя ни ход, ни раунд не наступают.',
  numberHint:
    'Шаг работает только у числа: у этой строки значение пустое или формула.',
} as const;

/** Шаг футов цены «Перемещение»: клетка сетки. */
export const EFFECT_MOVE_COST_FEET_STEP = 5;

/** Подписи цены действия — у срабатывания и у «вырваться» одни. */
export const EFFECT_ACTION_COST_FIELD_LABELS = {
  cost: 'Цена',
  moveCost: 'Футов',
} as const;

/** Подписи цены действия. */
export const EFFECT_ACTION_COST_LABELS: Record<EffectActionCost, string> = {
  action: 'Действие',
  bonus: 'Бонусное действие',
  reaction: 'Реакция',
  move: 'Перемещение',
  free: 'Без затрат',
};

/** Подпись кнопки «вырваться», пока автор не назвал свою. */
export const DEFAULT_ESCAPE_LABEL = 'Вырваться';

/** Подписи того, кто может вырваться. */
export const EFFECT_ESCAPE_ACTOR_LABELS: Record<EffectEscapeActor, string> = {
  self: 'Носитель',
  adjacent: 'Существо рядом',
};

/** Подписи того, что даёт успех действия «вырваться». */
export const EFFECT_ESCAPE_OUTCOME_LABELS: Record<EffectEscapeOutcome, string> =
  {
    removeSelf: 'Снять эффект',
    removeCondition: 'Снять состояние',
  };

/** Цена нового действия «вырваться»: правила обычно просят действие. */
export const NEW_ESCAPE_COST: EffectActionCost = 'action';

/** Навык проверки нового действия «вырваться». */
export const NEW_ESCAPE_CHECK_SKILL = 'athletics';

/** Подписи раздела «Действие, снимающее эффект». */
export const EFFECT_ESCAPE_SECTION_LABELS = {
  toggle: 'Из эффекта можно вырваться',
  hint: 'На листе у эффекта появится кнопка действия',
  actor: 'Кто действует',
  outcome: 'Успех',
  checkToggle: 'С проверкой',
  skill: 'Навык',
  dc: 'Сл',
  label: 'Подпись кнопки',
} as const;

/** Подписи раздела «Ступени» формы эффекта. */
export const EFFECT_STAGES_SECTION_LABELS = {
  title: 'Ступени',
  hint:
    'Каждая ступень несёт свои модификаторы и флаги. Переводит на следующую '
    + 'человек — кнопкой на листе или действием срабатывания.',
  /** Приставка номера ступени — и в заголовке, и в подписи новой ступени. */
  stagePrefix: 'Ступень ',
  add: 'Ступень',
  remove: 'Убрать ступень',
} as const;

/** Иконки раздела «Ступени». */
export const EFFECT_STAGES_SECTION_ICONS = {
  add: 'tabler:plus',
  remove: 'tabler:x',
} as const;

/**
 * Чья Сл подставляется вместо Сл 0 — коротко, без пояснения: так её называют
 * сводка и описание эффекта.
 */
export const EFFECT_APPLIER_DC_SHORT_LABELS = {
  spell: 'Сл заклинателя',
  creatureAction: 'Сл действия',
  weapon: 'Сл оружия',
  generic: 'Сл источника',
} as const satisfies Partial<Record<EffectFormContext, string>>;

/** Чья Сл подставляется в режиме «Авто», по месту формы. */
export const EFFECT_APPLIER_DC_LABELS: Partial<
  Record<EffectFormContext, string>
> = {
  ...EFFECT_APPLIER_DC_SHORT_LABELS,
  weapon: `${EFFECT_APPLIER_DC_SHORT_LABELS.weapon} (8 + бонус атаки)`,
};

/**
 * Сл 0 в сводке, если у места формы свой источник Сл: у действия существа это
 * Сл действия, у оружия — Сл оружия. В остальных местах — Сл заклинателя.
 */
export const EFFECT_SCENARIO_APPLIER_DC_LABELS: Partial<
  Record<EffectFormContext, string>
> = {
  creatureAction: EFFECT_APPLIER_DC_SHORT_LABELS.creatureAction,
  weapon: EFFECT_APPLIER_DC_SHORT_LABELS.weapon,
};

/** Режим поля Сл: подставить Сл источника или задать своё число. */
export type SaveDcFieldMode = 'auto' | 'manual';

/** Подписи режимов поля Сл. */
export const EFFECT_SAVE_DC_FIELD_MODE_LABELS: Record<SaveDcFieldMode, string> =
  {
    auto: 'Авто',
    manual: 'Вручную',
  };

/** Разделитель источника Сл и её числа в режиме «Авто» («Сл действия · 14»). */
export const SAVE_DC_AUTO_SEPARATOR = ' · ';

/** Режим поля Сл «Авто»: подставляется Сл источника. */
export const SAVE_DC_AUTO_MODE: SaveDcFieldMode = 'auto';

/** Режим поля Сл «Вручную»: своё число. */
export const SAVE_DC_MANUAL_MODE: SaveDcFieldMode = 'manual';

/** Заголовок выбора «при успехе» спасброска самого заклинания или действия. */
export const EFFECT_ACTION_SAVE_SUCCESS_TITLES: Partial<
  Record<EffectFormContext, string>
> = {
  spell: 'Если цель прошла спасбросок заклинания',
  creatureAction: 'Если цель прошла спасбросок действия',
};

/** Почему спасброска нет — пояснение вместо полей. */
export const EFFECT_SAVE_UNAVAILABLE_HINTS: Record<
  EffectSaveUnavailableReason,
  string
> = {
  stayTrigger:
    'У эффекта «пока внутри» спасброска нет. Чтобы существо бросало '
    + 'спасбросок, выберите в шаге «Когда срабатывает» вход или выход.',
  onCarrier:
    'Спасбросок бросает цель. Чтобы при попадании цель бросала спасбросок, '
    + 'выберите в шаге «Когда срабатывает» вариант «на цели».',
};

/** Вариант выбора «при успехе»: подпись и пояснение. */
export interface EffectSuccessOutcomeOption {
  /** Подпись варианта. */
  label: string;
  /** Пояснение под подписью. */
  description: string;
}

/** Варианты «при успехе» спасброска самого эффекта. */
export const EFFECT_SUCCESS_OUTCOME_OPTIONS: Record<
  EffectSuccessOutcome,
  EffectSuccessOutcomeOption
> = {
  nothing: {
    label: 'Ничего',
    description: 'Ни урона, ни эффекта.',
  },
  halfDamage: {
    label: 'Половина урона',
    description: 'Эффект не накладывается.',
  },
  halfDamageWithEffect: {
    label: 'Половина урона и эффект',
    description: 'Эффект накладывается и на прошедшего спасбросок.',
  },
  effectWithoutDamage: {
    label: 'Эффект без урона',
    description: 'Урона нет, эффект накладывается.',
  },
  onlyOnSuccess: {
    label: 'Эффект только при успехе',
    description:
      'При провале — ничего. Для исходов «успех/провал» разными эффектами, '
      + 'как у «Луча слабости».',
  },
};

/** Варианты «при успехе» спасброска заклинания или действия. */
export const EFFECT_ACTION_SAVE_OUTCOME_OPTIONS: Record<
  EffectSuccessOutcome,
  EffectSuccessOutcomeOption
> = {
  ...EFFECT_SUCCESS_OUTCOME_OPTIONS,
  nothing: {
    label: 'Эффект не накладывается',
    description: 'Прошедшая спасбросок цель эффект не получает.',
  },
  effectWithoutDamage: {
    label: 'Эффект всё равно',
    description: 'Эффект ложится и на прошедшую спасбросок цель.',
  },
};

/** Подписи шага «Урон». */
export const EFFECT_DAMAGE_STEP_LABELS = {
  triggerTitle: 'Урон при срабатывании',
  triggerHint:
    'Наносится сразу. Со спасброском: провал — полный, успех — по выбору в '
    + 'шаге «Спасбросок».',
  addDamage: 'Добавить урон',
} as const;

/** Подписи шага «Что меняет». */
export const EFFECT_MODIFIERS_STEP_LABELS = {
  conditionPrefix: 'Состояние: ',
  conditionRemove: 'Не считать состоянием',
  conditionRemoveHint:
    'Эффект перестанет считаться состоянием: иммунитет к нему не сработает. '
    + 'Модификаторы и особые правила останутся.',
  changesTitle: 'Модификаторы',
  changesEmpty: 'Модификаторов нет. Добавьте из списка «Готовые».',
  flagsTitle: 'Особые правила',
  flagsEmpty: 'Особых правил нет: помеха, преимущество, сопротивления…',
  presets: 'Готовые',
  changePresetHint:
    'Ключ, режим и значение подставятся сами — останется поправить число.',
  flagPresetHint: 'Выбрать правило из разделов',
  rollConditionTitle: 'Действует',
  rollConditionAlways: 'Всегда — в числах листа',
  rollConditionHint:
    'С условием эффект не входит в числа листа и работает только в бросках, '
    + 'где условие выполнено: в своей атаке («Тактика стаи» — союзник рядом с '
    + 'целью) или в атаке по носителю («Защита от добра и зла» — атакующий '
    + 'исчадие).',
  savedRollTitle: 'Сохранённый бросок',
  savedRollPlaceholder: 'Например, 2к6',
  savedRollHint:
    'Кость бросается ОДИН раз — когда эффект ложится. Результат подставляется '
    + 'вместо @roll во все формулы эффекта и дальше не меняется: урон каждый '
    + 'ход будет одним и тем же числом, а не новой костью при каждом тике.',
  adjacentAllyTitle: 'Какой союзник',
  adjacentAllyHint:
    'По правилам «Тактика стаи» не считает недееспособного союзника: '
    + 'спящего, парализованного, оглушённого. «В любом состоянии» — хватит '
    + 'просто стоять рядом.',
  add: ACTIVE_EFFECT_LABELS.addRow,
  immunitiesTitle: 'Иммунитет к состояниям',
  immunitiesHint:
    'Пока эффект действует, носитель не подхватывает эти состояния.',
  suppressTitle: 'Подавляет состояния',
  suppressHint:
    'Состояние остаётся на носителе, но не действует, пока эффект жив: '
    + '«Свобода перемещения» гасит Опутанного.',
  suppressPlaceholder: 'Выберите состояния',
  immunitiesPlaceholder: 'Состояния...',
} as const;

/** Подписи шага «Длительность». */
export const EFFECT_DURATION_STEP_LABELS = {
  durationTitle: 'Сколько держится',
  valuePlaceholder: 'Сколько',
  formulaToggle: 'Формулой',
  formulaToggleHint:
    'Срок бросается один раз, при наложении: «1к4» раунда у «Замешательства», '
    + '«1 + @mod.con» у умения.',
  formulaPlaceholder: 'Например, 1к4',
  permanentHint: 'Пока не снимут вручную.',
  roundsHint: 'Отсчитывается в бою каждый раунд.',
  turnHint:
    'Спадает точно на ходу носителя или источника — «до конца следующего '
    + 'хода». Работает в бою.',
  specialHint: 'Особое условие: снимает мастер.',
  timeHint:
    'В бою минуты и часы отсчитываются раундами (минута — 10); вне боя время '
    + 'не идёт.',
} as const;

/** Пояснение под выбором длительности — по её типу. */
export const EFFECT_DURATION_HINTS: Record<EffectDurationType, string> = {
  permanent: EFFECT_DURATION_STEP_LABELS.permanentHint,
  rounds: EFFECT_DURATION_STEP_LABELS.roundsHint,
  minutes: EFFECT_DURATION_STEP_LABELS.timeHint,
  hours: EFFECT_DURATION_STEP_LABELS.timeHint,
  days: EFFECT_DURATION_STEP_LABELS.timeHint,
  turn: EFFECT_DURATION_STEP_LABELS.turnHint,
  special: EFFECT_DURATION_STEP_LABELS.specialHint,
};

/** Длительность «до хода»: у неё выбираются момент хода и чей это ход. */
export const EFFECT_TURN_DURATION_TYPE = 'turn' satisfies EffectDurationType;

/** Наименьшее число у длительности в раундах, минутах или часах. */
export const MIN_EFFECT_DURATION_VALUE = 0;

/** Подписи плашки неработающих настроек. */
export const EFFECT_INERT_FIELDS_LABELS = {
  title: 'Эти настройки здесь не работают',
  description:
    'Они остались от прежнего редактора или от другого места эффекта и при '
    + 'срабатывании будут пропущены: ',
  clear: 'Убрать',
} as const;

/** Значение выбора «Действует» для эффекта без применения. */
export const EFFECT_PERMANENT_ACTIVATION = 'permanent';

/** Значение выбора «Действует» у модификаторов без условия броска. */
export const EFFECT_ROLL_CONDITION_ALWAYS = 'always';

/** Условию по отметке в «Ложится, если» подсказывать нечего. */
export const EFFECT_NO_KNOWN_TAGS: readonly string[] = [];

/** Выбор «Действует»: постоянно, при применении или переключателем. */
export type EffectActivationChoice =
  EffectActivationMode | typeof EFFECT_PERMANENT_ACTIVATION;

/** Подписи выбора «Действует». */
export const EFFECT_ACTIVATION_CHOICE_LABELS: Record<
  EffectActivationChoice,
  string
> = {
  permanent: 'Постоянно',
  use: 'При применении',
  toggle: 'Переключателем',
};

/** Пояснения под выбором «Действует». */
export const EFFECT_ACTIVATION_CHOICE_HINTS: Record<
  EffectActivationChoice,
  string
> = {
  permanent: 'Действует всё время, пока есть источник.',
  use:
    'Сам не действует: копия ложится, когда источник применяют — пунктом '
    + '«Использовать» у предмета, выстрелом боеприпасом, кнопкой «Применить» '
    + 'на листе. Расходуемый предмет теряет единицу, предмет с зарядами — '
    + 'заряд.',
  toggle:
    'Лежит на листе выключенным и включается переключателем. Включение '
    + 'запускает срабатывания «При включении»; по истечении длительности '
    + 'эффект выключается.',
};

/** Подписи ресурса применения. */
export const EFFECT_ACTIVATION_COUNTER_LABELS = {
  counter: 'Тратит ресурс',
  counterPlaceholder: 'Ключ ресурса, например rage',
  amount: 'Сколько',
  hint: 'Ресурс листа (вкладка «Ресурсы»); пусто — ничего не тратит.',
} as const;

/** Подписи условия наложения. */
export const EFFECT_LANDING_CONDITION_LABELS = {
  title: 'Ложится, если',
  always: 'Без условия — ложится всегда.',
  hint:
    'Условие считается до урона этого удара. Нужны хиты после урона — '
    + 'срабатывание «При наложении».',
} as const;

/** Подписи варианта эффекта. */
export const EFFECT_VARIANT_LABELS = {
  toggle: 'Один из вариантов',
  toggleHint:
    'Из эффектов одной группы ложится один: его выбирают при броске или '
    + 'бросают случайно.',
  group: 'Группа',
  label: 'Вариант',
  pick: 'Выбор',
  defaultGroup: 'вариант',
} as const;

/** Как выбирается вариант группы. */
export const EFFECT_VARIANT_PICK_LABELS: Record<EffectVariantPick, string> = {
  choose: 'Выбирает бросающий',
  random: 'Случайно',
};

/** Названия неработающих настроек. */
export const EFFECT_INERT_FIELD_NAMES: Record<InertEffectField, string> = {
  charges: 'заряды',
  activation: 'применение или включение',
  landingCondition: 'условие наложения',
  variant: 'вариант',
  effectTarget: 'на кого накладывается',
  aura: 'аура',
  areaTrigger: 'момент срабатывания',
  applySave: 'спасбросок',
  successOutcome: 'исход при успехе',
  damageParts: 'урон при срабатывании',
  recurringDamage: 'урон каждый ход',
  recurringSave: 'повторный спасбросок',
  consumeOn: 'снятие после атаки',
  duration: 'длительность',
  conditionImmunities: 'иммунитет к состояниям',
  triggers: 'срабатывания не для этого места',
};

/** Разделитель названий в перечне неработающих настроек. */
export const EFFECT_INERT_FIELDS_SEPARATOR = EFFECT_PHRASE_PARTS.listJoiner;

/** Знак в конце перечня неработающих настроек. */
export const EFFECT_INERT_FIELDS_TERMINATOR = '.';

/** Подписи сворачиваемого раздела «Описание». */
export const EFFECT_DESCRIPTION_LABELS = {
  title: 'Описание',
  placeholder: 'Коротко для подсказки и списка эффектов',
  fillFromSummary: 'Взять из сводки',
  fillFromSummaryHint: 'Заменить описание фразой из сводки сверху',
} as const;

/** Строк в поле описания до того, как оно растянется по тексту. */
export const EFFECT_DESCRIPTION_ROWS = 2;

/** Иконка раскрытия сворачиваемых разделов формы: «Описание», «Для опытных». */
export const EFFECT_SECTION_TOGGLE_ICON = 'tabler:chevron-down';

/** Кнопка раскрытия раздела: стрелка справа и поворот, пока раздел открыт. */
export const EFFECT_SECTION_TOGGLE_UI = {
  trailingIcon:
    'ms-auto transition-transform duration-200 group-data-[state=open]:rotate-180',
} as const;

/** Подписи сворачиваемого раздела «Для опытных». */
export const EFFECT_ADVANCED_LABELS = {
  title: 'Для опытных',
  priorityField: 'Приоритет у модификаторов',
  priorityFieldHint:
    'Порядок, в котором применяются модификаторы. Строки, где приоритет уже '
    + 'задан, показывают его всегда.',
} as const;

/** Подписи шага «Срабатывания». */
export const EFFECT_TRIGGERS_STEP_LABELS = {
  hint:
    'Что эффект делает сам по ходу боя: урон каждый ход, повторный спасбросок, '
    + 'снятие после атаки или своё — «когда → спасбросок → что сделать → сколько '
    + 'раз».',
  empty: 'Срабатываний нет.',
  addTitle: ACTIVE_EFFECT_LABELS.addRow,
  chargesToggle: 'Заряды',
  chargesToggleHint:
    'Сколько раз срабатывания эффекта сработают всего. Каждое сработавшее '
    + 'тратит заряд; зарядов не осталось — эффект молчит. Считаются только у '
    + 'эффекта, который лежит на существе: у ауры и зоны своего экземпляра нет.',
  chargesEndsWhenEmpty: 'Последний заряд снимает эффект',
} as const;

/** Подписи строки срабатывания. */
export const EFFECT_TRIGGER_ROW_LABELS = {
  event: 'Когда',
  role: 'Чья атака',
  turnOf: 'Чей ход',
  saveToggle: 'Спасбросок',
  saveAbility: ACTIVE_EFFECT_FORM_LABELS.ability,
  saveDc: 'Сл',
  actionsTitle: 'Что сделать',
  actionsEmpty:
    'Добавьте хотя бы одно действие — без него срабатывание не сохранится.',
  addAction: 'Действие',
  removeAction: 'Убрать действие',
  remove: 'Убрать срабатывание',
  gate: 'Исход',
  condition: 'Состояние',
  conditionRounds: 'Раундов',
  conditionRoundsPlaceholder: 'Пока не снимут',
  tag: 'Ключ отметки',
  tagLabel: 'Имя в списке',
  tagLabelPlaceholder: 'Как ключ',
  tagRoundsPlaceholder: 'До начала следующего хода',
  tagInvalid:
    'Ключ — буквы, цифры, «_», «.» и «-»; без годного ключа отметка не сохранится.',
  recipient: 'Кому',
  setHpValue: 'Хитов',
  dcFormula: 'Сл формулой',
  dcFormulaPlaceholder: 'max(10, floor(@damage / 2))',
  dcFormulaHint: '@damage — урон события. Пусто — число Сл.',
  limitToggle: 'Не чаще',
  limitTimes: 'раз за',
  chanceToggle: 'С броском на шанс',
  chancePercent: '% срабатывания',
  chanceHint:
    'Бросок идёт ПЕРЕД лимитом «не чаще N раз»: неудавшийся шанс — это '
    + 'несостоявшееся срабатывание, и «раз в ход» на него не тратится.',
  conditionKey: 'Какое состояние',
  conditionKeyAny: 'Любое',
  conditionKeyHint: 'Срабатывание слушает только это снятое состояние.',
  advantageIf: 'Преимущество, если',
  disadvantageIf: 'Помеха, если',
  saveModeIfEmpty: 'Без условия — режим не меняется.',
  autoSuccessIf: 'Автоматический успех, если',
  autoFailIf: 'Автоматический провал, если',
  autoOutcomeEmpty: 'Без условия — спасбросок бросается как обычно.',
  moveKind: 'Как двигать',
  moveDistance: 'Футов',
  moveFrom: 'От кого',
  moveHint: 'Ядро ставит фишку; препятствия не учитываются',
  areaShiftKind: 'Куда',
  areaShiftHint: 'Сдвигается зона того же каста; форма не меняется',
  removeConditionAll: 'Все состояния',
  tempHpAmount: 'Сколько',
  tempHpMode: 'Как',
  reviveHp: 'Хитов',
  reviveFull: 'Полный запас',
  setHpToMax: 'Полный запас',
  restoreWhat: 'Что вернуть',
  restoreLevel: 'Круг',
  restoreCounter: 'Ключ ресурса',
  restoreAmount: 'Сколько',
  dispelMaxLevel: 'До какого круга',
  dispelWithoutLevel: 'И то, у чего круг неизвестен',
  endCastWhose: 'Чей каст',
  conditionEndsOnExit: 'Спадает при выходе из зоны',
  conditionEndsOnExitHint:
    'Состояние уходит, как только существо покинет зону, которая его наложила '
    + '(«Опутанность» от «Паутины»). Вне зоны выходить не из чего — там '
    + 'настройка ничего не делает.',
  conditionLocked: 'Снимает только источник',
  conditionLockedHint:
    'Плитка состояния на листе и действие «снять состояние» его не трогают',
  costHint: 'Ходом распоряжается человек — цена это пометка',
  askToggle: 'Спрашивать разрешения',
  asker: 'У кого спрашивать',
  notifyText: 'Текст сообщения',
  notifyTextPlaceholder: 'Что напомнить человеку',
  notifyTo: 'Кому',
  notifyRoll: 'Бросок к сообщению',
  notifyRollPlaceholder: '1к8',
  notifyRollHint: 'Номер строки таблицы поведения; пусто — без броска',
  restType: 'Какой отдых',
  everyFeet: 'За каждые, фт',
  everyFeetOnce: 'раз за путь',
  saveMode: 'Бросок',
  recurringSaveToggle: 'Повторный спасбросок снимает состояние',
  recurringSaveTiming: 'Когда',
  tagStack: 'Счётчик',
  tagStackHint: 'Повторная отметка прибавляет ступень, а не заменяет прежнюю',
  maxHpAmount: 'На сколько',
  maxHpAmountPlaceholder: DEFAULT_MAX_HP_REDUCTION,
  maxHpAmountHint: '@damage — урон события; можно число или кости',
  maxHpRest: 'Максимум вернётся после',
} as const;

/** Момент повторного спасброска наложенного состояния по умолчанию. */
export const DEFAULT_RECURRING_SAVE_TIMING: EffectSaveTiming = 'endOfTurn';

/** События срабатывания в списке. */
export const EFFECT_TRIGGER_EVENT_LABELS: Partial<
  Record<EffectTriggerEvent, string>
> = {
  applied: 'При наложении',
  activate: 'При действии или включении',
  turnStart: 'В начале хода',
  turnEnd: 'В конце хода',
  enter: 'При входе в зону или ауру',
  exit: 'При выходе из зоны или ауры',
  attackRoll: 'При броске атаки',
  damageTaken: 'Когда носитель получает урон',
  healed: 'Когда носителя лечат',
  hpZero: 'Когда хиты носителя падают до 0',
  downedOther: 'Когда носитель сваливает цель',
  conditionLost: 'Когда с носителя снимается состояние',
  castEnd: 'Когда заклинание заканчивается',
  moved: 'Когда носитель проходит путь',
  rest: 'После отдыха',
};

/** Какой отдых запускает срабатывание. */
export const EFFECT_TRIGGER_REST_LABELS: Record<EffectTriggerRestType, string> =
  {
    long: 'Долгий отдых',
    short: 'Короткий отдых',
    any: 'Любой отдых',
  };

/** После какого отдыха возвращается максимум хитов. */
export const EFFECT_TRIGGER_MAX_HP_REST_LABELS: Record<
  EffectTriggerMaxHpRestEnd,
  string
> = {
  ...EFFECT_TRIGGER_REST_LABELS,
  [MAX_HP_REDUCTION_NEVER_ENDS]: 'Не вернётся сам',
};

/** Обычный спасбросок в выборе режима: поля `mode` нет. */
export const EFFECT_TRIGGER_NORMAL_SAVE_MODE = 'normal';

/** Режим спасброска срабатывания; обычный в данных не пишется. */
export const EFFECT_TRIGGER_SAVE_MODE_LABELS: Record<
  EffectTriggerSaveMode | typeof EFFECT_TRIGGER_NORMAL_SAVE_MODE,
  string
> = {
  [EFFECT_TRIGGER_NORMAL_SAVE_MODE]: 'Обычный',
  advantage: 'С преимуществом',
  disadvantage: 'С помехой',
};

/** Подпись носителя эффекта как получателя или адресата. */
const SUBJECT_ADDRESS_LABEL = 'Носителю эффекта';

/** Подпись наложившего эффект как получателя или адресата. */
const APPLIER_ADDRESS_LABEL = 'Наложившему эффект';

/** Кому достаются действия срабатывания; «другая сторона» — у урона. */
export const EFFECT_TRIGGER_RECIPIENT_LABELS: Record<
  EffectTriggerRecipient,
  string
> = {
  subject: SUBJECT_ADDRESS_LABEL,
  other: 'Тому, кто нанёс урон',
  [APPLIER_TRIGGER_RECIPIENT]: APPLIER_ADDRESS_LABEL,
  [AREA_TRIGGER_RECIPIENT]: 'Всем в радиусе',
  [CHOICE_TRIGGER_RECIPIENT]: 'Выбранным',
};

/** Подписи полей «всем в радиусе». */
export const EFFECT_TRIGGER_AREA_LABELS = {
  radius: 'Радиус, фт',
  target: 'Кого',
  alliesWithSelf: 'Союзников и носителя',
  allWithSelf: 'Всех и носителя',
} as const;

/** Подписи полей «по выбору». */
export const EFFECT_TRIGGER_CHOICE_LABELS = {
  radius: 'Радиус, фт',
  target: 'Из кого выбирать',
  count: 'Сколько целей',
  condition: 'Условие цели',
  optional: 'Можно отказаться',
  chooser: 'Кто выбирает',
} as const;

/** Кто выбирает получателей. */
export const EFFECT_TRIGGER_CHOOSER_LABELS: Record<
  EffectTriggerChooser,
  string
> = {
  subject: 'Носитель эффекта',
  source: 'Наложивший эффект',
};

/** Подписи вложенного срабатывания наложенного состояния. */
export const EFFECT_TRIGGER_NESTED_LABELS = {
  toggle: 'Своё срабатывание состояния',
  event: 'Когда у состояния',
  action: 'Что делает',
} as const;

/** «Другая сторона» при наложении — кто наложил эффект. */
export const EFFECT_TRIGGER_APPLIED_OTHER_PARTY_LABEL = APPLIER_ADDRESS_LABEL;

/** «Другая сторона» броска атаки по роли носителя. */
export const EFFECT_TRIGGER_ATTACK_OTHER_PARTY_LABELS: Record<
  EffectTriggerAttackRole,
  string
> = {
  attacker: 'Цели атаки',
  target: 'Атакующему',
};

/** Роль в броске атаки. */
export const EFFECT_TRIGGER_ROLE_LABELS: Record<
  EffectTriggerAttackRole,
  string
> = {
  attacker: 'Своя атака',
  target: 'Атака по носителю',
};

/** Чей ход у срабатывания начала и конца хода. */
export const EFFECT_TRIGGER_TURN_OWNER_LABELS: Record<
  EffectTriggerTurnOwner,
  string
> = {
  subject: 'Носителя эффекта',
  source: 'Наложившего эффект',
};

/** Виды действий. */
export const EFFECT_TRIGGER_ACTION_LABELS: Record<
  EffectTriggerActionType,
  string
> = {
  damage: 'Урон или лечение',
  applySelf: 'Наложить сам эффект',
  applyCondition: 'Наложить состояние',
  applyTag: 'Поставить отметку',
  reduceMaxHp: 'Уменьшить максимум хитов',
  setHp: 'Хиты становятся',
  endCast: 'Закончить каст',
  move: 'Переместить',
  moveArea: 'Сдвинуть зону',
  removeCondition: 'Снять состояние',
  tempHp: 'Временные хиты',
  kill: 'Убить',
  revive: 'Вернуть к жизни',
  dropHeld: 'Уронить из рук',
  restore: 'Вернуть ресурс',
  dispel: 'Рассеять заклинания',
  grantInspiration: 'Дать вдохновение',
  notify: 'Сообщить человеку',
  nextStage: 'Следующая ступень',
  removeSelf: 'Снять эффект',
};

/** Иконки видов действий. */
export const EFFECT_TRIGGER_ACTION_ICONS: Record<
  EffectTriggerActionType,
  string
> = {
  damage: 'tabler:flame',
  applySelf: 'tabler:copy',
  applyCondition: 'tabler:mood-sick',
  applyTag: 'tabler:bookmark',
  reduceMaxHp: 'tabler:heart-minus',
  setHp: 'tabler:heart-plus',
  endCast: 'tabler:player-stop',
  move: 'tabler:arrow-big-right-lines',
  moveArea: 'tabler:arrows-move',
  removeCondition: 'tabler:mood-check',
  tempHp: 'tabler:shield-half',
  kill: 'tabler:skull',
  revive: 'tabler:heartbeat',
  dropHeld: 'tabler:hand-off',
  restore: 'tabler:battery-charging',
  dispel: 'tabler:wand-off',
  grantInspiration: 'tabler:star',
  notify: 'tabler:message-2',
  nextStage: 'tabler:stairs-up',
  removeSelf: 'tabler:circle-x',
};

/** Подписи того, кому адресовано сообщение срабатывания. */
export const EFFECT_NOTIFY_TARGET_LABELS: Record<EffectNotifyTarget, string> = {
  subject: SUBJECT_ADDRESS_LABEL,
  source: APPLIER_ADDRESS_LABEL,
};

/** Подписи того, что делает действие с временными хитами. */
export const EFFECT_TEMP_HP_MODE_LABELS: Record<EffectTempHpMode, string> = {
  set: 'Поставить',
  add: 'Прибавить',
  spend: 'Потратить',
};

/** Подписи того, какой ресурс возвращает действие. */
export const EFFECT_RESTORE_KIND_LABELS: Record<EffectRestoreKind, string> = {
  spellSlot: 'Ячейку заклинания',
  counter: 'Ресурс листа',
};

/** Подписи того, чей каст заканчивает действие. */
export const EFFECT_CAST_OWNER_LABELS: Record<EffectCastOwner, string> = {
  self: 'Свой',
  recipient: 'Получателя',
};

/** Подписи того, как двигает действие «Переместить». */
export const EFFECT_TRIGGER_MOVE_KIND_LABELS: Record<
  EffectTriggerMoveKind,
  string
> = {
  push: 'Оттолкнуть',
  pull: 'Притянуть',
  teleport: 'Перенести',
};

/** Подписи того, как сдвигается зона действием «Сдвинуть зону». */
export const EFFECT_TRIGGER_AREA_SHIFT_KIND_LABELS: Record<
  EffectTriggerAreaShiftKind,
  string
> = {
  away: 'От получателя',
  toward: 'К получателю',
  follow: 'За носителем',
};

/** Подписи опоры направления перемещения. */
export const EFFECT_TRIGGER_MOVE_ORIGIN_LABELS: Record<
  EffectTriggerMoveOrigin,
  string
> = {
  source: 'От наложившего',
  subject: 'От носителя',
};

/** Сколько временных хитов у нового действия. */
export const DEFAULT_TRIGGER_TEMP_HP = '5';

/** До какого круга рассеивает новое действие «Рассеять». */
export const DEFAULT_DISPEL_MAX_LEVEL = 3;

/** Текст нового действия «Сообщить», пока автор не написал свой. */
export const DEFAULT_TRIGGER_NOTIFY_TEXT = 'Напоминание';

/**
 * Ключ пункта «любое / все состояния»: в данных это отсутствие ключа
 * состояния. Не пустая строка: пункт списка с пустым значением Reka UI
 * отвергает, и список не открывается. Звёздочкой ключ состояния не бывает —
 * в нём только буквы, цифры, «_», «.» и «-».
 */
export const ANY_CONDITION_KEY = '*';

/** Иконки кнопок строки срабатывания. */
export const EFFECT_TRIGGER_ROW_ICONS = {
  remove: 'tabler:trash',
  removeAction: 'tabler:x',
  addAction: 'tabler:plus',
} as const;

/** Наименьший срок состояния или отметки действия, раундов; 0 — срок по умолчанию. */
export const MIN_TRIGGER_ACTION_ROUNDS = 0;

/** Наименьшее число хитов действия «Хиты становятся». */
export const MIN_SET_HP_VALUE = 0;

/** Исход спасброска, при котором выполняется действие. */
export const EFFECT_TRIGGER_GATE_LABELS: Record<
  EffectTriggerActionGate,
  string
> = {
  failed: 'При провале',
  saved: 'При успехе',
  always: 'Всегда',
};

/** Исход урона: «половина при успехе» — отдельный вариант. */
export const EFFECT_TRIGGER_DAMAGE_HALF_GATE = 'half';

/** Подпись варианта «провал — полный, успех — половина». */
export const EFFECT_TRIGGER_DAMAGE_HALF_LABEL =
  'Провал — полный, успех — половина';

/** Периоды лимита. */
export const EFFECT_TRIGGER_PERIOD_LABELS: Record<
  EffectTriggerLimitPeriod,
  string
> = {
  turn: 'ход',
  round: 'раунд',
  shortRest: 'короткий отдых',
  longRest: 'долгий отдых',
};

/** Готовые срабатывания. */
export const EFFECT_TRIGGER_PRESET_LABELS: Record<EffectTriggerPreset, string> =
  {
    recurringDamage: 'Урон каждый ход',
    recurringSave: 'Повторный спасбросок',
    consumeOn: 'Снять после атаки',
    hpZeroToOne: 'Вместо 0 хитов — 1 хит',
    tagOnDamage: 'Отметка от урона',
    custom: 'Своё…',
  };

/** Иконки готовых срабатываний. */
export const EFFECT_TRIGGER_PRESET_ICONS: Record<EffectTriggerPreset, string> =
  {
    recurringDamage: 'tabler:flame',
    recurringSave: 'tabler:shield-half',
    consumeOn: 'tabler:sword',
    hpZeroToOne: 'tabler:heart-broken',
    tagOnDamage: 'tabler:bookmark',
    custom: 'tabler:plus',
  };

/** Подписи условия срабатывания. */
export const EFFECT_TRIGGER_CONDITION_LABELS = {
  title: ACTIVE_EFFECT_LABELS.changeCondition,
  always: 'Без условия — срабатывает всегда.',
  and: 'и',
  add: ACTIVE_EFFECT_LABELS.changeCondition,
  remove: 'Убрать условие',
  unknown: 'Условие из данных, окно его не знает: срабатывание не сработает',
  knownTags: 'Отметки этого эффекта',
  amount: 'не меньше',
} as const;

/** Виды частей условия срабатывания. */
export const EFFECT_TRIGGER_CONDITION_KIND_LABELS: Record<
  TriggerConditionKind,
  string
> = {
  damageType: 'Урон этого типа',
  damageTypeNot: 'Урон без этого типа',
  damageCritical: 'Критическое попадание',
  damageNotCritical: 'Не критическое попадание',
  selfBloodied: 'Носитель окровавлен (хитов не больше половины)',
  selfWounded: 'Носитель ранен',
  selfCreatureType: 'Носитель — существо типа',
  selfTag: 'На носителе отметка',
  selfTagNot: 'На носителе нет отметки',
  rollAdvantage: 'Атака с преимуществом',
  rollDisadvantage: 'Атака с помехой',
  otherCreatureType: 'Другая сторона — существо типа',
  otherMarkedBySelf: 'Другая сторона помечена носителем',
  selfHpAtMost: 'У носителя хитов не больше',
  selfHpAtLeast: 'У носителя хитов не меньше',
  selfSizeAtMost: 'Носитель размером не больше',
  selfSizeAtLeast: 'Носитель размером не меньше',
  selfCondition: 'Носитель в состоянии',
  selfConditionNot: 'Носитель не в состоянии',
  selfTagCountAtLeast: 'Отметок на носителе (счётчик)',
  selfTagFromSource: 'На носителе отметка от наложившего',
  selfTagFromSourceNot: 'На носителе нет отметки от наложившего',
  selfTempHpZero: 'У носителя нет временных хитов',
  selfGrounded: 'Носитель не летит',
  selfSpecies: 'Раса носителя',
  selfAbilityAtMost: 'У носителя характеристика не больше',
  selfAbilityAtLeast: 'У носителя характеристика не меньше',
  otherIsSource: 'Другая сторона — тот, кто наложил эффект',
  otherBloodied: 'Другая сторона окровавлена (хитов не больше половины)',
  otherHpAtMost: 'У другой стороны хитов не больше',
  damageAtLeast: 'Урон не меньше',
  sourceWithin: 'Наложивший в пределах (фт)',
  attackKind: 'Вид атаки',
  attackAbility: 'Атака считается характеристикой',
  attackLanded: 'Атака попала',
  attackMissed: 'Атака промахнулась',
  combatRoundIs: 'Идёт раунд боя',
  combatRoundAtLeast: 'Раунд боя не раньше',
  movementOwn: 'Носитель шёл сам',
  movementForced: 'Носителя переставили (толчок, перенос)',
};

/** Значение новой части условия с выбором. */
export const EFFECT_TRIGGER_CONDITION_DEFAULT_VALUES = {
  damageType: 'fire',
  creatureType: 'humanoid',
  tag: DEFAULT_EFFECT_TAG,
  number: '50',
  size: 'large',
  condition: 'incapacitated',
  ability: 'strength',
  attackKind: 'melee',
  text: '',
} as const satisfies Record<TriggerConditionParameter, string>;

/**
 * Значение новой части условия, когда общее по виду выбора не годится: «на
 * раунде 50» бессмысленно, расписание почти всегда — со второго раунда.
 */
export const EFFECT_TRIGGER_CONDITION_KIND_DEFAULT_VALUES: Partial<
  Record<TriggerConditionKind, string>
> = {
  combatRoundIs: '2',
  combatRoundAtLeast: '2',
  // Пустая строка вида не разобралась бы обратно в часть, и поле ввода
  // пропало бы сразу после добавления
  selfSpecies: 'Человек',
};

/** Значение части условия — характеристика: у неё свой порог по умолчанию. */
export const TRIGGER_CONDITION_ABILITY_PARAMETER =
  'ability' satisfies TriggerConditionParameter;

/** Значение части условия — свободная строка: вводится полем, а не выбором. */
export const TRIGGER_CONDITION_TEXT_PARAMETER =
  'text' satisfies TriggerConditionParameter;

/** Значение части условия — ключ отметки: вводится строкой, а не выбором. */
export const TRIGGER_CONDITION_TAG_PARAMETER =
  'tag' satisfies TriggerConditionParameter;

/** Значение части условия — число: вводится полем, а не выбором. */
export const TRIGGER_CONDITION_NUMBER_PARAMETER =
  'number' satisfies TriggerConditionParameter;

/** Состояние нового действия «Наложить состояние». */
export const DEFAULT_TRIGGER_CONDITION: EffectConditionKey = 'poisoned';

/** Период нового лимита «не чаще N раз». */
export const DEFAULT_TRIGGER_LIMIT_PERIOD: EffectTriggerLimitPeriod = 'turn';

/** Иконка бейджа состояния в шаге «Что меняет». */
export const EFFECT_CONDITION_BADGE_ICON = 'tabler:heart-broken';

/** Иконка кнопки «Не считать состоянием» у бейджа состояния. */
export const EFFECT_CONDITION_REMOVE_ICON = 'tabler:x';

/**
 * Помощник ввода формулы урона эффекта. Перенесён из общего поля формулы
 * урона нового сайта (`~ui/damage-formula`): на старом сайте такого поля нет,
 * а эффекту нужны лишь кости, типы урона, лечение и условия по цели.
 */

/** Приставка токена формулы. */
export const EFFECT_DAMAGE_FORMULA_TAG_PREFIX = '@';

/** Арифметический разделитель слагаемых. */
export const EFFECT_DAMAGE_FORMULA_SEPARATOR = '+';

/** Символ кости в формуле (русская «к»). */
export const EFFECT_DAMAGE_FORMULA_DICE_SYMBOL = 'к';

/** Вкладка-помощник ввода формулы: имя слота `UTabs`. */
export type EffectDamageFormulaToolSlot =
  'dice' | 'damageTypes' | 'healing' | 'conditions' | 'creatureTypes';

/** Кости, доступные кнопками. */
export const EFFECT_DAMAGE_FORMULA_DICE: Array<{
  label: string;
  value: number;
}> = [
  { label: 'к4', value: 4 },
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
  { label: 'к20', value: 20 },
];

/**
 * Вид части задаётся ТОЛЬКО токеном лечения: он помечает своё слагаемое и все
 * последующие без собственного токена.
 */
export const EFFECT_DAMAGE_FORMULA_HEALING_TAGS: Array<Option<string>> = [
  { label: 'Лечение (@heal)', value: 'heal' },
  { label: 'Временные ХП (@heal.temp)', value: 'heal.temp' },
];

/** Условия по хитам цели: слагаемое достаётся только подходящей цели. */
export const EFFECT_DAMAGE_FORMULA_CONDITION_TAGS: Array<Option<string>> = [
  { label: 'Полное HP (@target.full)', value: 'target.full' },
  { label: 'Неполное HP (@target.notFull)', value: 'target.notFull' },
];

/**
 * Типы существ для токена `@target.type.<тип>`: слагаемое достаётся только
 * целям названного типа (словарь VTTG).
 */
export const EFFECT_DAMAGE_FORMULA_CREATURE_TYPE_TAGS: Array<Option<string>> = [
  { label: 'Аберрация', value: 'target.type.aberration' },
  { label: 'Зверь', value: 'target.type.beast' },
  { label: 'Небожитель', value: 'target.type.celestial' },
  { label: 'Конструкт', value: 'target.type.construct' },
  { label: 'Дракон', value: 'target.type.dragon' },
  { label: 'Элементаль', value: 'target.type.elemental' },
  { label: 'Фея', value: 'target.type.fey' },
  { label: 'Исчадие', value: 'target.type.fiend' },
  { label: 'Великан', value: 'target.type.giant' },
  { label: 'Гуманоид', value: 'target.type.humanoid' },
  { label: 'Чудовище', value: 'target.type.monstrosity' },
  { label: 'Слизь', value: 'target.type.ooze' },
  { label: 'Растение', value: 'target.type.plant' },
  { label: 'Нежить', value: 'target.type.undead' },
  { label: 'Рой', value: 'target.type.swarm' },
];

/** Подписи вкладок и полей помощника формулы урона. */
export const EFFECT_DAMAGE_FORMULA_LABELS = {
  formula: 'Формула',
  formulaPlaceholder: 'Например: 8к6@dmg.fire',
  dice: 'Кости',
  damageTypes: 'Тип урона',
  healing: 'Лечение',
  conditions: 'Условия',
  creatureTypes: 'Тип существ',
} as const;

/** Подписи поля «значение из библиотеки». */
export const EFFECT_LIBRARY_INPUT_LABELS = {
  picker: 'Из библиотеки',
  search: 'Поиск…',
} as const;
