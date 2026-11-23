<script setup lang="ts">
  import type { EffectActionCost, EffectActionCostSettings } from '../../model';

  import {
    actionCostTakesFeet,
    DEFAULT_EFFECT_ACTION_COST,
    DEFAULT_EFFECT_MOVE_COST_FEET,
    EFFECT_ACTION_COST_FIELD_LABELS,
    EFFECT_ACTION_COST_OPTIONS,
    EFFECT_MOVE_COST_FEET_STEP,
    MAX_EFFECT_MOVE_COST_FEET,
    MIN_EFFECT_MOVE_COST_FEET,
  } from '../../model';

  /**
   * Цена действия: чем человек платит за срабатывание или за «вырваться». У
   * цены «Перемещение» есть число футов. Ходом распоряжается человек — цена
   * здесь пометка, а не списание.
   */
  const { help = undefined } = defineProps<{
    /** Пояснение под выбором цены. */
    help?: string;
  }>();

  /** Цена и футы перемещения — те же поля у срабатывания и у «вырваться». */
  const model = defineModel<EffectActionCostSettings>({
    required: true,
  });

  // Бесплатно — значение по умолчанию: в данных цена не пишется
  const cost = computed({
    get: () => model.value.cost ?? DEFAULT_EFFECT_ACTION_COST,
    set: (nextCost: EffectActionCost) => {
      model.value = {
        cost: nextCost === DEFAULT_EFFECT_ACTION_COST ? undefined : nextCost,
        // Футы перемещения нужны только цене «Перемещение»
        moveCostFeet: actionCostTakesFeet(nextCost)
          ? (model.value.moveCostFeet ?? DEFAULT_EFFECT_MOVE_COST_FEET)
          : undefined,
      };
    },
  });

  const moveCostFeet = computed({
    get: () => model.value.moveCostFeet ?? DEFAULT_EFFECT_MOVE_COST_FEET,
    set: (feet: number | null) => {
      model.value = {
        ...model.value,
        moveCostFeet: feet ?? DEFAULT_EFFECT_MOVE_COST_FEET,
      };
    },
  });

  const showsFeet = computed(() => actionCostTakesFeet(model.value.cost));
</script>

<template>
  <UFormField
    :label="EFFECT_ACTION_COST_FIELD_LABELS.cost"
    :help="help"
    class="w-full sm:w-48"
  >
    <USelect
      v-model="cost"
      :items="EFFECT_ACTION_COST_OPTIONS"
      value-key="value"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="showsFeet"
    :label="EFFECT_ACTION_COST_FIELD_LABELS.moveCost"
    class="w-full sm:w-28"
  >
    <UInputNumber
      v-model="moveCostFeet"
      :min="MIN_EFFECT_MOVE_COST_FEET"
      :max="MAX_EFFECT_MOVE_COST_FEET"
      :step="EFFECT_MOVE_COST_FEET_STEP"
      size="sm"
      class="w-full"
    />
  </UFormField>
</template>
