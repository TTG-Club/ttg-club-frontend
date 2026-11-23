import type {
  EffectConditionTemplate,
  EffectFormContext,
  EffectFormLayout,
  EffectFormLayoutOptions,
  EffectTrigger,
  EffectTriggerAction,
  TriggerConditionPart,
} from '~active-effects/model';

import { describe, expect, it } from 'vitest';

import {
  ADJACENT_ALLY_CONDITION_OPTIONS,
  APPLIER_SAVE_DC,
  applyConditionPresetToEffect,
  buildConditionActiveEffect,
  buildTriggerRecipientOptions,
  clampExhaustionLevel,
  clearInertEffectFields,
  clearTriggerActionGate,
  collectEffectTriggers,
  createEffectForContext,
  createEffectTriggerAction,
  createEffectTriggerPreset,
  DEFAULT_ABILITY_THRESHOLD,
  DEFAULT_EFFECT_CHANGE_PRIORITY,
  DEFAULT_EFFECT_SAVE_DC,
  DEFAULT_EFFECT_TAG,
  DEFAULT_SET_HP_VALUE,
  DEFAULT_TAG_COUNT_THRESHOLD,
  DEFAULT_TRIGGER_ATTACK_ROLE,
  DEFAULT_TRIGGER_CONDITION,
  describeEffectFlag,
  describeEffectScenario,
  describeEffectTrigger,
  describeTriggerCondition,
  EFFECT_CONDITION_EXPR_SUGGESTIONS,
  EFFECT_CONDITION_TEMPLATES,
  EFFECT_EXHAUSTION_LEVELS,
  EFFECT_FLAG_LABELS,
  EFFECT_FORM_STEPS,
  EFFECT_SUCCESS_OUTCOMES,
  EFFECT_SYSTEM_VERSION,
  EFFECT_TARGET_KEY_SUGGESTIONS,
  EFFECT_TRIGGER_DAMAGE_HALF_GATE,
  EFFECT_VALUE_SUGGESTIONS,
  FIXED_MIN_SAVE_DC,
  isAdjacentAllyCondition,
  isLegacyTrigger,
  LEGACY_TRIGGER_IDS,
  listEffectFormSteps,
  listEffectListTriggers,
  listEffectTriggerPresets,
  listInertEffectFields,
  listTriggerActionTypes,
  listTriggerConditionKinds,
  listTriggerTags,
  MAX_EXHAUSTION_LEVEL,
  MIN_TAG_COUNT_THRESHOLD,
  MIN_TRIGGER_AREA_RADIUS,
  normalizeActiveEffects,
  normalizeEffectDraft,
  normalizeLoadedActiveEffects,
  normalizeTagCountThreshold,
  omitTriggerSaveDcFormula,
  parseTriggerConditionPart,
  readEffectAreaTrigger,
  readEffectDelivery,
  readEffectSuccessOutcome,
  readTriggerActionRounds,
  readTriggerConditionParts,
  resolveEffectFormLayout,
  resolveExhaustionEffects,
  resolveTriggerActionGate,
  triggerConditionHasAmount,
  triggerEventAcceptsArea,
  triggerEventAcceptsDcFormula,
  triggerEventHasOtherParty,
  writeEffectAreaTrigger,
  writeEffectDelivery,
  writeEffectSaveEnabled,
  writeEffectSuccessOutcome,
  writeEffectTriggerRow,
  writeEffectTriggers,
  writeTriggerActionGate,
  writeTriggerActionRounds,
  writeTriggerCondition,
  writeTriggerEvent,
} from '~active-effects/model';

import {
  ALL_CREATURES_AURA,
  ALLIES_AURA,
  AURA_RADIUS,
  CONSTITUTION_SAVE,
  createEffect,
  createRawEffect,
  NEW_EFFECT_ID,
  NEW_EFFECT_NAME,
  POISON_DAMAGE,
  resolveLayoutFor,
  SAVE_DC,
  serializeEffect,
  stripUndefinedKeys,
  TYPED_SAVE_DC,
  WALK_SPEED_CHANGE,
} from './activeEffectsFixtures';

/**
 * Доменная логика активных эффектов: перенос тестов нового сайта
 * (`test/active-effects/*` core-app), по блоку на исходный файл.
 */
describe('dictionaries', () => {
  /**
   * Размеры словарей системы dnd5e-2024 той версии, с которой снят порт. Тест
   * падает, когда справочник разошёлся с ней: либо в системе появилось новое (и
   * порт отстал), либо на сайте завелась своя запись, которой VTTG не знает.
   * Меняются числа только вместе с `EFFECT_SYSTEM_VERSION`; какие именно записи
   * разошлись, показывает `node scripts/compare-effect-dictionaries.mjs`.
   */
  const SYSTEM_DICTIONARY_SIZES = {
    version: '0.8.66',
    flags: 200,
    changeKeys: 61,
    conditions: 93,
    values: 32,
  };

  describe('словари эффектов', () => {
    it('размеры совпадают с системой, с которой снят порт', () => {
      expect(EFFECT_SYSTEM_VERSION).toBe(SYSTEM_DICTIONARY_SIZES.version);

      expect(Object.keys(EFFECT_FLAG_LABELS)).toHaveLength(
        SYSTEM_DICTIONARY_SIZES.flags,
      );

      expect(EFFECT_TARGET_KEY_SUGGESTIONS).toHaveLength(
        SYSTEM_DICTIONARY_SIZES.changeKeys,
      );

      expect(EFFECT_CONDITION_EXPR_SUGGESTIONS).toHaveLength(
        SYSTEM_DICTIONARY_SIZES.conditions,
      );

      expect(EFFECT_VALUE_SUGGESTIONS).toHaveLength(
        SYSTEM_DICTIONARY_SIZES.values,
      );
    });

    it('новые ключи и флаги 0.8.62 на месте', () => {
      for (const flag of [
        'healing.blocked',
        'healing.tempBlocked',
        'attacksAgainst.spell.advantage',
        'save.advantage.vsSpell',
        'save.advantage.death',
        'save.negateOnSuccess.vsMagic',
        'save.evasion.dexterity',
        'damage.ignoreResistance.slashing',
      ]) {
        expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
      }

      const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
        (suggestion) => suggestion.value,
      );

      expect(changeKeys).toContain('abilityCheck');
      expect(changeKeys).toContain('save.concentration');
      expect(changeKeys).toContain('attacksAgainst');
      expect(changeKeys).toContain('deathSave');
    });

    it('новые ключи и флаги 0.8.66 на месте', () => {
      for (const flag of [
        'defense.suppressAll',
        'hitPoints.maxReductionBlocked',
        'attacksAgainst.forceCritical',
        'movement.teleportBlocked',
        'rest.noBenefit.short',
        'rest.noBenefit.long',
      ]) {
        expect(EFFECT_FLAG_LABELS[flag], flag).toBeDefined();
      }

      const changeKeys = EFFECT_TARGET_KEY_SUGGESTIONS.map(
        (suggestion) => suggestion.value,
      );

      for (const changeKey of [
        'creatureType',
        'damage.all',
        'damage.weapon',
        'attack.weapon',
      ]) {
        expect(changeKeys).toContain(changeKey);
      }
    });

    it('условия о союзнике рядом с целью — семейством, с распознаванием', () => {
      // Дееспособный, в любом состоянии и по пятнадцати состояниям в двух видах
      expect(ADJACENT_ALLY_CONDITION_OPTIONS).toHaveLength(32);

      const conditions = EFFECT_CONDITION_EXPR_SUGGESTIONS.map(
        (suggestion) => suggestion.value,
      );

      expect(conditions).toContain('target.allyAdjacent');
      expect(conditions).toContain('target.allyAdjacentAny');
      expect(conditions).toContain('target.allyAdjacentWith === "poisoned"');
      expect(conditions).toContain('target.allyAdjacentWithout === "poisoned"');
      expect(conditions).toContain('incoming.attackerCreatureType === "fiend"');

      expect(isAdjacentAllyCondition('target.allyAdjacent')).toBe(true);
      expect(isAdjacentAllyCondition('  target.allyAdjacentAny  ')).toBe(true);

      expect(
        isAdjacentAllyCondition('target.allyAdjacentWith === "prone"'),
      ).toBe(true);

      expect(isAdjacentAllyCondition('target.markedBySelf')).toBe(false);
    });
  });
});

describe('schema', () => {
  describe('терпимая загрузка эффектов', () => {
    it('эффект без id или с changes не той формы выпадает, соседний остаётся', () => {
      const loadedEffects = normalizeLoadedActiveEffects([
        createRawEffect({ id: undefined }),
        createRawEffect({ changes: 'мусор' }),
        createRawEffect({ id: 'effect_ok' }),
        'мусор',
      ]);

      expect(loadedEffects.map((effect) => effect.id)).toEqual(['effect_ok']);
    });

    it('плохая строка модификатора выпадает одна, остальные остаются', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          changes: [
            {
              key: 'armorClass',
              mode: 'add',
              value: '1',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
            },
            {
              key: 'armorClass',
              mode: 'teleport',
              value: '1',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
            },
            { key: 'initiative', mode: 'add', value: '2', priority: '' },
          ],
        }),
      ]);

      expect(effect?.changes).toEqual([
        {
          key: 'armorClass',
          mode: 'add',
          value: '1',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
        {
          key: 'initiative',
          mode: 'add',
          value: '2',
          priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
        },
      ]);
    });

    it('незнакомый флаг остаётся: словарь сайта отстаёт от системы', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          flags: [
            'attack.advantage',
            'healing.blocked',
            'homebrew.flag',
            '',
            '   ',
            42,
            null,
          ],
        }),
      ]);

      expect(effect?.flags).toEqual([
        'attack.advantage',
        'healing.blocked',
        'homebrew.flag',
      ]);
    });

    it('незнакомые значения перечислений обнуляют поле, а не эффект', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          areaTrigger: 'onMoonrise',
          effectTarget: 'everywhere',
          consumeOn: 'sometimes',
          duration: { type: 'turn', turnAnchor: 'moon' },
        }),
      ]);

      expect(effect).toBeDefined();
      expect(effect?.areaTrigger).toBeUndefined();
      expect(effect?.effectTarget).toBeUndefined();
      expect(effect?.consumeOn).toBeUndefined();
      expect(effect?.duration.type).toBe('turn');
      expect(effect?.duration.turnAnchor).toBeUndefined();
    });

    it('доставка «зоной», спасбросок урона каждый ход и степень истощения переживают загрузку', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          effectTarget: 'zone',
          conditionKey: 'exhaustion',
          exhaustionLevel: 2,
          recurringDamage: {
            damageParts: [{ formula: '2d10@dmg.radiant' }],
            timing: 'endOfTurn',
            save: {
              ability: 'constitution',
              dc: APPLIER_SAVE_DC,
              onSuccess: 'half',
            },
          },
        }),
      ]);

      expect(effect?.effectTarget).toBe('zone');
      expect(effect?.exhaustionLevel).toBe(2);

      expect(effect?.recurringDamage?.save).toEqual({
        ability: 'constitution',
        dc: APPLIER_SAVE_DC,
        onSuccess: 'half',
      });
    });

    it('срабатывание с незнакомым действием выпадает, соседнее и зарезервированное остаются', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          triggers: [
            { id: 'ok', event: 'turnEnd', actions: [{ type: 'removeSelf' }] },
            {
              id: 'future',
              event: 'onMoonrise',
              actions: [{ type: 'removeSelf' }],
            },
            {
              id: 'bad-action',
              event: 'turnEnd',
              actions: [{ type: 'teleport' }],
            },
            {
              id: 'bad-tag',
              event: 'turnEnd',
              actions: [{ type: 'applyTag', tag: 'a b' }],
            },
            { id: 'no-actions', event: 'turnEnd', actions: [] },
            { event: 'turnEnd', actions: [{ type: 'removeSelf' }] },
            { id: 'rest', event: 'rest', actions: [{ type: 'removeSelf' }] },
            'мусор',
          ],
        }),
      ]);

      expect(effect?.triggers?.map((trigger) => trigger.id)).toEqual([
        'ok',
        'rest',
      ]);
    });

    it('негодные необязательные поля срабатывания обнуляют поле, числа строкой — числами', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          triggers: [
            {
              id: 'form',
              event: 'turnStart',
              turnOf: 'someone',
              condition: '',
              save: {
                ability: 'wisdom',
                dc: String(TYPED_SAVE_DC),
                dcFormula: 5,
              },
              limit: { max: 0, per: 'turn' },
              actions: [
                {
                  type: 'damage',
                  parts: [{ formula: '1d6' }],
                  on: 'sometimes',
                },
              ],
            },
          ],
        }),
      ]);

      const [trigger] = effect?.triggers ?? [];

      expect(trigger?.turnOf).toBeUndefined();
      expect(trigger?.condition).toBeUndefined();
      expect(trigger?.save).toEqual({ ability: 'wisdom', dc: TYPED_SAVE_DC });
      expect(trigger?.limit).toBeUndefined();
      expect(trigger?.actions[0]?.on).toBeUndefined();
    });

    it('эффект без срабатываний разбирается как раньше — поле не появляется', () => {
      const [effect] = normalizeLoadedActiveEffects([createRawEffect()]);

      expect(stripUndefinedKeys(effect)).not.toHaveProperty('triggers');
    });

    it('части урона срабатывания с легаси-типом переносят его в формулу', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          triggers: [
            {
              id: 'burn',
              event: 'turnStart',
              actions: [
                { type: 'damage', parts: [{ formula: '2d6', type: 'fire' }] },
              ],
            },
          ],
        }),
      ]);

      const [action] = effect?.triggers?.[0]?.actions ?? [];

      expect(action?.type === 'damage' ? action.parts : []).toEqual([
        { formula: '2d6@dmg.fire' },
      ]);
    });
  });

  describe('сохранение эффектов', () => {
    it('старый эффект без новых полей после «открыл и сохранил» тот же', () => {
      const legacyStoredEffect = createRawEffect({
        icon: 'tabler:flame',
        effectTarget: 'target',
        conditionKey: 'restrained',
        applySave: {
          ability: 'strength',
          dc: APPLIER_SAVE_DC,
          onSuccess: 'negate',
        },
        recurringSave: {
          ability: 'strength',
          dc: APPLIER_SAVE_DC,
          timing: 'endOfTurn',
        },
        recurringDamage: {
          damageParts: [{ formula: '2d6@dmg.fire', target: 'selected' }],
          timing: 'startOfTurn',
        },
        consumeOn: 'carrierAttack',
        duration: { type: 'rounds', value: 10 },
        changes: [
          {
            key: 'armorClass',
            mode: 'add',
            value: '1',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
        flags: ['attack.disadvantage'],
      });

      const savedEffects = normalizeActiveEffects(
        normalizeLoadedActiveEffects([legacyStoredEffect]),
        'spell',
      );

      expect(stripUndefinedKeys(savedEffects)).toEqual([legacyStoredEffect]);
    });

    it('поля применения, варианта и новых срабатываний переживают «открыл и сохранил»', () => {
      const storedEffect = createRawEffect({
        activation: { mode: 'toggle', counter: 'rage' },
        variant: { group: 'вариант', label: 'Оглушение', pick: 'random' },
        landingCondition: 'source.weaponMastery === true',
        rollCondition: 'incoming.attackType === "melee"',
        aura: {
          radius: AURA_RADIUS,
          target: 'allies',
          applyToSelf: true,
          visible: true,
          radiusFormula: '10 + 20 * floor(@classLevel / 18)',
          whileCapable: true,
        },
        triggers: [
          {
            id: 'rest',
            event: 'rest',
            restType: 'short',
            actions: [
              { type: 'reduceMaxHp', amount: '@damage', endsOnRest: 'never' },
            ],
          },
          {
            id: 'burst',
            event: 'hpZero',
            recipient: 'area',
            area: { radius: AURA_RADIUS, target: 'enemies' },
            save: { ability: 'dexterity', dc: SAVE_DC, mode: 'advantage' },
            actions: [
              { type: 'applyTag', tag: 'burst', stack: true },
              {
                type: 'applyCondition',
                conditionKey: 'prone',
                recurringSave: {
                  ability: 'strength',
                  dc: SAVE_DC,
                  timing: 'endOfTurn',
                },
              },
            ],
          },
        ],
      });

      const savedEffects = normalizeActiveEffects(
        normalizeLoadedActiveEffects([storedEffect]),
        'ownEffects',
      );

      expect(stripUndefinedKeys(savedEffects)).toEqual([storedEffect]);
    });

    it('эффекты сценариев системы переживают круг «открыл и сохранил»', () => {
      // Данные — из tests/scenarios системы: зелье (I16), «Тактика стаи»,
      // «Опрокидывание» (W08) и взрыв спор на нуле хитов
      const scenarios: Array<{
        context: EffectFormContext;
        name: string;
        storedEffect: Record<string, unknown>;
      }> = [
        {
          context: 'item',
          name: 'Зелье лечения',
          storedEffect: createRawEffect({
            name: 'Зелье лечения',
            activation: { mode: 'use' },
            triggers: [
              {
                id: 'trigger_heal',
                event: 'applied',
                actions: [
                  {
                    type: 'damage',
                    // Цель части урона сайт пишет явно — у системы это умолчание
                    parts: [{ formula: '2d4@heal+2', target: 'selected' }],
                  },
                  { type: 'removeSelf' },
                ],
              },
            ],
          }),
        },
        {
          context: 'creatureTrait',
          name: 'Тактика стаи',
          storedEffect: createRawEffect({
            name: 'Тактика стаи',
            flags: ['attack.advantage'],
            rollCondition: 'target.allyAdjacent',
          }),
        },
        {
          context: 'weapon',
          name: 'Опрокидывание',
          storedEffect: createRawEffect({
            name: 'Опрокидывание',
            effectTarget: 'target',
            landingCondition: 'source.weaponMastery === true',
            applySave: {
              ability: 'constitution',
              dc: APPLIER_SAVE_DC,
              onSuccess: 'negate',
            },
            conditionKey: 'prone',
          }),
        },
        {
          context: 'creatureTrait',
          name: 'Газовые споры',
          storedEffect: createRawEffect({
            name: 'Газовые споры',
            triggers: [
              {
                id: 'trigger_spores',
                event: 'hpZero',
                recipient: 'area',
                area: { radius: 10, target: 'all' },
                save: { ability: 'constitution', dc: SAVE_DC },
                actions: [
                  {
                    type: 'applyCondition',
                    conditionKey: 'poisoned',
                    recurringSave: {
                      ability: 'constitution',
                      dc: SAVE_DC,
                      timing: 'endOfTurn',
                    },
                  },
                ],
              },
            ],
          }),
        },
      ];

      for (const { context, name, storedEffect } of scenarios) {
        const savedEffects = normalizeActiveEffects(
          normalizeLoadedActiveEffects([storedEffect]),
          context,
        );

        expect(stripUndefinedKeys(savedEffects), name).toEqual([storedEffect]);
      }
    });

    it('урон каждый ход без частей не пишется, «при успехе» — ровно один исход', () => {
      const [effect] = normalizeActiveEffects(
        normalizeLoadedActiveEffects([
          createRawEffect({
            effectTarget: 'target',
            applySave: { ability: 'strength', dc: SAVE_DC, onSuccess: 'half' },
            applyOnSuccess: true,
            applyOnSuccessOnly: true,
            recurringDamage: { damageParts: [], timing: 'startOfTurn' },
          }),
        ]),
        'weapon',
      );

      expect(effect?.recurringDamage).toBeUndefined();
      expect(effect?.applyOnSuccess).toBeUndefined();
      expect(effect?.applyOnSuccessOnly).toBe(true);
    });

    it('вложенное срабатывание состояния и блок «по выбору» переживают круг', () => {
      const storedEffect = createRawEffect({
        triggers: [
          {
            id: 'trigger_sleep',
            event: 'applied',
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'unconscious',
                triggers: [
                  {
                    id: 'trigger_wake',
                    event: 'damageTaken',
                    actions: [{ type: 'removeSelf' }],
                  },
                ],
              },
            ],
          },
          {
            id: 'trigger_heal',
            event: 'turnStart',
            recipient: 'choice',
            choice: {
              radius: AURA_RADIUS,
              target: 'allies',
              count: 2,
              condition: 'self.creatureType === "undead"',
              optional: true,
              chooser: 'source',
            },
            actions: [{ type: 'damage', parts: [{ formula: '5@heal' }] }],
          },
        ],
      });

      const [effect] = normalizeActiveEffects(
        normalizeLoadedActiveEffects([storedEffect]),
        'spell',
      );

      const [sleepTrigger, healTrigger] = effect?.triggers ?? [];
      const [applyCondition] = sleepTrigger?.actions ?? [];

      expect(
        applyCondition?.type === 'applyCondition'
          ? applyCondition.triggers
          : undefined,
      ).toEqual([
        {
          id: 'trigger_wake',
          event: 'damageTaken',
          actions: [{ type: 'removeSelf' }],
        },
      ]);

      expect(healTrigger?.recipient).toBe('choice');

      expect(stripUndefinedKeys(healTrigger?.choice ?? {})).toEqual({
        radius: AURA_RADIUS,
        target: 'allies',
        count: 2,
        condition: 'self.creatureType === "undead"',
        optional: true,
        chooser: 'source',
      });
    });

    it('сл 0 у предмета поднимается до 1, у заклинания остаётся «Авто»', () => {
      const auraSaveEffect = createRawEffect({
        aura: { radius: AURA_RADIUS, target: 'all', applyToSelf: false },
        areaTrigger: 'enter',
        applySave: {
          ability: 'wisdom',
          dc: APPLIER_SAVE_DC,
          onSuccess: 'negate',
        },
      });

      const loadedEffects = normalizeLoadedActiveEffects([auraSaveEffect]);

      expect(
        normalizeActiveEffects(loadedEffects, 'item')[0]?.applySave?.dc,
      ).toBe(FIXED_MIN_SAVE_DC);

      expect(
        normalizeActiveEffects(loadedEffects, 'spell')[0]?.applySave?.dc,
      ).toBe(APPLIER_SAVE_DC);
    });
  });

  describe('поля эффекта 0.8.66', () => {
    it('негодное значение обнуляет только своё поле, числа строкой — числами', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          charges: { max: '3', current: '2', endsWhenEmpty: 'yes' },
          savedRoll: '  ',
          durationFormula: '1к4',
          suppressConditions: ['restrained', 5],
          escape: {
            by: 'everyone',
            cost: 'move',
            moveCostFeet: '10',
            check: { skill: 'luck', dc: 14 },
            label: '',
          },
          stageIndex: '1',
          stages: [
            { label: 'Первая', changes: [], flags: ['speed.zero'] },
            { label: 'Вторая', changes: 'мусор', flags: [] },
          ],
          changes: [
            {
              key: 'attack.melee',
              mode: 'add',
              value: '-1',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
              step: { by: -1, per: 'turn', until: '-5' },
            },
            {
              key: 'armorClass',
              mode: 'add',
              value: '1',
              priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
              step: { by: 1, per: 'week' },
            },
          ],
          applySave: {
            ability: 'wisdom',
            dc: SAVE_DC,
            onSuccess: 'negate',
            allowWilling: 'да',
          },
        }),
      ]);

      expect(effect?.charges).toEqual({ max: 3, current: 2 });
      expect(effect?.savedRoll).toBeUndefined();
      expect(effect?.durationFormula).toBe('1к4');
      // Список ключей с негодным элементом обнуляется целиком, как у системы
      expect(effect?.suppressConditions).toBeUndefined();
      expect(effect?.escape).toEqual({ cost: 'move', moveCostFeet: 10 });
      expect(effect?.stageIndex).toBe(1);

      expect(effect?.stages).toEqual([
        { label: 'Первая', changes: [], flags: ['speed.zero'] },
        { label: 'Вторая', changes: [], flags: [] },
      ]);

      expect(effect?.changes.map((change) => change.step)).toEqual([
        { by: -1, per: 'turn', until: -5 },
        undefined,
      ]);

      expect(effect?.applySave).toEqual({
        ability: 'wisdom',
        dc: SAVE_DC,
        onSuccess: 'negate',
      });
    });

    it('срабатывание с новым событием и новыми полями не выпадает', () => {
      const [effect] = normalizeLoadedActiveEffects([
        createRawEffect({
          triggers: [
            {
              id: 'path',
              event: 'moved',
              everyFeet: '5',
              cost: 'teleport',
              chancePercent: 100,
              ask: true,
              asker: 'source',
              actions: [{ type: 'moveArea', kind: 'follow' }],
            },
            {
              id: 'lost',
              event: 'conditionLost',
              conditionKey: 'grappled',
              save: {
                ability: 'wisdom',
                dc: SAVE_DC,
                modeIf: [{ condition: 'self.hp.temp === 0', mode: 'lucky' }],
                autoSuccessIf: 'self.grounded === true',
              },
              actions: [{ type: 'notify', text: 'Свободен', to: 'source' }],
            },
          ],
        }),
      ]);

      expect(effect?.triggers).toEqual([
        {
          id: 'path',
          event: 'moved',
          everyFeet: 5,
          ask: true,
          asker: 'source',
          actions: [{ type: 'moveArea', kind: 'follow' }],
        },
        {
          id: 'lost',
          event: 'conditionLost',
          conditionKey: 'grappled',
          save: {
            ability: 'wisdom',
            dc: SAVE_DC,
            autoSuccessIf: 'self.grounded === true',
          },
          actions: [{ type: 'notify', text: 'Свободен', to: 'source' }],
        },
      ]);
    });

    it('при сохранении строки эффекта берутся из действующей ступени, заряды — целыми', () => {
      const firstStageChange = {
        key: 'movement.walk',
        mode: 'add',
        value: '-10',
        priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
      } as const;

      const [savedEffect] = normalizeActiveEffects(
        normalizeLoadedActiveEffects([
          createRawEffect({
            changes: [],
            flags: [],
            charges: { max: 5, current: 9 },
            stages: [
              { label: 'Первая', changes: [firstStageChange], flags: [] },
              { label: 'Вторая', changes: [], flags: ['speed.zero'] },
            ],
            escape: { check: { skill: 'athletics', dc: APPLIER_SAVE_DC } },
          }),
        ]),
        'item',
      );

      expect(savedEffect?.changes).toEqual([firstStageChange]);
      expect(savedEffect?.stageIndex).toBe(0);
      expect(savedEffect?.charges).toEqual({ max: 5, current: 5 });

      // У предмета источника нет: «Авто» поднимается до наименьшей Сл
      expect(savedEffect?.escape?.check).toEqual({
        skill: 'athletics',
        dc: FIXED_MIN_SAVE_DC,
      });
    });
  });
});

