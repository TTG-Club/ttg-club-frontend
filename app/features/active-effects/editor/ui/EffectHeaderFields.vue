<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { ActiveEffect, EffectConditionKey } from '../../model';

  import {
    ACTIVE_EFFECT_FORM_LABELS,
    applyConditionPresetToEffect,
    buildConditionActiveEffect,
    EFFECT_CONDITION_TEMPLATES,
  } from '../../model';

  /**
   * Шапка эффекта: название, иконка, работает ли эффект и шаблон состояния.
   */
  defineProps<{
    /** Показывать кнопку «Шаблон состояния». */
    showConditionPreset: boolean;
    /**
     * Показывать переключатель «Работает». У шаблона применения его нет: на
     * листе такой шаблон всегда лежит выключенным.
     */
    showStatusToggle: boolean;
  }>();

  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const name = computed({
    get: () => effect.value.name,
    set: (nextName: string) => {
      effect.value = { ...effect.value, name: nextName };
    },
  });

  const icon = computed({
    get: () => effect.value.icon ?? '',
    set: (nextIcon: string) => {
      effect.value = { ...effect.value, icon: nextIcon || undefined };
    },
  });

  const isActive = computed({
    get: () => !effect.value.disabled,
    set: (enabled: boolean) => {
      effect.value = { ...effect.value, disabled: !enabled };
    },
  });

  /** Подпись переключателя «работает / отключён». */
  const statusLabel = computed(() =>
    isActive.value
      ? ACTIVE_EFFECT_FORM_LABELS.statusActive
      : ACTIVE_EFFECT_FORM_LABELS.statusDisabled,
  );

  /** Иконка в поле иконки: пустое поле — без иконки. */
  const iconPreview = computed(() => icon.value || undefined);

  /**
   * Заполняет эффект тем, что делает состояние, не трогая срабатывание:
   * доставка, момент, спасбросок, урон, длительность и источник остаются.
   *
   * @param conditionKey ключ состояния.
   */
  function applyConditionPreset(conditionKey: EffectConditionKey): void {
    const conditionEffect = buildConditionActiveEffect(conditionKey);

    if (!conditionEffect) {
      return;
    }

    effect.value = applyConditionPresetToEffect(effect.value, conditionEffect);
  }

  // Истощения в меню нет: его модификаторы зависят от степени
  const conditionPresetItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    EFFECT_CONDITION_TEMPLATES.map((template) => ({
      label: template.name,
      icon: template.icon,
      onSelect: () => applyConditionPreset(template.key),
    })),
  ]);
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <UFormField
      :label="ACTIVE_EFFECT_FORM_LABELS.name"
      class="min-w-48 flex-1"
    >
      <UInput
        v-model="name"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="ACTIVE_EFFECT_FORM_LABELS.icon"
      class="w-56"
    >
      <UInput
        v-model="icon"
        :icon="iconPreview"
        :placeholder="ACTIVE_EFFECT_FORM_LABELS.iconPlaceholder"
        class="w-full"
      />
    </UFormField>

    <UDropdownMenu
      v-if="showConditionPreset"
      :items="conditionPresetItems"
      :content="{ align: 'end' }"
      :ui="{ content: 'max-h-72 overflow-y-auto' }"
    >
      <UButton
        icon="tabler:template"
        :label="ACTIVE_EFFECT_FORM_LABELS.conditionPreset"
        :title="ACTIVE_EFFECT_FORM_LABELS.conditionPresetHint"
        color="neutral"
        variant="outline"
      />
    </UDropdownMenu>

    <USwitch
      v-if="showStatusToggle"
      v-model="isActive"
      :label="statusLabel"
      class="h-8 items-center"
    />
  </div>
</template>
