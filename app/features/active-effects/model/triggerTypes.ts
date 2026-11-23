/**
 * «Срабатывания» эффекта: единая модель «когда → если → спасбросок → что
 * сделать → сколько раз».
 *
 * Раньше каждое «когда» было отдельным полем со своим интерпретатором: урон
 * каждый ход, повторный спасбросок, снятие после атаки. Срабатывание описывает их
 * одной формой, а новые правила («Зловоние» в начале хода, «раз в ход»)
 * собираются из тех же частей, без новой галочки на каждое.
 *
 * Старые поля эффекта остаются в данных: их читает `collectEffectTriggers`
 * (`triggers.ts`) как срабатывания с зарезервированными id `legacy.*`, а новое,
 * чего старые поля не выражают, лежит в `ActiveEffect.triggers`.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectTriggerTypes.ts
 */

import type {
  EffectAbility,
  EffectDamagePart,
  EffectDuration,
  EffectRecurringSave,
} from './types';

/** События, на которые срабатывание реагирует. */
export const EFFECT_TRIGGER_EVENTS = [
  'turnStart',
  'turnEnd',
  'enter',
  'exit',
  'applied',
  'attackRoll',
  'damageTaken',
  'healed',
  'hpZero',
  'downedOther',
  'conditionLost',
  'castEnd',
  'moved',
  'rest',
  'activate',
] as const;

/**
 * События следующих фаз: разбираются и сохраняются, чтобы версия без их
 * поддержки не стирала их у записи, но пока ничего не запускают. Сейчас таких
 * нет.
 */
export const EFFECT_TRIGGER_RESERVED_EVENTS = [] as const;

/** Событие, на которое реагирует срабатывание. */
export type EffectTriggerEvent =
  | (typeof EFFECT_TRIGGER_EVENTS)[number]
  | (typeof EFFECT_TRIGGER_RESERVED_EVENTS)[number];

/** Начало и конец хода: у них выбирается, чей это ход. */
export const TURN_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'turnStart',
  'turnEnd',
];

/** Вход в зону или ауру и выход из неё. */
export const PRESENCE_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'enter',
  'exit',
];

/**
 * Перемещение носителя: «за каждые N футов пути». Длину пути меряет ядро VTTG
 * (0.9.533+) — без него событие не приходит.
 */
export const MOVEMENT_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = ['moved'];

/** События урона: несут урон (`@damage`, типы, критический удар). */
export const DAMAGE_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
];

/**
 * События, где носитель — действующая сторона, а другая сторона события —
 * тот, кого он задел. Сюда же смотрят условия о другой стороне.
 */
export const OWN_DEED_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'downedOther',
];

/**
 * Событие «носителя вылечили»: несёт число восстановленных хитов в `@damage` —
 * той же переменной, что и урон.
 */
export const HEALING_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = ['healed'];

/** Событие «состояние снялось»: несёт ключ снятого состояния. */
export const CONDITION_LOST_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'conditionLost',
];

/**
 * События с уроном в данных: урон события, его типы и крит. «При наложении» —
 * урон удара, которым эффект наложен («максимум хитов уменьшается на
 * полученный некротический урон»).
 */
export const DAMAGE_DATA_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  ...DAMAGE_TRIGGER_EVENTS,
  'applied',
];

/**
 * События с атакой в данных: бросок атаки и наложение ударом. По ним работают
 * части условия о виде атаки и её характеристике.
 */
export const ATTACK_DATA_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'attackRoll',
  'applied',
];

/**
 * События с другой стороной: противник на броске атаки, тот, кто нанёс урон,
 * тот, кто наложил эффект. Ей можно отдать действия срабатывания.
 */
export const OTHER_PARTY_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'attackRoll',
  'damageTaken',
  'applied',
];

/**
 * События, у которых бывает номер раунда боя: все, кроме отдыха — отдых идёт
 * вне боя.
 */
export const COMBAT_ROUND_TRIGGER_EVENTS: readonly EffectTriggerEvent[] =
  EFFECT_TRIGGER_EVENTS.filter((event) => event !== 'rest');

/** Чей ход считает событие начала или конца хода. */
export const EFFECT_TRIGGER_TURN_OWNERS = ['subject', 'source'] as const;

/**
 * Чей ход: субъекта — того, на ком эффект действует, — или источника,
 * наложившего эффект.
 */
export type EffectTriggerTurnOwner =
  (typeof EFFECT_TRIGGER_TURN_OWNERS)[number];

/** Чей ход без поля `turnOf`: ход субъекта — в данных он не пишется. */
export const DEFAULT_TRIGGER_TURN_OWNER: EffectTriggerTurnOwner = 'subject';

/** Кому достаются действия срабатывания. */
export const EFFECT_TRIGGER_RECIPIENTS = [
  'subject',
  'other',
  'source',
  'area',
  'choice',
] as const;

/** Получатель «тот, кто наложил эффект». */
export const APPLIER_TRIGGER_RECIPIENT = 'source';

/** Получатель «всем в радиусе». */
export const AREA_TRIGGER_RECIPIENT = 'area';