describe('layout', () => {
  /** Радиус ауры, настроенный автором. */
  const CUSTOM_AURA_RADIUS = 30;

  /** Отрицательный радиус «всем в радиусе»: нормализация поднимает его до нуля. */
  const NEGATIVE_AREA_RADIUS = -5;

  describe('новый эффект по месту формы', () => {
    it('у действия существа и заклинания эффект сразу на цели', () => {
      for (const context of ['creatureAction', 'spell'] as const) {
        const effect = createEffectForContext(
          context,
          NEW_EFFECT_ID,
          NEW_EFFECT_NAME,
        );

        expect(effect.effectTarget, context).toBe('target');
        expect(readEffectDelivery(effect, context)).toBe('target');
      }
    });

    it('у черты существа, оружия, предмета и умения эффект на носителе', () => {
      for (const context of [
        'creatureTrait',
        'weapon',
        'item',
        'feature',
      ] as const) {
        const effect = createEffectForContext(
          context,
          NEW_EFFECT_ID,
          NEW_EFFECT_NAME,
        );

        expect(effect.effectTarget, context).toBe('self');
        expect(readEffectDelivery(effect, context)).toBe('carrier');
      }
    });
  });

  describe('раскладка формы эффекта', () => {
    it('черта персонажа на носителе — пассив: только то, что меняет', () => {
      const layout = resolveLayoutFor('feature');

      expect(layout.deliveryOptions).toEqual(['carrier', 'aura']);
      expect(layout.showTrigger).toBe(false);
      expect(layout.showSave).toBe(false);
      expect(layout.saveUnavailableReason).toBeNull();
      expect(layout.showRecurringDamage).toBe(false);
      expect(layout.showDuration).toBe(false);
      expect(layout.showRecurringSave).toBe(false);
      expect(layout.showConditionImmunities).toBe(true);
    });

    it('черта существа на носителе: урон и лечение каждый ход, без повторного спасброска', () => {
      const layout = resolveLayoutFor('creatureTrait');

      expect(layout.showRecurringDamage).toBe(true);
      expect(layout.showRecurringSave).toBe(false);
      expect(layout.showDuration).toBe(false);
      expect(layout.showConsumeOn).toBe(false);
      expect(resolveLayoutFor('item').showRecurringDamage).toBe(false);
    });

    it('аура умения («Аура защиты»): «пока внутри» без сроков, вход — со спасброском', () => {
      const stayLayout = resolveLayoutFor('feature', { aura: ALLIES_AURA });

      expect(stayLayout.delivery).toBe('aura');
      expect(stayLayout.showAuraSettings).toBe(true);
      expect(stayLayout.showSave).toBe(false);
      expect(stayLayout.saveUnavailableReason).toBe('stayTrigger');
      expect(stayLayout.showDuration).toBe(false);
      expect(stayLayout.showRecurringSave).toBe(false);

      const enterLayout = resolveLayoutFor('feature', {
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
      });

      expect(enterLayout.showSave).toBe(true);
      expect(enterLayout.showTriggerDamage).toBe(true);
      expect(enterLayout.showDuration).toBe(true);
      expect(enterLayout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
    });

    it('оружие на владельце подсказывает, где спасбросок', () => {
      const layout = resolveLayoutFor('weapon');

      expect(layout.deliveryOptions).toEqual(['carrier', 'target', 'aura']);
      expect(layout.showSave).toBe(false);
      expect(layout.saveUnavailableReason).toBe('onCarrier');
    });

    it('оружие «на цели при попадании»: спасбросок, Сл 0 — Сл оружия', () => {
      const effect = writeEffectDelivery(createEffect(), 'target');
      const layout = resolveEffectFormLayout('weapon', effect);

      expect(layout.delivery).toBe('target');
      expect(layout.showSave).toBe(true);
      expect(layout.showDuration).toBe(true);
      expect(layout.successOutcomeForActionSave).toBe(false);
      expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
    });

    it('аура предмета «пока внутри»: без длительности, иммунитеты достаются накрытым', () => {
      const layout = resolveLayoutFor('item', { aura: ALLIES_AURA });

      expect(layout.delivery).toBe('aura');
      expect(layout.showAuraSettings).toBe(true);
      expect(layout.showSave).toBe(false);
      expect(layout.saveUnavailableReason).toBe('stayTrigger');
      expect(layout.showDuration).toBe(false);
      expect(layout.showConditionImmunities).toBe(true);
      expect(layout.showRecurringDamage).toBe(true);
      expect(layout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
    });

    it('аура своих эффектов «пока внутри» тикает длительностью носителя', () => {
      const layout = resolveLayoutFor('ownEffects', { aura: ALLIES_AURA });

      expect(layout.showDuration).toBe(true);
      expect(layout.showRecurringSave).toBe(false);
    });

    it('свой эффект на носителе проживает свою жизнь', () => {
      const layout = resolveLayoutFor('ownEffects');

      expect(layout.showSave).toBe(false);
      expect(layout.showRecurringDamage).toBe(true);
      expect(layout.showDuration).toBe(true);
      expect(layout.showRecurringSave).toBe(true);
      expect(layout.showConsumeOn).toBe(true);
    });

    it('действие существа: Сл 0 — Сл действия, «при успехе» — к спасброску действия', () => {
      const layout = resolveLayoutFor('creatureAction', {
        effectTarget: 'target',
        conditionKey: 'prone',
      });

      expect(layout.deliveryOptions).toEqual(['target', 'carrier']);
      expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
      expect(layout.successOutcomeForActionSave).toBe(true);

      expect(layout.successOutcomes).toEqual([
        'nothing',
        'effectWithoutDamage',
        'onlyOnSuccess',
      ]);
    });

    it('свой спасбросок эффекта снимает привязку «при успехе» к действию', () => {
      const layout = resolveLayoutFor('spell', {
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
      });

      expect(layout.successOutcomeForActionSave).toBe(false);
      expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
    });

    it('заклинание на заклинателе: Сл 0 — Сл заклинателя при любой доставке', () => {
      expect(resolveLayoutFor('spell').minSaveDc).toBe(APPLIER_SAVE_DC);

      expect(resolveLayoutFor('spell', { aura: ALLIES_AURA }).minSaveDc).toBe(
        APPLIER_SAVE_DC,
      );
    });
  });

  describe('доставка эффекта', () => {
    it('«на цели» снимает ауру и момент срабатывания', () => {
      const effect = writeEffectDelivery(
        createEffect({ aura: ALLIES_AURA, areaTrigger: 'enter' }),
        'target',
      );

      expect(effect.effectTarget).toBe('target');
      expect(effect.aura).toBeUndefined();
      expect(effect.areaTrigger).toBeUndefined();
    });

    it('аура сохраняет уже настроенный радиус', () => {
      const effect = writeEffectDelivery(
        createEffect({ aura: { ...ALLIES_AURA, radius: CUSTOM_AURA_RADIUS } }),
        'aura',
      );

      expect(effect.effectTarget).toBe('self');
      expect(effect.aura?.radius).toBe(CUSTOM_AURA_RADIUS);
    });

    it('«пока внутри» не хранится полем', () => {
      const effect = writeEffectAreaTrigger(
        createEffect({ areaTrigger: 'enter' }),
        'stay',
      );

      expect(effect.areaTrigger).toBeUndefined();
      expect(readEffectAreaTrigger(effect)).toBe('stay');
    });
  });

  describe('исход успешного спасброска', () => {
    /** Ожидаемые поля по исходу. */
    const OUTCOME_FIELDS = {
      nothing: {
        onSuccess: 'negate',
        applyOnSuccess: undefined,
        applyOnSuccessOnly: undefined,
      },
      halfDamage: {
        onSuccess: 'half',
        applyOnSuccess: undefined,
        applyOnSuccessOnly: undefined,
      },
      halfDamageWithEffect: {
        onSuccess: 'half',
        applyOnSuccess: true,
        applyOnSuccessOnly: undefined,
      },
      effectWithoutDamage: {
        onSuccess: 'negate',
        applyOnSuccess: true,
        applyOnSuccessOnly: undefined,
      },
      onlyOnSuccess: {
        onSuccess: 'negate',
        applyOnSuccess: undefined,
        applyOnSuccessOnly: true,
      },
    } as const;

    it('запись и чтение сходятся для каждого исхода, обоих флагов сразу не бывает', () => {
      for (const outcome of EFFECT_SUCCESS_OUTCOMES) {
        const effect = writeEffectSuccessOutcome(
          createEffect({
            applySave: CONSTITUTION_SAVE,
            applyOnSuccess: true,
            applyOnSuccessOnly: true,
          }),
          outcome,
        );

        const { onSuccess, applyOnSuccess, applyOnSuccessOnly } =
          OUTCOME_FIELDS[outcome];

        expect(readEffectSuccessOutcome(effect)).toBe(outcome);
        expect(effect.applySave?.onSuccess, outcome).toBe(onSuccess);
        expect(effect.applyOnSuccess, outcome).toBe(applyOnSuccess);
        expect(effect.applyOnSuccessOnly, outcome).toBe(applyOnSuccessOnly);
      }
    });

    it('варианты — только осмысленные для настройки', () => {
      const listOutcomes = (overrides: Parameters<typeof createEffect>[0]) =>
        resolveLayoutFor('weapon', {
          effectTarget: 'target',
          applySave: CONSTITUTION_SAVE,
          ...overrides,
        }).successOutcomes;

      expect(
        listOutcomes({
          applySave: { ...CONSTITUTION_SAVE, onSuccess: 'negate' },
        }),
      ).toEqual(['nothing']);

      expect(listOutcomes({ damageParts: POISON_DAMAGE })).toEqual([
        'nothing',
        'halfDamage',
      ]);

      expect(
        listOutcomes({ damageParts: POISON_DAMAGE, conditionKey: 'poisoned' }),
      ).toEqual([...EFFECT_SUCCESS_OUTCOMES]);

      expect(listOutcomes({ conditionKey: 'poisoned' })).toEqual([
        'nothing',
        'halfDamage',
        'effectWithoutDamage',
        'onlyOnSuccess',
      ]);
    });

    it('без спасброска у оружия выбора нет', () => {
      expect(
        resolveLayoutFor('weapon', {
          effectTarget: 'target',
          conditionKey: 'poisoned',
        }).successOutcomes,
      ).toEqual([]);
    });
  });

  describe('неработающие поля', () => {
    it('на черте персонажа находятся и убираются', () => {
      const effect = createEffect({
        aura: ALLIES_AURA,
        applySave: CONSTITUTION_SAVE,
        recurringSave: { ability: 'wisdom', dc: SAVE_DC, timing: 'endOfTurn' },
        duration: { type: 'rounds', value: 3 },
        changes: [WALK_SPEED_CHANGE],
      });

      const layout = resolveEffectFormLayout('feature', effect);
      const inertFields = listInertEffectFields(effect, layout);

      // Аура умения работает: персонаж излучает её сам
      expect(inertFields).toEqual(['applySave', 'recurringSave', 'duration']);

      const clearedEffect = clearInertEffectFields(
        effect,
        inertFields,
        'feature',
      );

      expect(clearedEffect.aura).toEqual(ALLIES_AURA);
      expect(clearedEffect.applySave).toBeUndefined();
      expect(clearedEffect.recurringSave).toBeUndefined();
      expect(clearedEffect.duration).toEqual({ type: 'permanent' });
      expect(clearedEffect.changes).toEqual([WALK_SPEED_CHANGE]);

      expect(
        listInertEffectFields(
          clearedEffect,
          resolveEffectFormLayout('feature', clearedEffect),
        ),
      ).toEqual([]);
    });

    it('эффект черты существа, умения и предмета «на цели» возвращается на носителя', () => {
      const effect = createEffect({ effectTarget: 'target' });

      for (const context of ['creatureTrait', 'feature', 'item'] as const) {
        const layout = resolveEffectFormLayout(context, effect);

        expect(listInertEffectFields(effect, layout), context).toEqual([
          'effectTarget',
        ]);

        expect(
          clearInertEffectFields(effect, ['effectTarget'], context)
            .effectTarget,
          context,
        ).toBe('self');
      }
    });

    it('эффект действия существа ложится и на само существо', () => {
      const effect = createEffect({ effectTarget: 'self' });
      const layout = resolveEffectFormLayout('creatureAction', effect);

      // Доставка «На существе» работает с 0.8.62: неработающих полей нет
      expect(layout.delivery).toBe('carrier');
      expect(listInertEffectFields(effect, layout)).toEqual([]);
    });

    it('спасбросок, «при успехе» и урон у ауры «пока внутри»', () => {
      const effect = createEffect({
        aura: ALLIES_AURA,
        applySave: CONSTITUTION_SAVE,
        applyOnSuccess: true,
        damageParts: POISON_DAMAGE,
      });

      const layout = resolveEffectFormLayout('item', effect);
      const inertFields = listInertEffectFields(effect, layout);

      expect(inertFields).toEqual([
        'applySave',
        'successOutcome',
        'damageParts',
      ]);

      const clearedEffect = clearInertEffectFields(effect, inertFields, 'item');

      expect(clearedEffect.applySave).toBeUndefined();
      expect(clearedEffect.applyOnSuccess).toBeUndefined();
      expect(clearedEffect.applyOnSuccessOnly).toBeUndefined();
      expect(clearedEffect.damageParts).toBeUndefined();
    });
  });

  describe('шаги формы', () => {
    it('черта — выбор «на персонаже / аурой», «что меняет» и срабатывания урона', () => {
      expect(listEffectFormSteps(resolveLayoutFor('feature'))).toEqual([
        'trigger',
        'modifiers',
        'triggers',
      ]);
    });

    it('аура «пока внутри» объясняет, почему нет спасброска', () => {
      expect(
        listEffectFormSteps(resolveLayoutFor('item', { aura: ALLIES_AURA })),
      ).toEqual(['trigger', 'save', 'modifiers', 'triggers']);
    });

    it('аура заклинания «при входе» — все шаги', () => {
      expect(
        listEffectFormSteps(
          resolveLayoutFor('spell', {
            aura: ALLIES_AURA,
            areaTrigger: 'enter',
          }),
        ),
      ).toEqual([...EFFECT_FORM_STEPS]);
    });

    it('действие существа: шаг держат условие наложения и вариант', () => {
      expect(
        listEffectFormSteps(
          resolveLayoutFor('creatureAction', { effectTarget: 'target' }),
        ),
      ).toEqual([
        'trigger',
        'save',
        'damage',
        'modifiers',
        'duration',
        'triggers',
      ]);
    });

    it('условие наложения и вариант держат шаг «Когда срабатывает»', () => {
      expect(listEffectFormSteps(resolveLayoutFor('condition'))).toEqual([
        'modifiers',
      ]);

      const layout = resolveLayoutFor('spell', { effectTarget: 'target' });

      expect(layout.showVariant).toBe(true);
      expect(listEffectFormSteps(layout)).toContain('trigger');
    });
  });

  describe('получатель «всем в радиусе»', () => {
    /**
     * Срабатывание после нормализации черновика.
     *
     * @param trigger поля срабатывания поверх обязательных.
     * @returns срабатывание записи.
     */
    function normalizeAreaTrigger(
      trigger: Partial<EffectTrigger>,
    ): EffectTrigger | undefined {
      const draft = createEffect({
        triggers: [
          {
            id: 'trigger_area',
            event: 'hpZero',
            actions: [{ type: 'removeSelf' }],
            ...trigger,
          },
        ],
      });

      return normalizeEffectDraft(draft, resolveLayoutFor('creatureTrait'))
        .triggers?.[0];
    }

    it('выбор только у событий сервера со сценой, радиус от нуля', () => {
      expect(triggerEventAcceptsArea('hpZero')).toBe(true);
      expect(triggerEventAcceptsArea('applied')).toBe(true);
      expect(triggerEventAcceptsArea('turnStart')).toBe(false);

      expect(
        normalizeAreaTrigger({
          recipient: 'area',
          area: { radius: NEGATIVE_AREA_RADIUS, target: 'enemies' },
        })?.area,
      ).toEqual({ radius: MIN_TRIGGER_AREA_RADIUS, target: 'enemies' });

      const turnTrigger = normalizeAreaTrigger({
        event: 'turnStart',
        recipient: 'area',
        area: { radius: AURA_RADIUS },
      });

      expect(turnTrigger?.recipient).toBeUndefined();
      expect(turnTrigger?.area).toBeUndefined();
    });

    it('смена события уносит недоступного получателя и его радиус', () => {
      const areaTrigger: EffectTrigger = {
        id: 'trigger_area',
        event: 'hpZero',
        recipient: 'area',
        area: { radius: AURA_RADIUS },
        actions: [{ type: 'removeSelf' }],
      };

      expect(
        buildTriggerRecipientOptions(areaTrigger).map(
          (recipientOption) => recipientOption.value,
        ),
      ).toEqual(['subject', 'source', 'area', 'choice']);

      const turnTrigger = writeTriggerEvent(
        areaTrigger,
        'turnStart',
        resolveLayoutFor('ownEffects'),
      );

      expect(turnTrigger.recipient).toBeUndefined();
      expect(turnTrigger.area).toBeUndefined();
    });

    it('«по выбору» доступен и на границе хода, чужой блок не наследуется', () => {
      const choiceTrigger: EffectTrigger = {
        id: 'trigger_choice',
        event: 'turnStart',
        recipient: 'choice',
        choice: { radius: AURA_RADIUS, target: 'allies', count: 1 },
        actions: [{ type: 'removeSelf' }],
      };

      expect(
        buildTriggerRecipientOptions(choiceTrigger).map(
          (recipientOption) => recipientOption.value,
        ),
      ).toEqual(['subject', 'choice']);

      const restTrigger = writeTriggerEvent(
        choiceTrigger,
        'rest',
        resolveLayoutFor('ownEffects'),
      );

      expect(restTrigger.recipient).toBeUndefined();
      expect(restTrigger.choice).toBeUndefined();
    });
  });

  describe('применение и включение', () => {
    it('способы по месту формы: предмет применяют, умение ещё и включают', () => {
      expect(resolveLayoutFor('item').activationModes).toEqual(['use']);

      expect(resolveLayoutFor('feature').activationModes).toEqual([
        'use',
        'toggle',
      ]);

      expect(resolveLayoutFor('ownEffects').activationModes).toEqual([
        'use',
        'toggle',
      ]);

      expect(resolveLayoutFor('spell').activationModes).toEqual([]);
      expect(resolveLayoutFor('creatureTrait').activationModes).toEqual([]);
    });

    it('применяемый предмет: цель, копия живёт сама и слышит «при наложении»', () => {
      const potion = createEffect({ activation: { mode: 'use' } });
      const potionLayout = resolveEffectFormLayout('item', potion);

      expect(potionLayout.deliveryOptions).toEqual([
        'carrier',
        'target',
        'aura',
      ]);

      expect(potionLayout.showDuration).toBe(true);
      expect(potionLayout.showVariant).toBe(true);
      expect(potionLayout.showLandingCondition).toBe(true);
      expect(potionLayout.showActivationCounter).toBe(false);
      expect(potionLayout.triggerEvents).toContain('applied');
      expect(potionLayout.triggerActions).toContain('removeSelf');

      const potionOnTarget = createEffect({
        activation: { mode: 'use' },
        effectTarget: 'target',
      });

      expect(
        listInertEffectFields(
          potionOnTarget,
          resolveEffectFormLayout('item', potionOnTarget),
        ),
      ).toEqual([]);

      const wornItem = createEffect({ effectTarget: 'target' });

      expect(
        listInertEffectFields(
          wornItem,
          resolveEffectFormLayout('item', wornItem),
        ),
      ).toEqual(['effectTarget']);
    });

    it('переключаемое умение: ресурс и событие «При включении»', () => {
      const rage = createEffect({
        activation: { mode: 'toggle', counter: 'rage' },
      });

      const rageLayout = resolveEffectFormLayout('feature', rage);

      expect(rageLayout.showActivationCounter).toBe(true);
      expect(rageLayout.showDuration).toBe(true);
      expect(rageLayout.triggerEvents).toContain('activate');
      expect(rageLayout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
    });

    it('у применяемого предмета Сл своя: источника у зелья нет', () => {
      const poison = createEffect({
        effectTarget: 'target',
        activation: { mode: 'use' },
      });

      const poisonLayout = resolveEffectFormLayout('item', poison);

      expect(poisonLayout.delivery).toBe('target');
      expect(poisonLayout.minSaveDc).toBe(FIXED_MIN_SAVE_DC);
    });

    it('применяемое умение на цели бросает против Сл применившего', () => {
      const channel = createEffect({
        effectTarget: 'target',
        activation: { mode: 'use', counter: 'channelDivinity' },
      });

      const channelLayout = resolveEffectFormLayout('feature', channel);

      expect(channelLayout.delivery).toBe('target');
      expect(channelLayout.minSaveDc).toBe(APPLIER_SAVE_DC);
      expect(channelLayout.showSave).toBe(true);
    });

    it('применение не для этого места — неработающее поле', () => {
      const toggledItem = createEffect({ activation: { mode: 'toggle' } });

      expect(
        listInertEffectFields(
          toggledItem,
          resolveEffectFormLayout('item', toggledItem),
        ),
      ).toEqual(['activation']);
    });

    it('шаблон применения на своём листе сохраняется выключенным', () => {
      const template = createEffect({ activation: { mode: 'use' } });
      const templateLayout = resolveEffectFormLayout('ownEffects', template);

      expect(normalizeEffectDraft(template, templateLayout).disabled).toBe(
        true,
      );

      expect(templateLayout.showStatusToggle).toBe(false);
    });

    it('ресурс и расход пишутся только заданными', () => {
      const rage = createEffect({
        activation: { mode: 'toggle', counter: '  rage  ', amount: 2 },
      });

      expect(
        normalizeEffectDraft(rage, resolveEffectFormLayout('feature', rage))
          .activation,
      ).toEqual({ mode: 'toggle', counter: 'rage', amount: 2 });

      const singleCharge = createEffect({
        activation: { mode: 'toggle', counter: 'rage', amount: 1 },
      });

      expect(
        normalizeEffectDraft(
          singleCharge,
          resolveEffectFormLayout('feature', singleCharge),
        ).activation,
      ).toEqual({ mode: 'toggle', counter: 'rage', amount: undefined });

      const withoutCounter = createEffect({
        activation: { mode: 'use', amount: 3 },
      });

      expect(
        normalizeEffectDraft(
          withoutCounter,
          resolveEffectFormLayout('feature', withoutCounter),
        ).activation,
      ).toEqual({ mode: 'use', counter: undefined, amount: undefined });
    });
  });

  describe('переключатели спасбросков', () => {
    it('новый спасбросок: Сл по умолчанию у ауры предмета, Сл источника у заклинания', () => {
      const auraEffect = createEffect({
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
      });

      expect(
        writeEffectSaveEnabled(
          auraEffect,
          true,
          resolveEffectFormLayout('item', auraEffect),
        ).applySave,
      ).toEqual({
        ability: 'wisdom',
        dc: DEFAULT_EFFECT_SAVE_DC,
        onSuccess: 'negate',
      });

      const spellEffect = createEffect({ effectTarget: 'target' });

      expect(
        writeEffectSaveEnabled(
          spellEffect,
          true,
          resolveEffectFormLayout('spell', spellEffect),
        ).applySave?.dc,
      ).toBe(APPLIER_SAVE_DC);
    });

    it('включение не сбрасывает уже настроенный спасбросок', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
      });

      expect(
        writeEffectSaveEnabled(
          effect,
          true,
          resolveEffectFormLayout('weapon', effect),
        ).applySave,
      ).toEqual(CONSTITUTION_SAVE);
    });

    it('без спасброска у оружия уходит и «при успехе»', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
        applyOnSuccessOnly: true,
      });

      const effectWithoutSave = writeEffectSaveEnabled(
        effect,
        false,
        resolveEffectFormLayout('weapon', effect),
      );

      expect(effectWithoutSave.applySave).toBeUndefined();
      expect(effectWithoutSave.applyOnSuccessOnly).toBeUndefined();
    });

    it('у действия существа «при успехе» остаётся за спасброском действия', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
        applyOnSuccessOnly: true,
      });

      const effectWithoutSave = writeEffectSaveEnabled(
        effect,
        false,
        resolveEffectFormLayout('creatureAction', effect),
      );

      expect(effectWithoutSave.applySave).toBeUndefined();
      expect(effectWithoutSave.applyOnSuccessOnly).toBe(true);
    });
  });

  describe('список «Срабатывания»', () => {
    it('события и действия по месту', () => {
      const ownLayout = resolveLayoutFor('ownEffects');

      expect(ownLayout.triggerEvents).toEqual([
        'turnStart',
        'turnEnd',
        'attackRoll',
        'damageTaken',
        'hpZero',
        'healed',
        'conditionLost',
        'downedOther',
        'moved',
        'rest',
      ]);

      expect(ownLayout.triggerActions).toEqual([
        'damage',
        'applyCondition',
        'applyTag',
        'reduceMaxHp',
        'setHp',
        'tempHp',
        'move',
        'removeCondition',
        'kill',
        'revive',
        'dropHeld',
        'restore',
        'dispel',
        'grantInspiration',
        'notify',
        'nextStage',
        'endCast',
        'removeSelf',
      ]);

      expect(listTriggerActionTypes(ownLayout, 'attackRoll')).toEqual([
        'damage',
        'applyCondition',
        'applyTag',
        'reduceMaxHp',
        'tempHp',
        'move',
        'removeCondition',
        'kill',
        'revive',
        'dropHeld',
        'restore',
        'dispel',
        'grantInspiration',
        'notify',
        'nextStage',
        'endCast',
        'removeSelf',
      ]);

      expect(listTriggerActionTypes(ownLayout, 'hpZero')).toEqual([
        'damage',
        'applyCondition',
        'applyTag',
        'reduceMaxHp',
        'setHp',
        'tempHp',
        'move',
        'removeCondition',
        'kill',
        'revive',
        'dropHeld',
        'restore',
        'dispel',
        'grantInspiration',
        'notify',
        'nextStage',
        'endCast',
        'removeSelf',
      ]);

      expect(triggerEventAcceptsDcFormula('damageTaken')).toBe(true);
      expect(triggerEventAcceptsDcFormula('turnEnd')).toBe(false);
      expect(triggerEventAcceptsDcFormula('applied')).toBe(true);
      expect(triggerEventHasOtherParty('attackRoll')).toBe(true);
      expect(triggerEventHasOtherParty('damageTaken')).toBe(true);
      expect(triggerEventHasOtherParty('applied')).toBe(true);
      expect(triggerEventHasOtherParty('hpZero')).toBe(false);

      expect(
        resolveLayoutFor('spell', { effectTarget: 'target' }).triggerEvents,
      ).toEqual([
        'applied',
        // У действующего заклинания на цели есть своя кнопка действия
        'activate',
        'turnStart',
        'turnEnd',
        'attackRoll',
        'damageTaken',
        'hpZero',
        'healed',
        'conditionLost',
        'downedOther',
        'moved',
        'castEnd',
        'rest',
      ]);

      const spellZone = resolveLayoutFor('spell', { effectTarget: 'zone' });

      expect(spellZone.triggerEvents).toEqual([
        'turnStart',
        'turnEnd',
        'enter',
        'exit',
      ]);

      expect(spellZone.triggerActions).toEqual([
        'damage',
        'applyCondition',
        'applyTag',
        'reduceMaxHp',
        'tempHp',
        'move',
        'removeCondition',
        'kill',
        'revive',
        'dropHeld',
        'restore',
        'dispel',
        'grantInspiration',
        'notify',
        'endCast',
      ]);

      // В ауру входят и выходят так же, как в зону
      expect(
        resolveLayoutFor('spell', { aura: ALL_CREATURES_AURA }).triggerEvents,
      ).toEqual([
        'turnStart',
        'turnEnd',
        'enter',
        'exit',
        'damageTaken',
        'hpZero',
        'healed',
      ]);

      const traitLayout = resolveLayoutFor('creatureTrait');

      expect(traitLayout.triggerEvents).toEqual([
        'turnStart',
        'turnEnd',
        'damageTaken',
        'hpZero',
        'healed',
      ]);

      expect(traitLayout.triggerActions).toEqual([
        'damage',
        'applyCondition',
        'applyTag',
        'reduceMaxHp',
        'setHp',
        'tempHp',
        'move',
        'removeCondition',
        'kill',
        'revive',
        'dropHeld',
        'restore',
        'dispel',
        'grantInspiration',
        'notify',
        'endCast',
      ]);

      // Эффект накладывают — выбирается и ход наложившего
      expect(ownLayout.triggerTurnOwners).toEqual(['subject', 'source']);
      // У черты существа наложившего нет
      expect(traitLayout.triggerTurnOwners).toEqual(['subject']);

      for (const context of ['feature', 'item'] as const) {
        expect(resolveLayoutFor(context).triggerEvents, context).toEqual([
          'damageTaken',
          'hpZero',
          'healed',
        ]);
      }

      expect(resolveLayoutFor('weapon').triggerEvents).toEqual([]);
    });

    it('пресеты по месту; повторный спасбросок повторяет спасбросок эффекта', () => {
      expect(listEffectTriggerPresets(resolveLayoutFor('ownEffects'))).toEqual([
        'recurringDamage',
        'recurringSave',
        'consumeOn',
        'hpZeroToOne',
        'tagOnDamage',
        'custom',
      ]);

      expect(
        listEffectTriggerPresets(
          resolveLayoutFor('spell', { effectTarget: 'zone' }),
        ),
      ).toEqual(['recurringDamage', 'custom']);

      const effect = createEffect({
        effectTarget: 'target',
        applySave: CONSTITUTION_SAVE,
      });

      const layout = resolveEffectFormLayout('weapon', effect);
      const preset = createEffectTriggerPreset('recurringSave', effect, layout);

      expect(writeEffectTriggerRow(effect, 0, preset).recurringSave).toEqual({
        ability: 'constitution',
        dc: SAVE_DC,
        timing: 'endOfTurn',
      });

      const spellEffect = createEffect({ effectTarget: 'target' });

      // У заклинания — Сл заклинателя
      expect(
        createEffectTriggerPreset(
          'recurringSave',
          spellEffect,
          resolveEffectFormLayout('spell', spellEffect),
        ).save?.dc,
      ).toBe(APPLIER_SAVE_DC);
    });

    it('запись «сначала старые поля»: лимит уводит строку в triggers, удаление снимает поле', () => {
      const layout = resolveLayoutFor('ownEffects');
      const effect = createEffect();

      const recurringDamageEffect = writeEffectTriggerRow(
        effect,
        0,
        createEffectTriggerPreset('recurringDamage', effect, layout),
      );

      expect(recurringDamageEffect.recurringDamage).toEqual({
        damageParts: [],
        timing: 'startOfTurn',
      });

      expect(recurringDamageEffect.triggers).toBeUndefined();

      const [recurringDamageTrigger] = listEffectListTriggers(
        recurringDamageEffect,
      );

      if (!recurringDamageTrigger) {
        throw new Error('Пресет урона каждый ход не дал строки срабатывания');
      }

      const limitedEffect = writeEffectTriggerRow(recurringDamageEffect, 0, {
        ...recurringDamageTrigger,
        actions: [{ type: 'damage', parts: POISON_DAMAGE }],
        limit: { max: 1, per: 'turn' },
      });

      expect(limitedEffect.recurringDamage).toBeUndefined();
      expect(limitedEffect.triggers).toHaveLength(1);

      // Id legacy.* не уходит в triggers
      expect(limitedEffect.triggers?.[0]?.id).not.toBe(
        recurringDamageTrigger.id,
      );

      expect(limitedEffect.triggers?.[0]?.limit).toEqual({
        max: 1,
        per: 'turn',
      });

      const consumeOnEffect = writeEffectTriggerRow(
        limitedEffect,
        1,
        createEffectTriggerPreset('consumeOn', limitedEffect, layout),
      );

      expect(consumeOnEffect.consumeOn).toBe('carrierAttack');

      // Старые поля читаются первыми
      expect(
        listEffectListTriggers(consumeOnEffect).map((trigger) => trigger.event),
      ).toEqual(['attackRoll', 'turnStart']);

      const effectWithoutConsumeOn = writeEffectTriggerRow(
        consumeOnEffect,
        0,
        null,
      );

      expect(effectWithoutConsumeOn.consumeOn).toBeUndefined();
      expect(effectWithoutConsumeOn.triggers).toHaveLength(1);
    });

    it('срабатывание не для этого места — плашкой; «Убрать» оставляет работающие', () => {
      const effect = createEffect({
        effectTarget: 'zone',
        triggers: [
          {
            id: 'trigger_attack',
            event: 'attackRoll',
            actions: [{ type: 'removeSelf' }],
          },
          {
            id: 'trigger_turn',
            event: 'turnStart',
            actions: [{ type: 'damage', parts: POISON_DAMAGE }],
          },
        ],
      });

      const layout = resolveEffectFormLayout('spell', effect);

      expect(listInertEffectFields(effect, layout)).toEqual(['triggers']);

      const effectWithWorkingTriggers = clearInertEffectFields(
        effect,
        ['triggers'],
        'spell',
      );

      expect(
        effectWithWorkingTriggers.triggers?.map((trigger) => trigger.id),
      ).toEqual(['trigger_turn']);

      expect(
        listInertEffectFields(
          { ...effect, effectTarget: 'self' },
          resolveLayoutFor('ownEffects'),
        ),
      ).toEqual([]);
    });

    it('черта существа: срабатывание броска атаки не работает', () => {
      const effect = createEffect({
        triggers: [
          {
            id: 'trigger_attack',
            event: 'attackRoll',
            actions: [{ type: 'applyTag', tag: 'огонь' }],
          },
        ],
      });

      expect(
        listInertEffectFields(
          effect,
          resolveEffectFormLayout('creatureTrait', effect),
        ),
      ).toEqual(['triggers']);
    });

    it('сохранение: без действий не пишется, Сл и лимит — в границах', () => {
      const effect = createEffect({
        effectTarget: 'zone',
        triggers: [
          { id: 'trigger_empty', event: 'turnStart', actions: [] },
          {
            id: 'trigger_stench',
            event: 'turnStart',
            save: { ability: 'constitution', dc: -3 },
            actions: [{ type: 'applyCondition', conditionKey: 'poisoned' }],
            limit: { max: 0, per: 'round' },
          },
        ],
      });

      const itemLayout = resolveEffectFormLayout('item', effect);
      const normalizedEffect = normalizeEffectDraft(effect, itemLayout);

      expect(normalizedEffect.triggers?.map((trigger) => trigger.id)).toEqual([
        'trigger_stench',
      ]);

      const [stenchTrigger] = normalizedEffect.triggers ?? [];

      expect(stenchTrigger?.save?.dc).toBe(FIXED_MIN_SAVE_DC);
      expect(stenchTrigger?.limit).toEqual({ max: 1, per: 'round' });

      expect(
        normalizeEffectDraft(
          createEffect({
            triggers: [{ id: 'trigger_bare', event: 'turnEnd', actions: [] }],
          }),
          itemLayout,
        ).triggers,
      ).toBeUndefined();
    });
  });

  describe('шаблон состояния', () => {
    it('берёт то, что делает состояние, и оставляет срабатывание', () => {
      const effect = createEffect({
        origin: 'spell',
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
        applySave: CONSTITUTION_SAVE,
        damageParts: POISON_DAMAGE,
        duration: { type: 'minutes', value: 1 },
        changes: [WALK_SPEED_CHANGE],
        exhaustionLevel: 2,
      });

      const condition = buildConditionActiveEffect('poisoned');

      if (!condition) {
        throw new Error('Нет шаблона состояния «Отравленный»');
      }

      const poisonedEffect = applyConditionPresetToEffect(effect, condition);

      expect(poisonedEffect.id).toBe(effect.id);
      expect(poisonedEffect.origin).toBe('spell');
      expect(poisonedEffect.aura).toEqual(ALLIES_AURA);
      expect(poisonedEffect.areaTrigger).toBe('enter');
      expect(poisonedEffect.applySave).toEqual(CONSTITUTION_SAVE);
      expect(poisonedEffect.damageParts).toEqual(POISON_DAMAGE);
      expect(poisonedEffect.duration).toEqual({ type: 'minutes', value: 1 });
      expect(poisonedEffect.conditionKey).toBe('poisoned');
      expect(poisonedEffect.name).toBe(condition.name);
      expect(poisonedEffect.changes).toEqual(condition.changes);
      expect(poisonedEffect.flags).toEqual(condition.flags);
      expect(poisonedEffect.exhaustionLevel).toBeUndefined();
    });
  });

  describe('черновик перед сохранением', () => {
    it('имя без пробелов, пустые списки — отсутствием поля, Сл по месту', () => {
      const effect = createEffect({
        name: '  Яд  ',
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
        applySave: CONSTITUTION_SAVE,
        recurringSave: {
          ability: 'wisdom',
          dc: TYPED_SAVE_DC,
          timing: 'endOfTurn',
        },
        damageParts: [],
        conditionImmunities: [],
      });

      const normalizedEffect = normalizeEffectDraft(
        effect,
        resolveEffectFormLayout('item', effect),
      );

      expect(normalizedEffect.name).toBe('Яд');
      expect(normalizedEffect.recurringSave?.dc).toBe(TYPED_SAVE_DC);
      expect(normalizedEffect.damageParts).toBeUndefined();
      expect(normalizedEffect.conditionImmunities).toBeUndefined();
    });

    it('сл спасброска против урона каждый ход: 0 у ауры предмета — 1', () => {
      const effect = createEffect({
        aura: ALLIES_AURA,
        recurringDamage: {
          damageParts: POISON_DAMAGE,
          timing: 'startOfTurn',
          save: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
        },
      });

      const normalizedEffect = normalizeEffectDraft(
        effect,
        resolveEffectFormLayout('item', effect),
      );

      expect(normalizedEffect.recurringDamage?.save?.dc).toBe(
        FIXED_MIN_SAVE_DC,
      );

      expect(normalizedEffect.recurringDamage?.damageParts).toEqual(
        POISON_DAMAGE,
      );
    });

    it('отметка без годного ключа выбрасывается одна, а не со срабатыванием', () => {
      const effect = createEffect({
        triggers: [
          {
            id: 'trigger_marks',
            event: 'turnStart',
            actions: [
              { type: 'applyTag', tag: '' },
              { type: 'applyTag', tag: 'огонь' },
            ],
          },
          {
            id: 'trigger_blank',
            event: 'turnEnd',
            actions: [{ type: 'applyTag', tag: 'с пробелом' }],
          },
        ],
      });

      const normalizedEffect = normalizeEffectDraft(
        effect,
        resolveEffectFormLayout('ownEffects', effect),
      );

      expect(
        normalizedEffect.triggers?.map((trigger) => [
          trigger.id,
          trigger.actions.map((action) =>
            action.type === 'applyTag' ? action.tag : action.type,
          ),
        ]),
      ).toEqual([['trigger_marks', ['огонь']]]);

      expect(listTriggerTags(effect.triggers ?? [])).toEqual(['огонь']);
    });

    it('сл 0 остаётся «Сл источника» только там, где источник есть', () => {
      const spellEffect = createEffect({
        effectTarget: 'target',
        applySave: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
      });

      expect(
        normalizeEffectDraft(
          spellEffect,
          resolveEffectFormLayout('spell', spellEffect),
        ).applySave?.dc,
      ).toBe(APPLIER_SAVE_DC);

      const auraEffect = createEffect({
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
        applySave: { ...CONSTITUTION_SAVE, dc: APPLIER_SAVE_DC },
      });

      expect(
        normalizeEffectDraft(
          auraEffect,
          resolveEffectFormLayout('item', auraEffect),
        ).applySave?.dc,
      ).toBe(FIXED_MIN_SAVE_DC);
    });
  });

  describe('живая сводка эффекта', () => {
    it('аура: спасбросок при входе, провал и успех', () => {
      const effect = createEffect({
        aura: ALLIES_AURA,
        areaTrigger: 'enter',
        applySave: CONSTITUTION_SAVE,
        damageParts: POISON_DAMAGE,
        conditionKey: 'poisoned',
        duration: { type: 'minutes', value: 1 },
      });

      expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
        `Когда существо входит в ауру ${AURA_RADIUS} фт (союзники): спасбросок Телосложения, Сл ${SAVE_DC}. `
          + 'Провал — 2d6 ядом, «Отравленный», на 1 минуту. '
          + 'Успех — половина урона.',
      );
    });

    it('оружие: спасбросок при попадании', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: { ...CONSTITUTION_SAVE, onSuccess: 'negate' },
        conditionKey: 'poisoned',
        duration: { type: 'rounds', value: 1 },
      });

      expect(describeEffectScenario(effect, 'weapon')).toBe(
        `При попадании оружием: спасбросок Телосложения, Сл ${SAVE_DC}. `
          + 'Провал — «Отравленный», на 1 раунд. Успех — ничего.',
      );
    });

    it('«только при успехе»: провал ничего не даёт', () => {
      const effect = writeEffectSuccessOutcome(
        createEffect({
          effectTarget: 'target',
          applySave: CONSTITUTION_SAVE,
          changes: [WALK_SPEED_CHANGE],
        }),
        'onlyOnSuccess',
      );

      expect(describeEffectScenario(effect, 'weapon')).toBe(
        `При попадании оружием: спасбросок Телосложения, Сл ${SAVE_DC}. `
          + 'Провал — ничего. Успех — Скорость (ходьба) +10 фт.',
      );
    });

    it('пассив черты не говорит о спасброске и длительности', () => {
      const effect = createEffect({
        changes: [WALK_SPEED_CHANGE],
        applySave: CONSTITUTION_SAVE,
        duration: { type: 'rounds', value: 3 },
      });

      expect(describeEffectScenario(effect, 'feature')).toBe(
        'Постоянно у персонажа: Скорость (ходьба) +10 фт.',
      );
    });

    it('пустой эффект', () => {
      expect(describeEffectScenario(createEffect(), 'item')).toBe(
        'Пока предмет надет: эффект пока ничего не делает.',
      );
    });

    it('действие существа: Сл 0 — Сл действия', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: {
          ability: 'strength',
          dc: APPLIER_SAVE_DC,
          onSuccess: 'negate',
        },
        conditionKey: 'prone',
      });

      expect(describeEffectScenario(effect, 'creatureAction')).toBe(
        'Когда действие задело цель: спасбросок Силы, Сл действия. '
          + 'Провал — «Лежащий ничком». Успех — ничего.',
      );
    });

    it('«при успехе» спасброска действия', () => {
      const effect = createEffect({
        effectTarget: 'target',
        conditionKey: 'grappled',
      });

      expect(
        describeEffectScenario(
          writeEffectSuccessOutcome(effect, 'onlyOnSuccess'),
          'creatureAction',
        ),
      ).toBe(
        'Когда действие задело цель, если цель прошла спасбросок: «Схваченный».',
      );

      expect(
        describeEffectScenario(
          writeEffectSuccessOutcome(effect, 'effectWithoutDamage'),
          'creatureAction',
        ),
      ).toBe(
        'Когда действие задело цель: «Схваченный». '
          + 'Эффект ложится и при успешном спасброске.',
      );
    });

    it('заклинание на цели: «Когда заклинание задело цель»', () => {
      const effect = createEffect({
        effectTarget: 'target',
        conditionKey: 'restrained',
        duration: { type: 'rounds', value: 10 },
        recurringSave: {
          ability: 'strength',
          dc: APPLIER_SAVE_DC,
          timing: 'endOfTurn',
        },
      });

      expect(describeEffectScenario(effect, 'spell')).toBe(
        'Когда заклинание задело цель: «Опутанный», повторный спасбросок Силы '
          + 'Сл заклинателя в конце хода снимает эффект, на 10 раундов.',
      );
    });

    it('состояние из шаблона не перечисляет свои правила, только добавленные', () => {
      const condition = buildConditionActiveEffect('poisoned');

      if (!condition) {
        throw new Error('Нет шаблона состояния «Отравленный»');
      }

      expect(condition.flags.length).toBeGreaterThan(0);

      const effect = applyConditionPresetToEffect(
        createEffect({ effectTarget: 'target' }),
        condition,
      );

      expect(describeEffectScenario(effect, 'weapon')).toBe(
        'При попадании оружием: «Отравленный».',
      );

      expect(
        describeEffectScenario(
          { ...effect, changes: [...effect.changes, WALK_SPEED_CHANGE] },
          'weapon',
        ),
      ).toBe('При попадании оружием: «Отравленный», Скорость (ходьба) +10 фт.');
    });

    it('аура «пока внутри»: урон каждый ход со спасброском', () => {
      for (const [onSuccess, successLabel] of [
        ['negate', 'без урона'],
        ['half', 'половина урона'],
      ] as const) {
        const effect = createEffect({
          aura: ALLIES_AURA,
          recurringDamage: {
            damageParts: POISON_DAMAGE,
            timing: 'startOfTurn',
            save: { ...CONSTITUTION_SAVE, onSuccess },
          },
        });

        expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
          `Существам в ауре ${AURA_RADIUS} фт (союзники): каждый ход 2d6 ядом в начале хода `
            + `(спасбросок Телосложения, Сл ${SAVE_DC}: успех — ${successLabel}).`,
        );
      }
    });

    it('лечение каждый ход — токеном в формуле', () => {
      const effect = createEffect({
        triggers: [
          {
            id: 'trigger_regeneration',
            event: 'turnStart',
            condition: 'self.tag !== "noRegen"',
            actions: [{ type: 'damage', parts: [{ formula: '15@heal' }] }],
          },
        ],
      });

      expect(describeEffectScenario(effect, 'creatureTrait')).toBe(
        'Постоянно у существа: в начале хода, если на носителе нет отметки '
          + '«noRegen»: 15 лечения.',
      );
    });

    it('аура и снятие после атаки', () => {
      expect(
        describeEffectScenario(
          createEffect({ aura: ALLIES_AURA, changes: [WALK_SPEED_CHANGE] }),
          'item',
        ),
      ).toBe(
        `Существам в ауре ${AURA_RADIUS} фт (союзники): Скорость (ходьба) +10 фт.`,
      );

      expect(
        describeEffectScenario(
          createEffect({
            flags: ['attack.advantage'],
            consumeOn: 'carrierAttack',
          }),
          'ownEffects',
        ),
      ).toBe(
        `Пока эффект активен: ${describeEffectFlag('attack.advantage')}, `
          + 'снимается после своей атаки.',
      );
    });
  });
});

