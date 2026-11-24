import type {
  ActiveEffect,
  EffectActivationMode,
  EffectFormContext,
  ItemEffectContext,
} from '~active-effects/model';

import type { MechanicsBlock, MechanicsKind } from './constants';
import type {
  AbilityBonusForm,
  ChoiceForm,
  ClassSpellListForm,
  CounterForm,
  EntityRefForm,
  GrantedSpellForm,
  MagicItemMechanicsForm,
  MechanicsForm,
  ModifiersForm,
  ProficienciesForm,
  RestRuleForm,
  SpellGrantForm,
  SpellListForm,
  SpellListGroupForm,
} from './schemas';
import type { WorkshopMechanicsFields } from './types';

import {
  EFFECT_ACTIVATION_MODE,
  EFFECT_FORM_CONTEXT,
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';

import { toOptionalAmount, toOptionalText } from '../utils';
import {
  COUNTER_MIN_REST_AMOUNT,
  COUNTER_REST_MODE,
  MAGIC_ITEM_USED_ACTIVATIONS,
  MAGIC_ITEM_WEAPON_TYPES,
  MECHANICS_DEFAULT_COUNTER_MAX,
  MECHANICS_KEY_PREFIX,
  MECHANICS_KIND_BLOCKS,
  MECHANICS_SPELL_CHOICE_TYPES,
} from './constants';
import {
  abilityBonusLoadSchema,
  activeEffectsFormSchema,
  choiceLoadSchema,
  classSpellListLoadSchema,
  counterLoadSchema,
  mechanicsFormSchema,
  parseMagicItemMechanicsBase,
  parseMechanicsForm,
  spellListGroupLoadSchema,
} from './schemas';

/** Часть тела запроса механики: только заполненные поля. */
export type MechanicsPayload = Record<string, unknown>;

/* ---------- Новые элементы формы ---------- */

/** Пустая механика: запись на лист не влияет. */
export function createMechanicsForm(): MechanicsForm {
  return parseMechanicsForm({});
}

/**
 * Свободный ключ для нового выбора или ресурса: занятый склеил бы два
 * элемента в один на листе персонажа.
 * @param prefix - начало ключа
 * @param usedKeys - ключи, которые уже есть
 */
export function createMechanicsKey(
  prefix: string,
  usedKeys: ReadonlyArray<string>,
): string {
  const used = new Set(usedKeys);

  let index = 1;

  while (used.has(`${prefix}-${index}`)) {
    index++;
  }

  return `${prefix}-${index}`;
}

/**
 * Новый выбор со свободным ключом.
 * @param usedKeys - ключи выборов, которые уже есть
 */
export function createChoiceForm(usedKeys: ReadonlyArray<string>): ChoiceForm {
  return choiceLoadSchema.parse({
    key: createMechanicsKey(MECHANICS_KEY_PREFIX.choice, usedKeys),
  });
}

/**
 * Новый ресурс со свободным ключом: максимум — бонус мастерства, все заряды
 * возвращает продолжительный отдых.
 * @param usedKeys - ключи ресурсов, которые уже есть
 */
export function createCounterForm(
  usedKeys: ReadonlyArray<string>,
): CounterForm {
  return counterLoadSchema.parse({
    key: createMechanicsKey(MECHANICS_KEY_PREFIX.counter, usedKeys),
    max: MECHANICS_DEFAULT_COUNTER_MAX,
  });
}

/** Новое повышение характеристик. */
export function createAbilityBonusForm(): AbilityBonusForm {
  return abilityBonusLoadSchema.parse({});
}

/** Новая ссылка на запись справочника. */
export function createEntityRefForm(): EntityRefForm {
  return { url: '', name: '' };
}

/** Новое выдаваемое заклинание. */
export function createGrantedSpellForm(): GrantedSpellForm {
  return {
    ...createEntityRefForm(),
    requiredLevel: null,
    spellcastingAbility: undefined,
    alwaysPrepared: false,
    limitedBySlots: false,
  };
}

/** Новый список класса, выдаваемый целиком. */
export function createClassSpellListForm(): ClassSpellListForm {
  return classSpellListLoadSchema.parse({});
}

/** Новая группа расширения списка заклинаний. */
export function createSpellListGroupForm(): SpellListGroupForm {
  return spellListGroupLoadSchema.parse({});
}

/**
 * Есть ли у выбора фильтр заклинаний: только у заклинаний и заговоров.
 * @param choice - выбор
 */
export function hasSpellFilter(choice: ChoiceForm): boolean {
  return choice.types.some((type) => MECHANICS_SPELL_CHOICE_TYPES.has(type));
}

/**
 * Нужно ли правилу отдыха число зарядов.
 * @param rule - правило отдыха
 */
export function isAmountRestRule(rule: RestRuleForm): boolean {
  return rule.mode === COUNTER_REST_MODE.amount;
}

/* ---------- Тело запроса ---------- */

/**
 * Объект без незаполненных полей; пустой — отсутствие значения.
 * @param record - поля объекта
 */
function compact(record: MechanicsPayload): MechanicsPayload | undefined {
  const entries = Object.entries(record).filter(
    ([, value]) => value !== undefined,
  );

  return entries.length ? Object.fromEntries(entries) : undefined;
}

/**
 * Непустой список или отсутствие значения.
 * @param items - элементы
 */
function toOptionalList<Item>(
  items: ReadonlyArray<Item | undefined>,
): Array<Item> | undefined {
  const filled = items.flatMap((item) => (item === undefined ? [] : [item]));

  return filled.length ? filled : undefined;
}

/**
 * Флажок уходит только включённым: выключенный и отсутствующий бэкенд
 * понимает одинаково.
 * @param value - флажок формы
 */
function toOptionalFlag(value: boolean): true | undefined {
  return value || undefined;
}

/**
 * Код из списка; пустой выбор — отсутствие значения.
 * @param value - код из формы
 */
function toOptionalCode(value: string | null | undefined): string | undefined {
  return value || undefined;
}

/**
 * Ссылка на запись справочника: без url её нет.
 * @param reference - ссылка из формы
 */
function getEntityRefPayload(
  reference: EntityRefForm,
): MechanicsPayload | undefined {
  const url = toOptionalText(reference.url);

  return url ? { url, name: toOptionalText(reference.name) } : undefined;
}

/**
 * Список ссылок на записи справочника.
 * @param references - ссылки из формы
 */
function getEntityRefsPayload(
  references: ReadonlyArray<EntityRefForm>,
): Array<MechanicsPayload> | undefined {
  return toOptionalList(references.map(getEntityRefPayload));
}

/**
 * Повышение характеристик: пустая строка не отправляется.
 * @param bonus - повышение из формы
 */
function getAbilityBonusPayload(
  bonus: AbilityBonusForm,
): MechanicsPayload | undefined {
  return compact({
    abilities: toOptionalList(bonus.abilities),
    bonus: toOptionalAmount(bonus.bonus),
    upto: toOptionalAmount(bonus.upto),
    count: toOptionalAmount(bonus.count),
    fromChoiceKey: toOptionalText(bonus.fromChoiceKey),
  });
}

/**
 * Владения без выбора.
 * @param proficiencies - владения из формы
 */
function getProficienciesPayload(
  proficiencies: ProficienciesForm,
): MechanicsPayload | undefined {
  return compact({
    weaponCategories: toOptionalList(proficiencies.weaponCategories),
    weapons: getEntityRefsPayload(proficiencies.weapons),
    armorCategories: toOptionalList(proficiencies.armorCategories),
    savingThrows: toOptionalList(proficiencies.savingThrows),
    skills: toOptionalList(proficiencies.skills),
    tools: getEntityRefsPayload(proficiencies.tools),
    languages: toOptionalList(proficiencies.languages),
  });
}

/**
 * Выбор игрока. Без вида выбор ничего не значит и не отправляется; набор
 * видов уходит, только если видов больше одного.
 * @param choice - выбор из формы
 */
function getChoicePayload(choice: ChoiceForm): MechanicsPayload | undefined {
  const [type] = choice.types;

  if (!type) {
    return undefined;
  }

  const { spellFilter } = choice;

  return compact({
    key: toOptionalText(choice.key),
    type,
    types: choice.types.length > 1 ? [...choice.types] : undefined,
    label: toOptionalText(choice.label),
    count: toOptionalAmount(choice.count),
    requiredLevel: toOptionalAmount(choice.requiredLevel),
    countEqualsProficiencyBonus: toOptionalFlag(
      choice.countEqualsProficiencyBonus,
    ),
    options: toOptionalList(
      choice.options.map((option) => {
        const value = toOptionalText(option.value);

        return value ? { value, name: toOptionalText(option.name) } : undefined;
      }),
    ),
    spellFilter: hasSpellFilter(choice)
      ? compact({
          level: toOptionalAmount(spellFilter.level),
          maxLevel: toOptionalAmount(spellFilter.maxLevel),
          schools: toOptionalList(spellFilter.schools),
          classes: getEntityRefsPayload(spellFilter.classes),
          classesFromChoiceKey: toOptionalText(
            spellFilter.classesFromChoiceKey,
          ),
          castingTime: toOptionalCode(spellFilter.castingTime),
        })
      : undefined,
    onlyIfNotProficient: toOptionalFlag(choice.onlyIfNotProficient),
    onlyIfProficient: toOptionalFlag(choice.onlyIfProficient),
    grants: toOptionalCode(choice.grants),
    expertiseIfProficient: toOptionalFlag(choice.expertiseIfProficient),
    rechooseOnLongRest: toOptionalFlag(choice.rechooseOnLongRest),
    scaling: toOptionalList(
      choice.scaling.map(({ level, count }) =>
        level === null || count === null ? undefined : { level, count },
      ),
    ),
    showInTable: toOptionalFlag(choice.showInTable),
    shortName: toOptionalText(choice.shortName),
    alwaysPrepared: toOptionalFlag(choice.alwaysPrepared),
  });
}

/**
 * Правило отдыха: число зарядов только у режима `AMOUNT`.
 * @param rule - правило из формы
 */
function getRestRulePayload(rule: RestRuleForm): MechanicsPayload {
  if (!isAmountRestRule(rule)) {
    return { mode: rule.mode };
  }

  return {
    mode: rule.mode,
    amount: Math.max(
      rule.amount ?? COUNTER_MIN_REST_AMOUNT,
      COUNTER_MIN_REST_AMOUNT,
    ),
  };
}

/**
 * Ресурс со счётчиком: без названия, максимума и ступеней его нет. Правила
 * обоих отдыхов уходят всегда — легаси-откат форма не отправляет.
 * @param counter - ресурс из формы
 */
function getCounterPayload(counter: CounterForm): MechanicsPayload | undefined {
  const name = toOptionalText(counter.name);
  const max = toOptionalText(counter.max);

  const scaling = toOptionalList(
    counter.scaling.map((step) =>
      step.level === null || step.max === null
        ? undefined
        : { level: step.level, max: step.max },
    ),
  );

  if (!name && !max && !scaling) {
    return undefined;
  }

  return compact({
    key: toOptionalText(counter.key),
    name,
    shortName: toOptionalText(counter.shortName),
    max,
    scaling,
    min: toOptionalAmount(counter.min),
    showInTable: toOptionalFlag(counter.showInTable),
    shortRest: getRestRulePayload(counter.shortRest),
    longRest: getRestRulePayload(counter.longRest),
    startsEmpty: toOptionalFlag(counter.startsEmpty),
  });
}

/**
 * Постоянные модификаторы листа.
 * @param modifiers - модификаторы из формы
 */
function getModifiersPayload(
  modifiers: ModifiersForm,
): MechanicsPayload | undefined {
  const { hitPoints, speed, damage } = modifiers;

  return compact({
    hitPoints: compact({
      flat: toOptionalAmount(hitPoints.flat),
      perAcquisitionLevel: toOptionalAmount(hitPoints.perAcquisitionLevel),
      perLevelAfterAcquisition: toOptionalAmount(
        hitPoints.perLevelAfterAcquisition,
      ),
    }),
    speed: compact({
      walkBonus: toOptionalAmount(speed.walkBonus),
      fly: toOptionalAmount(speed.fly),
      climb: toOptionalAmount(speed.climb),
      swim: toOptionalAmount(speed.swim),
      flyEqualsWalk: toOptionalFlag(speed.flyEqualsWalk),
      climbEqualsWalk: toOptionalFlag(speed.climbEqualsWalk),
      swimEqualsWalk: toOptionalFlag(speed.swimEqualsWalk),
    }),
    armorClassBonus: toOptionalAmount(modifiers.armorClassBonus),
    senses: toOptionalList(
      modifiers.senses.map((sense) =>
        sense.type
          ? compact({ type: sense.type, range: toOptionalAmount(sense.range) })
          : undefined,
      ),
    ),
    telepathyRange: toOptionalAmount(modifiers.telepathyRange),
    damage: compact({
      resistances: toOptionalList(damage.resistances),
      immunities: toOptionalList(damage.immunities),
      vulnerabilities: toOptionalList(damage.vulnerabilities),
      defenseChoices: toOptionalList(
        damage.defenseChoices.map((defense) => {
          const choiceKey = toOptionalText(defense.choiceKey);

          return choiceKey && defense.kind
            ? { choiceKey, kind: defense.kind }
            : undefined;
        }),
      ),
    }),
    conditionImmunities: toOptionalList(modifiers.conditionImmunities),
    creatureType: toOptionalCode(modifiers.creatureType),
    initiativeProficiencyBonus: toOptionalFlag(
      modifiers.initiativeProficiencyBonus,
    ),
    initiativeBonus: toOptionalAmount(modifiers.initiativeBonus),
  });
}

/**
 * Сколько модификаторов заполнено: число на бейдже блока. Считает сборщик
 * тела запроса, чтобы бейдж совпадал с тем, что уйдёт на сервер.
 * @param modifiers - модификаторы из формы
 */
export function getModifiersFilledCount(modifiers: ModifiersForm): number {
  return Object.keys(getModifiersPayload(modifiers) ?? {}).length;
}

/**
 * Выдаваемое заклинание: без url его нет.
 * @param spell - заклинание из формы
 */
function getGrantedSpellPayload(
  spell: GrantedSpellForm,
): MechanicsPayload | undefined {
  const reference = getEntityRefPayload(spell);

  if (!reference) {
    return undefined;
  }

  return compact({
    ...reference,
    requiredLevel: toOptionalAmount(spell.requiredLevel),
    spellcastingAbility: toOptionalCode(spell.spellcastingAbility),
    alwaysPrepared: toOptionalFlag(spell.alwaysPrepared),
    limitedBySlots: toOptionalFlag(spell.limitedBySlots),
  });
}

/**
 * Список класса целиком: без классов его нет.
 * @param classList - список из формы
 */
function getClassSpellListPayload(
  classList: ClassSpellListForm,
): MechanicsPayload | undefined {
  const classes = getEntityRefsPayload(classList.classes);

  if (!classes) {
    return undefined;
  }

  return compact({
    requiredLevel: toOptionalAmount(classList.requiredLevel),
    classes,
    level: toOptionalAmount(classList.level),
    maxLevel: toOptionalAmount(classList.maxLevel),
    maxLevelFromSlots: toOptionalFlag(classList.maxLevelFromSlots),
    spellcastingAbility: toOptionalCode(classList.spellcastingAbility),
    alwaysPrepared: toOptionalFlag(classList.alwaysPrepared),
  });
}

/**
 * Заклинания без выбора.
 * @param spells - заклинания из формы
 */
function getSpellGrantPayload(
  spells: SpellGrantForm,
): MechanicsPayload | undefined {
  return compact({
    spells: toOptionalList(spells.spells.map(getGrantedSpellPayload)),
    classLists: toOptionalList(spells.classLists.map(getClassSpellListPayload)),
    spellcastingAbility: toOptionalCode(spells.spellcastingAbility),
    alwaysPrepared: toOptionalFlag(spells.alwaysPrepared),
  });
}

/**
 * Расширение списка заклинаний: группы без заклинаний не отправляются.
 * @param spellList - расширение из формы
 */
function getSpellListPayload(
  spellList: SpellListForm,
): MechanicsPayload | undefined {
  const groups = toOptionalList(
    spellList.groups.map((group) => {
      const spells = getEntityRefsPayload(group.spells);

      return spells
        ? compact({
            requiredLevel: toOptionalAmount(group.requiredLevel),
            count: toOptionalText(group.count),
            spells,
          })
        : undefined;
    }),
  );

  return compact({
    groups,
    requiresSpellcasting: toOptionalFlag(spellList.requiresSpellcasting),
  });
}

/** Сборщики блоков механики для тела запроса. */
const BLOCK_PAYLOADS: Readonly<
  Record<MechanicsBlock, (form: MechanicsForm) => unknown>
> = {
  abilityBonuses: (form) =>
    toOptionalList(form.abilityBonuses.map(getAbilityBonusPayload)),
  proficiencies: (form) => getProficienciesPayload(form.proficiencies),
  choices: (form) => toOptionalList(form.choices.map(getChoicePayload)),
  modifiers: (form) => getModifiersPayload(form.modifiers),
  counters: (form) => toOptionalList(form.counters.map(getCounterPayload)),
  spells: (form) => getSpellGrantPayload(form.spells),
  spellList: (form) => getSpellListPayload(form.spellList),
  feats: (form) => getEntityRefsPayload(form.feats),
};

/**
 * Механика для тела запроса: только блоки модели этого вида и только
 * заполненное. Пустая механика уходит пустым объектом, а не отсутствием:
 * отсутствующее поле бэкенд понимает как «оставить сохранённое», и снятую
 * модератором механику без `{}` было бы не стереть.
 * @param form - механика из формы
 * @param kind - вид механики записи
 */
export function getMechanicsPayload(
  form: MechanicsForm,
  kind: MechanicsKind,
): MechanicsPayload {
  const entries = MECHANICS_KIND_BLOCKS[kind].map(
    (block) => [block, BLOCK_PAYLOADS[block](form)] as const,
  );

  return compact(Object.fromEntries(entries)) ?? {};
}

/**
 * Сколько блоков механики заполнено: число на бейдже свёрнутого раздела.
 * @param form - механика из формы
 * @param kind - вид механики записи
 */
export function getMechanicsFilledCount(
  form: MechanicsForm,
  kind: MechanicsKind,
): number {
  return MECHANICS_KIND_BLOCKS[kind].filter(
    (block) => BLOCK_PAYLOADS[block](form) !== undefined,
  ).length;
}

/**
 * Активные эффекты для тела запроса: нормализованные моделью эффектов, без
 * безымянных. Пустой список уходит `[]` — по той же причине, что и `{}` у
 * механики: отсутствие бэкенд понимает как «оставить сохранённое».
 * @param effects - эффекты из формы
 * @param context - место эффектов; у черт, классов и рас — `feature`
 */
export function getActiveEffectsPayload(
  effects: ReadonlyArray<ActiveEffect>,
  context: EffectFormContext = EFFECT_FORM_CONTEXT.feature,
): Array<ActiveEffect> {
  return normalizeActiveEffects([...effects], context);
}

/**
 * Активные эффекты из ответа сервера для формы: битые выбрасываются, не
 * задевая соседей.
 * @param input - значение поля `activeEffects` из ответа
 */
export function parseActiveEffectsForm(input: unknown): Array<ActiveEffect> {
  return normalizeLoadedActiveEffects(input);
}

/**
 * Механика и эффекты из ответа сервера для формы.
 * @param input - запись из ответа
 * @param input.mechanics - поле `mechanics`
 * @param input.activeEffects - поле `activeEffects`
 */
export function parseMechanicsFields(input: {
  mechanics?: unknown;
  activeEffects?: unknown;
}): WorkshopMechanicsFields {
  return {
    mechanics: parseMechanicsForm(input.mechanics),
    activeEffects: parseActiveEffectsForm(input.activeEffects),
  };
}

/**
 * Копия механики и эффектов для формы: правка формы не должна менять запись,
 * из которой форма открыта. Без записи — пустые.
 * @param fields - механика и эффекты записи
 */
export function copyMechanicsFields(
  fields?: WorkshopMechanicsFields,
): WorkshopMechanicsFields {
  if (!fields) {
    return { mechanics: createMechanicsForm(), activeEffects: [] };
  }

  // Разбор схемой формы создаёт новые объекты и списки на каждом уровне
  return {
    mechanics: mechanicsFormSchema.parse(fields.mechanics),
    activeEffects: activeEffectsFormSchema.parse(fields.activeEffects),
  };
}

/**
 * Механика и эффекты для тела запроса: всегда текущие значения формы,
 * `{}` и `[]` — если модератор всё снял.
 * @param fields - механика и эффекты из формы
 * @param kind - вид механики записи
 */
export function getMechanicsFieldsPayload(
  fields: WorkshopMechanicsFields,
  kind: MechanicsKind,
): { mechanics: MechanicsPayload; activeEffects: Array<ActiveEffect> } {
  return {
    mechanics: getMechanicsPayload(fields.mechanics, kind),
    activeEffects: getActiveEffectsPayload(fields.activeEffects),
  };
}

/* ---------- Магический предмет ---------- */

/** Пустая механика магического предмета. */
export function createMagicItemMechanicsForm(): MagicItemMechanicsForm {
  return parseMagicItemMechanicsForm({});
}

/**
 * Механика магического предмета из ответа сервера для формы.
 * @param input - значение поля `mechanics` из ответа
 */
export function parseMagicItemMechanicsForm(
  input: unknown,
): MagicItemMechanicsForm {
  const { activeEffects, ...mechanics } = parseMagicItemMechanicsBase(input);

  return {
    ...mechanics,
    activeEffects: normalizeLoadedActiveEffects(activeEffects),
  };
}

/**
 * Место эффектов магического предмета: у оружия эффект может лечь и на цель
 * при попадании, у остальных предметов — на владельца.
 * @param itemType - код типа предмета
 */
export function getMagicItemEffectContext(itemType: string): ItemEffectContext {
  return MAGIC_ITEM_WEAPON_TYPES.has(itemType)
    ? EFFECT_FORM_CONTEXT.weapon
    : EFFECT_FORM_CONTEXT.item;
}

/**
 * Как действует новый эффект предмета: у применяемого («при использовании»,
 * «вручную») — применением, у остальных — постоянно.
 * @param activation - когда работает механика предмета
 */
export function getMagicItemEffectActivation(
  activation: string | null | undefined,
): EffectActivationMode | undefined {
  return activation && MAGIC_ITEM_USED_ACTIVATIONS.has(activation)
    ? EFFECT_ACTIVATION_MODE.use
    : undefined;
}

/**
 * Механика магического предмета для тела запроса. Заряды без максимума не
 * существуют и не отправляются. Пустая механика уходит `{}`: отсутствие
 * бэкенд понимает как «оставить сохранённое».
 * @param form - механика из формы
 * @param context - место эффектов предмета
 */
export function getMagicItemMechanicsPayload(
  form: MagicItemMechanicsForm,
  context: ItemEffectContext,
): MechanicsPayload {
  const activeEffects = getActiveEffectsPayload(form.activeEffects, context);
  const { resource } = form;

  const resourcePayload =
    resource.maxCharges && resource.maxCharges > 0
      ? compact({
          maxCharges: resource.maxCharges,
          recharge: toOptionalText(resource.recharge),
          rechargeEvent: toOptionalCode(resource.rechargeEvent),
          cost: resource.cost && resource.cost > 0 ? resource.cost : undefined,
        })
      : undefined;

  return (
    compact({
      activation: toOptionalCode(form.activation),
      activeEffects: toOptionalList(activeEffects),
      resource: resourcePayload,
      passive: toOptionalText(form.passive),
    }) ?? {}
  );
}