/** Получатель «по выбору»: кого задеть, решает человек. */
export const CHOICE_TRIGGER_RECIPIENT = 'choice';

/**
 * Получатель действий: субъект — тот, на ком эффект, — другая сторона
 * события (кто нанёс урон), наложивший эффект (`source`: «Прикосновение
 * вампира» лечит заклинателя), все в радиусе от субъекта (`area`: взрыв при
 * смерти) или выбранные человеком (`choice`: «лечит одно существо на выбор»).
 * Снятие эффекта всегда про эффект субъекта.
 */
export type EffectTriggerRecipient = (typeof EFFECT_TRIGGER_RECIPIENTS)[number];

/** Получатель без поля `recipient`: субъект — в данных он не пишется. */
export const DEFAULT_TRIGGER_RECIPIENT: EffectTriggerRecipient = 'subject';

/**
 * Кого задевает «всем в радиусе».
 *
 * Виды `…WithSelf` добавляют в список самого субъекта: «Духовные стражи» бьют
 * врагов вокруг, «Маяк надежды» лечит союзников И носителя. Без них носитель в
 * список не попадает — соседей по сцене ядро VTTG отдаёт без него.
 */
export const EFFECT_TRIGGER_AREA_TARGETS = [
  'all',
  'allies',
  'enemies',
  'allWithSelf',
  'alliesWithSelf',
] as const;

/** Кого задевает «всем в радиусе»: отношение к субъекту по фишкам. */
export type EffectTriggerAreaTarget =
  (typeof EFFECT_TRIGGER_AREA_TARGETS)[number];

/** Кого задевает «всем в радиусе» без поля `target`. */
export const DEFAULT_TRIGGER_AREA_TARGET: EffectTriggerAreaTarget = 'all';

/** Виды отбора, в которые входит сам субъект. */
const SELF_INCLUDING_AREA_TARGETS: ReadonlySet<EffectTriggerAreaTarget> =
  new Set(['allWithSelf', 'alliesWithSelf']);

/** Отношение к субъекту, которое проверяет «всем в радиусе». */
export type EffectTriggerAreaRelation = 'all' | 'allies' | 'enemies';

/** Отношение, которое проверяет вид отбора: «с носителем» его не меняет. */
const AREA_TARGET_RELATIONS: Record<
  EffectTriggerAreaTarget,
  EffectTriggerAreaRelation
> = {
  all: 'all',
  allies: 'allies',
  enemies: 'enemies',
  allWithSelf: 'all',
  alliesWithSelf: 'allies',
};

/**
 * Входит ли сам субъект в «всем в радиусе».
 *
 * @param target вид отбора; нет — умолчание.
 * @returns `true`, если носителя тоже задевает.
 */
export function areaTargetIncludesSelf(
  target: EffectTriggerAreaTarget | undefined,
): boolean {
  return SELF_INCLUDING_AREA_TARGETS.has(target ?? DEFAULT_TRIGGER_AREA_TARGET);
}

/**
 * Какое отношение к субъекту проверяет вид отбора.
 *
 * @param target вид отбора; нет — умолчание.
 * @returns `all`, `allies` либо `enemies`.
 */
export function areaTargetRelation(
  target: EffectTriggerAreaTarget | undefined,
): EffectTriggerAreaRelation {
  return AREA_TARGET_RELATIONS[target ?? DEFAULT_TRIGGER_AREA_TARGET];
}

/** Радиус новой строки «всем в радиусе», фт. */
export const DEFAULT_TRIGGER_AREA_RADIUS = 10;

/** Наименьший радиус «всем в радиусе»: нулевой задевает только свою клетку. */
export const MIN_TRIGGER_AREA_RADIUS = 0;

/** «Всем в радиусе»: кому достаются действия. */
export interface EffectTriggerArea {
  /** Радиус от фишки субъекта, фт. */
  radius: number;
  /** Кого задевает; нет — всех, кроме субъекта. */
  target?: EffectTriggerAreaTarget;
}

/**
 * События с получателем «всем в радиусе»: их выполняет сервер VTTG со сценой
 * в контексте — урон, «0 хитов», наложение, бросок атаки.
 */
export const AREA_RECIPIENT_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
  'applied',
  'attackRoll',
];

/**
 * События с получателем «по выбору». Спрашивают и на границе хода: «аура лечит
 * одно существо на выбор в начале своего хода» — самый частый рецепт.
 */
export const CHOICE_RECIPIENT_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'turnStart',
  'turnEnd',
  'damageTaken',
  'hpZero',
  'applied',
  'attackRoll',
  'enter',
  'exit',
];

/** Кто выбирает получателей: носитель эффекта или тот, кто его наложил. */
export const EFFECT_TRIGGER_CHOOSERS = ['subject', 'source'] as const;

/** Выбирающий. */
export type EffectTriggerChooser = (typeof EFFECT_TRIGGER_CHOOSERS)[number];

/** Кто выбирает без поля `chooser`: носитель эффекта. */
export const DEFAULT_TRIGGER_CHOOSER: EffectTriggerChooser = 'subject';

