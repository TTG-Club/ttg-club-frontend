<script setup lang="ts">
  import type {
    EffectCastOwner,
    EffectNotifyTarget,
    EffectRestoreKind,
    EffectTempHpMode,
    EffectTriggerAction,
    EffectTriggerAreaShiftKind,
    EffectTriggerEvent,
    EffectTriggerMoveKind,
    EffectTriggerMoveOrigin,
  } from '../../model';

  import {
    ANY_CONDITION_KEY,
    buildAreaShiftKindOptions,
    buildConditionItemsWithAny,
    DEFAULT_CAST_OWNER,
    DEFAULT_NOTIFY_TARGET,
    DEFAULT_RESTORE_KIND,
    DEFAULT_TEMP_HP_MODE,
    DEFAULT_TRIGGER_AREA_SHIFT_KIND,
    DEFAULT_TRIGGER_MOVE_DISTANCE,
    DEFAULT_TRIGGER_MOVE_KIND,
    DEFAULT_TRIGGER_MOVE_ORIGIN,
    EFFECT_CAST_OWNER_OPTIONS,
    EFFECT_NOTIFY_TARGET_OPTIONS,
    EFFECT_RESTORE_KIND_OPTIONS,
    EFFECT_TEMP_HP_MODE_OPTIONS,
    EFFECT_TRIGGER_MOVE_KIND_OPTIONS,
    EFFECT_TRIGGER_MOVE_ORIGIN_OPTIONS,
    EFFECT_TRIGGER_ROW_LABELS,
    MAX_NOTIFY_TEXT_LENGTH,
    MAX_SPELL_SLOT_LEVEL,
    MAX_TRIGGER_MOVE_DISTANCE,
    MIN_DISPEL_LEVEL,
    MIN_REVIVE_HP,
    MIN_SPELL_SLOT_LEVEL,
    MIN_TRIGGER_MOVE_DISTANCE,
    PATH_AREA_SHIFT_KINDS,
  } from '../../model';

  /**
   * Поля действий срабатывания, у которых нет своих подсписков: временные
   * хиты, перемещение, сдвиг зоны, снятие состояния, возврат к жизни, возврат
   * ресурса, рассеивание, конец каста и сообщение человеку. У действий без
   * полей («Убить», «Дать вдохновение», «Следующая ступень») не показывается
   * ничего.
   */
  const { event = undefined } = defineProps<{
    /** Событие срабатывания: «зона за носителем» бывает только на пути. */
    event?: EffectTriggerEvent;
  }>();

  /** Действие: поля заменяют его целиком при каждой правке. */
  const action = defineModel<EffectTriggerAction>('action', {
    required: true,
  });

  /** Состояния для снятия: «Все состояния» первым пунктом. */
  const removableConditionItems = buildConditionItemsWithAny(
    EFFECT_TRIGGER_ROW_LABELS.removeConditionAll,
  );

  const areaShiftKindOptions = computed(() => buildAreaShiftKindOptions(event));

  // Зона, идущая за носителем, повторяет его путь: расстояния у неё нет
  const areaShiftNeedsDistance = computed(
    () =>
      action.value.type === 'moveArea'
      && !PATH_AREA_SHIFT_KINDS.includes(action.value.kind),
  );

  /**
   * Меняет число или формулу временных хитов. Пустое значение не пишется: без
   * него действие не разобралось бы и срабатывание пропало бы из данных.
   *
   * @param nextAmount введённая строка.
   */
  function updateTempHpAmount(nextAmount: string): void {
    const currentAction = action.value;
    const amount = nextAmount.trim();

    if (currentAction.type === 'tempHp' && amount) {
      action.value = { ...currentAction, amount };
    }
  }

  // Поставить — значение по умолчанию: в данных оно не пишется
  const tempHpMode = computed({
    get: () =>
      action.value.type === 'tempHp'
        ? (action.value.mode ?? DEFAULT_TEMP_HP_MODE)
        : DEFAULT_TEMP_HP_MODE,
    set: (nextMode: EffectTempHpMode) => {
      const currentAction = action.value;

      if (currentAction.type === 'tempHp') {
        action.value = {
          ...currentAction,
          mode: nextMode === DEFAULT_TEMP_HP_MODE ? undefined : nextMode,
        };
      }
    },
  });

  const moveKind = computed({
    get: () =>
      action.value.type === 'move'
        ? action.value.kind
        : DEFAULT_TRIGGER_MOVE_KIND,
    set: (nextKind: EffectTriggerMoveKind) => {
      const currentAction = action.value;

      if (currentAction.type === 'move') {
        action.value = { ...currentAction, kind: nextKind };
      }
    },
  });

  // Наложивший — значение по умолчанию: в данных он не пишется
  const moveOrigin = computed({
    get: () =>
      action.value.type === 'move'
        ? (action.value.from ?? DEFAULT_TRIGGER_MOVE_ORIGIN)
        : DEFAULT_TRIGGER_MOVE_ORIGIN,
    set: (nextOrigin: EffectTriggerMoveOrigin) => {
      const currentAction = action.value;

      if (currentAction.type === 'move') {
        action.value = {
          ...currentAction,
          from:
            nextOrigin === DEFAULT_TRIGGER_MOVE_ORIGIN ? undefined : nextOrigin,
        };
      }
    },
  });

  /**
   * Меняет расстояние перемещения; очищенное поле — ноль.
   *
   * @param nextDistance введённые футы.
   */
  function updateMoveDistance(nextDistance: number | null | undefined): void {
    const currentAction = action.value;

    if (currentAction.type === 'move') {
      action.value = {
        ...currentAction,
        distance: Math.max(
          MIN_TRIGGER_MOVE_DISTANCE,
          nextDistance ?? MIN_TRIGGER_MOVE_DISTANCE,
        ),
      };
    }
  }

  const areaShiftKind = computed({
    get: () =>
      action.value.type === 'moveArea'
        ? action.value.kind
        : DEFAULT_TRIGGER_AREA_SHIFT_KIND,
    set: (nextKind: EffectTriggerAreaShiftKind) => {
      const currentAction = action.value;

      if (currentAction.type === 'moveArea') {
        action.value = { ...currentAction, kind: nextKind };
      }
    },
  });

  // Без своего числа зона сдвигается на расстояние по умолчанию;
  // очищенное поле — ноль
  const areaShiftDistance = computed({
    get: () =>
      action.value.type === 'moveArea'
        ? (action.value.distance ?? DEFAULT_TRIGGER_MOVE_DISTANCE)
        : DEFAULT_TRIGGER_MOVE_DISTANCE,
    set: (nextDistance: number | null) => {
      const currentAction = action.value;

      if (currentAction.type === 'moveArea') {
        action.value = {
          ...currentAction,
          distance: Math.max(
            MIN_TRIGGER_MOVE_DISTANCE,
            nextDistance ?? MIN_TRIGGER_MOVE_DISTANCE,
          ),
        };
      }
    },
  });

  // «Все состояния» — в данных ключа нет: снимаются все состояния получателя
  const removedCondition = computed({
    get: () =>
      action.value.type === 'removeCondition'
        ? (action.value.conditionKey ?? ANY_CONDITION_KEY)
        : ANY_CONDITION_KEY,
    set: (nextKey: string) => {
      const currentAction = action.value;

      if (currentAction.type === 'removeCondition') {
        action.value = {
          ...currentAction,
          conditionKey: nextKey === ANY_CONDITION_KEY ? undefined : nextKey,
        };
      }
    },
  });

  // Полный запас хитов вместо числа
  const reviveFull = computed({
    get: () => action.value.type === 'revive' && action.value.full === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'revive') {
        action.value = { ...currentAction, full: enabled ? true : undefined };
      }
    },
  });

  // Без своего числа — один хит; очищенное поле — тоже
  const reviveHp = computed({
    get: () =>
      action.value.type === 'revive'
        ? (action.value.hp ?? MIN_REVIVE_HP)
        : MIN_REVIVE_HP,
    set: (hitPoints: number | null) => {
      const currentAction = action.value;

      if (currentAction.type === 'revive') {
        action.value = {
          ...currentAction,
          hp: Math.max(MIN_REVIVE_HP, hitPoints ?? MIN_REVIVE_HP),
        };
      }
    },
  });

  const restoreWhat = computed({
    get: () =>
      action.value.type === 'restore'
        ? action.value.what
        : DEFAULT_RESTORE_KIND,
    set: (nextKind: EffectRestoreKind) => {
      const currentAction = action.value;

      if (currentAction.type === 'restore') {
        action.value = {
          ...currentAction,
          what: nextKind,
          level: nextKind === 'spellSlot' ? MIN_SPELL_SLOT_LEVEL : undefined,
          counter: nextKind === 'counter' ? currentAction.counter : undefined,
        };
      }
    },
  });

  // Круг ячейки держится в пределах кругов заклинаний
  const restoreLevel = computed({
    get: () =>
      action.value.type === 'restore'
        ? (action.value.level ?? MIN_SPELL_SLOT_LEVEL)
        : MIN_SPELL_SLOT_LEVEL,
    set: (nextLevel: number | null) => {
      const currentAction = action.value;

      if (currentAction.type === 'restore') {
        action.value = {
          ...currentAction,
          level: Math.min(
            MAX_SPELL_SLOT_LEVEL,
            Math.max(MIN_SPELL_SLOT_LEVEL, nextLevel ?? MIN_SPELL_SLOT_LEVEL),
          ),
        };
      }
    },
  });

  // Пустой ключ ресурса не пишется: без него возвращать нечего
  const restoreCounter = computed({
    get: () =>
      action.value.type === 'restore' ? (action.value.counter ?? '') : '',
    set: (nextCounter: string) => {
      const currentAction = action.value;
      const counter = nextCounter.trim();

      if (currentAction.type === 'restore' && counter) {
        action.value = { ...currentAction, counter };
      }
    },
  });

  /**
   * Меняет круг у «Рассеять заклинания».
   *
   * @param nextLevel введённый круг.
   */
  function updateDispelLevel(nextLevel: number | null | undefined): void {
    const currentAction = action.value;

    if (currentAction.type === 'dispel') {
      action.value = {
        ...currentAction,
        maxLevel: Math.min(
          MAX_SPELL_SLOT_LEVEL,
          Math.max(MIN_DISPEL_LEVEL, nextLevel ?? MIN_DISPEL_LEVEL),
        ),
      };
    }
  }

  const dispelWithoutLevel = computed({
    get: () =>
      action.value.type === 'dispel' && action.value.withoutLevel === true,
    set: (enabled: boolean) => {
      const currentAction = action.value;

      if (currentAction.type === 'dispel') {
        action.value = {
          ...currentAction,
          withoutLevel: enabled ? true : undefined,
        };
      }
    },
  });

  // Свой каст — значение по умолчанию: в данных оно не пишется
  const endCastWhose = computed({
    get: () =>
      action.value.type === 'endCast'
        ? (action.value.whose ?? DEFAULT_CAST_OWNER)
        : DEFAULT_CAST_OWNER,
    set: (nextOwner: EffectCastOwner) => {
      const currentAction = action.value;

      if (currentAction.type === 'endCast') {
        action.value = {
          ...currentAction,
          whose: nextOwner === DEFAULT_CAST_OWNER ? undefined : nextOwner,
        };
      }
    },
  });

  /**
   * Меняет текст сообщения. Пустой текст не пишется: без него сообщение не
   * разобралось бы и срабатывание пропало бы из данных.
   *
   * @param nextText введённый текст.
   */
  function updateNotifyText(nextText: string): void {
    const currentAction = action.value;
    const text = nextText.trim();

    if (currentAction.type === 'notify' && text) {
      action.value = { ...currentAction, text };
    }
  }

  // Носитель — значение по умолчанию: в данных он не пишется
  const notifyTo = computed({
    get: () =>
      action.value.type === 'notify'
        ? (action.value.to ?? DEFAULT_NOTIFY_TARGET)
        : DEFAULT_NOTIFY_TARGET,
    set: (nextTarget: EffectNotifyTarget) => {
      const currentAction = action.value;

      if (currentAction.type === 'notify') {
        action.value = {
          ...currentAction,
          to: nextTarget === DEFAULT_NOTIFY_TARGET ? undefined : nextTarget,
        };
      }
    },
  });

  // Пустая формула убирает бросок к сообщению
  const notifyRoll = computed({
    get: () =>
      action.value.type === 'notify' ? (action.value.roll ?? '') : '',
    set: (nextRoll: string) => {
      const currentAction = action.value;

      if (currentAction.type === 'notify') {
        action.value = { ...currentAction, roll: nextRoll.trim() || undefined };
      }
    },
  });
