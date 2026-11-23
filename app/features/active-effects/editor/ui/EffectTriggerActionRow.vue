<script setup lang="ts">
  import type {
    EffectConditionKey,
    EffectDamagePart,
    EffectFormLayout,
    EffectRecurringSave,
    EffectSaveTiming,
    EffectTriggerAction,
    EffectTriggerActionType,
    EffectTriggerEvent,
    EffectTriggerMaxHpRestEnd,
    EffectTriggerReduceMaxHpAction,
    EffectTriggerSave,
    NestedEffectTrigger,
  } from '../../model';

  import {
    createDefaultEffectSave,
    createEffectTriggerAction,
    createEffectTriggerId,
    DEFAULT_NESTED_TRIGGER_EVENT,
    DEFAULT_RECURRING_SAVE_TIMING,
    DEFAULT_TRIGGER_REST_TYPE,
    EFFECT_CONDITION_OPTIONS,
    EFFECT_SAVE_TIMING_OPTIONS,
    EFFECT_TRIGGER_ACTION_ICONS,
    EFFECT_TRIGGER_ACTION_LABELS,
    EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS,
    EFFECT_TRIGGER_DAMAGE_HALF_GATE,
    EFFECT_TRIGGER_EVENT_LABELS,
    EFFECT_TRIGGER_GATE_OPTIONS,
    EFFECT_TRIGGER_MAX_HP_REST_OPTIONS,
    EFFECT_TRIGGER_NESTED_LABELS,
    EFFECT_TRIGGER_ROW_ICONS,
    EFFECT_TRIGGER_ROW_LABELS,
    isEffectTag,
    listNestedTriggerActionTypes,
    MIN_SET_HP_VALUE,
    MIN_TRIGGER_ACTION_ROUNDS,
    NESTED_TRIGGER_EVENTS,
    readTriggerActionRounds,
    resolveTriggerActionGate,
    writeTriggerActionGate,
    writeTriggerActionRounds,
  } from '../../model';
  import EffectDamageParts from './EffectDamageParts.vue';
  import EffectSaveFields from './EffectSaveFields.vue';
  import EffectTriggerActionFields from './EffectTriggerActionFields.vue';

  /**
   * Действие строки срабатывания: вид, исход относительно спасброска строки и
   * поля вида — части урона, состояние со сроком и повторным спасброском, число
   * хитов, ключ и имя отметки со счётчиком, уменьшение максимума хитов. Поля
   * остальных действий — в `EffectTriggerActionFields`.
   */
  const {
    layout,
    triggerSave = undefined,
    applierSaveDc = undefined,
    event = undefined,
  } = defineProps<{
    /** Раскладка формы: по ней подставляется Сл повторного спасброска. */
    layout: EffectFormLayout;
    /** Спасбросок строки: без него исход действия не выбирается. */
    triggerSave?: EffectTriggerSave;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
    /**
     * Действие уже вложено в наложенное состояние: своих срабатываний у него не
     * бывает — вложенность на одну ступень.
     */
    nested?: boolean;
    /** Событие срабатывания: «зона за носителем» бывает только на пути. */
    event?: EffectTriggerEvent;
  }>();

  const emit = defineEmits<{
    /** Убрать действие из строки. */
    remove: [];
  }>();

  /** Действие: поля заменяют его целиком при каждой правке. */
  const action = defineModel<EffectTriggerAction>('action', {
    required: true,
  });

  const actionLabel = computed(
    () => EFFECT_TRIGGER_ACTION_LABELS[action.value.type],
  );

  const actionIcon = computed(
    () => EFFECT_TRIGGER_ACTION_ICONS[action.value.type],
  );

  /** Исход действия; не заданный — по спасброску строки. */
  const gate = computed(() =>
    resolveTriggerActionGate({ save: triggerSave }, action.value),
  );

  /** Исход урона для выбора: «успех — половина» — отдельный вариант. */
  const damageGate = computed(() => {
    const currentAction = action.value;

    return currentAction.type === 'damage' && currentAction.halfOnSave
      ? EFFECT_TRIGGER_DAMAGE_HALF_GATE
      : gate.value;
  });

  /** Срок состояния или отметки в раундах. */
  const rounds = computed(() => readTriggerActionRounds(action.value));

  /** Состояние действия, если оно из списка выбора. */
  const conditionKey = computed<EffectConditionKey | undefined>(() => {
    const currentAction = action.value;

    return currentAction.type === 'applyCondition'
      ? EFFECT_CONDITION_OPTIONS.find(
          (conditionOption) =>
            conditionOption.value === currentAction.conditionKey,
        )?.value
      : undefined;
  });

  /** Ошибка ключа отметки. */
  const tagError = computed(() => {
    const currentAction = action.value;

    return currentAction.type === 'applyTag' && !isEffectTag(currentAction.tag)
      ? EFFECT_TRIGGER_ROW_LABELS.tagInvalid
      : undefined;
  });

  /**
   * Меняет исход действия по выбору в списке.
   *
   * @param selectedGate значение из списка исходов.
   */
  function selectGate(selectedGate: unknown): void {
    const choice = EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS.find(
      (gateOption) => gateOption.value === selectedGate,
    )?.value;

    if (!choice) {
      return;
    }

    const nextAction = writeTriggerActionGate(action.value, choice);

    if (nextAction) {
      action.value = nextAction;
    }
  }

  /**
   * Меняет части урона.
   *
   * @param parts части урона.
   */
  function updateDamageParts(parts: EffectDamagePart[]): void {
    const currentAction = action.value;

    if (currentAction.type === 'damage') {
      action.value = { ...currentAction, parts };
    }
  }

  /**
   * Меняет состояние действия.
   *
   * @param nextConditionKey ключ состояния.
   */
  function updateCondition(nextConditionKey: EffectConditionKey): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyCondition') {
      action.value = { ...currentAction, conditionKey: nextConditionKey };
    }
  }

  /**
   * Меняет срок состояния или отметки в раундах; пусто — срок по умолчанию
   * (состояние — пока не снимут, отметка — до начала следующего хода).
   *
   * @param nextRounds раундов.
   */
  function updateActionRounds(nextRounds: number | null | undefined): void {
    action.value = writeTriggerActionRounds(action.value, nextRounds);
  }

  /**
   * Меняет число хитов действия «Хиты становятся».
   *
   * @param hitPoints хитов; очищенное поле — наименьшее число.
   */
  function updateSetHp(hitPoints: number | null | undefined): void {
    const currentAction = action.value;

    if (currentAction.type === 'setHp') {
      action.value = {
        ...currentAction,
        value: Math.max(MIN_SET_HP_VALUE, hitPoints ?? MIN_SET_HP_VALUE),
      };
    }
  }

  const hasNestedTrigger = computed({
    get: () =>
      action.value.type === 'applyCondition'
      && (action.value.triggers?.length ?? 0) > 0,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type !== 'applyCondition') {
        return;
      }

      action.value = {
        ...currentAction,
        triggers: enabled
          ? [
              {
                id: createEffectTriggerId(),
                event: DEFAULT_NESTED_TRIGGER_EVENT,
                actions: [{ type: 'removeSelf' }],
              },
            ]
          : undefined,
      };
    },
  });

  /** Единственное вложенное срабатывание состояния. */
  const nestedTrigger = computed(() =>
    action.value.type === 'applyCondition'
      ? action.value.triggers?.[0]
      : undefined,
  );

  /** Единственное действие вложенного срабатывания. */
  const nestedAction = computed<EffectTriggerAction>({
    get: () => nestedTrigger.value?.actions[0] ?? { type: 'removeSelf' },
    set: (nextAction) => updateNestedTrigger({ actions: [nextAction] }),
  });

  /** События, на которые реагирует наложенное состояние. */
  const nestedEventItems = NESTED_TRIGGER_EVENTS.map((event) => ({
    value: event,
    label: EFFECT_TRIGGER_EVENT_LABELS[event],
  }));

  /** Что вложенное срабатывание может сделать. */
  const nestedActionItems = computed(() =>
    listNestedTriggerActionTypes(
      layout,
      nestedTrigger.value?.event ?? DEFAULT_NESTED_TRIGGER_EVENT,
    ).map((type) => ({
      value: type,
      label: EFFECT_TRIGGER_ACTION_LABELS[type],
    })),
  );

  /**
   * Меняет вложенное срабатывание, не теряя остальных его полей.
   *
   * @param patch изменённые поля срабатывания.
   */
  function updateNestedTrigger(patch: Partial<NestedEffectTrigger>): void {
    const currentAction = action.value;
    const currentTrigger = nestedTrigger.value;

    if (currentAction.type !== 'applyCondition' || !currentTrigger) {
      return;
    }

    action.value = {
      ...currentAction,
      triggers: [{ ...currentTrigger, ...patch }],
    };
  }

  /**
   * Меняет событие вложенного срабатывания.
   *
   * @param nextEvent событие наложенного состояния.
   */
  function updateNestedEvent(nextEvent: EffectTriggerEvent): void {
    updateNestedTrigger({ event: nextEvent });
  }

  /**
   * Меняет вид действия вложенного срабатывания.
   *
   * @param nextType вид действия.
   */
  function updateNestedActionType(nextType: EffectTriggerActionType): void {
    nestedAction.value = createEffectTriggerAction(nextType);
  }

  const hasRecurringSave = computed({
    get: () =>
      action.value.type === 'applyCondition'
      && action.value.recurringSave !== undefined,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type !== 'applyCondition') {
        return;
      }

      action.value = {
        ...currentAction,
        recurringSave: enabled
          ? {
              ...createDefaultEffectSave(layout),
              timing: DEFAULT_RECURRING_SAVE_TIMING,
            }
          : undefined,
      };
    },
  });

  /** Повторный спасбросок состояния: поля заменяют его целиком. */
  const recurringSave = computed({
    get: (): EffectRecurringSave =>
      action.value.type === 'applyCondition' && action.value.recurringSave
        ? action.value.recurringSave
        : {
            ...createDefaultEffectSave(layout),
            timing: DEFAULT_RECURRING_SAVE_TIMING,
          },
    set: (nextSave: EffectRecurringSave) => {
      const currentAction = action.value;

      if (currentAction.type === 'applyCondition') {
        action.value = { ...currentAction, recurringSave: nextSave };
      }
    },
  });

  /**
   * Меняет момент повторного спасброска состояния.
   *
   * @param nextTiming момент броска.
   */
  function updateRecurringSaveTiming(nextTiming: EffectSaveTiming): void {
    recurringSave.value = { ...recurringSave.value, timing: nextTiming };
  }

  // «Снимает только источник» пишется только включённым: `locked: true`
  const conditionLocked = computed({
    get: () =>
      action.value.type === 'applyCondition' && action.value.locked === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'applyCondition') {
        action.value = {
          ...currentAction,
          locked: enabled ? true : undefined,
        };
      }
    },
  });

  /** «Спадает при выходе»: настройка есть только там, где эффект в зоне. */
  const canEndOnZoneExit = computed(() => layout.delivery === 'zone');

  const conditionEndsOnExit = computed({
    get: () =>
      action.value.type === 'applyCondition'
      && action.value.endsOnExit === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'applyCondition') {
        action.value = {
          ...currentAction,
          endsOnExit: enabled ? true : undefined,
        };
      }
    },
  });

  // Полный запас хитов вместо числа
  const setHpToMax = computed({
    get: () => action.value.type === 'setHp' && action.value.toMax === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'setHp') {
        action.value = {
          ...currentAction,
          toMax: enabled ? true : undefined,
        };
      }
    },
  });

  // Счётчик пишется только включённым: `stack: true`
  const tagStack = computed({
    get: () => action.value.type === 'applyTag' && action.value.stack === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'applyTag') {
        action.value = { ...currentAction, stack: enabled ? true : undefined };
      }
    },
  });

  /**
   * Меняет поля уменьшения максимума хитов.
   *
   * @param patch изменённые поля.
   */
  function updateMaxHp(
    patch: Partial<Omit<EffectTriggerReduceMaxHpAction, 'type'>>,
  ): void {
    const currentAction = action.value;

    if (currentAction.type === 'reduceMaxHp') {
      action.value = { ...currentAction, ...patch };
    }
  }

  /**
   * Меняет «на сколько». Пустое значение не пишется: без него действие не
   * разобралось бы и срабатывание пропало бы из данных.
   *
   * @param nextAmount введённая строка.
   */
  function updateMaxHpAmount(nextAmount: string): void {
    const amount = nextAmount.trim();

    if (amount) {
      updateMaxHp({ amount });
    }
  }

  // Долгий отдых — значение по умолчанию: в данных он не пишется
  const maxHpRest = computed({
    get: () =>
      action.value.type === 'reduceMaxHp'
        ? (action.value.endsOnRest ?? DEFAULT_TRIGGER_REST_TYPE)
        : DEFAULT_TRIGGER_REST_TYPE,
    set: (nextRestEnd: EffectTriggerMaxHpRestEnd) => {
      updateMaxHp({
        endsOnRest:
          nextRestEnd === DEFAULT_TRIGGER_REST_TYPE ? undefined : nextRestEnd,
      });
    },
  });

  /**
   * Меняет ключ отметки.
   *
   * @param nextTag новый ключ.
   */
  function updateTagKey(nextTag: string): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyTag') {
      action.value = { ...currentAction, tag: nextTag.trim() };
    }
  }

  /**
   * Меняет имя отметки в списке; пустое имя — как ключ.
   *
   * @param nextLabel новое имя.
   */
  function updateTagLabel(nextLabel: string): void {
    const currentAction = action.value;

    if (currentAction.type === 'applyTag') {
      action.value = {
        ...currentAction,
        label: nextLabel.trim() || undefined,
      };
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2 border-l-2 border-default pl-3">
    <div class="flex flex-wrap items-center gap-2">
      <UIcon
        :name="actionIcon"
        class="size-4 text-muted"
      />

      <span class="text-xs text-default">
        {{ actionLabel }}
      </span>

      <template v-if="triggerSave">
        <USelect
          v-if="action.type === 'damage'"
          :model-value="damageGate"
          :items="EFFECT_TRIGGER_DAMAGE_GATE_OPTIONS"
          value-key="value"
          size="xs"
          class="w-64 max-w-full"
          :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
          @update:model-value="selectGate"
        />

        <USelect
          v-else
          :model-value="gate"
          :items="EFFECT_TRIGGER_GATE_OPTIONS"
          value-key="value"
          size="xs"
          class="w-40"
          :aria-label="EFFECT_TRIGGER_ROW_LABELS.gate"
          @update:model-value="selectGate"
        />
      </template>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="EFFECT_TRIGGER_ROW_ICONS.removeAction"
        class="ml-auto"
        :aria-label="EFFECT_TRIGGER_ROW_LABELS.removeAction"
        @click.left.exact.prevent="emit('remove')"
      />
    </div>

    <EffectDamageParts
      v-if="action.type === 'damage'"
      :model-value="action.parts"
      allow-healing
      @update:model-value="updateDamageParts"
    />

    <template v-else-if="action.type === 'applyCondition'">
      <div class="flex flex-wrap items-end gap-2">
        <UFormField
          :label="EFFECT_TRIGGER_ROW_LABELS.condition"
          class="w-56"
        >
          <USelect
            :model-value="conditionKey"
            :items="EFFECT_CONDITION_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="updateCondition"
          />
        </UFormField>

        <UFormField
          :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
          class="w-40"
        >
          <UInputNumber
            :model-value="rounds"
            :min="MIN_TRIGGER_ACTION_ROUNDS"
            :placeholder="EFFECT_TRIGGER_ROW_LABELS.conditionRoundsPlaceholder"
            size="sm"
            class="w-full"
            @update:model-value="updateActionRounds"
          />
        </UFormField>
      </div>

      <USwitch
        v-model="conditionLocked"
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionLocked"
        :description="EFFECT_TRIGGER_ROW_LABELS.conditionLockedHint"
      />

      <USwitch
        v-if="canEndOnZoneExit"
        v-model="conditionEndsOnExit"
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionEndsOnExit"
        :description="EFFECT_TRIGGER_ROW_LABELS.conditionEndsOnExitHint"
      />

      <USwitch
        v-model="hasRecurringSave"
        :label="EFFECT_TRIGGER_ROW_LABELS.recurringSaveToggle"
      />

      <div
        v-if="action.recurringSave"
        class="flex flex-wrap items-end gap-2"
      >
        <EffectSaveFields
          v-model:save="recurringSave"
          :layout="layout"
          :applier-save-dc="applierSaveDc"
          :ability-label="EFFECT_TRIGGER_ROW_LABELS.saveAbility"
          :save-dc-label="EFFECT_TRIGGER_ROW_LABELS.saveDc"
        />

        <UFormField
          :label="EFFECT_TRIGGER_ROW_LABELS.recurringSaveTiming"
          class="w-40"
        >
          <USelect
            :model-value="action.recurringSave.timing"
            :items="EFFECT_SAVE_TIMING_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="updateRecurringSaveTiming"
          />
        </UFormField>
      </div>

      <!-- Своё срабатывание состояния: «Сон» просыпается от урона сам, не
           заканчивая каст всем целям -->
      <USwitch
        v-if="!nested"
        v-model="hasNestedTrigger"
        :label="EFFECT_TRIGGER_NESTED_LABELS.toggle"
      />

      <div
        v-if="!nested && nestedTrigger"
        class="flex flex-col gap-2 border-l-2 border-muted/50 pl-3"
      >
        <div class="flex flex-wrap items-end gap-2">
          <UFormField
            :label="EFFECT_TRIGGER_NESTED_LABELS.event"
            class="w-full sm:w-56"
          >
            <USelect
              :model-value="nestedTrigger.event"
              :items="nestedEventItems"
              value-key="value"
              size="sm"
              class="w-full"
              @update:model-value="updateNestedEvent"
            />
          </UFormField>

          <UFormField
            :label="EFFECT_TRIGGER_NESTED_LABELS.action"
            class="w-full sm:w-56"
          >
            <USelect
              :model-value="nestedAction.type"
              :items="nestedActionItems"
              value-key="value"
              size="sm"
              class="w-full"
              @update:model-value="updateNestedActionType"
            />
          </UFormField>
        </div>

        <EffectTriggerActionRow
          v-model:action="nestedAction"
          :layout="layout"
          :applier-save-dc="applierSaveDc"
          nested
        />
      </div>
    </template>

    <div
      v-else-if="action.type === 'setHp'"
      class="flex flex-wrap items-center gap-3"
    >
      <UFormField
        v-if="!action.toMax"
        :label="EFFECT_TRIGGER_ROW_LABELS.setHpValue"
        class="w-32"
      >
        <UInputNumber
          :model-value="action.value"
          :min="MIN_SET_HP_VALUE"
          size="sm"
          class="w-full"
          @update:model-value="updateSetHp"
        />
      </UFormField>

      <USwitch
        v-model="setHpToMax"
        :label="EFFECT_TRIGGER_ROW_LABELS.setHpToMax"
      />
    </div>

    <div
      v-else-if="action.type === 'applyTag'"
      class="flex flex-wrap items-start gap-2"
    >
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.tag"
        :error="tagError"
        class="w-56"
      >
        <UInput
          :model-value="action.tag"
          size="sm"
          class="w-full"
          @update:model-value="updateTagKey"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.tagLabel"
        class="w-48"
      >
        <UInput
          :model-value="action.label"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagLabelPlaceholder"
          size="sm"
          class="w-full"
          @update:model-value="updateTagLabel"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.conditionRounds"
        class="w-52"
      >
        <UInputNumber
          :model-value="rounds"
          :min="MIN_TRIGGER_ACTION_ROUNDS"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.tagRoundsPlaceholder"
          size="sm"
          class="w-full"
          @update:model-value="updateActionRounds"
        />
      </UFormField>

      <USwitch
        v-model="tagStack"
        class="self-end"
        :label="EFFECT_TRIGGER_ROW_LABELS.tagStack"
        :description="EFFECT_TRIGGER_ROW_LABELS.tagStackHint"
      />
    </div>

    <div
      v-else-if="action.type === 'reduceMaxHp'"
      class="flex flex-wrap items-start gap-2"
    >
      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.maxHpAmount"
        :help="EFFECT_TRIGGER_ROW_LABELS.maxHpAmountHint"
        class="w-56"
      >
        <UInput
          :model-value="action.amount"
          :placeholder="EFFECT_TRIGGER_ROW_LABELS.maxHpAmountPlaceholder"
          size="sm"
          class="w-full font-mono"
          @update:model-value="updateMaxHpAmount"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_TRIGGER_ROW_LABELS.maxHpRest"
        class="w-48"
      >
        <USelect
          v-model="maxHpRest"
          :items="EFFECT_TRIGGER_MAX_HP_REST_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>

    <EffectTriggerActionFields
      v-else
      v-model:action="action"
      :event="event"
    />
  </div>
</template>