/** Сколько целей выбирают без поля `count`. */
export const DEFAULT_TRIGGER_CHOICE_COUNT = 1;

/** Радиус новой строки «по выбору», фт. */
export const DEFAULT_TRIGGER_CHOICE_RADIUS = 30;

/**
 * Больше целей одним выбором не просят. Потолок высокий: «все существа по
 * твоему выбору в пределах 30 футов» на большой сцене задевает не два десятка,
 * а сколько там стоит.
 */
export const MAX_TRIGGER_CHOICE_COUNT = 99;

/** Наименьшее число целей «по выбору». */
export const MIN_TRIGGER_CHOICE_COUNT = 1;

/**
 * «По выбору»: кандидаты и сколько из них задеть.
 *
 * Кандидаты отбираются так же, как «всем в радиусе» (радиус от фишки субъекта и
 * отношение фишек), и дополнительно просеиваются условием из общего словаря
 * условий — «только нежить», «только раненые». Что достанется выбранным, решают
 * действия срабатывания: урон, лечение, временные хиты, состояние, отметка.
 */
export interface EffectTriggerChoice {
  /** Радиус от фишки субъекта, фт. */
  radius: number;
  /** Кого можно выбрать; нет — всех, кроме субъекта. */
  target?: EffectTriggerAreaTarget;
  /** Сколько целей просят выбрать; нет — одну. */
  count?: number;
  /** Условие кандидата строкой словаря условий; нет — любой. */
  condition?: string;
  /** Выбор добровольный: отказ законен и не считается сбоем. */
  optional?: true;
  /** Кто выбирает; нет — носитель эффекта. */
  chooser?: EffectTriggerChooser;
}

/**
 * События, на которые реагирует наложенное состояние. Оно живёт своей жизнью на
 * цели: каст, применение и наложение — про эффект-источник, у состояния их не
 * бывает.
 */
export const NESTED_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
  'turnStart',
  'turnEnd',
  'attackRoll',
  'rest',
];

/** Событие нового вложенного срабатывания: «Сон» просыпается от урона. */
export const DEFAULT_NESTED_TRIGGER_EVENT: EffectTriggerEvent = 'damageTaken';

/** Роль субъекта в броске атаки. */
export const EFFECT_TRIGGER_ATTACK_ROLES = ['attacker', 'target'] as const;

/** Субъект атакует или атакуют его. */
export type EffectTriggerAttackRole =
  (typeof EFFECT_TRIGGER_ATTACK_ROLES)[number];

/** Роль без поля `role`: срабатывание на своей атаке. */
export const DEFAULT_TRIGGER_ATTACK_ROLE: EffectTriggerAttackRole = 'attacker';

/** Чем платят за действие эффекта: ход, часть хода или ничего. */
export const EFFECT_ACTION_COSTS = [
  'action',
  'bonus',
  'reaction',
  'move',
  'free',
] as const;

/**
 * Цена действия: действие, бонусное действие, реакция, часть перемещения или
 * бесплатно. Движок VTTG ходом не распоряжается — цена это пометка для
 * человека и (у реакции) расход счётчика реакции.
 */
export type EffectActionCost = (typeof EFFECT_ACTION_COSTS)[number];

/** Цена без поля `cost`: бесплатно — в данных она не пишется. */
export const DEFAULT_EFFECT_ACTION_COST: EffectActionCost = 'free';

/**
 * Платят ли за цену футами: у «Перемещения» есть число, у остальных цен нет.
 *
 * @param cost цена; нет — бесплатно.
 * @returns `true`, если к цене нужны футы.
 */
export function actionCostTakesFeet(
  cost: EffectActionCost | undefined,
): boolean {
  return cost === 'move';
}

/**
 * Цена действия и футы перемещения к ней: одни и те же поля у срабатывания и у
 * «вырваться» (`EffectEscape`).
 */
export interface EffectActionCostSettings {
  /** Чем платят; нет — бесплатно. */
  cost?: EffectActionCost;
  /** Сколько футов перемещения стоит цена `move`. */
  moveCostFeet?: number;
}

/** Сколько футов перемещения стоит действие с ценой `move` без своего числа. */
export const DEFAULT_EFFECT_MOVE_COST_FEET = 5;

/** Наименьшая цена перемещения, фт. */
export const MIN_EFFECT_MOVE_COST_FEET = 0;

/** Дальше этого предела цена перемещения не считается, фт. */
export const MAX_EFFECT_MOVE_COST_FEET = 200;

/** Когда выполняется действие относительно спасброска срабатывания. */
export const EFFECT_TRIGGER_ACTION_GATES = [
  'always',
  'failed',
  'saved',
] as const;

/**
 * Гейт действия: всегда, при провале или при успехе спасброска. Без своего
 * спасброска гейт сверяется со спасброском действия или заклинания, которое
 * эффект наложило. Не задан — `failed`, если спасбросок есть, иначе `always`.
 */
export type EffectTriggerActionGate =
  (typeof EFFECT_TRIGGER_ACTION_GATES)[number];

