<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectDurationType,
    EffectTurnAnchor,
    EffectTurnTiming,
  } from '../../model';

  import {
    DEFAULT_EFFECT_TURN_ANCHOR,
    DEFAULT_EFFECT_TURN_TIMING,
    durationHint,
    EFFECT_DURATION_STEP_LABELS,
    EFFECT_DURATION_TYPE_OPTIONS,
    EFFECT_TURN_ANCHOR_OPTIONS,
    EFFECT_TURN_DURATION_TYPE,
    EFFECT_TURN_TIMING_OPTIONS,
    isCountedDuration,
    MIN_EFFECT_DURATION_VALUE,
    writeDurationType,
  } from '../../model';

  /**
   * Шаг «Длительность»: сколько держится эффект — числом или формулой, которую
   * VTTG бросит при наложении. Повторный спасбросок и снятие после атаки —
   * строки списка «Срабатывания».
   */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const durationType = computed({
    get: () => effect.value.duration.type,
    set: (type: EffectDurationType) => {
      effect.value = {
        ...effect.value,
        duration: writeDurationType(effect.value.duration, type),
        // Формула — это число единиц срока: у срока без числа её нет
        durationFormula: isCountedDuration(type)
          ? effect.value.durationFormula
          : undefined,
      };
    },
  });

  const hasDurationValue = computed(() =>
    isCountedDuration(effect.value.duration.type),
  );

  const isTurnDuration = computed(
    () => effect.value.duration.type === EFFECT_TURN_DURATION_TYPE,
  );

  const durationDescription = computed(() =>
    durationHint(effect.value.duration.type),
  );

  const durationValue = computed({
    get: () => effect.value.duration.value ?? null,
    set: (durationAmount: number | null) => {
      effect.value = {
        ...effect.value,
        duration: {
          ...effect.value.duration,
          value: durationAmount ?? undefined,
        },
      };
    },
  });

  // Число и формулу вместе задать нельзя: заполненное число у формулы VTTG
  // считает её результатом и кость не перебрасывает
  const useDurationFormula = computed({
    get: () => effect.value.durationFormula !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        durationFormula: enabled ? '' : undefined,
        duration: { ...effect.value.duration, value: undefined },
      };
    },
  });

  /** Срок задан формулой — у длительности, которая вообще считается. */
  const showsDurationFormula = computed(
    () => hasDurationValue.value && useDurationFormula.value,
  );

  /** Срок задан числом. */
  const showsDurationNumber = computed(
    () => hasDurationValue.value && !useDurationFormula.value,
  );

  const durationFormula = computed({
    get: () => effect.value.durationFormula ?? '',
    set: (formula: string) => {
      effect.value = { ...effect.value, durationFormula: formula };
    },
  });

  const turnTiming = computed({
    get: () => effect.value.duration.turnTiming ?? DEFAULT_EFFECT_TURN_TIMING,
    set: (timing: EffectTurnTiming) => {
      effect.value = {
        ...effect.value,
        duration: { ...effect.value.duration, turnTiming: timing },
      };
    },
  });

  const turnAnchor = computed({
    get: () => effect.value.duration.turnAnchor ?? DEFAULT_EFFECT_TURN_ANCHOR,
    set: (anchor: EffectTurnAnchor) => {
      effect.value = {
        ...effect.value,
        duration: { ...effect.value.duration, turnAnchor: anchor },
      };
    },
  });
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-medium text-default">
      {{ EFFECT_DURATION_STEP_LABELS.durationTitle }}
    </span>

    <div class="flex flex-wrap items-center gap-2">
      <USelect
        v-model="durationType"
        :items="EFFECT_DURATION_TYPE_OPTIONS"
        value-key="value"
        size="sm"
        class="w-48"
      />

      <UInputNumber
        v-if="showsDurationNumber"
        v-model="durationValue"
        :min="MIN_EFFECT_DURATION_VALUE"
        :placeholder="EFFECT_DURATION_STEP_LABELS.valuePlaceholder"
        size="sm"
        class="w-28"
      />

      <UInput
        v-if="showsDurationFormula"
        v-model="durationFormula"
        :placeholder="EFFECT_DURATION_STEP_LABELS.formulaPlaceholder"
        size="sm"
        class="w-40 font-mono"
      />

      <USwitch
        v-if="hasDurationValue"
        v-model="useDurationFormula"
        :label="EFFECT_DURATION_STEP_LABELS.formulaToggle"
        size="sm"
      />

      <template v-if="isTurnDuration">
        <USelect
          v-model="turnTiming"
          :items="EFFECT_TURN_TIMING_OPTIONS"
          value-key="value"
          size="sm"
          class="w-40"
        />

        <USelect
          v-model="turnAnchor"
          :items="EFFECT_TURN_ANCHOR_OPTIONS"
          value-key="value"
          size="sm"
          class="w-48"
        />
      </template>
    </div>

    <p class="text-xs text-muted">
      {{ durationDescription }}
    </p>

    <p
      v-if="showsDurationFormula"
      class="text-xs text-muted"
    >
      {{ EFFECT_DURATION_STEP_LABELS.formulaToggleHint }}
    </p>
  </div>
</template>
