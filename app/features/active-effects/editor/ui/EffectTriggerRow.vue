<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { WritableComputedRef } from 'vue';

  import type {
    EffectActionCostSettings,
    EffectFormLayout,
    EffectTrigger,
    EffectTriggerAction,
    EffectTriggerActionType,
    EffectTriggerAreaTarget,
    EffectTriggerAttackRole,
    EffectTriggerChoice,
    EffectTriggerChooser,
    EffectTriggerEvent,
    EffectTriggerLimitPeriod,
    EffectTriggerRecipient,
    EffectTriggerRestType,
    EffectTriggerSave,
    EffectTriggerSaveMode,
    EffectTriggerSaveModeChoice,
    EffectTriggerTurnOwner,
  } from '../../model';

  import {
    ANY_CONDITION_KEY,
    AREA_TRIGGER_RECIPIENT,
    buildConditionItemsWithAny,
    buildTriggerRecipientOptions,
    CHOICE_TRIGGER_RECIPIENT,
    clearTriggerActionGate,
    createDefaultEffectSave,
    createEffectTriggerAction,
    DEFAULT_TRIGGER_AREA_RADIUS,
    DEFAULT_TRIGGER_AREA_TARGET,
    DEFAULT_TRIGGER_ATTACK_ROLE,
    DEFAULT_TRIGGER_CHANCE_PERCENT,
    DEFAULT_TRIGGER_CHOICE_COUNT,
    DEFAULT_TRIGGER_CHOICE_RADIUS,
    DEFAULT_TRIGGER_CHOOSER,
    DEFAULT_TRIGGER_LIMIT_PERIOD,
    DEFAULT_TRIGGER_PATH_FEET,
    DEFAULT_TRIGGER_RECIPIENT,
    DEFAULT_TRIGGER_REST_TYPE,
    DEFAULT_TRIGGER_TURN_OWNER,
    EFFECT_AURA_RADIUS_STEP,
    EFFECT_TRIGGER_ACTION_ICONS,
    EFFECT_TRIGGER_ACTION_LABELS,
    EFFECT_TRIGGER_AREA_LABELS,
    EFFECT_TRIGGER_AREA_TARGET_OPTIONS,
    EFFECT_TRIGGER_CHOICE_LABELS,
    EFFECT_TRIGGER_CHOOSER_OPTIONS,
    EFFECT_TRIGGER_EVENT_LABELS,
    EFFECT_TRIGGER_NORMAL_SAVE_MODE,
    EFFECT_TRIGGER_PERIOD_OPTIONS,
    EFFECT_TRIGGER_REST_OPTIONS,
    EFFECT_TRIGGER_ROLE_OPTIONS,
    EFFECT_TRIGGER_ROW_ICONS,
    EFFECT_TRIGGER_ROW_LABELS,
    EFFECT_TRIGGER_SAVE_MODE_OPTIONS,
    EFFECT_TRIGGER_TURN_OWNER_LABELS,
    isTurnTriggerEvent,
    listTriggerActionTypes,
    MAX_TRIGGER_CHANCE_PERCENT,
    MAX_TRIGGER_CHOICE_COUNT,
    MAX_TRIGGER_PATH_FEET,
    MIN_TRIGGER_AREA_RADIUS,
    MIN_TRIGGER_CHANCE_PERCENT,
    MIN_TRIGGER_CHOICE_COUNT,
    MIN_TRIGGER_LIMIT_MAX,
    omitTriggerSaveDcFormula,
    TRIGGER_PATH_FEET_ONCE,
    triggerEventAcceptsDcFormula,
    triggerEventHasConditionKey,
    triggerEventHasPathFeet,
    triggerEventHasRecipientChoice,
    triggerEventHasRestType,
    triggerEventHasRole,
    validateFormula,
    writeTriggerEvent,
  } from '../../model';
  import EffectActionCostFields from './EffectActionCostFields.vue';
  import EffectSaveFields from './EffectSaveFields.vue';
  import EffectTriggerActionRow from './EffectTriggerActionRow.vue';
  import EffectTriggerConditionPicker from './EffectTriggerConditionPicker.vue';

  /**
   * Строка списка «Срабатывания»: когда → условие → спасбросок → что сделать →
   * сколько раз. Что доступно, решает модель по месту формы: события —
   * `layout.triggerEvents`, действия — `listTriggerActionTypes`, Сл формулой —
   * `triggerEventAcceptsDcFormula`.
   */
  const {
    layout,
    applierSaveDc = undefined,
    knownTags,
  } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
    /** Отметки, которые ставят срабатывания эффекта. */
    knownTags: readonly string[];
  }>();

  const emit = defineEmits<{
    remove: [];
  }>();

  /** Строка списка: форма заменяет её целиком при каждой правке. */
  const trigger = defineModel<EffectTrigger>('trigger', { required: true });

  /**
   * События в выборе: доступные здесь и то, что уже стоит (неработающее
   * покажет плашка формы).
   */
  const eventItems = computed(() =>
    [...new Set([...layout.triggerEvents, trigger.value.event])].map(
      (triggerEvent) => ({
        value: triggerEvent,
        label: EFFECT_TRIGGER_EVENT_LABELS[triggerEvent] ?? triggerEvent,
      }),
    ),
  );

  /** Чей ход в выборе: доступные здесь и то, что уже стоит в данных. */
  const turnOwnerItems = computed(() =>
    [
      ...new Set([
        ...layout.triggerTurnOwners,
        trigger.value.turnOf ?? DEFAULT_TRIGGER_TURN_OWNER,
      ]),
    ].map((owner) => ({
      value: owner,
      label: EFFECT_TRIGGER_TURN_OWNER_LABELS[owner],
    })),
  );

  const showsTurnOwner = computed(
    () =>
      isTurnTriggerEvent(trigger.value.event)
      && turnOwnerItems.value.length > 1,
  );

  const acceptsSaveDcFormula = computed(() =>
    triggerEventAcceptsDcFormula(trigger.value.event),
  );

  const hasRecipientChoice = computed(() =>
    triggerEventHasRecipientChoice(trigger.value.event),
  );

  const showsRole = computed(() => triggerEventHasRole(trigger.value.event));

  const showsRestType = computed(() =>
    triggerEventHasRestType(trigger.value.event),
  );

  const showsPathFeet = computed(() =>
    triggerEventHasPathFeet(trigger.value.event),
  );

  /** Состояние выбирают только у события «когда состояние снимается». */
  const showsLostCondition = computed(() =>
    triggerEventHasConditionKey(trigger.value.event),
  );

  /** Состояния для выбора, «Любое» первым пунктом. */
  const lostConditionItems = buildConditionItemsWithAny(
    EFFECT_TRIGGER_ROW_LABELS.conditionKeyAny,
  );

  const isAreaRecipient = computed(
    () => trigger.value.recipient === AREA_TRIGGER_RECIPIENT,
  );

  const isChoiceRecipient = computed(
    () => trigger.value.recipient === CHOICE_TRIGGER_RECIPIENT,
  );

  const recipientItems = computed(() =>
    buildTriggerRecipientOptions(trigger.value),
  );

  const allowedActionTypes = computed(() =>
    listTriggerActionTypes(layout, trigger.value.event),
  );

  const hasActions = computed(() => trigger.value.actions.length > 0);

  /**
   * Заменяет строку целиком.
   *
   * @param patch изменённые поля.
   */
  function updateTrigger(patch: Partial<EffectTrigger>): void {
    trigger.value = { ...trigger.value, ...patch };
  }

  // Смена события отбрасывает то, чего у нового события нет
  const event = computed({
    get: () => trigger.value.event,
    set: (nextEvent: EffectTriggerEvent) => {
      trigger.value = writeTriggerEvent(trigger.value, nextEvent, layout);
    },
  });

  // Получатель по умолчанию в данных не пишется
  const recipient = computed({
    get: () => trigger.value.recipient ?? DEFAULT_TRIGGER_RECIPIENT,
    set: (nextRecipient: EffectTriggerRecipient) =>
      updateTrigger({
        recipient:
          nextRecipient === DEFAULT_TRIGGER_RECIPIENT
            ? undefined
            : nextRecipient,
        // «Всем в радиусе» появляется с радиусом по умолчанию
        area:
          nextRecipient === AREA_TRIGGER_RECIPIENT
            ? (trigger.value.area ?? { radius: DEFAULT_TRIGGER_AREA_RADIUS })
            : undefined,
        // «Выбранным» — с радиусом и одной целью
        choice:
          nextRecipient === CHOICE_TRIGGER_RECIPIENT
            ? (trigger.value.choice ?? {
                radius: DEFAULT_TRIGGER_CHOICE_RADIUS,
              })
            : undefined,
      }),
  });

  /**
   * Меняет поле блока «по выбору», не теряя остальных.
   *
   * @param patch изменённые поля блока.
   */
  function updateChoice(patch: Partial<EffectTriggerChoice>): void {
    updateTrigger({
      choice: {
        radius: DEFAULT_TRIGGER_CHOICE_RADIUS,
        ...trigger.value.choice,
        ...patch,
      },
    });
  }

  const choiceRadius = computed({
    get: () => trigger.value.choice?.radius ?? DEFAULT_TRIGGER_CHOICE_RADIUS,
    set: (nextRadius: number | null) => {
      if (nextRadius !== null) {
        updateChoice({ radius: nextRadius });
      }
    },
  });

  const choiceTarget = computed({
    get: () => trigger.value.choice?.target ?? DEFAULT_TRIGGER_AREA_TARGET,
    set: (nextTarget: EffectTriggerAreaTarget) =>
      updateChoice({
        target:
          nextTarget === DEFAULT_TRIGGER_AREA_TARGET ? undefined : nextTarget,
      }),
  });

  const choiceCount = computed({
    get: () => trigger.value.choice?.count ?? DEFAULT_TRIGGER_CHOICE_COUNT,
    set: (nextCount: number | null) => {
      if (nextCount !== null) {
        updateChoice({ count: nextCount });
      }
    },
  });

  const choiceChooser = computed({
    get: () => trigger.value.choice?.chooser ?? DEFAULT_TRIGGER_CHOOSER,
    set: (nextChooser: EffectTriggerChooser) =>
      updateChoice({
        chooser:
          nextChooser === DEFAULT_TRIGGER_CHOOSER ? undefined : nextChooser,
      }),
  });

  const choiceOptional = computed({
    get: () => trigger.value.choice?.optional === true,
    set: (enabled: boolean) =>
      updateChoice({ optional: enabled ? true : undefined }),
  });

  const choiceCondition = computed({
    get: () => trigger.value.choice?.condition,
    set: (nextCondition: string | undefined) =>
      updateChoice({ condition: nextCondition?.trim() || undefined }),
  });

  const areaRadius = computed({
    get: () => trigger.value.area?.radius ?? DEFAULT_TRIGGER_AREA_RADIUS,
    set: (nextRadius: number | null) => {
      if (nextRadius !== null) {
        updateTrigger({ area: { ...trigger.value.area, radius: nextRadius } });
      }
    },
  });

  const areaTarget = computed({
    get: () => trigger.value.area?.target ?? DEFAULT_TRIGGER_AREA_TARGET,
    set: (nextTarget: EffectTriggerAreaTarget) =>
      updateTrigger({
        area: {
          radius: trigger.value.area?.radius ?? DEFAULT_TRIGGER_AREA_RADIUS,
          target:
            nextTarget === DEFAULT_TRIGGER_AREA_TARGET ? undefined : nextTarget,
        },
      }),
  });

  // Долгий отдых — значение по умолчанию: в данных он не пишется
  const restType = computed({
    get: () => trigger.value.restType ?? DEFAULT_TRIGGER_REST_TYPE,
    set: (nextRestType: EffectTriggerRestType) =>
      updateTrigger({
        restType:
          nextRestType === DEFAULT_TRIGGER_REST_TYPE ? undefined : nextRestType,
      }),
  });

  // Пусто — один раз за перемещение: в данных шага нет
  const everyFeet = computed({
    get: () => trigger.value.everyFeet ?? null,
    set: (feet: number | null) =>
      updateTrigger({
        everyFeet:
          typeof feet === 'number' && feet > TRIGGER_PATH_FEET_ONCE
            ? feet
            : undefined,
      }),
  });

  // «Любое» — в данных ключа нет: срабатывание слушает любое снятое состояние
  const lostConditionKey = computed({
    get: () => trigger.value.conditionKey ?? ANY_CONDITION_KEY,
    set: (nextKey: string) =>
      updateTrigger({
        conditionKey: nextKey === ANY_CONDITION_KEY ? undefined : nextKey,
      }),
  });

  // Шанс выключен — поля нет вовсе, а не сто процентов
  const hasChance = computed({
    get: () => trigger.value.chancePercent !== undefined,
    set: (enabled: boolean) =>
      updateTrigger({
        chancePercent: enabled ? DEFAULT_TRIGGER_CHANCE_PERCENT : undefined,
      }),
  });

  const chancePercent = computed({
    get: () => trigger.value.chancePercent ?? DEFAULT_TRIGGER_CHANCE_PERCENT,
    set: (percent: number | null) =>
      updateTrigger({
        chancePercent: percent ?? DEFAULT_TRIGGER_CHANCE_PERCENT,
      }),
  });

  const actionCost = computed({
    get: () => ({
      cost: trigger.value.cost,
      moveCostFeet: trigger.value.moveCostFeet,
    }),
    set: (nextCost: EffectActionCostSettings) => updateTrigger(nextCost),
  });

  const asks = computed({
    get: () => trigger.value.ask === true,
    set: (enabled: boolean) =>
      updateTrigger({
        ask: enabled ? true : undefined,
        asker: enabled ? trigger.value.asker : undefined,
      }),
  });

  // Носитель — значение по умолчанию: в данных он не пишется
  const asker = computed({
    get: () => trigger.value.asker ?? DEFAULT_TRIGGER_CHOOSER,
    set: (nextAsker: EffectTriggerChooser) =>
      updateTrigger({
        asker: nextAsker === DEFAULT_TRIGGER_CHOOSER ? undefined : nextAsker,
      }),
  });

  /**
   * Условие режима спасброска: одно правило на режим — больше форме не нужно,
   * а модель принимает список.
   *
   * @param mode преимущество или помеха.
   * @returns модель условия.
   */
  function createSaveModeCondition(
    mode: EffectTriggerSaveMode,
  ): WritableComputedRef<string | undefined> {
    return computed({
      get: () =>
        trigger.value.save?.modeIf?.find((rule) => rule.mode === mode)
          ?.condition,
      set: (nextCondition: string | undefined) => {
        const { save } = trigger.value;

        if (!save) {
          return;
        }

        const otherRules = (save.modeIf ?? []).filter(
          (rule) => rule.mode !== mode,
        );

        const rules = nextCondition
          ? [...otherRules, { condition: nextCondition, mode }]
          : otherRules;

        updateTrigger({
          save: { ...save, modeIf: rules.length > 0 ? rules : undefined },
        });
      },
    });
  }

  const advantageIf = createSaveModeCondition('advantage');
  const disadvantageIf = createSaveModeCondition('disadvantage');

  /**
   * Условие автоматического исхода спасброска.
   *
   * @param saveField поле спасброска.
   * @returns модель условия.
   */
  function createAutoOutcomeCondition(
    saveField: 'autoSuccessIf' | 'autoFailIf',
  ): WritableComputedRef<string | undefined> {
    return computed({
      get: () => trigger.value.save?.[saveField],
      set: (nextCondition: string | undefined) => {
        const { save } = trigger.value;

        if (save) {
          updateTrigger({ save: { ...save, [saveField]: nextCondition } });
        }
      },
    });
  }

  const autoSuccessIf = createAutoOutcomeCondition('autoSuccessIf');
  const autoFailIf = createAutoOutcomeCondition('autoFailIf');

  // Обычный спасбросок в данных не пишется
  const saveMode = computed({
    get: (): EffectTriggerSaveModeChoice =>
      trigger.value.save?.mode ?? EFFECT_TRIGGER_NORMAL_SAVE_MODE,
    set: (nextMode: EffectTriggerSaveModeChoice) => {
      const { save } = trigger.value;

      if (!save) {
        return;
      }

      updateTrigger({
        save: {
          ...save,
          mode:
            nextMode === EFFECT_TRIGGER_NORMAL_SAVE_MODE ? undefined : nextMode,
        },
      });
    },
  });

  const saveDcFormula = computed({
    get: () => trigger.value.save?.dcFormula ?? '',
    set: (nextFormula: string) => {
      const { save } = trigger.value;

      if (!save) {
        return;
      }

      const formula = nextFormula.trim();

      updateTrigger({
        save: formula
          ? { ...save, dcFormula: formula }
          : omitTriggerSaveDcFormula(save),
      });
    },
  });

  const saveDcFormulaError = computed(() => {
    const formula = trigger.value.save?.dcFormula;

    return formula ? validateFormula(formula).error : undefined;
  });

  const condition = computed({
    get: () => trigger.value.condition,
    set: (nextCondition: string | undefined) =>
      updateTrigger({ condition: nextCondition }),
  });

  const role = computed({
    get: () => trigger.value.role ?? DEFAULT_TRIGGER_ATTACK_ROLE,
    set: (nextRole: EffectTriggerAttackRole) =>
      updateTrigger({ role: nextRole }),
  });

  // Ход носителя — значение по умолчанию: в данных он не пишется
  const turnOf = computed({
    get: () => trigger.value.turnOf ?? DEFAULT_TRIGGER_TURN_OWNER,
    set: (nextTurnOwner: EffectTriggerTurnOwner) =>
      updateTrigger({
        turnOf:
          nextTurnOwner === DEFAULT_TRIGGER_TURN_OWNER
            ? undefined
            : nextTurnOwner,
      }),
  });

  const hasSave = computed({
    get: () => trigger.value.save !== undefined,
    set: (enabled: boolean) => {
      updateTrigger(
        enabled
          ? { save: createDefaultEffectSave(layout) }
          : {
              save: undefined,
              // Без спасброска «при успехе» не наступило бы никогда
              actions: trigger.value.actions.map(clearTriggerActionGate),
            },
      );
    },
  });

  /**
   * Заменяет спасбросок строки.
   *
   * @param nextSave спасбросок с изменёнными характеристикой или Сл.
   */
  function updateSave(nextSave: EffectTriggerSave): void {
    updateTrigger({ save: nextSave });
  }

  /** Действия строки с ключом для списка. */
  const actionRows = computed(() =>
    trigger.value.actions.map((action, index) => ({
      key: `${index}-${action.type}`,
      action,
    })),
  );

  /**
   * Заменяет действие.
   *
   * @param index номер действия.
   * @param nextAction новое действие.
   */
  function updateAction(index: number, nextAction: EffectTriggerAction): void {
    updateTrigger({
      actions: trigger.value.actions.map((existingAction, actionIndex) =>
        actionIndex === index ? nextAction : existingAction,
      ),
    });
  }

  /**
   * Убирает действие.
   *
   * @param index номер действия.
   */
  function removeAction(index: number): void {
    updateTrigger({
      actions: trigger.value.actions.filter(
        (_, actionIndex) => actionIndex !== index,
      ),
    });
  }

  /**
   * Добавляет действие в конец списка.
   *
   * @param type вид действия.
   */
  function addAction(type: EffectTriggerActionType): void {
    updateTrigger({
      actions: [...trigger.value.actions, createEffectTriggerAction(type)],
    });
  }

  const addActionItems = computed<DropdownMenuItem[]>(() =>
    allowedActionTypes.value.map((type) => ({
      label: EFFECT_TRIGGER_ACTION_LABELS[type],
      icon: EFFECT_TRIGGER_ACTION_ICONS[type],
      onSelect: () => addAction(type),
    })),
  );

  const hasLimit = computed({
    get: () => trigger.value.limit !== undefined,
    set: (enabled: boolean) =>
      updateTrigger({
        limit: enabled
          ? { max: MIN_TRIGGER_LIMIT_MAX, per: DEFAULT_TRIGGER_LIMIT_PERIOD }
          : undefined,
      }),
  });

  const limitMax = computed({
    get: () => trigger.value.limit?.max ?? MIN_TRIGGER_LIMIT_MAX,
    set: (max: number | null) => {
      if (trigger.value.limit) {
        updateTrigger({
          limit: { ...trigger.value.limit, max: max ?? MIN_TRIGGER_LIMIT_MAX },
        });
      }
    },
  });

  const limitPer = computed({
    get: () => trigger.value.limit?.per ?? DEFAULT_TRIGGER_LIMIT_PERIOD,
    set: (per: EffectTriggerLimitPeriod) => {
      if (trigger.value.limit) {
        updateTrigger({ limit: { ...trigger.value.limit, per } });
      }
    },
  });