/** Периоды лимита «не чаще N раз». */
export const EFFECT_TRIGGER_LIMIT_PERIODS = [
  'turn',
  'round',
  'shortRest',
  'longRest',
] as const;

/** За какой период считается лимит. */
export type EffectTriggerLimitPeriod =
  (typeof EFFECT_TRIGGER_LIMIT_PERIODS)[number];

/** Лимит «не чаще N раз» — от одного раза. */
export const MIN_TRIGGER_LIMIT_MAX = 1;

/** Шанс нового срабатывания с броском, %. */
export const DEFAULT_TRIGGER_CHANCE_PERCENT = 50;

/** Наименьший шанс срабатывания, %. */
export const MIN_TRIGGER_CHANCE_PERCENT = 1;

/** Наибольший шанс: сто процентов — это «всегда», поле тогда не нужно. */
export const MAX_TRIGGER_CHANCE_PERCENT = 99;

/** Режимы спасброска срабатывания сверх флагов бросающего. */
export const EFFECT_TRIGGER_SAVE_MODES = ['advantage', 'disadvantage'] as const;

/**
 * Режим спасброска срабатывания: «повторяет спасбросок с преимуществом, если
 * урон нанёс заклинатель» («Жуткий смех Таши»). Складывается с флагами
 * бросающего по обычному правилу: преимущество и помеха гасятся.
 */
export type EffectTriggerSaveMode = (typeof EFFECT_TRIGGER_SAVE_MODES)[number];

/** Больше правил режима у одного спасброска не бывает. */
export const MAX_SAVE_MODE_RULES = 8;

/** Какой отдых запускает срабатывание «после отдыха». */
export const EFFECT_TRIGGER_REST_TYPES = ['long', 'short', 'any'] as const;

/** Отдых срабатывания: долгий, короткий или любой. */
export type EffectTriggerRestType = (typeof EFFECT_TRIGGER_REST_TYPES)[number];

/** Отдых без поля `restType`: долгий — в данных он не пишется. */
export const DEFAULT_TRIGGER_REST_TYPE: EffectTriggerRestType = 'long';

/** Уменьшение максимума хитов, которое снимают только руками. */
export const MAX_HP_REDUCTION_NEVER_ENDS = 'never';

/** Когда проходит уменьшение максимума хитов: отдых или никогда. */
export const EFFECT_TRIGGER_MAX_HP_REST_ENDS = [
  ...EFFECT_TRIGGER_REST_TYPES,
  MAX_HP_REDUCTION_NEVER_ENDS,
] as const;

/** Конец уменьшения максимума хитов. */
export type EffectTriggerMaxHpRestEnd =
  (typeof EFFECT_TRIGGER_MAX_HP_REST_ENDS)[number];

/** Режим спасброска при выполненном условии. */
export interface EffectTriggerSaveModeRule {
  /** Условие строкой словаря срабатываний. */
  condition: string;
  /** Что оно даёт: преимущество или помеху. */
  mode: EffectTriggerSaveMode;
}

/** Спасбросок срабатывания; Сл 0 — Сл источника, как у остальных полей. */
export interface EffectTriggerSave {
  ability: EffectAbility;
  dc: number;
  /** Преимущество или помеха самого спасброска. */
  mode?: EffectTriggerSaveMode;
  /**
   * Сл формулой от данных события: `@damage` — урон события
   * («max(10, floor(@damage / 2))»). Нет данных или формула с ошибкой — `dc`.
   */
  dcFormula?: string;
  /**
   * Режим спасброска по условию: «повторяет спасбросок с преимуществом, если
   * урон нанёс заклинатель». Правила складываются с постоянным `mode` по
   * обычному правилу — преимущество и помеха гасятся.
   */
  modeIf?: EffectTriggerSaveModeRule[];
  /** Условие автоматического успеха строкой словаря срабатываний. */
  autoSuccessIf?: string;
  /** Условие автоматического провала строкой словаря срабатываний. */
  autoFailIf?: string;
}

/** Лимит «не чаще N раз за период». */
export interface EffectTriggerLimit {
  max: number;
  per: EffectTriggerLimitPeriod;
  /**
   * Общий счётчик нескольких срабатываний: «урон зоны раз в ход» считает и вход,
   * и начало хода одним лимитом.
   */
  key?: string;
}

/** Урон или лечение (`@heal`, `@heal.temp` — лечение не гейтится спасброском). */
export interface EffectTriggerDamageAction {
  type: 'damage';
  parts: EffectDamagePart[];
  on?: EffectTriggerActionGate;
  /** Успешный спасбросок — половина урона (при гейте `always`). */
  halfOnSave?: true;
}

/** Длящаяся копия самого эффекта на субъекте. */
export interface EffectTriggerApplySelfAction {
  type: 'applySelf';
  on?: EffectTriggerActionGate;
}

