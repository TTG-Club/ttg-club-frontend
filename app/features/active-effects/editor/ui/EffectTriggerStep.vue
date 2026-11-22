<script setup lang="ts">
  import type {
    ActiveEffect,
    EffectActivation,
    EffectAura,
    EffectAuraTarget,
    EffectFormLayout,
    EffectVariantPick,
  } from '../../model';

  import {
    buildActivationOptions,
    buildAreaTriggerOptions,
    buildDeliveryOptions,
    DEFAULT_ACTIVATION_AMOUNT,
    DEFAULT_EFFECT_AURA,
    DEFAULT_EFFECT_VARIANT_PICK,
    EFFECT_ACTIVATION_CHOICE_HINTS,
    EFFECT_ACTIVATION_COUNTER_LABELS,
    EFFECT_AREA_TRIGGER_HINTS,
    EFFECT_AURA_LABELS,
    EFFECT_AURA_RADIUS_STEP,
    EFFECT_AURA_TARGET_OPTIONS,
    EFFECT_LANDING_CONDITION_LABELS,
    EFFECT_NO_KNOWN_TAGS,
    EFFECT_PERMANENT_ACTIVATION,
    EFFECT_SCROLLABLE_TABS_UI,
    EFFECT_VARIANT_LABELS,
    EFFECT_VARIANT_PICK_OPTIONS,
    findAreaTrigger,
    MIN_EFFECT_AURA_RADIUS,
    resolveEffectDeliveryHint,
    writeEffectAreaTrigger,
    writeEffectDelivery,
  } from '../../model';
  import EffectTriggerConditionPicker from './EffectTriggerConditionPicker.vue';

  /**
   * Шаг «Когда срабатывает»: постоянно ли действует эффект или его применяют,
   * на кого он ложится (носитель, цель, аура, зона заклинания), момент
   * срабатывания зоны или ауры, настройки ауры, условие наложения и вариант.
   */
  const { layout } = defineProps<{
    /** Раскладка формы. */
    layout: EffectFormLayout;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const activationOptions = computed(() => buildActivationOptions(layout));

  const activationChoice = computed(
    () => effect.value.activation?.mode ?? EFFECT_PERMANENT_ACTIVATION,
  );

  const activationHint = computed(
    () => EFFECT_ACTIVATION_CHOICE_HINTS[activationChoice.value],
  );

  /**
   * Меняет способ действия эффекта: «Постоянно» убирает применение, способ
   * применения сохраняет уже заданный ресурс.
   *
   * @param selectedChoice значение переключателя.
   */
  function selectActivation(selectedChoice: string | number): void {
    if (selectedChoice === EFFECT_PERMANENT_ACTIVATION) {
      effect.value = { ...effect.value, activation: undefined };

      return;
    }

    const mode = layout.activationModes.find(
      (activationMode) => activationMode === selectedChoice,
    );

    if (mode) {
      effect.value = {
        ...effect.value,
        activation: { ...effect.value.activation, mode },
      };
    }
  }

  /**
   * Меняет ресурс применения.
   *
   * @param patch изменённые поля.
   */
  function updateActivation(patch: Partial<EffectActivation>): void {
    const { activation } = effect.value;

    if (activation) {
      effect.value = {
        ...effect.value,
        activation: { ...activation, ...patch },
      };
    }
  }

  const activationCounter = computed({
    get: () => effect.value.activation?.counter ?? '',
    set: (counter: string) => updateActivation({ counter }),
  });

  const activationAmount = computed({
    get: () => effect.value.activation?.amount ?? DEFAULT_ACTIVATION_AMOUNT,
    set: (amount: number | null | undefined) => {
      // Очищенное поле числа отдаёт `undefined`, а не `null`
      if (typeof amount === 'number') {
        updateActivation({ amount });
      }
    },
  });

  const deliveryOptions = computed(() => buildDeliveryOptions(layout));

  const triggerOptions = computed(() =>
    buildAreaTriggerOptions(layout.delivery),
  );

  /** Выбор доставки нужен, только если вариантов больше одного. */
  const showDeliveryChoice = computed(() => deliveryOptions.value.length > 1);

  /** Пояснение под выбором доставки: у зоны заклинания своё. */
  const deliveryHint = computed(() => resolveEffectDeliveryHint(layout));

  const triggerHint = computed(() => EFFECT_AREA_TRIGGER_HINTS[layout.trigger]);

  /** Настройки ауры видны у доставки «аурой», когда аура уже заведена. */
  const showAuraSettings = computed(
    () => layout.showAuraSettings && effect.value.aura !== undefined,
  );

  /**
   * Аура в полях настроек. Поля видны, только когда аура заведена, так что
   * аура по умолчанию лишь закрывает её отсутствие в типе.
   */
  const aura = computed(() => effect.value.aura ?? DEFAULT_EFFECT_AURA);

  /**
   * Меняет доставку эффекта.
   *
   * @param selectedDelivery значение переключателя.
   */
  function selectDelivery(selectedDelivery: string | number): void {
    const delivery = layout.deliveryOptions.find(
      (deliveryOption) => deliveryOption === selectedDelivery,
    );

    if (delivery) {
      effect.value = writeEffectDelivery(effect.value, delivery);
    }
  }

  /**
   * Меняет момент срабатывания зоны или ауры.
   *
   * @param selectedTrigger значение переключателя.
   */
  function selectTrigger(selectedTrigger: string | number): void {
    const trigger = findAreaTrigger(selectedTrigger);

    if (trigger) {
      effect.value = writeEffectAreaTrigger(effect.value, trigger);
    }
  }

  /**
   * Меняет поле ауры.
   *
   * @param patch изменённые поля.
   */
  function updateAura(patch: Partial<EffectAura>): void {
    const { aura: currentAura } = effect.value;

    if (currentAura) {
      effect.value = { ...effect.value, aura: { ...currentAura, ...patch } };
    }
  }

  const auraRadius = computed({
    get: () => aura.value.radius,
    set: (radius: number | null | undefined) => {
      // Очищенное поле числа отдаёт `undefined`, а не `null`
      if (typeof radius === 'number') {
        updateAura({ radius });
      }
    },
  });

  const auraTarget = computed({
    get: () => aura.value.target,
    set: (target: EffectAuraTarget) => updateAura({ target }),
  });

  const auraRadiusFormula = computed({
    get: () => aura.value.radiusFormula ?? '',
    set: (radiusFormula: string) =>
      updateAura({ radiusFormula: radiusFormula || undefined }),
  });

  const auraWhileCapable = computed({
    get: () => aura.value.whileCapable === true,
    set: (whileCapable: boolean | 'indeterminate') =>
      updateAura({ whileCapable: whileCapable === true || undefined }),
  });

  const landingCondition = computed({
    get: () => effect.value.landingCondition,
    set: (nextCondition: string | undefined) => {
      effect.value = { ...effect.value, landingCondition: nextCondition };
    },
  });

  const hasVariant = computed({
    get: () => effect.value.variant !== undefined,
    set: (enabled: boolean) => {
      effect.value = {
        ...effect.value,
        variant: enabled
          ? {
              group: EFFECT_VARIANT_LABELS.defaultGroup,
              label: effect.value.name,
            }
          : undefined,
      };
    },
  });

  /**
   * Меняет поле варианта. Пустое поле не пишется: вариант без группы или
   * подписи разбор записи выбросил бы.
   *
   * @param patch изменённые поля.
   * @param patch.group ключ группы.
   * @param patch.label подпись варианта.
   */
  function updateVariant(patch: { group?: string; label?: string }): void {
    const { variant } = effect.value;
    const group = (patch.group ?? variant?.group ?? '').trim();
    const label = (patch.label ?? variant?.label ?? '').trim();

    if (variant && group && label) {
      effect.value = { ...effect.value, variant: { ...variant, group, label } };
    }
  }

  // Выбор бросающим — значение по умолчанию: в данных оно не пишется
  const variantPick = computed({
    get: () => effect.value.variant?.pick ?? DEFAULT_EFFECT_VARIANT_PICK,
    set: (pick: EffectVariantPick) => {
      const { variant } = effect.value;

      if (!variant) {
        return;
      }

      effect.value = {
        ...effect.value,
        variant: {
          ...variant,
          pick: pick === DEFAULT_EFFECT_VARIANT_PICK ? undefined : pick,
        },
      };
    },
  });

  const auraApplyToSelf = computed({
    get: () => aura.value.applyToSelf,
    set: (applyToSelf: boolean | 'indeterminate') =>
      updateAura({ applyToSelf: applyToSelf === true }),
  });

  // Круг в данных может быть не задан: тогда флажок снят, как и раньше
  const auraVisible = computed({
    get: () => aura.value.visible === true,
    set: (visible: boolean | 'indeterminate') =>
      updateAura({ visible: visible === true }),
  });
</script>

<template>
  <div
    v-if="activationOptions.length > 0"
    class="flex flex-col gap-1.5"
  >
    <UTabs
      :model-value="activationChoice"
      :items="activationOptions"
      :content="false"
      size="xs"
      color="primary"
      class="w-fit max-w-full"
      :ui="EFFECT_SCROLLABLE_TABS_UI"
      @update:model-value="selectActivation"
    />

    <p class="text-xs text-muted">
      {{ activationHint }}
    </p>

    <div
      v-if="layout.showActivationCounter"
      class="flex flex-wrap items-end gap-2"
    >
      <UFormField
        :label="EFFECT_ACTIVATION_COUNTER_LABELS.counter"
        :help="EFFECT_ACTIVATION_COUNTER_LABELS.hint"
        class="w-full sm:w-72"
      >
        <UInput
          v-model="activationCounter"
          :placeholder="EFFECT_ACTIVATION_COUNTER_LABELS.counterPlaceholder"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="activationCounter"
        :label="EFFECT_ACTIVATION_COUNTER_LABELS.amount"
        class="w-24"
      >
        <UInputNumber
          v-model="activationAmount"
          :min="DEFAULT_ACTIVATION_AMOUNT"
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>

  <div
    v-if="showDeliveryChoice"
    class="flex flex-col gap-1.5"
  >
    <UTabs
      :model-value="layout.delivery"
      :items="deliveryOptions"
      :content="false"
      size="xs"
      color="primary"
      class="w-fit max-w-full"
      :ui="EFFECT_SCROLLABLE_TABS_UI"
      @update:model-value="selectDelivery"
    />

    <p class="text-xs text-muted">
      {{ deliveryHint }}
    </p>
  </div>

  <div
    v-if="layout.showTrigger"
    class="flex flex-col gap-1.5"
  >
    <UTabs
      :model-value="layout.trigger"
      :items="triggerOptions"
      :content="false"
      size="xs"
      color="primary"
      class="w-fit max-w-full"
      :ui="EFFECT_SCROLLABLE_TABS_UI"
      @update:model-value="selectTrigger"
    />

    <p class="text-xs text-muted">
      {{ triggerHint }}
    </p>
  </div>

  <div
    v-if="showAuraSettings"
    class="flex flex-wrap items-end gap-3 rounded-md border border-default bg-elevated/40 px-3 py-2"
  >
    <UFormField
      :label="EFFECT_AURA_LABELS.radius"
      class="w-32"
    >
      <UInputNumber
        v-model="auraRadius"
        :min="MIN_EFFECT_AURA_RADIUS"
        :step="EFFECT_AURA_RADIUS_STEP"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_AURA_LABELS.radiusFormula"
      :help="EFFECT_AURA_LABELS.radiusFormulaHint"
      class="w-full sm:w-72"
    >
      <UInput
        v-model="auraRadiusFormula"
        :placeholder="EFFECT_AURA_LABELS.radiusFormulaPlaceholder"
        size="sm"
        class="w-full font-mono"
      />
    </UFormField>

    <UFormField
      :label="EFFECT_AURA_LABELS.target"
      class="w-48"
    >
      <USelect
        v-model="auraTarget"
        :items="EFFECT_AURA_TARGET_OPTIONS"
        value-key="value"
        size="sm"
        class="w-full"
      />
    </UFormField>

    <div class="flex h-8 flex-wrap items-center gap-4">
      <UCheckbox
        v-model="auraApplyToSelf"
        :label="EFFECT_AURA_LABELS.applyToSelf"
      />

      <UCheckbox
        v-model="auraVisible"
        :label="EFFECT_AURA_LABELS.visible"
      />

      <UCheckbox
        v-model="auraWhileCapable"
        :label="EFFECT_AURA_LABELS.whileCapable"
      />
    </div>
  </div>

  <div
    v-if="layout.showLandingCondition"
    class="flex flex-col gap-1"
  >
    <EffectTriggerConditionPicker
      v-model:condition="landingCondition"
      event="applied"
      :known-tags="EFFECT_NO_KNOWN_TAGS"
      :title="EFFECT_LANDING_CONDITION_LABELS.title"
      :empty-text="EFFECT_LANDING_CONDITION_LABELS.always"
    />

    <p class="text-xs text-muted">
      {{ EFFECT_LANDING_CONDITION_LABELS.hint }}
    </p>
  </div>

  <div
    v-if="layout.showVariant"
    class="flex flex-col gap-2"
  >
    <USwitch
      v-model="hasVariant"
      :label="EFFECT_VARIANT_LABELS.toggle"
      :description="EFFECT_VARIANT_LABELS.toggleHint"
    />

    <div
      v-if="effect.variant"
      class="flex flex-wrap items-end gap-2"
    >
      <UFormField
        :label="EFFECT_VARIANT_LABELS.group"
        class="w-40"
      >
        <UInput
          :model-value="effect.variant.group"
          size="sm"
          class="w-full"
          @update:model-value="updateVariant({ group: String($event) })"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_VARIANT_LABELS.label"
        class="w-full sm:w-56"
      >
        <UInput
          :model-value="effect.variant.label"
          size="sm"
          class="w-full"
          @update:model-value="updateVariant({ label: String($event) })"
        />
      </UFormField>

      <UFormField
        :label="EFFECT_VARIANT_LABELS.pick"
        class="w-48"
      >
        <USelect
          v-model="variantPick"
          :items="EFFECT_VARIANT_PICK_OPTIONS"
          value-key="value"
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>
