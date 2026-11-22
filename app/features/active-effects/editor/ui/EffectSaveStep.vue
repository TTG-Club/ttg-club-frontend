<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectFormLayout,
    EffectSave,
    EffectSuccessOutcome,
  } from '../../model';

  import {
    ACTIVE_EFFECT_FORM_LABELS,
    buildSuccessOutcomeOptions,
    EFFECT_ACTION_SAVE_SUCCESS_TITLES,
    EFFECT_SAVE_STEP_LABELS,
    EFFECT_SAVE_UNAVAILABLE_HINTS,
    readEffectSuccessOutcome,
    writeEffectSaveEnabled,
    writeEffectSuccessOutcome,
  } from '../../model';
  import EffectSaveFields from './EffectSaveFields.vue';

  /**
   * Шаг «Спасбросок»: нужен ли спасбросок, какой и что даёт успех. Там, где
   * спасброска быть не может, шаг объясняет, как его получить.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** Заголовок выбора «при успехе» спасброска заклинания или действия. */
  const actionSaveSuccessTitle = computed(
    () => EFFECT_ACTION_SAVE_SUCCESS_TITLES[layout.context],
  );

  /**
   * Эффект на цели заклинания или действия: у них свой спасбросок, и
   * спасбросок эффекта — дополнительный.
   */
  const isActionTarget = computed(
    () =>
      layout.delivery === 'target'
      && actionSaveSuccessTitle.value !== undefined,
  );

  const toggleLabel = computed(() => {
    if (isActionTarget.value) {
      return EFFECT_SAVE_STEP_LABELS.ownToggle;
    }

    // У зоны и ауры бросает не цель атаки, а вошедший или вышедший
    return layout.showTrigger
      ? EFFECT_SAVE_STEP_LABELS.areaToggle
      : EFFECT_SAVE_STEP_LABELS.toggle;
  });

  const toggleHint = computed(() =>
    isActionTarget.value
      ? EFFECT_SAVE_STEP_LABELS.ownToggleHint
      : EFFECT_SAVE_STEP_LABELS.toggleHint,
  );

  const successTitle = computed(() =>
    layout.successOutcomeForActionSave
      ? (actionSaveSuccessTitle.value ?? EFFECT_SAVE_STEP_LABELS.successTitle)
      : EFFECT_SAVE_STEP_LABELS.successTitle,
  );

  const successOptions = computed(() => buildSuccessOutcomeOptions(layout));

  /** Выбирать есть из чего: единственный вариант «ничего» не показывается. */
  const showSuccessChoice = computed(() => successOptions.value.length > 1);

  const unavailableHint = computed(() =>
    layout.saveUnavailableReason
      ? EFFECT_SAVE_UNAVAILABLE_HINTS[layout.saveUnavailableReason]
      : '',
  );

  const hasSave = computed({
    get: () => effect.value.applySave !== undefined,
    set: (enabled: boolean) => {
      effect.value = writeEffectSaveEnabled(effect.value, enabled, layout);
    },
  });

  /**
   * Заменяет спасбросок эффекта.
   *
   * @param nextSave спасбросок с изменёнными характеристикой или Сл.
   */
  function updateSave(nextSave: EffectSave): void {
    effect.value = { ...effect.value, applySave: nextSave };
  }

  // Галочка пишется только включённой: `allowWilling: true`
  const allowWilling = computed({
    get: () => effect.value.applySave?.allowWilling === true,
    set: (enabled: boolean) => {
      const { applySave } = effect.value;

      if (applySave) {
        effect.value = {
          ...effect.value,
          applySave: { ...applySave, allowWilling: enabled ? true : undefined },
        };
      }
    },
  });

  const successOutcome = computed({
    get: () => readEffectSuccessOutcome(effect.value),
    set: (outcome: EffectSuccessOutcome) => {
      effect.value = writeEffectSuccessOutcome(effect.value, outcome);
    },
  });
</script>

<template>
  <template v-if="layout.showSave">
    <USwitch
      v-model="hasSave"
      :label="toggleLabel"
      :description="toggleHint"
    />

    <div
      v-if="effect.applySave"
      class="flex flex-wrap items-end gap-3"
    >
      <EffectSaveFields
        :save="effect.applySave"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
        :ability-label="ACTIVE_EFFECT_FORM_LABELS.ability"
        :save-dc-label="ACTIVE_EFFECT_FORM_LABELS.saveDc"
        @update:save="updateSave"
      />

      <USwitch
        v-model="allowWilling"
        class="mb-2"
        :label="EFFECT_SAVE_STEP_LABELS.allowWilling"
        :description="EFFECT_SAVE_STEP_LABELS.allowWillingHint"
      />
    </div>
  </template>

  <p
    v-else-if="unavailableHint"
    class="text-xs text-muted"
  >
    {{ unavailableHint }}
  </p>

  <div
    v-if="showSuccessChoice"
    class="flex flex-col gap-1.5"
  >
    <span class="text-xs font-medium text-muted">
      {{ successTitle }}
    </span>

    <URadioGroup
      v-model="successOutcome"
      :items="successOptions"
      value-key="value"
      variant="card"
      size="sm"
      :ui="{ fieldset: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }"
    />
  </div>
</template>