/** Состояние на субъекте. */
export interface EffectTriggerApplyConditionAction {
  type: 'applyCondition';
  /** Ключ состояния — канонного либо заведённого в мире VTTG. */
  conditionKey: string;
  duration?: EffectDuration;
  /**
   * Состояние спадает, когда существо выходит из зоны, которая его наложила
   * («Опутанность спадает, как только выйдешь из Паутины»). Работает только у
   * зоны: у срабатывания вне зоны выходить не из чего.
   */
  endsOnExit?: true;
  /**
   * Повторный спасбросок наложенного состояния: «провал — парализован,
   * повторяет спасбросок в конце каждого своего хода». Сл 0 — Сл источника.
   */
  recurringSave?: EffectRecurringSave;
  /**
   * Собственные срабатывания наложенного состояния: «Сон» кладёт
   * «Бессознательного», который снимается, когда цель получает урон. Без них
   * пришлось бы заканчивать каст — а он снял бы сон со ВСЕХ целей.
   *
   * Одна ступень вложенности: у вложенного срабатывания своё `applyCondition`
   * вложенных уже не несёт.
   */
  triggers?: NestedEffectTrigger[];
  /**
   * Состояние снимается только тем, что его наложило: плитка состояния на
   * листе и действие «снять состояние» его не трогают («Заражение» держится до
   * снятия заклинанием).
   */
  locked?: true;
  on?: EffectTriggerActionGate;
}

/**
 * Ключ отметки: буквы, цифры, `_`, `.` и `-`. Отметка попадает в строку
 * условия (`self.tag === "…"`), и кавычки или `&&` в ключе её бы сломали.
 */
export const EFFECT_TAG_PATTERN = /^[\p{L}\p{N}_.-]{1,64}$/u;

/** Ключ новой отметки, пока автор не назвал свою. */
export const DEFAULT_EFFECT_TAG = 'отметка';

/**
 * Годится ли строка ключом отметки.
 *
 * @param tag строка.
 * @returns `true`, если это ключ отметки.
 */
export function isEffectTag(tag: string): boolean {
  return EFFECT_TAG_PATTERN.test(tag);
}

/**
 * Отметка на субъекте: лёгкий эффект без нагрузки, который читают условия
 * других срабатываний — «Регенерация не работает до начала следующего хода»
 * после урона огнём. Повторная отметка тем же ключом обновляет прежнюю.
 */
export interface EffectTriggerApplyTagAction {
  type: 'applyTag';
  /** Ключ: по нему условие `self.tag === "…"` узнаёт отметку. */
  tag: string;
  /** Имя отметки в списке эффектов; нет — ключ. */
  label?: string;
  /** Срок; нет — до начала следующего хода носителя. */
  duration?: EffectDuration;
  /**
   * Счётчик: повторная отметка тем же ключом прибавляет ступень, а не
   * заменяет прежнюю («три провала — окаменение»). Условие
   * `self.tagCount["ключ"] >= N` читает число ступеней.
   */
  stack?: true;
  on?: EffectTriggerActionGate;
}

/**
 * Максимум хитов получателя уменьшается: «максимум хитов уменьшается на
 * полученный урон, пока цель не закончит долгий отдых». Уменьшения
 * складываются в одну метку.
 */
export interface EffectTriggerReduceMaxHpAction {
  type: 'reduceMaxHp';
  /** На сколько: число, кости или `@damage` — урон события. */
  amount: string;
  /** Какой отдых возвращает максимум; `never` — только снятие руками. */
  endsOnRest?: EffectTriggerMaxHpRestEnd;
  on?: EffectTriggerActionGate;
}

/** Хиты получателя становятся числом: «вместо 0 хитов — 1 хит». */
export interface EffectTriggerSetHpAction {
  type: 'setHp';
  value: number;
  /** Полный запас хитов вместо числа: «восстанавливает все хиты». */
  toMax?: true;
  on?: EffectTriggerActionGate;
}

/** Чей каст заканчивает действие. */
export const EFFECT_CAST_OWNERS = ['self', 'recipient'] as const;

/** Свой каст или каст получателя. */
export type EffectCastOwner = (typeof EFFECT_CAST_OWNERS)[number];

/** Чей каст без поля `whose`: свой. */
export const DEFAULT_CAST_OWNER: EffectCastOwner = 'self';

/**
 * Закончить каст, который держит эффект: снимаются сам эффект и все эффекты
 * этого каста у всех существ, и его зона («провал спасброска концентрации»).
 */
export interface EffectTriggerEndCastAction {
  type: 'endCast';
  /**
   * Чей каст заканчивается: свой — эффекта, чьё срабатывание идёт, или
   * получателя («прерывает концентрацию цели»). Нет поля — свой.
   */
  whose?: EffectCastOwner;
  on?: EffectTriggerActionGate;
}

/** Снять сам эффект. */
export interface EffectTriggerRemoveSelfAction {
  type: 'removeSelf';
  on?: EffectTriggerActionGate;
}

/** Кому адресовано сообщение срабатывания. */
export const EFFECT_NOTIFY_TARGETS = ['subject', 'source'] as const;

/** Кому адресовано сообщение: носителю эффекта или тому, кто его наложил. */
export type EffectNotifyTarget = (typeof EFFECT_NOTIFY_TARGETS)[number];

