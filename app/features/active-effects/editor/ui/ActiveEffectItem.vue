<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectFormContext,
    EffectFormStep,
  } from '../../model';

  import {
    clearInertEffectFields,
    describeEffectScenario,
    EFFECT_FORM_STEP_ICONS,
    EFFECT_FORM_STEP_TITLES,
    EFFECT_MODIFIERS_STEP_TITLES,
    listEffectFormSteps,
    listInertEffectFields,
    resolveEffectFormLayout,
  } from '../../model';
  import EffectAdvancedSection from './EffectAdvancedSection.vue';
  import EffectDamageStep from './EffectDamageStep.vue';
  import EffectDescriptionSection from './EffectDescriptionSection.vue';
  import EffectDurationStep from './EffectDurationStep.vue';
  import EffectEscapeSection from './EffectEscapeSection.vue';
  import EffectFormStepSection from './EffectFormStepSection.vue';
  import EffectHeaderFields from './EffectHeaderFields.vue';
  import EffectInertFieldsNotice from './EffectInertFieldsNotice.vue';
  import EffectModifiersStep from './EffectModifiersStep.vue';
  import EffectSaveStep from './EffectSaveStep.vue';
  import EffectScenarioSummary from './EffectScenarioSummary.vue';
  import EffectStagesSection from './EffectStagesSection.vue';
  import EffectTriggersStep from './EffectTriggersStep.vue';
  import EffectTriggerStep from './EffectTriggerStep.vue';

  /**
   * Форма одного активного эффекта: одна страница по шагам с живой сводкой
   * сверху.
   *
   * Какие шаги и поля показать, решает модель по МЕСТУ формы (`context`) и
   * текущей настройке эффекта (`resolveEffectFormLayout`): у пассивной черты
   * нет спасброска, у ауры «пока внутри» — урона при срабатывании, у действия
   * существа — выбора «на себя». Шаги получают эффект и отдают новый объект,
   * ничего не меняя на месте.
   */
  const {
    context,
    zoneAvailable = undefined,
    applierSaveDc = undefined,
  } = defineProps<{
    /** Место формы: задаёт, какие шаги и поля показать. */
    context: EffectFormContext;
    /**
     * Есть ли у заклинания область — где появиться зоне на месте шаблона. Не
     * задано — доставка «зоной» не прячется.
     */
    zoneAvailable?: boolean;
    /**
     * Сл источника, которую подставит «Авто» у полей Сл: у действия существа
     * это Сл самого действия из формы. Не задано — видна только подпись.
     */
    applierSaveDc?: number;
  }>();

  const effect = defineModel<ActiveEffect>({ required: true });

  /**
   * Раскрыто ли описание: заполненное видно сразу. Форма монтируется на каждое
   * раскрытие эффекта, поэтому начальное значение читается один раз.
   */
  // eslint-disable-next-line vue/no-ref-object-reactivity-loss -- снимок при монтировании, дальше раздел открывает автор
  const isDescriptionOpen = ref(effect.value.description.trim() !== '');

  /** Показывать приоритет у всех модификаторов. */
  const showPriorityField = ref(false);

  const layout = computed(() =>
    resolveEffectFormLayout(context, effect.value, { zoneAvailable }),
  );

  /**
   * Номера показанных шагов с единицы; шага, которого в раскладке нет, в
   * записи нет.
   */
  const stepNumbers = computed<Partial<Record<EffectFormStep, number>>>(() =>
    Object.fromEntries(
      listEffectFormSteps(layout.value).map((step, index) => [step, index + 1]),
    ),
  );

  const scenario = computed(() =>
    describeEffectScenario(effect.value, context),
  );

  const inertFields = computed(() =>
    listInertEffectFields(effect.value, layout.value),
  );

  const hasInertFields = computed(() => inertFields.value.length > 0);

  const modifiersTitle = computed(
    () => EFFECT_MODIFIERS_STEP_TITLES[layout.value.delivery],
  );

  const description = computed({
    get: () => effect.value.description,
    set: (nextDescription: string) => {
      effect.value = { ...effect.value, description: nextDescription };
    },
  });

  /** Убирает настройки, которые в этом месте не работают. */
  function clearInertFields(): void {
    effect.value = clearInertEffectFields(
      effect.value,
      inertFields.value,
      context,
    );
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <EffectHeaderFields
      v-model:effect="effect"
      :show-condition-preset="layout.showConditionPreset"
      :show-status-toggle="layout.showStatusToggle"
    />

    <!-- Сводка держится сверху при прокрутке: правка любого шага видна в ней
      сразу. Подложки у полосы нет — шаги уходят под саму сводку -->
    <div class="sticky top-0 z-10">
      <EffectScenarioSummary :scenario="scenario" />
    </div>

    <EffectInertFieldsNotice
      v-if="hasInertFields"
      :fields="inertFields"
      @clear="clearInertFields"
    />

    <EffectFormStepSection
      v-if="stepNumbers.trigger !== undefined"
      :step-number="stepNumbers.trigger"
      :title="EFFECT_FORM_STEP_TITLES.trigger"
      :icon="EFFECT_FORM_STEP_ICONS.trigger"
    >
      <EffectTriggerStep
        v-model:effect="effect"
        :layout="layout"
      />
    </EffectFormStepSection>

    <EffectFormStepSection
      v-if="stepNumbers.save !== undefined"
      :step-number="stepNumbers.save"
      :title="EFFECT_FORM_STEP_TITLES.save"
      :icon="EFFECT_FORM_STEP_ICONS.save"
    >
      <EffectSaveStep
        v-model:effect="effect"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
      />
    </EffectFormStepSection>

    <EffectFormStepSection
      v-if="stepNumbers.damage !== undefined"
      :step-number="stepNumbers.damage"
      :title="EFFECT_FORM_STEP_TITLES.damage"
      :icon="EFFECT_FORM_STEP_ICONS.damage"
    >
      <EffectDamageStep v-model:effect="effect" />
    </EffectFormStepSection>

    <EffectFormStepSection
      v-if="stepNumbers.modifiers !== undefined"
      :step-number="stepNumbers.modifiers"
      :title="modifiersTitle"
      :icon="EFFECT_FORM_STEP_ICONS.modifiers"
    >
      <EffectModifiersStep
        v-model:effect="effect"
        :layout="layout"
        :show-priority-field="showPriorityField"
      />

      <EffectStagesSection
        v-if="layout.showStages"
        v-model:effect="effect"
        :show-priority-field="showPriorityField"
      />
    </EffectFormStepSection>

    <EffectFormStepSection
      v-if="stepNumbers.duration !== undefined"
      :step-number="stepNumbers.duration"
      :title="EFFECT_FORM_STEP_TITLES.duration"
      :icon="EFFECT_FORM_STEP_ICONS.duration"
    >
      <EffectDurationStep v-model:effect="effect" />

      <EffectEscapeSection
        v-if="layout.showEscape"
        v-model:effect="effect"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
      />
    </EffectFormStepSection>

    <EffectFormStepSection
      v-if="stepNumbers.triggers !== undefined"
      :step-number="stepNumbers.triggers"
      :title="EFFECT_FORM_STEP_TITLES.triggers"
      :icon="EFFECT_FORM_STEP_ICONS.triggers"
    >
      <EffectTriggersStep
        v-model:effect="effect"
        :layout="layout"
        :applier-save-dc="applierSaveDc"
      />
    </EffectFormStepSection>

    <EffectDescriptionSection
      v-model:description="description"
      v-model:open="isDescriptionOpen"
      :scenario="scenario"
    />

    <EffectAdvancedSection v-model:show-priority-field="showPriorityField" />
  </div>
</template>