</script>

<template>
  <div class="flex flex-col gap-3 rounded-md border border-default p-3">
    <div class="flex flex-wrap items-end gap-2">
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.event"
        class="w-full sm:w-60"
      >
        <USelect
          v-model="event"
          :items="eventItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsRole"
        :label="EFFECT_TRIGGER_ROW_LABELS.role"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="role"
          :items="EFFECT_TRIGGER_ROLE_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsRestType"
        :label="EFFECT_TRIGGER_ROW_LABELS.restType"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="restType"
          :items="EFFECT_TRIGGER_REST_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsPathFeet"
        :label="EFFECT_TRIGGER_ROW_LABELS.everyFeet"
        class="w-full sm:w-32"
      >
        <UInputNumber
          v-model="everyFeet"
          :min="TRIGGER_PATH_FEET_ONCE"
          :max="MAX_TRIGGER_PATH_FEET"
          :step="DEFAULT_TRIGGER_PATH_FEET"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.everyFeetOnce"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="showsLostCondition"
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionKey"
        :help="EFFECT_TRIGGER_ROW_LABELS.conditionKeyHint"
        class="w-full sm:w-56"
      >
        <USelectMenu
          v-model="lostConditionKey"
          :items="lostConditionItems"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="hasRecipientChoice"
        :label="EFFECT_TRIGGER_ROW_LABELS.recipient"
        class="w-full sm:w-56"
      >
        <USelect
          v-model="recipient"
          :items="recipientItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <template v-if="isAreaRecipient">
        <UFormField
          :label="EFFECT_TRIGGER_AREA_LABELS.radius"
          class="w-full sm:w-28"
        >
          <UInputNumber
            v-model="areaRadius"
            :min="MIN_TRIGGER_AREA_RADIUS"
            :step="EFFECT_AURA_RADIUS_STEP"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_TRIGGER_AREA_LABELS.target"
          class="w-full sm:w-44"
        >
          <USelect
            v-model="areaTarget"
            :items="EFFECT_TRIGGER_AREA_TARGET_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>
      </template>

      <template v-if="isChoiceRecipient">
        <UFormField
          :label="EFFECT_TRIGGER_CHOICE_LABELS.radius"
          class="w-full sm:w-28"
        >
          <UInputNumber
            v-model="choiceRadius"
            :min="MIN_TRIGGER_AREA_RADIUS"
            :step="EFFECT_AURA_RADIUS_STEP"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_TRIGGER_CHOICE_LABELS.target"
          class="w-full sm:w-44"
        >
          <USelect
            v-model="choiceTarget"
            :items="EFFECT_TRIGGER_AREA_TARGET_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_TRIGGER_CHOICE_LABELS.count"
          class="w-full sm:w-28"
        >
          <UInputNumber
            v-model="choiceCount"
            :min="MIN_TRIGGER_CHOICE_COUNT"
            :max="MAX_TRIGGER_CHOICE_COUNT"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_TRIGGER_CHOICE_LABELS.chooser"
          class="w-full sm:w-48"
        >
          <USelect
            v-model="choiceChooser"
            :items="EFFECT_TRIGGER_CHOOSER_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="choiceOptional"
          :label="EFFECT_TRIGGER_CHOICE_LABELS.optional"
        />
      </template>

      <UFormField
        v-if="showsTurnOwner"
        :label="EFFECT_TRIGGER_ROW_LABELS.turnOf"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="turnOf"
          :items="turnOwnerItems"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UButton
        color="error"
        variant="ghost"
        size="xs"
        :icon="EFFECT_TRIGGER_ROW_ICONS.remove"
        class="ml-auto"
        :aria-label="EFFECT_TRIGGER_ROW_LABELS.remove"
        :title="EFFECT_TRIGGER_ROW_LABELS.remove"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <EffectTriggerConditionPicker
      v-model:condition="condition"
      :event="trigger.event"
      :known-tags="knownTags"
    />

    <!-- Условие кандидата: тот же словарь, но проверяется на том, кого выбирают -->
    <EffectTriggerConditionPicker
      v-if="isChoiceRecipient"
      v-model:condition="choiceCondition"
      :event="trigger.event"
      :known-tags="knownTags"
      :title="EFFECT_TRIGGER_CHOICE_LABELS.condition"
    />

    <USwitch
      v-model="hasSave"
      :label="EFFECT_TRIGGER_ROW_LABELS.saveToggle"
    />

    <div
      v-if="trigger.save"
      class="flex flex-wrap items-start gap-3"
    >
      <EffectSaveFields
        :save="trigger.save"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
        :ability-label="EFFECT_TRIGGER_ROW_LABELS.saveAbility"
        :save-dc-label="EFFECT_TRIGGER_ROW_LABELS.saveDc"
        @update:save="updateSave"
      />

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.saveMode"
        class="w-full sm:w-44"
      >
        <USelect
          v-model="saveMode"
          :items="EFFECT_TRIGGER_SAVE_MODE_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="acceptsSaveDcFormula"
        :label="EFFECT_TRIGGER_ROW_LABELS.dcFormula"
        :help="EFFECT_TRIGGER_ROW_LABELS.dcFormulaHint"
        :error="saveDcFormulaError"
        class="w-full sm:w-72"
      >
        <UInput
          v-model="saveDcFormula"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.dcFormulaPlaceholder"
          size="sm"
          class="w-full font-mono"
        />
      </UFormField>
    </div>

    <template v-if="trigger.save">
      <EffectTriggerConditionPicker
        v-model:condition="advantageIf"
        :event="trigger.event"
        :known-tags="knownTags"
        :title="EFFECT_TRIGGER_ROW_LABELS.advantageIf"
        :empty-text="EFFECT_TRIGGER_ROW_LABELS.saveModeIfEmpty"
      />

      <EffectTriggerConditionPicker
        v-model:condition="disadvantageIf"
        :event="trigger.event"
        :known-tags="knownTags"
        :title="EFFECT_TRIGGER_ROW_LABELS.disadvantageIf"
        :empty-text="EFFECT_TRIGGER_ROW_LABELS.saveModeIfEmpty"
      />

      <EffectTriggerConditionPicker
        v-model:condition="autoSuccessIf"
        :event="trigger.event"
        :known-tags="knownTags"
        :title="EFFECT_TRIGGER_ROW_LABELS.autoSuccessIf"
        :empty-text="EFFECT_TRIGGER_ROW_LABELS.autoOutcomeEmpty"
      />

      <EffectTriggerConditionPicker
        v-model:condition="autoFailIf"
        :event="trigger.event"
        :known-tags="knownTags"
        :title="EFFECT_TRIGGER_ROW_LABELS.autoFailIf"
        :empty-text="EFFECT_TRIGGER_ROW_LABELS.autoOutcomeEmpty"
      />
    </template>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-medium text-default">
        {{ EFFECT_TRIGGER_ROW_LABELS.actionsTitle }}
      </span>

      <p
        v-if="!hasActions"
        class="text-xs text-warning"
      >
        {{ EFFECT_TRIGGER_ROW_LABELS.actionsEmpty }}
      </p>

      <EffectTriggerActionRow
        v-for="(actionRow, index) in actionRows"
        :key="actionRow.key"
        :action="actionRow.action"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
        :trigger-save="trigger.save"
        :event="trigger.event"
        @update:action="updateAction(index, $event)"
        @remove="removeAction(index)"
      />

      <UDropdownMenu
        v-if="addActionItems.length > 0"
        :items="addActionItems"
        :content="{ align: 'start' }"
      >
        <UButton
          color="primary"
          variant="soft"
          size="xs"
          :icon="EFFECT_TRIGGER_ROW_ICONS.addAction"
          class="w-fit"
          :label="EFFECT_TRIGGER_ROW_LABELS.addAction"
        />
      </UDropdownMenu>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <USwitch
        v-model="hasChance"
        :label="EFFECT_TRIGGER_ROW_LABELS.chanceToggle"
      />

      <template v-if="hasChance">
        <UInputNumber
          v-model="chancePercent"
          :min="MIN_TRIGGER_CHANCE_PERCENT"
          :max="MAX_TRIGGER_CHANCE_PERCENT"
          size="sm"
          class="w-24"
        />

        <span class="text-xs text-muted">
          {{ EFFECT_TRIGGER_ROW_LABELS.chancePercent }}
        </span>
      </template>
    </div>

    <p
      v-if="hasChance"
      class="text-xs text-muted"
    >
      {{ EFFECT_TRIGGER_ROW_LABELS.chanceHint }}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <USwitch
        v-model="hasLimit"
        :label="EFFECT_TRIGGER_ROW_LABELS.limitToggle"
      />

      <template v-if="trigger.limit">
        <UInputNumber
          v-model="limitMax"
          :min="MIN_TRIGGER_LIMIT_MAX"
          size="sm"
          class="w-24"
        />

        <span class="text-xs text-muted">
          {{ EFFECT_TRIGGER_ROW_LABELS.limitTimes }}
        </span>

        <USelect
          v-model="limitPer"
          :items="EFFECT_TRIGGER_PERIOD_OPTIONS"
          value-key="value"
          size="sm"
          class="w-44"
        />
      </template>
    </div>

    <div class="flex flex-wrap items-end gap-2">
      <EffectActionCostFields
        v-model="actionCost"
        :help="EFFECT_TRIGGER_ROW_LABELS.costHint"
      />

      <USwitch
        v-model="asks"
        class="mb-2"
        :label="EFFECT_TRIGGER_ROW_LABELS.askToggle"
      />

      <UFormField
        v-if="asks"
        :label="EFFECT_TRIGGER_ROW_LABELS.asker"
        class="w-full sm:w-48"
      >
        <USelect
          v-model="asker"
          :items="EFFECT_TRIGGER_CHOOSER_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>