/** Кому адресовано сообщение без поля `to`: носителю. */
export const DEFAULT_NOTIFY_TARGET: EffectNotifyTarget = 'subject';

/** Самый длинный текст сообщения срабатывания. */
export const MAX_NOTIFY_TEXT_LENGTH = 300;

/**
 * Сообщить человеку: строка в сводке чата VTTG, адресованная по имени.
 *
 * Тем же действием пишется напоминание о поведении — «пока действует
 * Принуждение, выполняй приказ». Ходом существа движок не распоряжается —
 * решает человек, поэтому предел пользы — напоминание вовремя.
 */
export interface EffectTriggerNotifyAction {
  type: 'notify';
  /** Что сказать. */
  text: string;
  /** Кому; нет — носителю эффекта. */
  to?: EffectNotifyTarget;
  /** Бросок к сообщению: «1к8» — номер строки таблицы поведения. */
  roll?: string;
  on?: EffectTriggerActionGate;
}

/**
 * Перевести эффект на следующую ступень: `changes` и `flags` носителя
 * заменяются на записанные у ступени («Проклятие гибельного старения»).
 */
export interface EffectTriggerNextStageAction {
  type: 'nextStage';
  on?: EffectTriggerActionGate;
}

/**
 * Снять состояние с получателя: «Защита от яда снимает Отравление». Запертое
 * состояние (`applyCondition.locked`) так не снимается.
 */
export interface EffectTriggerRemoveConditionAction {
  type: 'removeCondition';
  /** Какое состояние; нет — все состояния получателя. */
  conditionKey?: string;
  on?: EffectTriggerActionGate;
}

/**
 * Убить получателя: метка «Мёртв», хиты в ноль, спасброски от смерти больше
 * не бросаются («Слово силы: Смерть»).
 */
export interface EffectTriggerKillAction {
  type: 'kill';
  on?: EffectTriggerActionGate;
}

/**
 * С каким числом хитов возвращают к жизни: без поля — с одним, меньше одного
 * не бывает — иначе получатель остался бы на нуле.
 */
export const MIN_REVIVE_HP = 1;

/** Вернуть получателя к жизни: метка «Мёртв» снимается, хиты — по полю. */
export interface EffectTriggerReviveAction {
  type: 'revive';
  /** Сколько хитов; нет — один. */
  hp?: number;
  /** Полный запас хитов вместо числа. */
  full?: true;
  on?: EffectTriggerActionGate;
}

/** Получатель роняет то, что держит в руках. */
export interface EffectTriggerDropHeldAction {
  type: 'dropHeld';
  on?: EffectTriggerActionGate;
}

/** Как действие меняет временные хиты. */
export const EFFECT_TEMP_HP_MODES = ['set', 'add', 'spend'] as const;

/**
 * Что делает действие с временными хитами: поставить (по правилам они не
 * складываются — берётся большее), прибавить или потратить.
 */
export type EffectTempHpMode = (typeof EFFECT_TEMP_HP_MODES)[number];

/** Режим без поля `mode`: поставить. */
export const DEFAULT_TEMP_HP_MODE: EffectTempHpMode = 'set';

/** Временные хиты получателя: число, кости или `@damage`. */
export interface EffectTriggerTempHpAction {
  type: 'tempHp';
  amount: string;
  mode?: EffectTempHpMode;
  on?: EffectTriggerActionGate;
}

/** Что возвращает действие «вернуть ресурс». */
export const EFFECT_RESTORE_KINDS = ['spellSlot', 'counter'] as const;

/** Ячейка заклинания или счётчик листа. */
export type EffectRestoreKind = (typeof EFFECT_RESTORE_KINDS)[number];

/** Что возвращает новое действие «Вернуть ресурс»: ячейку заклинания. */
export const DEFAULT_RESTORE_KIND: EffectRestoreKind = 'spellSlot';

/** Наименьший круг ячейки заклинания. */
export const MIN_SPELL_SLOT_LEVEL = 1;

/** Наибольший круг ячейки заклинания. */
export const MAX_SPELL_SLOT_LEVEL = 9;

/** Наименьший круг, до которого рассеивают: заговоры. */
export const MIN_DISPEL_LEVEL = 0;

/** Вернуть получателю потраченный ресурс. */
export interface EffectTriggerRestoreAction {
  type: 'restore';
  what: EffectRestoreKind;
  /** Круг ячейки (1–9) — у `spellSlot`. */
  level?: number;
  /** Ключ счётчика листа — у `counter`. */
  counter?: string;
  /** Сколько вернуть; нет — одну единицу. */
  amount?: number;
  on?: EffectTriggerActionGate;
}

/**
 * Рассеять чужие заклинания на получателе: снимаются эффекты кастов не выше
 * круга `maxLevel`, а сами касты заканчиваются.
 *
 * Круг берётся с эффекта (VTTG проставляет его при касте). У эффекта без
 * круга — из компендиума, от зоны мастера — круг неизвестен, и он снимается
 * только при `withoutLevel`.
 */
