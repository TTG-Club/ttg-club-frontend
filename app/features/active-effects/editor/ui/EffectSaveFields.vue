<script
  setup
  lang="ts"
  generic="Save extends Pick<EffectTriggerSave, 'ability' | 'dc'>"
>
  import type {
    EffectAbility,
    EffectFormLayout,
    EffectTriggerSave,
  } from '../../model';

  import {
    EFFECT_ABILITY_OPTIONS,
    EFFECT_APPLIER_DC_LABELS,
    layoutAcceptsApplierSaveDc,
  } from '../../model';
  import EffectSaveDcField from './EffectSaveDcField.vue';

  /**
   * Поля спасброска: характеристика и Сл, у которой «Авто» есть там, где у Сл
   * есть источник. Одни и те же у спасброска эффекта и у спасброска строки
   * срабатывания: меняются только характеристика и число, остальные поля
   * спасброска (исход при успехе, формула Сл) переносятся как есть.
   */
  const { layout, applierSaveDc = undefined } = defineProps<{
    /** Раскладка формы: можно ли подставить Сл источника и чья она. */
    layout: EffectFormLayout;
    /** Сл источника для «Авто», если форма её знает. */
    applierSaveDc?: number;
    /** Подпись поля характеристики. */
    abilityLabel: string;
    /** Подпись поля Сл. */
    saveDcLabel: string;
  }>();

  /** Спасбросок: поля заменяют его целиком при каждой правке. */
  const save = defineModel<Save>('save', { required: true });

  const acceptsApplierSaveDc = computed(() =>
    layoutAcceptsApplierSaveDc(layout),
  );

  const applierDcLabel = computed(
    () => EFFECT_APPLIER_DC_LABELS[layout.context],
  );

  const saveAbility = computed({
    get: () => save.value.ability,
    set: (nextAbility: EffectAbility) => {
      save.value = { ...save.value, ability: nextAbility };
    },
  });

  const saveDc = computed({
    get: () => save.value.dc,
    set: (nextSaveDc: number) => {
      save.value = { ...save.value, dc: nextSaveDc };
    },
  });
</script>

<template>
  <UFormField
    :label="abilityLabel"
    class="w-48"
  >
    <USelect
      v-model="saveAbility"
      :items="EFFECT_ABILITY_OPTIONS"
      value-key="value"
      size="sm"
      class="w-full"
    />
  </UFormField>

  <EffectSaveDcField
    v-model="saveDc"
    :label="saveDcLabel"
    :auto-allowed="acceptsApplierSaveDc"
    :auto-label="applierDcLabel"
    :auto-value="applierSaveDc"
  />
</template>