</script>

<template>
  <div
    v-if="action.type === 'tempHp'"
    class="flex flex-wrap items-start gap-2"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.tempHpAmount"
      :help="EFFECT_TRIGGER_ROW_LABELS.maxHpAmountHint"
      class="w-full sm:w-56"
    >
      <UInput
        :model-value="action.amount"
        size="sm"
        class="w-full font-mono"
        @update:model-value="updateTempHpAmount"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.tempHpMode"
      class="w-full sm:w-44"
    >
      <USelect
        v-model="tempHpMode"
        :items="EFFECT_TEMP_HP_MODE_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>
  </div>

  <div
    v-else-if="action.type === 'moveArea'"
    class="flex flex-wrap items-start gap-2"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.areaShiftKind"
      :help="EFFECT_TRIGGER_ROW_LABELS.areaShiftHint"
      class="w-full sm:w-52"
    >
      <USelect
        v-model="areaShiftKind"
        :items="areaShiftKindOptions"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="areaShiftNeedsDistance"
      :label="EFFECT_TRIGGER_ROW_LABELS.moveDistance"
      class="w-full sm:w-28"
    >
      <UInputNumber
        v-model="areaShiftDistance"
        :min="MIN_TRIGGER_MOVE_DISTANCE"
        :max="MAX_TRIGGER_MOVE_DISTANCE"
        size="sm"
        class="w-full"
      />
    </UFormField>
  </div>

  <div
    v-else-if="action.type === 'move'"
    class="flex flex-wrap items-start gap-2"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.moveKind"
      class="w-full sm:w-44"
    >
      <USelect
        v-model="moveKind"
        :items="EFFECT_TRIGGER_MOVE_KIND_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.moveDistance"
      class="w-full sm:w-28"
    >
      <UInputNumber
        :model-value="action.distance"
        :min="MIN_TRIGGER_MOVE_DISTANCE"
        :max="MAX_TRIGGER_MOVE_DISTANCE"
        size="sm"
        class="w-full"
        @update:model-value="updateMoveDistance"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.moveFrom"
      :help="EFFECT_TRIGGER_ROW_LABELS.moveHint"
      class="w-full sm:w-52"
    >
      <USelect
        v-model="moveOrigin"
        :items="EFFECT_TRIGGER_MOVE_ORIGIN_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>
  </div>

  <UFormField
    v-else-if="action.type === 'removeCondition'"
    :label="EFFECT_TRIGGER_ROW_LABELS.condition"
    class="w-full sm:w-64"
  >
    <USelectMenu
      v-model="removedCondition"
      :items="removableConditionItems"
      value-key="value"
      label-key="label"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <div
    v-else-if="action.type === 'revive'"
    class="flex flex-wrap items-center gap-3"
  >
    <UFormField
      v-if="!action.full"
      :label="EFFECT_TRIGGER_ROW_LABELS.reviveHp"
      class="w-32"
    >
      <UInputNumber
        v-model="reviveHp"
        :min="MIN_REVIVE_HP"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <USwitch
      v-model="reviveFull"
      :label="EFFECT_TRIGGER_ROW_LABELS.reviveFull"
    />
  </div>

  <div
    v-else-if="action.type === 'restore'"
    class="flex flex-wrap items-start gap-2"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.restoreWhat"
      class="w-full sm:w-52"
    >
      <USelect
        v-model="restoreWhat"
        :items="EFFECT_RESTORE_KIND_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="action.what === 'spellSlot'"
      :label="EFFECT_TRIGGER_ROW_LABELS.restoreLevel"
      class="w-full sm:w-28"
    >
      <UInputNumber
        v-model="restoreLevel"
        :min="MIN_SPELL_SLOT_LEVEL"
        :max="MAX_SPELL_SLOT_LEVEL"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-else
      :label="EFFECT_TRIGGER_ROW_LABELS.restoreCounter"
      class="w-full sm:w-56"
    >
      <UInput
        v-model="restoreCounter"
        size="sm"
        class="w-full"
      />
    </UFormField>
  </div>

  <div
    v-else-if="action.type === 'dispel'"
    class="flex flex-wrap items-center gap-3"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.dispelMaxLevel"
      class="w-32"
    >
      <UInputNumber
        :model-value="action.maxLevel"
        :min="MIN_DISPEL_LEVEL"
        :max="MAX_SPELL_SLOT_LEVEL"
        size="sm"
        class="w-full"
        @update:model-value="updateDispelLevel"
      />
    </UFormField>

    <USwitch
      v-model="dispelWithoutLevel"
      :label="EFFECT_TRIGGER_ROW_LABELS.dispelWithoutLevel"
    />
  </div>

  <UFormField
    v-else-if="action.type === 'endCast'"
    :label="EFFECT_TRIGGER_ROW_LABELS.endCastWhose"
    class="w-full sm:w-44"
  >
    <USelect
      v-model="endCastWhose"
      :items="EFFECT_CAST_OWNER_OPTIONS"
      value-key="value"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <div
    v-else-if="action.type === 'notify'"
    class="flex flex-wrap items-start gap-2"
  >
    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.notifyText"
      class="w-full sm:w-72"
    >
      <UInput
        :model-value="action.text"
        :placeholder="EFFECT_TRIGGER_ROW_LABELS.notifyTextPlaceholder"
        :maxlength="MAX_NOTIFY_TEXT_LENGTH"
        size="sm"
        class="w-full"
        @update:model-value="updateNotifyText"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.notifyTo"
      class="w-full sm:w-48"
    >
      <USelect
        v-model="notifyTo"
        :items="EFFECT_NOTIFY_TARGET_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_TRIGGER_ROW_LABELS.notifyRoll"
      :help="EFFECT_TRIGGER_ROW_LABELS.notifyRollHint"
      class="w-full sm:w-40"
    >
      <UInput
        v-model="notifyRoll"
        :placeholder="EFFECT_TRIGGER_ROW_LABELS.notifyRollPlaceholder"
        size="sm"
        class="w-full font-mono"
      />
    </UFormField>
  </div>
</template>