export interface EffectTriggerDispelAction {
  type: 'dispel';
  /** До какого круга снимать. */
  maxLevel: number;
  /** Снимать и то, у чего круг неизвестен. */
  withoutLevel?: true;
  on?: EffectTriggerActionGate;
}

/** Дать получателю вдохновение. */
export interface EffectTriggerGrantInspirationAction {
  type: 'grantInspiration';
  on?: EffectTriggerActionGate;
}

/** Шаг пути, который форма предлагает первым, когда автор включает повтор: клетка. */
export const DEFAULT_TRIGGER_PATH_FEET = 5;

/** Наименьший шаг пути события перемещения. */
export const MIN_TRIGGER_PATH_FEET = 1;

/**
 * Шаг пути в поле формы, который значит «раз за путь»: в данных тогда поля
 * нет. Минимум поля — он, а не 1: поле защёлкивает число к шагу от минимума, и
 * с единицей 10 футов не ввести (1, 6, 11…).
 */
export const TRIGGER_PATH_FEET_ONCE = 0;

/** Наибольший шаг пути события перемещения. */
export const MAX_TRIGGER_PATH_FEET = 500;

/** Как двигает действие «Переместить». */
export const EFFECT_TRIGGER_MOVE_KINDS = ['push', 'pull', 'teleport'] as const;

/** Толчок от опоры, притягивание к ней или перенос по тому же направлению. */
export type EffectTriggerMoveKind = (typeof EFFECT_TRIGGER_MOVE_KINDS)[number];

/** Как двигает новое действие «Переместить»: толчком. */
export const DEFAULT_TRIGGER_MOVE_KIND: EffectTriggerMoveKind = 'push';

/** От чего считают направление перемещения. */
export const EFFECT_TRIGGER_MOVE_ORIGINS = ['source', 'subject'] as const;

/** Опора направления: наложивший эффект или сам носитель. */
export type EffectTriggerMoveOrigin =
  (typeof EFFECT_TRIGGER_MOVE_ORIGINS)[number];

/** Опора без поля `from`: наложивший эффект. */
export const DEFAULT_TRIGGER_MOVE_ORIGIN: EffectTriggerMoveOrigin = 'source';

/** На сколько футов двигает новое действие «Переместить». */
export const DEFAULT_TRIGGER_MOVE_DISTANCE = 10;

/** Наименьшее расстояние перемещения и сдвига зоны, фт. */
export const MIN_TRIGGER_MOVE_DISTANCE = 0;

/** Дальше этого действие не двигает, фт. */
export const MAX_TRIGGER_MOVE_DISTANCE = 500;

/**
 * Перемещение получателя: толчок, притягивание, перенос.
 *
 * Направление считается по прямой между фишками получателя и опоры. Ставит
 * фишку ядро VTTG (0.9.532+); без этой возможности действие молчит.
 * Препятствия не учитываются — толчок пройдёт сквозь стену.
 */
export interface EffectTriggerMoveAction {
  type: 'move';
  kind: EffectTriggerMoveKind;
  /** На сколько футов. */
  distance: number;
  /** От кого считать направление; нет — от наложившего эффект. */
  from?: EffectTriggerMoveOrigin;
  on?: EffectTriggerActionGate;
}

/**
 * Как сдвигается зона действием «Сдвинуть зону»:
 * - `follow` — идёт за носителем на то же смещение, что прошла его фишка
 *   («Тьма» на предмете в руке); только на событии пути;
 * - `away` / `toward` — на N футов от получателя / к нему («Облако смерти»
 *   уходит от заклинателя в начале его хода).
 */
export const EFFECT_TRIGGER_AREA_SHIFT_KINDS = [
  'away',
  'toward',
  'follow',
] as const;

/** Вид сдвига зоны. */
export type EffectTriggerAreaShiftKind =
  (typeof EFFECT_TRIGGER_AREA_SHIFT_KINDS)[number];

/** Вид сдвига у нового действия: от получателя, как у «Облака смерти». */
export const DEFAULT_TRIGGER_AREA_SHIFT_KIND: EffectTriggerAreaShiftKind =
  'away';

/** Виды сдвига, которым нужно событие пути: смещение берут у фишки носителя. */
export const PATH_AREA_SHIFT_KINDS: readonly EffectTriggerAreaShiftKind[] = [
  'follow',
];

/**
 * Сдвинуть зону, которую оставил тот же каст, что и эффект. Сдвигает ядро
 * VTTG (0.9.533+), форма зоны не меняется; без этой возможности, без каста
 * или без зоны действие молчит.
 */
export interface EffectTriggerMoveAreaAction {
  type: 'moveArea';
  kind: EffectTriggerAreaShiftKind;
  /** На сколько футов для «от получателя» и «к получателю». */
  distance?: number;
  on?: EffectTriggerActionGate;
}

