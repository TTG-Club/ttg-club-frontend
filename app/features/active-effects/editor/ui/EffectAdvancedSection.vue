<script setup lang="ts">
  import { EFFECT_ADVANCED_LABELS } from '../../model';
  import EffectSectionToggle from './EffectSectionToggle.vue';

  /**
   * Сворачиваемый раздел «Для опытных»: включает у модификаторов приоритет.
   * Порядок применения большинству эффектов не нужен.
   */
  const showPriorityField = defineModel<boolean>('showPriorityField', {
    required: true,
  });
</script>

<template>
  <UCollapsible class="flex flex-col gap-2">
    <EffectSectionToggle
      icon="tabler:settings"
      :label="EFFECT_ADVANCED_LABELS.title"
    />

    <template #content>
      <div class="px-1 pb-1">
        <USwitch
          v-model="showPriorityField"
          :label="EFFECT_ADVANCED_LABELS.priorityField"
          :description="EFFECT_ADVANCED_LABELS.priorityFieldHint"
        />
      </div>
    </template>
  </UCollapsible>
</template>