describe('scenarios', () => {
  /**
   * Эффекты каталога сценариев системы dnd5e-2024 (`tests/scenarios`,
   * `docs/EFFECT_SCENARIOS.md`) на сайте: запись переживает круг «открыл и
   * сохранил» без потерь, а в своём месте окна у эффекта нет неработающих полей.
   *
   * Эффекты перенесены литералами — как их собирает тест системы. Где сайт при
   * сохранении пишет запись иначе только умолчанием, эффект записан уже в форме
   * сайта, с комментарием.
   */

  /** Сл спасброска срабатывания в сценариях словаря условий. */
  const TRIGGER_SAVE_DC = 13;

  /** Сл, которую честным броском не пройти: успех бывает только автоматическим. */
  const UNBEATABLE_SAVE_DC = 30;

  /** Радиус «в пределах 30 футов» у отбора и выбора целей заклинаний, фт. */
  const SPELL_AREA_RADIUS = 30;

  /** На сколько толкает «Волна грома» и уходит «Облако смерти», фт. */
  const SHIFT_DISTANCE_FEET = 10;

  /** Шаг пути «Шипастого следа», фт. */
  const PATH_STEP_FEET = 10;

  /** Заряды «Огненного щита». */
  const FIRE_SHIELD_CHARGES = 2;

  /** Круг ячейки, которую возвращает «Стихийное извержение». */
  const RESTORED_SLOT_LEVEL = 2;

  /** До какого круга снимает «Рассеивание магии». */
  const DISPEL_MAX_LEVEL = 3;

  /** Срок «Вибрирующих жидкостей», раунды. */
  const SAVED_ROLL_DURATION_ROUNDS = 3;

  /** Сценарий каталога системы: эффект и место окна, где его собирает автор. */
  interface EffectScenario {
    /** Номер сценария в каталоге системы. */
    id: string;
    /** Подпись эффекта в проверке. */
    name: string;
    /** Место окна. */
    context: EffectFormContext;
    /** Что ещё влияет на раскладку (область у заклинания). */
    layoutOptions?: EffectFormLayoutOptions;
    /** Эффект, как его хранит сервер. */
    storedEffect: Record<string, unknown>;
  }

  /**
   * Проверяет эффекты раздела каталога: круг «открыл и сохранил» ничего не
   * теряет, а в своём месте окна нет неработающих полей.
   *
   * @param title название раздела.
   * @param scenarios сценарии раздела.
   */
  function describeScenarios(
    title: string,
    scenarios: readonly EffectScenario[],
  ): void {
    describe(title, () => {
      // Цикл, а не `it.each`: у `it.each` подпись приходит в кавычках и
      // обрезается, а по ней ищут упавший сценарий
      for (const {
        id,
        context,
        layoutOptions,
        name,
        storedEffect,
      } of scenarios) {
        it(`[${id}] «${name}» переживает круг «открыл и сохранил»`, () => {
          const savedEffects = normalizeActiveEffects(
            normalizeLoadedActiveEffects([storedEffect]),
            context,
            layoutOptions,
          );

          expect(stripUndefinedKeys(savedEffects), name).toEqual([
            storedEffect,
          ]);
        });

        it(`[${id}] «${name}»: в месте окна «${context}» нет неработающих полей`, () => {
          const inertFields = normalizeLoadedActiveEffects([storedEffect]).map(
            (effect) =>
              listInertEffectFields(
                effect,
                resolveEffectFormLayout(context, effect, layoutOptions),
              ),
          );

          // Один эффект без неработающих полей: выпавший при загрузке эффект
          // дал бы пустой список и тоже уронил бы проверку
          expect(inertFields, name).toEqual([[]]);
        });
      }
    });
  }

  describeScenarios('каталог: вопросы человеку', [
    {
      id: 'Q01',
      name: 'Опутывание',
      context: 'spell',
      layoutOptions: { zoneAvailable: false },
      storedEffect: createRawEffect({
        id: 'Опутывание',
        name: 'Опутывание',
        conditionKey: 'restrained',
        escape: {
          by: 'self',
          cost: 'action',
          check: { skill: 'athletics', dc: APPLIER_SAVE_DC },
          onSuccess: 'removeSelf',
        },
      }),
    },
    {
      id: 'Q09',
      name: 'Горение с ценой и вопросом',
      context: 'ownEffects',
      storedEffect: createRawEffect({
        id: 'Горение',
        name: 'Горение',
        triggers: [
          {
            id: 'trigger_tick',
            event: 'turnStart',
            cost: 'bonus',
            ask: true,
            actions: [
              {
                type: 'damage',
                // Тип урона сайт хранит токеном формулы, цель части пишет явно —
                // у системы это поле `type` и умолчание цели
                parts: [{ formula: '3@dmg.fire', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q09',
      name: 'Горение без цены и вопроса',
      context: 'ownEffects',
      // Такое срабатывание система пишет старым полем «урон каждый ход»
      storedEffect: createRawEffect({
        id: 'Горение',
        name: 'Горение',
        recurringDamage: {
          // Тип урона — токеном формулы, цель части — явно
          damageParts: [{ formula: '3@dmg.fire', target: 'selected' }],
          timing: 'startOfTurn',
        },
      }),
    },
    {
      id: 'Q02',
      name: 'Эвардовы чёрные щупальца',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Эвардовы чёрные щупальца',
        name: 'Эвардовы чёрные щупальца',
        triggers: [
          {
            id: 'trigger_crush',
            event: 'turnStart',
            ask: true,
            actions: [
              {
                type: 'damage',
                // Тип урона — токеном формулы, цель части — явно
                parts: [{ formula: '3@dmg.bludgeoning', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q04',
      name: 'Ответный удар',
      context: 'ownEffects',
      storedEffect: createRawEffect({
        id: 'Ответный удар',
        name: 'Ответный удар',
        triggers: [
          {
            id: 'trigger_riposte',
            event: 'turnEnd',
            cost: 'reaction',
            actions: [
              {
                type: 'damage',
                // Тип урона — токеном формулы, цель части — явно
                parts: [{ formula: '3@dmg.slashing', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q05',
      name: 'Принуждение',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Принуждение',
        name: 'Принуждение',
        triggers: [
          {
            id: 'trigger_remind',
            event: 'turnStart',
            actions: [
              {
                type: 'notify',
                text: 'Двигайся в указанную сторону',
                to: 'subject',
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q06',
      name: 'Проклятие гибельного старения',
      context: 'ownEffects',
      storedEffect: createRawEffect({
        id: 'Проклятие гибельного старения',
        name: 'Проклятие гибельного старения',
        changes: [
          {
            key: 'ability.strength',
            mode: 'add',
            value: '-2',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
        stages: [
          {
            label: 'Сила −2',
            changes: [
              {
                key: 'ability.strength',
                mode: 'add',
                value: '-2',
                priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
              },
            ],
            flags: [],
          },
          {
            label: 'Сила −4',
            changes: [
              {
                key: 'ability.strength',
                mode: 'add',
                value: '-4',
                priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
              },
            ],
            flags: [],
          },
        ],
        stageIndex: 0,
      }),
    },
    {
      id: 'Q07',
      name: 'Пылающая сфера на цели',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Пылающая сфера',
        name: 'Пылающая сфера',
        effectTarget: 'target',
        triggers: [
          {
            id: 'trigger_move',
            event: 'activate',
            cost: 'bonus',
            actions: [
              {
                type: 'damage',
                // Тип урона — токеном формулы, цель части — явно
                parts: [{ formula: '4@dmg.fire', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q07',
      name: 'Пылающая сфера на заклинателе',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Пылающая сфера',
        name: 'Пылающая сфера',
        triggers: [
          {
            id: 'trigger_move',
            event: 'activate',
            cost: 'bonus',
            actions: [
              {
                type: 'damage',
                // Тип урона — токеном формулы, цель части — явно
                parts: [{ formula: '4@dmg.fire', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Q08',
      name: 'Дверь измерений',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Дверь измерений',
        name: 'Дверь измерений',
        // Каталог: «spell → цель». В тесте системы доставки нет, а спасбросок
        // эффекта на заклинателе в окне не работает
        effectTarget: 'target',
        applySave: {
          ability: 'charisma',
          dc: SAVE_DC,
          onSuccess: 'negate',
          allowWilling: true,
        },
      }),
    },
  ]);

  describeScenarios('каталог: словарь условий', [
    {
      id: 'TC03',
      name: 'Временные хиты, характеристика и раса носителя',
      context: 'ownEffects',
      // В сценарии эффекта нет: части словаря положены в срабатывания, как их
      // перечисляет каталог
      storedEffect: createRawEffect({
        id: 'Условия о носителе',
        name: 'Условия о носителе',
        triggers: [
          {
            id: 'trigger_self_at_least',
            event: 'turnStart',
            condition:
              'self.hp.temp === 0 && self.ability["strength"] >= 13 && self.species === "эльф"',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
          {
            id: 'trigger_self_at_most',
            event: 'turnEnd',
            condition:
              'self.ability["strength"] <= 12 && self.species === "Дварф"',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'TC04',
      name: 'Наложивший, окровавленность и хиты другой стороны',
      context: 'ownEffects',
      // В сценарии эффекта нет: другая сторона есть у события урона
      storedEffect: createRawEffect({
        id: 'Условия о другой стороне',
        name: 'Условия о другой стороне',
        triggers: [
          {
            id: 'trigger_other',
            event: 'damageTaken',
            condition:
              'target.isSource === true && target.hp.value <= (target.hp.max / 2) && target.hp.value <= 10',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'TC05',
      name: 'Урон, расстояние и вид атаки из данных события',
      context: 'ownEffects',
      // В сценарии эффекта нет: каждая часть — на событии, где есть её данные
      storedEffect: createRawEffect({
        id: 'Условия о событии',
        name: 'Условия о событии',
        triggers: [
          {
            id: 'trigger_damage',
            event: 'damageTaken',
            condition: 'damage.amount >= 10 && source.distance <= 30',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
          {
            id: 'trigger_attack',
            event: 'attackRoll',
            condition:
              'attack.kind === "melee" && attack.ability === "strength"',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'TC07',
      name: 'Жуткий смех Таши с режимом по условию',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Жуткий смех Таши',
        name: 'Жуткий смех Таши',
        triggers: [
          {
            id: 'trigger_save',
            event: 'turnEnd',
            save: {
              ability: 'wisdom',
              dc: TRIGGER_SAVE_DC,
              modeIf: [{ condition: 'self.hp.temp === 0', mode: 'advantage' }],
            },
            actions: [{ type: 'removeSelf' }],
          },
        ],
      }),
    },
    {
      id: 'TC08',
      name: 'Жуткий смех Таши с успехом и провалом по условию',
      context: 'spell',
      // В сценарии спасбросок без эффекта: он положен в срабатывание, как у
      // второго сценария TC08
      storedEffect: createRawEffect({
        id: 'Жуткий смех Таши',
        name: 'Жуткий смех Таши',
        triggers: [
          {
            id: 'trigger_save',
            event: 'turnEnd',
            save: {
              ability: 'wisdom',
              dc: TRIGGER_SAVE_DC,
              autoSuccessIf: 'self.hp.temp === 0',
              autoFailIf: 'self.hp.value <= 20',
            },
            actions: [{ type: 'removeSelf', on: 'saved' }],
          },
        ],
      }),
    },
    {
      id: 'TC08',
      name: 'Жуткий смех Таши с автоматическим успехом',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Жуткий смех Таши',
        name: 'Жуткий смех Таши',
        triggers: [
          {
            id: 'trigger_save',
            event: 'turnEnd',
            save: {
              ability: 'wisdom',
              dc: UNBEATABLE_SAVE_DC,
              autoSuccessIf: 'self.hp.temp === 0',
            },
            actions: [{ type: 'removeSelf', on: 'saved' }],
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: действия срабатываний', [
    {
      id: 'A01',
      name: 'Защита от яда',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Защита от яда',
        name: 'Защита от яда',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'removeCondition', conditionKey: 'poisoned' }],
          },
        ],
      }),
    },
    {
      id: 'A02',
      name: 'Заражение',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Заражение',
        name: 'Заражение',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'poisoned',
                locked: true,
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'A02',
      name: 'Снятие',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Снятие',
        name: 'Снятие',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'removeCondition', conditionKey: 'poisoned' }],
          },
        ],
      }),
    },
    {
      id: 'A03',
      name: 'Слово силы: Исцеление',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Слово силы: Исцеление',
        name: 'Слово силы: Исцеление',
        effectTarget: 'target',
        triggers: [
          {
            id: 'trigger_main',
            event: 'applied',
            actions: [
              { type: 'setHp', value: 0, toMax: true },
              { type: 'removeCondition' },
            ],
          },
        ],
      }),
    },
    {
      id: 'A04',
      name: 'Божественное слово',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Божественное слово',
        name: 'Божественное слово',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'kill' }],
          },
        ],
      }),
    },
    {
      id: 'A04',
      name: 'Воскрешение',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Воскрешение',
        name: 'Воскрешение',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'revive', full: true }],
          },
        ],
      }),
    },
    {
      id: 'A05',
      name: 'Ложная жизнь',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Ложная жизнь',
        name: 'Ложная жизнь',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'tempHp', amount: '5' }],
          },
        ],
      }),
    },
    {
      id: 'A05',
      name: 'Расход щита',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Расход щита',
        name: 'Расход щита',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'tempHp', amount: '3', mode: 'spend' }],
          },
        ],
      }),
    },
    {
      id: 'A06',
      name: 'Рассеивание магии',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Рассеивание магии',
        name: 'Рассеивание магии',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'dispel', maxLevel: DISPEL_MAX_LEVEL }],
          },
        ],
      }),
    },
    {
      id: 'A07',
      name: 'Вернуть ячейку',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Вернуть ячейку',
        name: 'Вернуть ячейку',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [
              {
                type: 'restore',
                what: 'spellSlot',
                level: RESTORED_SLOT_LEVEL,
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'A07',
      name: 'Вернуть ресурс',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Вернуть ресурс',
        name: 'Вернуть ресурс',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'restore', what: 'counter', counter: 'rage' }],
          },
        ],
      }),
    },
    {
      id: 'A08',
      name: 'Совершенство',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Совершенство',
        name: 'Совершенство',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'grantInspiration' }, { type: 'dropHeld' }],
          },
        ],
      }),
    },
    {
      id: 'A09',
      name: 'Изгоняющая кара',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Изгоняющая кара',
        name: 'Изгоняющая кара',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [{ type: 'endCast', whose: 'recipient' }],
          },
        ],
      }),
    },
    {
      id: 'A10',
      name: 'Сглаз',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Сглаз',
        name: 'Сглаз',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [
              { type: 'grantInspiration', on: 'saved' },
              { type: 'kill', on: 'failed' },
            ],
          },
        ],
      }),
    },
    {
      id: 'A11',
      name: 'Свобода перемещения',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Свобода перемещения',
        name: 'Свобода перемещения',
        suppressConditions: ['restrained'],
      }),
    },
    {
      id: 'A12',
      name: 'Волна грома',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Волна грома',
        name: 'Волна грома',
        triggers: [
          {
            id: 'trigger_main',
            event: 'turnStart',
            actions: [
              { type: 'move', kind: 'push', distance: SHIFT_DISTANCE_FEET },
            ],
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: ключи и флаги', [
    {
      id: 'K01',
      name: 'Иссушение',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Иссушение',
        name: 'Иссушение',
        triggers: [
          {
            id: 'trigger_drain',
            event: 'turnStart',
            actions: [{ type: 'reduceMaxHp', amount: '5' }],
          },
        ],
      }),
    },
    {
      id: 'K01',
      name: 'Аура жизни',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Аура жизни',
        name: 'Аура жизни',
        flags: ['hitPoints.maxReductionBlocked'],
      }),
    },
    {
      id: 'K02',
      name: 'Парализованный',
      context: 'condition',
      storedEffect: createRawEffect({
        id: 'Парализованный',
        name: 'Парализованный',
        flags: ['attacksAgainst.forceCritical'],
      }),
    },
    {
      id: 'K02',
      name: 'Адамантиновая броня',
      context: 'item',
      storedEffect: createRawEffect({
        id: 'Адамантиновая броня',
        name: 'Адамантиновая броня',
        flags: ['defense.critImmunity'],
      }),
    },
    {
      id: 'K03',
      name: 'Изгоняющая кара',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Изгоняющая кара',
        name: 'Изгоняющая кара',
        flags: ['defense.suppressAll'],
      }),
    },
    {
      id: 'K04',
      name: 'Цепи Белета',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Цепи Белета',
        name: 'Цепи Белета',
        flags: ['movement.teleportBlocked'],
      }),
    },
    {
      id: 'K05',
      name: 'Проклятие бессонницы',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Проклятие бессонницы',
        name: 'Проклятие бессонницы',
        flags: ['rest.noBenefit.long'],
      }),
    },
    {
      id: 'K06',
      name: 'Метка охотника',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Метка охотника',
        name: 'Метка охотника',
        changes: [
          {
            key: 'damage.all',
            mode: 'add',
            value: '1d6',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
      }),
    },
    {
      id: 'K06',
      name: 'Только рукопашный',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Только рукопашный',
        name: 'Только рукопашный',
        changes: [
          {
            key: 'damage.melee',
            mode: 'add',
            value: '1d4',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
      }),
    },
    {
      id: 'K07',
      name: 'Обращение в зверя',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Обращение в зверя',
        name: 'Обращение в зверя',
        changes: [
          {
            key: 'creatureType',
            mode: 'add',
            value: 'beast',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: значения формулой', [
    {
      id: 'V01',
      name: 'Вибрирующие жидкости',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Вибрирующие жидкости',
        name: 'Вибрирующие жидкости',
        savedRoll: '2к6',
        duration: { type: 'rounds', value: SAVED_ROLL_DURATION_ROUNDS },
        changes: [
          {
            key: 'armorClass',
            mode: 'add',
            value: '-@roll',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
        recurringDamage: {
          // Тип урона — токеном формулы, цель части — явно
          damageParts: [{ formula: '@roll@dmg.thunder', target: 'selected' }],
          timing: 'startOfTurn',
        },
      }),
    },
    {
      id: 'V04',
      name: 'Замешательство',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Замешательство',
        name: 'Замешательство',
        durationFormula: '1к4',
        duration: { type: 'rounds' },
      }),
    },
    {
      id: 'V08',
      name: 'Огненный щит',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Огненный щит',
        name: 'Огненный щит',
        charges: { max: FIRE_SHIELD_CHARGES, current: FIRE_SHIELD_CHARGES },
        triggers: [
          {
            id: 'trigger_burn',
            // В тесте системы событие `damaged` — такого события нет ни у
            // системы, ни у сайта: разбор записи выбросил бы срабатывание
            event: 'damageTaken',
            actions: [{ type: 'applyTag', tag: 'burned' }],
          },
        ],
      }),
    },
    {
      id: 'V09',
      name: 'Искра',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Искра',
        name: 'Искра',
        charges: { max: 1, current: 1, endsWhenEmpty: true },
        triggers: [
          {
            id: 'trigger_spark',
            // У системы `damaged` — см. «Огненный щит»
            event: 'damageTaken',
            actions: [{ type: 'applyTag', tag: 'sparked' }],
          },
        ],
      }),
    },
    {
      id: 'V11',
      name: 'Нарастающая порча',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Нарастающая порча',
        name: 'Нарастающая порча',
        changes: [
          {
            key: 'abilityCheck',
            mode: 'add',
            value: '-1',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
            step: { by: -1, per: 'turn', until: -5 },
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: получатели и отбор', [
    {
      id: 'R01',
      name: 'Маяк надежды',
      context: 'spell',
      // В сценарии эффекта нет: отборы «с носителем» положены в «всем в
      // радиусе» — как у эффекта R03
      storedEffect: createRawEffect({
        id: 'Маяк надежды',
        name: 'Маяк надежды',
        triggers: [
          {
            id: 'trigger_allies_with_self',
            event: 'damageTaken',
            recipient: 'area',
            area: { radius: SPELL_AREA_RADIUS, target: 'alliesWithSelf' },
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
          {
            id: 'trigger_all_with_self',
            event: 'damageTaken',
            recipient: 'area',
            area: { radius: SPELL_AREA_RADIUS, target: 'allWithSelf' },
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'R04',
      name: 'Прикосновение вампира',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Прикосновение вампира',
        name: 'Прикосновение вампира',
        triggers: [
          {
            id: 'trigger_drain',
            event: 'damageTaken',
            recipient: 'source',
            actions: [{ type: 'tempHp', amount: '5' }],
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: события срабатываний', [
    {
      id: 'E01',
      name: 'Печать жизни',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Печать жизни',
        name: 'Печать жизни',
        triggers: [
          {
            id: 'trigger_Печать жизни',
            event: 'healed',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E03',
      name: 'Освобождение от любого состояния',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Освобождение',
        name: 'Освобождение',
        triggers: [
          {
            id: 'trigger_Освобождение',
            event: 'conditionLost',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E03',
      name: 'Освобождение от Опутанности',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Освобождение',
        name: 'Освобождение',
        triggers: [
          {
            id: 'trigger_Освобождение',
            event: 'conditionLost',
            conditionKey: 'restrained',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E04',
      name: 'Кровавая жатва',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Кровавая жатва',
        name: 'Кровавая жатва',
        triggers: [
          {
            id: 'trigger_Кровавая жатва',
            event: 'downedOther',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E06',
      name: 'Шальная искра',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Шальная искра',
        name: 'Шальная искра',
        triggers: [
          {
            id: 'trigger_spark',
            event: 'turnStart',
            chancePercent: 50,
            limit: { max: 1, per: 'turn' },
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E07',
      name: 'Атака попала или промахнулась',
      context: 'spell',
      // В сценарии эффекта нет: части условия — у броска атаки, строками
      // `writeTriggerCondition`
      storedEffect: createRawEffect({
        id: 'Попадание и промах',
        name: 'Попадание и промах',
        triggers: [
          {
            id: 'trigger_landed',
            event: 'attackRoll',
            condition: 'attack.landed === true',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
          {
            id: 'trigger_missed',
            event: 'attackRoll',
            condition: 'attack.landed === false',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E17',
      name: 'Расписание на втором раунде',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Расписание',
        name: 'Расписание',
        triggers: [
          {
            id: 'trigger_Расписание',
            event: 'healed',
            condition: 'combat.round === 2',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E17',
      name: 'Расписание не раньше второго раунда',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Расписание',
        name: 'Расписание',
        triggers: [
          {
            id: 'trigger_Расписание',
            event: 'healed',
            condition: 'combat.round >= 2',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E17',
      name: 'Расписание хода',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Расписание хода',
        name: 'Расписание хода',
        triggers: [
          {
            id: 'trigger_Расписание хода',
            event: 'turnStart',
            condition: 'combat.round === 2',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E17',
      name: 'Расписание действия',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Расписание действия',
        name: 'Расписание действия',
        triggers: [
          {
            id: 'trigger_Расписание действия',
            event: 'activate',
            condition: 'combat.round === 2',
            actions: [{ type: 'applyTag', tag: 'fired' }],
          },
        ],
      }),
    },
    {
      id: 'E09',
      name: 'Громовой клинок',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Громовой клинок',
        name: 'Громовой клинок',
        triggers: [
          {
            id: 'trigger_booming_blade',
            event: 'moved',
            condition: 'move.forced === false',
            actions: [
              {
                type: 'damage',
                // Цель части урона сайт пишет явно — у системы это умолчание
                parts: [{ formula: '1d8@dmg.thunder', target: 'selected' }],
              },
              { type: 'removeSelf' },
            ],
          },
        ],
      }),
    },
    {
      id: 'E09',
      name: 'Шипастый след',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Шипастый след',
        name: 'Шипастый след',
        triggers: [
          {
            id: 'trigger_trail',
            event: 'moved',
            everyFeet: PATH_STEP_FEET,
            actions: [
              {
                type: 'damage',
                // Цель части урона сайт пишет явно — у системы это умолчание
                parts: [{ formula: '1@dmg.piercing', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: зоны и ауры', [
    {
      id: 'Z15',
      name: 'Аура живучести',
      context: 'spell',
      storedEffect: createRawEffect({
        id: 'Аура живучести',
        name: 'Аура живучести',
        triggers: [
          {
            id: 'trigger_heal',
            event: 'turnStart',
            recipient: 'choice',
            choice: { radius: SPELL_AREA_RADIUS, target: 'allies', count: 1 },
            actions: [
              {
                type: 'damage',
                // Цель части урона сайт пишет явно — у системы это умолчание
                parts: [{ formula: '5@heal', target: 'selected' }],
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Z17',
      name: 'Паутина',
      context: 'zone',
      storedEffect: createRawEffect({
        id: 'Паутина',
        name: 'Паутина',
        areaTrigger: 'enter',
        triggers: [
          {
            id: 'trigger_web',
            event: 'enter',
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'restrained',
                endsOnExit: true,
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'Z18',
      name: 'Облако смерти',
      context: 'spell',
      // `castId` из теста системы не переносится: его проставляет VTTG при
      // касте, а сайт такого поля не хранит
      storedEffect: createRawEffect({
        id: 'Облако смерти',
        name: 'Облако смерти',
        triggers: [
          {
            id: 'trigger_cloudkill_drift',
            event: 'turnStart',
            actions: [
              { type: 'moveArea', kind: 'away', distance: SHIFT_DISTANCE_FEET },
            ],
          },
        ],
      }),
    },
    {
      id: 'Z18',
      name: 'Тьма',
      context: 'spell',
      // `castId` — см. «Облако смерти»
      storedEffect: createRawEffect({
        id: 'Тьма',
        name: 'Тьма',
        triggers: [
          {
            id: 'trigger_darkness_follow',
            event: 'moved',
            actions: [{ type: 'moveArea', kind: 'follow' }],
          },
        ],
      }),
    },
  ]);

  describeScenarios('каталог: магические предметы и оружие', [
    {
      id: 'W01b',
      name: 'Магическое оружие',
      context: 'weapon',
      storedEffect: createRawEffect({
        id: 'Магическое оружие',
        name: 'Магическое оружие',
        changes: [
          {
            key: 'damage.weapon',
            mode: 'add',
            value: '1d4@dmg.force',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
          {
            key: 'attack.weapon',
            mode: 'add',
            value: '1',
            priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
          },
        ],
      }),
    },
  ]);
});

describe('spell-zones', () => {
  /** «Лунный луч»: урон каждый ход в зоне, спасбросок Телосложения Сл заклинателя. */
  const MOONBEAM_STAY = createEffect({
    name: 'Лунный луч',
    effectTarget: 'zone',
    recurringDamage: {
      damageParts: [{ formula: '2d10@dmg.radiant+@mod.spell' }],
      timing: 'endOfTurn',
      save: { ability: 'constitution', dc: APPLIER_SAVE_DC, onSuccess: 'half' },
    },
  });

  /** «Паутина»: при входе спасбросок Ловкости, провал — «Опутанный». */
  const WEB_ENTER = createEffect({
    name: 'Опутанный',
    effectTarget: 'zone',
    areaTrigger: 'enter',
    applySave: {
      ability: 'dexterity',
      dc: APPLIER_SAVE_DC,
      onSuccess: 'negate',
    },
    conditionKey: 'restrained',
    duration: { type: 'rounds', value: 10 },
  });

  describe('форма эффекта заклинания: доставка «зоной на месте области»', () => {
    it('зона — одна из доставок заклинания; обычный эффект заклинания остаётся «на цели»', () => {
      const layout = resolveEffectFormLayout(
        'spell',
        createEffect({ effectTarget: 'target' }),
      );

      expect(layout.deliveryOptions).toEqual([
        'target',
        'carrier',
        'aura',
        'zone',
      ]);

      expect(layout.delivery).toBe('target');
      expect(readEffectDelivery(MOONBEAM_STAY, 'spell')).toBe('zone');
      expect(readEffectDelivery(createEffect(), 'spell')).toBe('carrier');
    });

    it('сл 0 — Сл заклинателя у зоны заклинания; момент — как у ауры, без её настроек', () => {
      const layout = resolveEffectFormLayout('spell', WEB_ENTER);

      expect(layout.minSaveDc).toBe(APPLIER_SAVE_DC);
      expect(layout.showTrigger).toBe(true);
      expect(layout.showAuraSettings).toBe(false);
      expect(layout.showSave).toBe(true);

      expect(resolveEffectFormLayout('item', WEB_ENTER).minSaveDc).toBe(
        FIXED_MIN_SAVE_DC,
      );
    });

    it('зона «пока в зоне»: без спасброска и длительности, с уроном каждый ход', () => {
      const layout = resolveEffectFormLayout('spell', MOONBEAM_STAY);

      expect(layout.showSave).toBe(false);
      expect(layout.saveUnavailableReason).toBe('stayTrigger');
      expect(layout.showDuration).toBe(false);
      expect(layout.showRecurringDamage).toBe(true);
    });

    it('смена доставки: в зону и обратно на цель без хвостов момента срабатывания', () => {
      const zoneEffect = writeEffectDelivery(createEffect(), 'zone');

      expect(zoneEffect.effectTarget).toBe('zone');

      const targetEffect = writeEffectDelivery(
        { ...zoneEffect, areaTrigger: 'enter' },
        'target',
      );

      expect(targetEffect.effectTarget).toBe('target');
      expect(targetEffect.areaTrigger).toBeUndefined();
    });

    it('без области у заклинания зону не предлагают, а уже выбранная — неработающее поле', () => {
      const layout = resolveEffectFormLayout(
        'spell',
        createEffect({ effectTarget: 'target' }),
        { zoneAvailable: false },
      );

      expect(layout.deliveryOptions).toEqual(['target', 'carrier', 'aura']);

      const zoneLayout = resolveEffectFormLayout('spell', MOONBEAM_STAY, {
        zoneAvailable: false,
      });

      expect(listInertEffectFields(MOONBEAM_STAY, zoneLayout)).toEqual([
        'effectTarget',
      ]);

      expect(
        clearInertEffectFields(MOONBEAM_STAY, ['effectTarget'], 'spell')
          .effectTarget,
      ).toBe('target');
    });

    it('«в зону» не работает у предмета, умения, черты и действия существа и у своих эффектов', () => {
      for (const context of [
        'item',
        'feature',
        'creatureTrait',
        'creatureAction',
        'ownEffects',
      ] as const) {
        const layout = resolveEffectFormLayout(context, MOONBEAM_STAY);

        expect(listInertEffectFields(MOONBEAM_STAY, layout), context).toContain(
          'effectTarget',
        );
      }
    });

    it('сводка говорит о зоне заклинания и Сл заклинателя', () => {
      expect(describeEffectScenario(MOONBEAM_STAY, 'spell')).toBe(
        'Пока существо в зоне заклинания: каждый ход 2d10+мод. закл. характеристики излучением в конце хода '
          + '(спасбросок Телосложения, Сл заклинателя: успех — половина урона).',
      );

      expect(describeEffectScenario(WEB_ENTER, 'spell')).toBe(
        'При входе в зону заклинания: спасбросок Ловкости, Сл заклинателя. '
          + 'Провал — «Опутанный», на 10 раундов. Успех — ничего.',
      );
    });
  });
});

describe('trigger-conditions', () => {
  describe('словарь условий срабатываний', () => {
    it('разбор и сборка частей: значения из словаря, незнакомое остаётся строкой', () => {
      const condition =
        'damage.type === "fire" && damage.isCritical === false && мутная строка';

      const parts = readTriggerConditionParts(condition);

      expect(parts).toEqual([
        { kind: 'damageType', value: 'fire' },
        { kind: 'damageNotCritical' },
        'мутная строка',
      ]);

      expect(writeTriggerCondition(parts)).toBe(condition);
      expect(writeTriggerCondition([])).toBeUndefined();
      expect(parseTriggerConditionPart('damage.type === "мана"')).toBeNull();

      expect(parseTriggerConditionPart('self.tag !== "огонь"')).toEqual({
        kind: 'selfTagNot',
        value: 'огонь',
      });

      // Ключ отметки без пробелов и кавычек
      expect(parseTriggerConditionPart('self.tag === "a b"')).toBeNull();
    });

    it('тип носителя и другой стороны, помеченная носителем цель', () => {
      expect(
        readTriggerConditionParts(
          'self.creatureType === "undead" && target.creatureType === "humanoid" && target.markedBySelf',
        ),
      ).toEqual([
        { kind: 'selfCreatureType', value: 'undead' },
        { kind: 'otherCreatureType', value: 'humanoid' },
        { kind: 'otherMarkedBySelf' },
      ]);
    });

    it('хиты, размер и состояние: разбор, сборка и фразы', () => {
      const condition =
        'self.hp.value <= 50 && self.size >= "large" && self.condition === "poisoned"';

      const parts = readTriggerConditionParts(condition);

      expect(parts).toEqual([
        { kind: 'selfHpAtMost', value: '50' },
        { kind: 'selfSizeAtLeast', value: 'large' },
        { kind: 'selfCondition', value: 'poisoned' },
      ]);

      // Число пишется без кавычек, иначе VTTG сравнил бы строку
      expect(writeTriggerCondition(parts)).toBe(condition);

      expect(describeTriggerCondition(condition)).toBe(
        'у носителя не больше 50 хитов и носитель размером не меньше «Большой» '
          + 'и носитель в состоянии «Отравленный»',
      );

      // «Окровавлен» — своя часть, а не «хитов не больше»
      expect(
        parseTriggerConditionPart('self.hp.value <= (self.hp.max / 2)'),
      ).toEqual({ kind: 'selfBloodied' });

      expect(parseTriggerConditionPart('self.size >= "крошечный"')).toBeNull();
      expect(parseTriggerConditionPart('self.hp.value <= -5')).toBeNull();
    });

    it('счётчик отметок: ключ в скобках и порог', () => {
      const condition = 'self.tagCount["провал"] >= 3';

      expect(parseTriggerConditionPart(condition)).toEqual({
        kind: 'selfTagCountAtLeast',
        value: 'провал',
        amount: 3,
      });

      expect(
        writeTriggerCondition([
          { kind: 'selfTagCountAtLeast', value: 'провал', amount: 3 },
        ]),
      ).toBe(condition);

      // Без порога пишется значение по умолчанию: строка остаётся разбираемой
      expect(
        writeTriggerCondition([
          { kind: 'selfTagCountAtLeast', value: 'провал' },
        ]),
      ).toBe(`self.tagCount["провал"] >= ${DEFAULT_TAG_COUNT_THRESHOLD}`);

      expect(describeTriggerCondition(condition)).toBe(
        'отметок «провал» на носителе не меньше 3',
      );

      expect(triggerConditionHasAmount('selfTagCountAtLeast')).toBe(true);
      expect(triggerConditionHasAmount('selfTag')).toBe(false);
      expect(normalizeTagCountThreshold(null)).toBe(MIN_TAG_COUNT_THRESHOLD);
      expect(normalizeTagCountThreshold(0)).toBe(MIN_TAG_COUNT_THRESHOLD);
      expect(normalizeTagCountThreshold(4.7)).toBe(4);
      expect(parseTriggerConditionPart('self.tagCount["a b"] >= 3')).toBeNull();
    });

    it('отметка от наложившего; приёма оружия в правилах 2014 нет', () => {
      expect(
        readTriggerConditionParts('self.tagFromSource === "charm"'),
      ).toEqual([{ kind: 'selfTagFromSource', value: 'charm' }]);

      expect(listTriggerConditionKinds('applied')).not.toContain(
        'sourceWeaponMastery',
      );

      // Строка приёма оружия из данных не разбирается в часть словаря
      expect(
        parseTriggerConditionPart('source.weaponMastery === true'),
      ).toBeNull();

      expect(listTriggerConditionKinds('turnStart')).toContain('selfHpAtMost');
    });

    it('части по событию: урон — только у событий урона, режим броска — у атаки', () => {
      const turnKinds = listTriggerConditionKinds('turnStart');
      const damageKinds = listTriggerConditionKinds('damageTaken');
      const attackKinds = listTriggerConditionKinds('attackRoll');

      expect(turnKinds).not.toContain('damageType');
      expect(turnKinds).toContain('selfBloodied');
      expect(turnKinds).toContain('selfTag');
      expect(damageKinds).toContain('damageTypeNot');
      expect(damageKinds).toContain('otherCreatureType');
      expect(damageKinds).not.toContain('rollAdvantage');
      expect(attackKinds).toContain('otherMarkedBySelf');
      expect(attackKinds).not.toContain('damageCritical');
    });

    it('подпись условия: части словаря фразой, незнакомое — кодом', () => {
      expect(
        describeTriggerCondition(
          'damage.type === "fire" && self.hp.value <= (self.hp.max / 2) && нечто',
        ),
      ).toBe('урон огненный и у носителя не больше половины хитов и нечто');
    });

    it('[TC01] части словаря 0.8.66: собрал в форме → строка → разобрал — те же части', () => {
      const parts: TriggerConditionPart[] = [
        { kind: 'selfTempHpZero' },
        { kind: 'selfGrounded' },
        { kind: 'otherIsSource' },
        { kind: 'otherBloodied' },
        { kind: 'selfSpecies', value: 'Эльф' },
        { kind: 'selfAbilityAtLeast', value: 'strength', amount: 13 },
        { kind: 'selfAbilityAtMost', value: 'dexterity', amount: 8 },
        { kind: 'otherHpAtMost', value: '25' },
        { kind: 'damageAtLeast', value: '10' },
        { kind: 'sourceWithin', value: '30' },
        { kind: 'attackKind', value: 'melee' },
        { kind: 'attackAbility', value: 'strength' },
        { kind: 'attackLanded' },
        { kind: 'attackMissed' },
        { kind: 'combatRoundIs', value: '2' },
        { kind: 'combatRoundAtLeast', value: '3' },
        { kind: 'movementOwn' },
        { kind: 'movementForced' },
      ];

      const condition = writeTriggerCondition(parts);

      expect(readTriggerConditionParts(condition)).toEqual(parts);

      expect(condition).toBe(
        [
          'self.hp.temp === 0',
          'self.grounded === true',
          'target.isSource === true',
          'target.hp.value <= (target.hp.max / 2)',
          'self.species === "Эльф"',
          'self.ability["strength"] >= 13',
          'self.ability["dexterity"] <= 8',
          'target.hp.value <= 25',
          'damage.amount >= 10',
          'source.distance <= 30',
          'attack.kind === "melee"',
          'attack.ability === "strength"',
          'attack.landed === true',
          'attack.landed === false',
          'combat.round === 2',
          'combat.round >= 3',
          'move.forced === false',
          'move.forced === true',
        ].join(' && '),
      );

      expect(triggerConditionHasAmount('selfAbilityAtLeast')).toBe(true);

      // Без порога пишется порог по умолчанию: строка остаётся разбираемой
      expect(
        writeTriggerCondition([{ kind: 'selfAbilityAtMost', value: 'wisdom' }]),
      ).toBe(`self.ability["wisdom"] <= ${DEFAULT_ABILITY_THRESHOLD}`);
    });

    it('[TC02] незнакомая часть и чужое значение остаются строкой, соседние разбираются', () => {
      const condition = 'self.hp.temp === 0 && self.чужое === "x"';

      expect(readTriggerConditionParts(condition)).toEqual([
        { kind: 'selfTempHpZero' },
        'self.чужое === "x"',
      ]);

      expect(
        parseTriggerConditionPart('self.ability["luck"] >= 10'),
      ).toBeNull();

      expect(parseTriggerConditionPart('attack.kind === "psionic"')).toBeNull();
      expect(parseTriggerConditionPart('self.species === ""')).toBeNull();

      // «Окровавлена другая сторона» — своя часть, а не «хитов не больше»
      expect(
        parseTriggerConditionPart('target.hp.value <= (target.hp.max / 2)'),
      ).toEqual({ kind: 'otherBloodied' });
    });

    it('[TC06] часть предлагается только там, где на событии есть её данные', () => {
      const turnKinds = listTriggerConditionKinds('turnStart');
      const attackKinds = listTriggerConditionKinds('attackRoll');
      const movedKinds = listTriggerConditionKinds('moved');
      const restKinds = listTriggerConditionKinds('rest');

      expect(turnKinds).toContain('selfTempHpZero');
      expect(turnKinds).toContain('sourceWithin');
      expect(turnKinds).toContain('combatRoundIs');
      expect(turnKinds).not.toContain('attackKind');
      expect(turnKinds).not.toContain('otherIsSource');
      expect(turnKinds).not.toContain('movementOwn');
      expect(attackKinds).toContain('attackLanded');
      expect(attackKinds).toContain('otherBloodied');
      expect(attackKinds).not.toContain('damageAtLeast');

      expect(listTriggerConditionKinds('damageTaken')).toContain(
        'damageAtLeast',
      );

      expect(listTriggerConditionKinds('applied')).toContain('attackAbility');

      expect(listTriggerConditionKinds('downedOther')).toContain(
        'otherHpAtMost',
      );

      expect(movedKinds).toContain('movementForced');
      expect(movedKinds).not.toContain('attackKind');
      // Отдых идёт вне боя: номера раунда у него нет
      expect(restKinds).not.toContain('combatRoundAtLeast');
    });

    it('фразы новых частей условия', () => {
      expect(
        describeTriggerCondition(
          'self.ability["strength"] >= 13 && attack.kind === "melee" && attack.ability === "dexterity"',
        ),
      ).toBe(
        'Сила носителя не меньше 13 и атака рукопашная и атака считается '
          + 'характеристикой «Ловкость»',
      );

      expect(
        describeTriggerCondition(
          'self.species === "Эльф" && combat.round >= 3 && move.forced === false',
        ),
      ).toBe('раса носителя — «Эльф» и с 3-го раунда боя и носитель шёл сам');

      expect(
        describeTriggerCondition(
          'target.hp.value <= 25 && source.distance <= 30 && damage.amount >= 10',
        ),
      ).toBe(
        'у другой стороны не больше 25 хитов и наложивший в пределах 30 фт и '
          + 'урон не меньше 10',
      );
    });
  });
});

describe('trigger-row-model', () => {
  /** Спасбросок строки: Телосложение, Сл 13. */
  const TRIGGER_ROW_CONSTITUTION_SAVE = {
    ability: 'constitution',
    dc: 13,
  } as const;

  /** Формула Сл от урона события. */
  const DAMAGE_DC_FORMULA = 'max(10, floor(@damage / 2))';

  /** Срок отметки или состояния в тестах, раундов. */
  const ACTION_ROUNDS = 2;

  /**
   * Раскладка формы с заданным набором действий срабатывания: так тест не
   * зависит от того, какие действия место формы разрешает.
   */
  const TRIGGER_LAYOUT: EffectFormLayout = {
    ...resolveLayoutFor('feature'),
    triggerActions: [
      'damage',
      'applyCondition',
      'applyTag',
      'setHp',
      'removeSelf',
    ],
  };

  /** Урон «провал — полный, успех — половина». */
  const HALF_DAMAGE_ACTION: EffectTriggerAction = {
    type: 'damage',
    parts: POISON_DAMAGE,
    on: 'always',
    halfOnSave: true,
  };

  /** Отравление при успехе на два раунда. */
  const SAVED_CONDITION_ACTION: EffectTriggerAction = {
    type: 'applyCondition',
    conditionKey: 'poisoned',
    on: 'saved',
    duration: { type: 'rounds', value: ACTION_ROUNDS },
  };

  /**
   * Строка срабатывания.
   *
   * @param overrides поля, отличные от умолчания.
   * @returns строка.
   */
  function createTrigger(
    overrides: Partial<EffectTrigger> = {},
  ): EffectTrigger {
    return {
      id: 'trigger_test',
      event: 'turnStart',
      actions: [],
      ...overrides,
    };
  }

  describe('новое действие срабатывания', () => {
    it('у каждого вида — свои значения по умолчанию', () => {
      expect(createEffectTriggerAction('damage')).toStrictEqual({
        type: 'damage',
        parts: [],
      });

      expect(createEffectTriggerAction('applyCondition')).toStrictEqual({
        type: 'applyCondition',
        conditionKey: DEFAULT_TRIGGER_CONDITION,
      });

      expect(createEffectTriggerAction('applyTag')).toStrictEqual({
        type: 'applyTag',
        tag: DEFAULT_EFFECT_TAG,
      });

      expect(createEffectTriggerAction('setHp')).toStrictEqual({
        type: 'setHp',
        value: DEFAULT_SET_HP_VALUE,
      });

      expect(createEffectTriggerAction('removeSelf')).toStrictEqual({
        type: 'removeSelf',
      });
    });
  });

  describe('действие без исхода', () => {
    it('урон теряет исход и «половину», части остаются', () => {
      expect(clearTriggerActionGate(HALF_DAMAGE_ACTION)).toStrictEqual({
        type: 'damage',
        parts: POISON_DAMAGE,
      });
    });

    it('остальные действия теряют только исход', () => {
      expect(clearTriggerActionGate(SAVED_CONDITION_ACTION)).toEqual({
        type: 'applyCondition',
        conditionKey: 'poisoned',
        duration: { type: 'rounds', value: ACTION_ROUNDS },
      });
    });
  });

  describe('спасбросок без формулы Сл', () => {
    it('остаются характеристика и число', () => {
      expect(
        omitTriggerSaveDcFormula({
          ...TRIGGER_ROW_CONSTITUTION_SAVE,
          dcFormula: DAMAGE_DC_FORMULA,
        }),
      ).toStrictEqual(TRIGGER_ROW_CONSTITUTION_SAVE);
    });
  });

  describe('смена события строки', () => {
    it('с броска атаки на ход: роль и получатель снимаются, id и условие остаются', () => {
      const trigger = createTrigger({
        event: 'attackRoll',
        role: 'target',
        recipient: 'other',
        condition: 'roll.hasAdvantage',
        actions: [{ type: 'removeSelf', on: 'always' }],
      });

      expect(writeTriggerEvent(trigger, 'turnEnd', TRIGGER_LAYOUT)).toEqual({
        id: trigger.id,
        event: 'turnEnd',
        condition: 'roll.hasAdvantage',
        actions: [{ type: 'removeSelf', on: 'always' }],
      });
    });

    it('с хода на бросок атаки: чей ход снимается, роль — по умолчанию', () => {
      const trigger = createTrigger({ event: 'turnStart', turnOf: 'source' });

      expect(writeTriggerEvent(trigger, 'attackRoll', TRIGGER_LAYOUT)).toEqual({
        id: trigger.id,
        event: 'attackRoll',
        role: DEFAULT_TRIGGER_ATTACK_ROLE,
        actions: [],
      });
    });

    it('роль у броска атаки сохраняется', () => {
      const trigger = createTrigger({ event: 'attackRoll', role: 'target' });

      expect(
        writeTriggerEvent(trigger, 'attackRoll', TRIGGER_LAYOUT).role,
      ).toBe('target');
    });

    it('формула Сл остаётся у событий урона и снимается у остальных', () => {
      const save = {
        ...TRIGGER_ROW_CONSTITUTION_SAVE,
        dcFormula: DAMAGE_DC_FORMULA,
      };

      const trigger = createTrigger({ event: 'damageTaken', save });

      expect(writeTriggerEvent(trigger, 'hpZero', TRIGGER_LAYOUT).save).toEqual(
        save,
      );

      expect(
        writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
      ).toStrictEqual(TRIGGER_ROW_CONSTITUTION_SAVE);
    });

    it('без спасброска спасбросок не появляется', () => {
      const trigger = createTrigger({ event: 'damageTaken' });

      expect(
        writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
      ).toBeUndefined();
    });

    it('действия, которые на новом событии не работают, отбрасываются', () => {
      const setHpAction = createEffectTriggerAction('setHp');
      const damageAction = createEffectTriggerAction('damage');

      const trigger = createTrigger({
        event: 'hpZero',
        actions: [setHpAction, damageAction],
      });

      expect(
        writeTriggerEvent(trigger, 'damageTaken', TRIGGER_LAYOUT).actions,
      ).toEqual([damageAction]);

      expect(
        writeTriggerEvent(trigger, 'hpZero', TRIGGER_LAYOUT).actions,
      ).toEqual([setHpAction, damageAction]);
    });
  });

  describe('исход действия по выбору', () => {
    it('у урона обычный исход снимает «половину»', () => {
      expect(
        writeTriggerActionGate(HALF_DAMAGE_ACTION, 'failed'),
      ).toStrictEqual({
        type: 'damage',
        parts: POISON_DAMAGE,
        on: 'failed',
      });
    });

    it('«половина» у урона — всегда и вдвое при успехе', () => {
      expect(
        writeTriggerActionGate(
          { type: 'damage', parts: POISON_DAMAGE, on: 'failed' },
          EFFECT_TRIGGER_DAMAGE_HALF_GATE,
        ),
      ).toStrictEqual(HALF_DAMAGE_ACTION);
    });

    it('«половина» не у урона не пишется', () => {
      expect(
        writeTriggerActionGate(
          SAVED_CONDITION_ACTION,
          EFFECT_TRIGGER_DAMAGE_HALF_GATE,
        ),
      ).toBeNull();
    });

    it('остальные действия получают выбранный исход', () => {
      expect(writeTriggerActionGate(SAVED_CONDITION_ACTION, 'failed')).toEqual({
        ...SAVED_CONDITION_ACTION,
        on: 'failed',
      });
    });
  });

  describe('срок действия в раундах', () => {
    it('читается у состояния и отметки со сроком в раундах', () => {
      expect(readTriggerActionRounds(SAVED_CONDITION_ACTION)).toBe(
        ACTION_ROUNDS,
      );

      expect(
        readTriggerActionRounds({
          type: 'applyTag',
          tag: DEFAULT_EFFECT_TAG,
          duration: { type: 'rounds', value: ACTION_ROUNDS },
        }),
      ).toBe(ACTION_ROUNDS);
    });

    it('без срока, со сроком не в раундах и у других действий — `null`', () => {
      expect(
        readTriggerActionRounds({ type: 'applyTag', tag: DEFAULT_EFFECT_TAG }),
      ).toBeNull();

      expect(
        readTriggerActionRounds({
          type: 'applyCondition',
          conditionKey: 'poisoned',
          duration: { type: 'permanent' },
        }),
      ).toBeNull();

      expect(readTriggerActionRounds(HALF_DAMAGE_ACTION)).toBeNull();
    });

    it('число пишется сроком в раундах', () => {
      expect(
        writeTriggerActionRounds(
          { type: 'applyTag', tag: DEFAULT_EFFECT_TAG },
          ACTION_ROUNDS,
        ),
      ).toEqual({
        type: 'applyTag',
        tag: DEFAULT_EFFECT_TAG,
        duration: { type: 'rounds', value: ACTION_ROUNDS },
      });
    });

    it('пустое поле и ноль снимают срок', () => {
      expect(
        writeTriggerActionRounds(SAVED_CONDITION_ACTION, undefined),
      ).toHaveProperty('duration', undefined);

      expect(
        writeTriggerActionRounds(SAVED_CONDITION_ACTION, null),
      ).toHaveProperty('duration', undefined);

      expect(
        writeTriggerActionRounds(SAVED_CONDITION_ACTION, 0),
      ).toHaveProperty('duration', undefined);
    });

    it('у действия без срока ничего не меняется', () => {
      expect(writeTriggerActionRounds(HALF_DAMAGE_ACTION, ACTION_ROUNDS)).toBe(
        HALF_DAMAGE_ACTION,
      );
    });
  });

  describe('заготовки новых действий', () => {
    it('каждое действие места «заклинание на цели» проходит схему записи', () => {
      const layout = resolveEffectFormLayout(
        'spell',
        createEffect({ effectTarget: 'target' }),
      );

      for (const actionType of layout.triggerActions) {
        const action = createEffectTriggerAction(actionType);

        const [loadedEffect] = normalizeLoadedActiveEffects([
          createEffect({
            triggers: [
              { id: 'trigger_new', event: 'applied', actions: [action] },
            ],
          }),
        ]);

        // Пустой `{ type }` у действия с обязательными полями выпал бы при
        // следующем открытии
        expect(loadedEffect?.triggers?.[0]?.actions, actionType).toEqual([
          action,
        ]);
      }
    });
  });

  describe('смена события строки 0.8.66', () => {
    it('снятое состояние и шаг пути живут только у своих событий', () => {
      const lostTrigger = createTrigger({
        event: 'conditionLost',
        conditionKey: 'grappled',
      });

      expect(
        writeTriggerEvent(lostTrigger, 'conditionLost', TRIGGER_LAYOUT)
          .conditionKey,
      ).toBe('grappled');

      expect(
        writeTriggerEvent(lostTrigger, 'turnStart', TRIGGER_LAYOUT)
          .conditionKey,
      ).toBeUndefined();

      const pathTrigger = createTrigger({ event: 'moved', everyFeet: 5 });

      expect(
        writeTriggerEvent(pathTrigger, 'moved', TRIGGER_LAYOUT).everyFeet,
      ).toBe(5);

      expect(
        writeTriggerEvent(pathTrigger, 'healed', TRIGGER_LAYOUT).everyFeet,
      ).toBeUndefined();
    });

    it('без формулы Сл режим спасброска и его условия остаются', () => {
      const save = {
        ...TRIGGER_ROW_CONSTITUTION_SAVE,
        mode: 'advantage',
        dcFormula: DAMAGE_DC_FORMULA,
        modeIf: [{ condition: 'self.hp.temp === 0', mode: 'disadvantage' }],
        autoFailIf: 'self.condition === "unconscious"',
      } as const;

      const trigger = createTrigger({ event: 'damageTaken', save });

      expect(
        writeTriggerEvent(trigger, 'turnStart', TRIGGER_LAYOUT).save,
      ).toStrictEqual({
        ...TRIGGER_ROW_CONSTITUTION_SAVE,
        mode: 'advantage',
        modeIf: [{ condition: 'self.hp.temp === 0', mode: 'disadvantage' }],
        autoFailIf: 'self.condition === "unconscious"',
      });
    });
  });
});

describe('triggers', () => {
  /** Спасбросок Телосложения со Сл эффектов в тестах, без исхода. */
  const CONSTITUTION_TRIGGER_SAVE = {
    ability: 'constitution',
    dc: SAVE_DC,
  } as const;

  /**
   * Подпись Сл для фраз: `APPLIER_SAVE_DC` — Сл заклинателя.
   *
   * @param dc сложность.
   * @returns подпись.
   */
  function formatDc(dc: number): string {
    return dc === APPLIER_SAVE_DC ? 'Сл заклинателя' : `Сл ${dc}`;
  }

  describe('чтение старых полей как срабатываний', () => {
    it('урон каждый ход: без спасброска, «без урона» и «половина урона»', () => {
      const recurringDamageEffect = createEffect({
        recurringDamage: { damageParts: POISON_DAMAGE, timing: 'startOfTurn' },
      });

      expect(listEffectListTriggers(recurringDamageEffect)).toEqual([
        {
          id: LEGACY_TRIGGER_IDS.recurringDamage,
          event: 'turnStart',
          actions: [{ type: 'damage', parts: POISON_DAMAGE, on: 'always' }],
        },
      ]);

      const [negateOnSaveTrigger] = listEffectListTriggers(
        createEffect({
          recurringDamage: {
            damageParts: POISON_DAMAGE,
            timing: 'endOfTurn',
            save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
          },
        }),
      );

      expect(negateOnSaveTrigger?.event).toBe('turnEnd');
      expect(negateOnSaveTrigger?.save).toEqual(CONSTITUTION_TRIGGER_SAVE);

      expect(negateOnSaveTrigger?.actions[0]).toEqual({
        type: 'damage',
        parts: POISON_DAMAGE,
        on: 'failed',
      });

      const [halfOnSaveTrigger] = listEffectListTriggers(
        createEffect({
          recurringDamage: {
            damageParts: POISON_DAMAGE,
            timing: 'endOfTurn',
            save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
          },
        }),
      );

      expect(halfOnSaveTrigger?.actions[0]).toEqual({
        type: 'damage',
        parts: POISON_DAMAGE,
        on: 'always',
        halfOnSave: true,
      });
    });

    it('повторный спасбросок снимает эффект при успехе, снятие после атаки — по роли', () => {
      const effect = createEffect({
        recurringSave: {
          ability: 'wisdom',
          dc: TYPED_SAVE_DC,
          timing: 'endOfTurn',
        },
        consumeOn: 'attackOnCarrier',
      });

      expect(listEffectListTriggers(effect)).toEqual([
        {
          id: LEGACY_TRIGGER_IDS.recurringSave,
          event: 'turnEnd',
          save: { ability: 'wisdom', dc: TYPED_SAVE_DC },
          actions: [{ type: 'removeSelf', on: 'saved' }],
        },
        {
          id: LEGACY_TRIGGER_IDS.consumeOn,
          event: 'attackRoll',
          role: 'target',
          actions: [{ type: 'removeSelf', on: 'always' }],
        },
      ]);
    });

    it('разовое срабатывание: событие по доставке, гейты по исходу «при успехе»', () => {
      const successOutcomeGates = [
        {
          outcome: 'nothing',
          damageGate: 'failed',
          effectGate: 'failed',
          halfOnSave: undefined,
        },
        {
          outcome: 'halfDamage',
          damageGate: 'always',
          effectGate: 'failed',
          halfOnSave: true,
        },
        {
          outcome: 'halfDamageWithEffect',
          damageGate: 'always',
          effectGate: 'always',
          halfOnSave: true,
        },
        {
          outcome: 'effectWithoutDamage',
          damageGate: 'failed',
          effectGate: 'always',
          halfOnSave: undefined,
        },
        {
          outcome: 'onlyOnSuccess',
          damageGate: 'saved',
          effectGate: 'saved',
          halfOnSave: undefined,
        },
      ] as const;

      for (const {
        outcome,
        damageGate,
        effectGate,
        halfOnSave,
      } of successOutcomeGates) {
        const effect = writeEffectSuccessOutcome(
          createEffect({
            effectTarget: 'target',
            conditionKey: 'poisoned',
            applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
            damageParts: POISON_DAMAGE,
          }),
          outcome,
        );

        const [landing] = collectEffectTriggers(effect);

        expect(landing?.id, outcome).toBe(LEGACY_TRIGGER_IDS.landing);
        expect(landing?.event, outcome).toBe('applied');
        expect(landing?.save, outcome).toEqual(CONSTITUTION_TRIGGER_SAVE);

        expect(
          landing?.actions.map((action) => [
            action.type,
            action.on,
            action.type === 'damage' ? action.halfOnSave : undefined,
          ]),
          outcome,
        ).toEqual([
          ['damage', damageGate, halfOnSave],
          ['applySelf', effectGate, undefined],
        ]);
      }

      const [exitTrigger] = collectEffectTriggers(
        createEffect({ areaTrigger: 'exit', damageParts: POISON_DAMAGE }),
      );

      expect(exitTrigger?.event).toBe('exit');

      // У эффекта «на носителе» разового срабатывания нет
      expect(
        collectEffectTriggers(
          createEffect({
            applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
          }),
        ),
      ).toEqual([]);
    });

    it('явные срабатывания идут после старых полей', () => {
      const stench: EffectTrigger = {
        id: 'trigger_stench',
        event: 'turnStart',
        save: CONSTITUTION_TRIGGER_SAVE,
        actions: [{ type: 'applyCondition', conditionKey: 'poisoned' }],
      };

      const effect = createEffect({
        consumeOn: 'carrierAttack',
        triggers: [stench],
      });

      expect(
        listEffectListTriggers(effect).map((trigger) => trigger.id),
      ).toEqual([LEGACY_TRIGGER_IDS.consumeOn, 'trigger_stench']);
    });

    it('гейт по умолчанию: при спасброске — провал, но «половина при успехе» бьёт всегда', () => {
      const withSave = { save: CONSTITUTION_TRIGGER_SAVE };

      expect(
        resolveTriggerActionGate(withSave, {
          type: 'damage',
          parts: POISON_DAMAGE,
        }),
      ).toBe('failed');

      expect(
        resolveTriggerActionGate({}, { type: 'damage', parts: POISON_DAMAGE }),
      ).toBe('always');

      expect(
        resolveTriggerActionGate(withSave, {
          type: 'damage',
          parts: POISON_DAMAGE,
          halfOnSave: true,
        }),
      ).toBe('always');

      expect(
        resolveTriggerActionGate(withSave, {
          type: 'damage',
          parts: POISON_DAMAGE,
          halfOnSave: true,
          on: 'saved',
        }),
      ).toBe('saved');
    });
  });

  describe('запись «сначала старые поля»', () => {
    it('круг чтение → запись не меняет эффект со всеми старыми полями', () => {
      const saves = [
        undefined,
        { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
        { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
      ] as const;

      for (const save of saves) {
        for (const consumeOn of [
          undefined,
          'carrierAttack',
          'attackOnCarrier',
        ] as const) {
          for (const recurringSave of [
            undefined,
            { ability: 'wisdom', dc: APPLIER_SAVE_DC, timing: 'startOfTurn' },
          ] as const) {
            const effect = createEffect({
              recurringDamage: {
                damageParts: POISON_DAMAGE,
                timing: 'startOfTurn',
                ...(save ? { save } : {}),
              },
              ...(recurringSave ? { recurringSave } : {}),
              ...(consumeOn ? { consumeOn } : {}),
            });

            expect(
              serializeEffect(
                writeEffectTriggers(effect, listEffectListTriggers(effect)),
              ),
            ).toBe(serializeEffect(effect));
          }
        }
      }
    });

    it('невыразимое старым полем уходит в triggers: лимит, условие, ход источника, второй урон', () => {
      const damageTrigger: EffectTrigger = {
        id: LEGACY_TRIGGER_IDS.recurringDamage,
        event: 'turnStart',
        actions: [{ type: 'damage', parts: POISON_DAMAGE, on: 'always' }],
      };

      const effectWithExtraTriggers = writeEffectTriggers(createEffect(), [
        damageTrigger,
        { ...damageTrigger, id: 'second' },
        { ...damageTrigger, id: 'limited', limit: { max: 1, per: 'turn' } },
        { ...damageTrigger, id: 'source', turnOf: 'source' },
        {
          ...damageTrigger,
          id: 'conditional',
          condition: 'self.hp.value < self.hp.max',
        },
      ]);

      expect(effectWithExtraTriggers.recurringDamage).toEqual({
        damageParts: POISON_DAMAGE,
        timing: 'startOfTurn',
      });

      expect(
        effectWithExtraTriggers.triggers?.map((trigger) => trigger.id),
      ).toEqual(['second', 'limited', 'source', 'conditional']);
    });

    it('старые поля, которых нет в списке, снимаются; разовое срабатывание не трогается', () => {
      const effect = createEffect({
        effectTarget: 'target',
        applySave: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'negate' },
        recurringSave: { ability: 'wisdom', dc: SAVE_DC, timing: 'endOfTurn' },
        consumeOn: 'carrierAttack',
      });

      const effectWithoutConsumeOn = writeEffectTriggers(
        effect,
        collectEffectTriggers(effect).filter(
          (trigger) => trigger.id !== LEGACY_TRIGGER_IDS.consumeOn,
        ),
      );

      expect(effectWithoutConsumeOn.consumeOn).toBeUndefined();

      expect(effectWithoutConsumeOn.recurringSave).toEqual(
        effect.recurringSave,
      );

      expect(effectWithoutConsumeOn.applySave).toEqual(effect.applySave);
      expect(effectWithoutConsumeOn.triggers).toBeUndefined();
    });

    it('невыразимая строка с id legacy.* получает новый id', () => {
      const effectWithLimitedSave = writeEffectTriggers(createEffect(), [
        {
          id: LEGACY_TRIGGER_IDS.recurringSave,
          event: 'turnEnd',
          save: CONSTITUTION_TRIGGER_SAVE,
          actions: [{ type: 'removeSelf', on: 'saved' }],
          limit: { max: 1, per: 'round' },
        },
      ]);

      const [limitedSaveTrigger] = effectWithLimitedSave.triggers ?? [];

      expect(effectWithLimitedSave.recurringSave).toBeUndefined();
      expect(effectWithLimitedSave.triggers).toHaveLength(1);

      expect(limitedSaveTrigger && isLegacyTrigger(limitedSaveTrigger)).toBe(
        false,
      );
    });
  });

  describe('фразы срабатываний', () => {
    it('новые срабатывания: момент, спасбросок, исходы, лимит, ход источника', () => {
      expect(
        describeEffectTrigger(
          {
            id: 'stench',
            event: 'turnStart',
            save: { ability: 'constitution', dc: SAVE_DC },
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'poisoned',
                duration: { type: 'rounds', value: 1 },
              },
            ],
            limit: { max: 1, per: 'turn' },
          },
          { formatDc },
        ),
      ).toBe(
        `в начале хода: спасбросок Телосложения, Сл ${SAVE_DC}; провал — «Отравленный» на 1 раунд; `
          + 'успех — ничего, не чаще одного раза за ход',
      );

      expect(
        describeEffectTrigger(
          {
            id: 'burn',
            event: 'turnEnd',
            turnOf: 'source',
            save: { ability: 'dexterity', dc: APPLIER_SAVE_DC },
            actions: [
              {
                type: 'damage',
                parts: [{ formula: '2d6', type: 'fire' }],
                on: 'always',
                halfOnSave: true,
              },
              { type: 'removeSelf', on: 'saved' },
            ],
            limit: { max: 3, per: 'longRest' },
          },
          { formatDc },
        ),
      ).toBe(
        'в конце хода источника: спасбросок Ловкости, Сл заклинателя; провал — 2d6 огненный; '
          + 'успех — половина урона, эффект снимается, не чаще 3 раз за долгий отдых',
      );
    });

    it('отдых, режим спасброска и «всем в радиусе»', () => {
      expect(
        describeEffectTrigger(
          {
            id: 'regain',
            event: 'rest',
            restType: 'short',
            actions: [{ type: 'removeSelf' }],
          },
          { formatDc },
        ),
      ).toBe('после короткого отдыха: эффект снимается');

      expect(
        describeEffectTrigger(
          { id: 'aftermath', event: 'rest', actions: [{ type: 'removeSelf' }] },
          { formatDc },
        ),
      ).toBe('после долгого отдыха: эффект снимается');

      expect(
        describeEffectTrigger(
          {
            id: 'laughter',
            event: 'damageTaken',
            save: { ability: 'wisdom', dc: SAVE_DC, mode: 'advantage' },
            actions: [{ type: 'removeSelf', on: 'saved' }],
          },
          { formatDc },
        ),
      ).toBe(
        `при получении урона: спасбросок Мудрости с преимуществом, Сл ${SAVE_DC}; `
          + 'провал — ничего; успех — эффект снимается',
      );

      expect(
        describeEffectTrigger(
          {
            id: 'spores',
            event: 'hpZero',
            recipient: 'area',
            area: { radius: 5, target: 'allies' },
            actions: [{ type: 'removeSelf' }],
          },
          { formatDc },
        ),
      ).toBe(
        'когда хиты падают до 0, на союзников в 5 фт вокруг: эффект снимается',
      );
    });

    it('повторный спасбросок состояния, счётчик отметки и максимум хитов', () => {
      expect(
        describeEffectTrigger(
          {
            id: 'paralysis',
            event: 'applied',
            actions: [
              {
                type: 'applyCondition',
                conditionKey: 'paralyzed',
                recurringSave: {
                  ability: 'constitution',
                  dc: SAVE_DC,
                  timing: 'endOfTurn',
                },
              },
            ],
          },
          { formatDc },
        ),
      ).toBe(
        'при наложении: «Парализованный» (повторный спасбросок Телосложения '
          + `Сл ${SAVE_DC} в конце хода снимает эффект)`,
      );

      expect(
        describeEffectTrigger(
          {
            id: 'petrify',
            event: 'turnEnd',
            actions: [{ type: 'applyTag', tag: 'petrify', stack: true }],
          },
          { formatDc },
        ),
      ).toBe('в конце хода: отметка «petrify» +1');

      expect(
        describeEffectTrigger(
          {
            id: 'lifeDrain',
            event: 'applied',
            actions: [{ type: 'reduceMaxHp', amount: '@damage' }],
          },
          { formatDc },
        ),
      ).toBe('при наложении: максимум хитов −урон до долгого отдыха');

      expect(
        describeEffectTrigger(
          {
            id: 'curse',
            event: 'applied',
            actions: [
              { type: 'reduceMaxHp', amount: '2d6', endsOnRest: 'never' },
            ],
          },
          { formatDc },
        ),
      ).toBe('при наложении: максимум хитов −2d6');
    });

    it('условие, Сл формулой и «хиты становятся»', () => {
      expect(
        describeEffectTrigger(
          {
            id: 'fortitude',
            event: 'hpZero',
            condition:
              'damage.type !== "radiant" && damage.isCritical === false',
            save: { ability: 'constitution', dc: 5, dcFormula: '5 + @damage' },
            actions: [{ type: 'setHp', value: 1, on: 'saved' }],
          },
          { formatDc },
        ),
      ).toBe(
        'когда хиты падают до 0, если урон не излучением и не критическое попадание: '
          + 'спасбросок Телосложения, Сл = 5 + урон; провал — ничего; успех — хиты становятся 1',
      );
    });

    it('старые поля описываются прежними фразами сводки', () => {
      const effect = createEffect({
        conditionKey: 'poisoned',
        recurringDamage: {
          damageParts: POISON_DAMAGE,
          timing: 'startOfTurn',
          save: { ...CONSTITUTION_TRIGGER_SAVE, onSuccess: 'half' },
        },
        recurringSave: {
          ability: 'wisdom',
          dc: TYPED_SAVE_DC,
          timing: 'endOfTurn',
        },
        consumeOn: 'carrierAttack',
      });

      expect(
        listEffectListTriggers(effect).map((trigger) =>
          describeEffectTrigger(trigger, { formatDc }),
        ),
      ).toEqual([
        `каждый ход 2d6 ядом в начале хода (спасбросок Телосложения, Сл ${SAVE_DC}: успех — половина урона)`,
        `повторный спасбросок Мудрости Сл ${TYPED_SAVE_DC} в конце хода снимает эффект`,
        'снимается после своей атаки',
      ]);
    });
  });

  describe('срабатывания 0.8.66', () => {
    it('цена, вопрос, шанс и режим спасброска по условию не сворачиваются в старые поля', () => {
      const plainRecurringSave: EffectTrigger = {
        id: 'escape',
        event: 'turnEnd',
        save: CONSTITUTION_TRIGGER_SAVE,
        actions: [{ type: 'removeSelf', on: 'saved' }],
      };

      const variants: EffectTrigger[] = [
        { ...plainRecurringSave, cost: 'reaction' },
        { ...plainRecurringSave, ask: true },
        { ...plainRecurringSave, chancePercent: 50 },
        {
          ...plainRecurringSave,
          save: {
            ...CONSTITUTION_TRIGGER_SAVE,
            modeIf: [{ condition: 'self.hp.temp === 0', mode: 'advantage' }],
          },
        },
        {
          ...plainRecurringSave,
          save: {
            ...CONSTITUTION_TRIGGER_SAVE,
            autoFailIf: 'self.condition === "unconscious"',
          },
        },
      ];

      for (const trigger of variants) {
        const effect = writeEffectTriggers(createEffect(), [trigger]);

        expect(effect.recurringSave, JSON.stringify(trigger)).toBeUndefined();
        expect(effect.triggers).toEqual([trigger]);
      }

      // Простое срабатывание по-прежнему пишется старым полем
      expect(
        writeEffectTriggers(createEffect(), [plainRecurringSave]).recurringSave,
      ).toBeDefined();
    });

    it('фразы новых событий, получателей и действий', () => {
      expect(
        describeEffectTrigger(
          {
            id: 'heal',
            event: 'healed',
            recipient: 'source',
            actions: [
              { type: 'tempHp', amount: '5', mode: 'add' },
              { type: 'setHp', value: 1, toMax: true },
            ],
          },
          { formatDc },
        ),
      ).toBe(
        'когда носителя лечат, на наложившего: временные хиты +5, хиты '
          + 'восстанавливаются полностью',
      );

      expect(
        describeEffectTrigger(
          {
            id: 'path',
            event: 'moved',
            everyFeet: 5,
            actions: [
              { type: 'move', kind: 'push', distance: 10 },
              { type: 'moveArea', kind: 'follow' },
              { type: 'moveArea', kind: 'away' },
            ],
          },
          { formatDc },
        ),
      ).toBe(
        'за каждые 5 фт пути: отталкивает на 10 фт, зона идёт за носителем, '
          + 'сдвигает зону от получателя на 10 фт',
      );

      expect(
        describeEffectTrigger(
          {
            id: 'word',
            event: 'applied',
            actions: [
              { type: 'removeCondition' },
              { type: 'removeCondition', conditionKey: 'poisoned' },
              { type: 'kill' },
              { type: 'revive' },
              { type: 'revive', full: true },
              { type: 'dropHeld' },
              { type: 'restore', what: 'spellSlot', level: 3 },
              { type: 'restore', what: 'counter', counter: 'rage' },
              { type: 'dispel', maxLevel: 3 },
              { type: 'grantInspiration' },
              { type: 'notify', text: 'Выполняй приказ' },
              { type: 'nextStage' },
              { type: 'endCast', whose: 'recipient' },
              {
                type: 'applyCondition',
                conditionKey: 'restrained',
                endsOnExit: true,
              },
            ],
          },
          { formatDc },
        ),
      ).toBe(
        [
          'при наложении: снимаются все состояния',
          'снимается состояние «Отравленный»',
          'получатель умирает',
          'получатель возвращается к жизни с 1',
          'получатель возвращается к жизни с полным запасом хитов',
          'получатель роняет то, что держит',
          'возвращается ячейка круга 3',
          'возвращается ресурс «rage»',
          'рассеиваются заклинания до круга 3',
          'получатель получает вдохновение',
          'сообщение «Выполняй приказ»',
          'эффект переходит на следующую ступень',
          'каст получателя заканчивается',
          '«Опутанный» до выхода из зоны',
        ].join(', '),
      );

      expect(
        describeEffectTrigger(
          {
            id: 'downed',
            event: 'downedOther',
            actions: [{ type: 'tempHp', amount: '1d6' }],
          },
          { formatDc },
        ),
      ).toBe('когда носитель сваливает цель: временные хиты 1d6');
    });
  });
});

describe('правила 2014', () => {
  /**
   * Находит шаблон состояния по ключу.
   *
   * @param key ключ состояния.
   * @returns шаблон состояния.
   */
  function findTemplate(key: string): EffectConditionTemplate {
    const template = EFFECT_CONDITION_TEMPLATES.find(
      (conditionTemplate) => conditionTemplate.key === key,
    );

    if (!template) {
      throw new Error(`Нет шаблона состояния ${key}`);
    }

    return template;
  }

  it('недееспособность без помехи на инициативу', () => {
    expect(findTemplate('incapacitated').flags).toEqual(['incapacitated']);

    expect(findTemplate('paralyzed').flags).not.toContain(
      'initiative.disadvantage',
    );
  });

  it('невидимость без преимущества на инициативу', () => {
    expect(findTemplate('invisible').flags).not.toContain(
      'initiative.advantage',
    );
  });

  it('ошеломлённый не может перемещаться', () => {
    expect(findTemplate('stunned').flags).toContain('speed.zero');
  });

  it('истощения в шаблонах нет, таблица — шесть ступеней', () => {
    expect(
      EFFECT_CONDITION_TEMPLATES.some(
        (conditionTemplate) => conditionTemplate.key === 'exhaustion',
      ),
    ).toBe(false);

    expect(EFFECT_EXHAUSTION_LEVELS).toHaveLength(MAX_EXHAUSTION_LEVEL);
  });

  it('следствия Истощения накапливаются по ступеням', () => {
    expect(resolveExhaustionEffects(0).flags).toEqual([]);

    expect(resolveExhaustionEffects(1).flags).toEqual([
      'abilityCheck.disadvantage',
    ]);

    const thirdLevel = resolveExhaustionEffects(3);

    expect(thirdLevel.flags).toEqual([
      'abilityCheck.disadvantage',
      'attack.disadvantage',
      'save.disadvantage',
    ]);

    expect(thirdLevel.changes.map((change) => change.key)).toContain(
      'movement.walk',
    );

    const fourthLevel = resolveExhaustionEffects(4);

    expect(fourthLevel.changes.map((change) => change.key)).toContain(
      'hitPoints.max',
    );

    expect(fourthLevel.isDeath).toBe(false);
    expect(resolveExhaustionEffects(5).flags).toContain('speed.zero');
    expect(resolveExhaustionEffects(6).isDeath).toBe(true);
  });

  it('ступень Истощения приводится к 0–6', () => {
    expect(clampExhaustionLevel(-2)).toBe(0);
    expect(clampExhaustionLevel(9)).toBe(MAX_EXHAUSTION_LEVEL);
    expect(clampExhaustionLevel(2.7)).toBe(2);
    expect(clampExhaustionLevel(Number.NaN)).toBe(0);
  });
});