/** Что срабатывание делает. */
export type EffectTriggerAction =
  | EffectTriggerDamageAction
  | EffectTriggerApplySelfAction
  | EffectTriggerApplyConditionAction
  | EffectTriggerApplyTagAction
  | EffectTriggerReduceMaxHpAction
  | EffectTriggerSetHpAction
  | EffectTriggerEndCastAction
  | EffectTriggerNotifyAction
  | EffectTriggerNextStageAction
  | EffectTriggerRemoveConditionAction
  | EffectTriggerKillAction
  | EffectTriggerReviveAction
  | EffectTriggerDropHeldAction
  | EffectTriggerTempHpAction
  | EffectTriggerRestoreAction
  | EffectTriggerDispelAction
  | EffectTriggerGrantInspirationAction
  | EffectTriggerMoveAction
  | EffectTriggerMoveAreaAction
  | EffectTriggerRemoveSelfAction;

/**
 * Срабатывание эффекта. Цена (`cost`, `moveCostFeet`) — действие, бонусное
 * действие, реакция или часть перемещения; нет поля — бесплатно. Реакция
 * вдобавок тратит счётчик реакции носителя, остальные цены — пометка для
 * человека.
 */
export interface EffectTrigger extends EffectActionCostSettings {
  /** Стабильный id; `legacy.*` зарезервированы под выведенные из старых полей. */
  id: string;
  event: EffectTriggerEvent;
  /** Для начала и конца хода: чей ход; не задано — субъекта. */
  turnOf?: EffectTriggerTurnOwner;
  /** Для броска атаки: роль субъекта. */
  role?: EffectTriggerAttackRole;
  /** Для отдыха: какой отдых; не задано — долгий. */
  restType?: EffectTriggerRestType;
  /** Кому достаются урон, лечение и наложения; не задано — субъекту. */
  recipient?: EffectTriggerRecipient;
  /** Радиус и отбор для получателя «всем в радиусе». */
  area?: EffectTriggerArea;
  /** Кандидаты и число целей для получателя «по выбору». */
  choice?: EffectTriggerChoice;
  /** Условие в словаре условий срабатываний (`triggerConditions.ts`). */
  condition?: string;
  save?: EffectTriggerSave;
  actions: EffectTriggerAction[];
  limit?: EffectTriggerLimit;
  /**
   * Какое состояние слушает срабатывание «когда состояние снимается». Нет
   * поля — любое снятое.
   */
  conditionKey?: string;
  /**
   * Шанс срабатывания в процентах: «на 4 и выше по к6» — это 50. Бросок идёт
   * ПЕРЕД лимитом «не чаще N раз»: неудавшийся шанс — несостоявшееся
   * срабатывание, и тратить на него «раз в ход» нельзя. Нет поля —
   * срабатывает всегда.
   */
  chancePercent?: number;
  /**
   * Для перемещения: срабатывание повторяется за каждые столько футов пути
   * («Шипастая поросль» — за каждые 5 футов). Не задано — один раз за
   * перемещение («Громовой клинок», зона идёт за носителем).
   */
  everyFeet?: number;
  /**
   * Спрашивать разрешения: перед срабатыванием владельцу выбирающего уходит
   * вопрос «да / нет». Отказ и молчание отменяют срабатывание.
   */
  ask?: true;
  /** У кого спрашивать; нет — у носителя эффекта. */
  asker?: EffectTriggerChooser;
}

/**
 * Действие вложенного срабатывания. Наложение состояния в нём своих
 * срабатываний уже не несёт: вложенность — на одну ступень, иначе форма и схема
 * стали бы бесконечными.
 */
export type NestedEffectTriggerAction =
  | Exclude<EffectTriggerAction, EffectTriggerApplyConditionAction>
  | Omit<EffectTriggerApplyConditionAction, 'triggers'>;

/** Срабатывание, которое несёт на себе наложенное состояние. */
export interface NestedEffectTrigger extends Omit<EffectTrigger, 'actions'> {
  actions: NestedEffectTriggerAction[];
}

/** Приставка id срабатываний, выведенных из старых полей эффекта. */
export const LEGACY_TRIGGER_ID_PREFIX = 'legacy.';

/** Id срабатываний, выведенных из старых полей. */
export const LEGACY_TRIGGER_IDS = {
  landing: `${LEGACY_TRIGGER_ID_PREFIX}landing`,
  recurringDamage: `${LEGACY_TRIGGER_ID_PREFIX}recurringDamage`,
  recurringSave: `${LEGACY_TRIGGER_ID_PREFIX}recurringSave`,
  consumeOn: `${LEGACY_TRIGGER_ID_PREFIX}consumeOn`,
} as const;

/** Старое поле, которое выражает срабатывание. */
export type LegacyTriggerKind = Exclude<
  keyof typeof LEGACY_TRIGGER_IDS,
  'landing'
>;

/**
 * Спрашивают ли разрешения перед срабатыванием: явная галочка или цена
 * «Реакция». Реакция — ресурс человека: тратить её за него движок не вправе,
 * поэтому цена «Реакция» сама по себе делает срабатывание добровольным.
 *
 * @param trigger срабатывание.
 * @returns `true`, если перед срабатыванием спрашивают.
 */
export function triggerAsksPermission(
  trigger: Pick<EffectTrigger, 'ask' | 'cost'>,
): boolean {
  return trigger.ask === true || trigger.cost === 'reaction';
}
