<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectActionCostSettings,
    EffectEscape,
    EffectEscapeActor,
    EffectEscapeCheck,
    EffectEscapeOutcome,
    EffectFormLayout,
  } from '../../model';

  import {
    APPLIER_SAVE_DC,
    DEFAULT_EFFECT_SAVE_DC,
    DEFAULT_ESCAPE_ACTOR,
    DEFAULT_ESCAPE_LABEL,
    DEFAULT_ESCAPE_OUTCOME,
    EFFECT_APPLIER_DC_LABELS,
    EFFECT_ESCAPE_ACTOR_OPTIONS,
    EFFECT_ESCAPE_OUTCOME_OPTIONS,
    EFFECT_ESCAPE_SECTION_LABELS,
    EFFECT_SKILL_OPTIONS,
    layoutAcceptsApplierSaveDc,
    MAX_EFFECT_STAGE_LABEL_LENGTH,
    NEW_ESCAPE_CHECK_SKILL,
    NEW_ESCAPE_COST,
  } from '../../model';
  import EffectActionCostFields from './EffectActionCostFields.vue';
  import EffectSaveDcField from './EffectSaveDcField.vue';

  /**
   * Раздел «Действие, снимающее эффект»: «существо может действием совершить
   * проверку Силы (Атлетика) Сл 14 и освободиться». На листе VTTG у такого
   * эффекта появляется кнопка.
   *
   * Сл «Авто» — Сл источника: её проставляют при наложении. У эффекта без
   * источника она остаётся нулевой, и кнопка честно отказывается действовать —
   * поэтому «Авто» есть только там, где источник бывает.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  /** «Авто» доступно там, где Сл источника вообще бывает. */
  const autoDcAllowed = computed(() => layoutAcceptsApplierSaveDc(layout));

  const applierDcLabel = computed(
    () => EFFECT_APPLIER_DC_LABELS[layout.context],
  );

  /**
   * Новая проверка: Атлетика против Сл источника там, где он есть, иначе
   * против своего числа — ноль без источника сохранение всё равно подняло бы
   * до наименьшей допустимой Сл.
   *
   * @returns проверка.
   */
  function createEscapeCheck(): EffectEscapeCheck {
    return {
      skill: NEW_ESCAPE_CHECK_SKILL,
      dc: autoDcAllowed.value ? APPLIER_SAVE_DC : DEFAULT_EFFECT_SAVE_DC,
    };
  }

  /**
   * Меняет поля блока действия.
   *
   * @param patch новые поля блока.
   */
  function updateEscape(patch: Partial<EffectEscape>): void {
    const { escape } = effect.value;

    if (escape) {
      effect.value = { ...effect.value, escape: { ...escape, ...patch } };
    }
  }

  /**
   * Меняет поля проверки.
   *
   * @param patch новые поля проверки.
   */
  function updateEscapeCheck(patch: Partial<EffectEscapeCheck>): void {
    const check = effect.value.escape?.check;

    if (check) {
      updateEscape({ check: { ...check, ...patch } });
    }
  }

  // Новый блок — действием и с проверкой: так правила пишут чаще всего
  const hasEscape = computed({
    get: () => effect.value.escape !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        escape: enabled
          ? { cost: NEW_ESCAPE_COST, check: createEscapeCheck() }
          : undefined,
      };
    },
  });

  // Носитель — значение по умолчанию: в данных он не пишется
  const escapeActor = computed({
    get: () => effect.value.escape?.by ?? DEFAULT_ESCAPE_ACTOR,
    set: (nextActor: EffectEscapeActor) =>
      updateEscape({
        by: nextActor === DEFAULT_ESCAPE_ACTOR ? undefined : nextActor,
      }),
  });

  const escapeActionCost = computed({
    get: () => ({
      cost: effect.value.escape?.cost,
      moveCostFeet: effect.value.escape?.moveCostFeet,
    }),
    set: (nextCost: EffectActionCostSettings) => updateEscape(nextCost),
  });

  // «Снять эффект» — значение по умолчанию: в данных оно не пишется
  const escapeOutcome = computed({
    get: () => effect.value.escape?.onSuccess ?? DEFAULT_ESCAPE_OUTCOME,
    set: (nextOutcome: EffectEscapeOutcome) =>
      updateEscape({
        onSuccess:
          nextOutcome === DEFAULT_ESCAPE_OUTCOME ? undefined : nextOutcome,
      }),
  });

  // Пустая подпись — кнопка «Вырваться»: в данных поля нет
  const escapeLabel = computed({
    get: () => effect.value.escape?.label ?? '',
    set: (nextLabel: string) =>
      updateEscape({ label: nextLabel.trim() ? nextLabel : undefined }),
  });

  const hasCheck = computed({
    get: () => effect.value.escape?.check !== undefined,
    set: (enabled: boolean) =>
      updateEscape({ check: enabled ? createEscapeCheck() : undefined }),
  });

  const escapeSkill = computed({
    get: () => effect.value.escape?.check?.skill ?? NEW_ESCAPE_CHECK_SKILL,
    set: (nextSkill: string) => updateEscapeCheck({ skill: nextSkill }),
  });

  const escapeDc = computed({
    get: () => effect.value.escape?.check?.dc ?? APPLIER_SAVE_DC,
    set: (nextDc: number) => updateEscapeCheck({ dc: nextDc }),
  });
</script>

<template>
  <div class="flex flex-col gap-2">
    <USwitch
      v-model="hasEscape"
      :label="EFFECT_ESCAPE_SECTION_LABELS.toggle"
      :description="EFFECT_ESCAPE_SECTION_LABELS.hint"
    />

    <div
      v-if="effect.escape"
      class="flex flex-wrap items-end gap-2 rounded-md border border-default p-2"
    >
      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.actor"
        class="w-full sm:w-44"
      >
        <USelect
          v-model="escapeActor"
          :items="EFFECT_ESCAPE_ACTOR_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <EffectActionCostFields v-model="escapeActionCost" />

      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.outcome"
        class="w-full sm:w-44"
      >
        <USelect
          v-model="escapeOutcome"
          :items="EFFECT_ESCAPE_OUTCOME_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_ESCAPE_SECTION_LABELS.label"
        class="w-full sm:w-48"
      >
        <UInput
          v-model="escapeLabel"
          :placeholder="DEFAULT_ESCAPE_LABEL"
          :maxlength="MAX_EFFECT_STAGE_LABEL_LENGTH"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <USwitch
        v-model="hasCheck"
        class="mb-2"
        :label="EFFECT_ESCAPE_SECTION_LABELS.checkToggle"
      />

      <template v-if="effect.escape.check">
        <UFormField
          :label="EFFECT_ESCAPE_SECTION_LABELS.skill"
          class="w-full sm:w-48"
        >
          <USelect
            v-model="escapeSkill"
            :items="EFFECT_SKILL_OPTIONS"
            value-key="value"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <EffectSaveDcField
          v-model="escapeDc"
          :label="EFFECT_ESCAPE_SECTION_LABELS.dc"
          :auto-allowed="autoDcAllowed"
          :auto-label="applierDcLabel"
          :auto-value="applierSaveDc"
        />
      </template>
    </div>
  </div>
</template>
