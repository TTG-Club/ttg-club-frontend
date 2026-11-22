<script setup lang="ts">
  import {
    EFFECT_DESCRIPTION_LABELS,
    EFFECT_DESCRIPTION_ROWS,
  } from '../../model';
  import EffectSectionToggle from './EffectSectionToggle.vue';

  /**
   * Сворачиваемое описание эффекта: текст для подсказки и списка эффектов.
   * Кнопка подставляет фразу живой сводки.
   */
  const { scenario } = defineProps<{
    /** Фраза живой сводки. */
    scenario: string;
  }>();

  const description = defineModel<string>('description', { required: true });

  /** Раскрыт ли раздел: заполненное описание видно сразу. */
  const isOpen = defineModel<boolean>('open', { default: false });

  /** Заменяет описание фразой сводки. */
  function fillFromSummary(): void {
    description.value = scenario;
  }
</script>

<template>
  <UCollapsible
    v-model:open="isOpen"
    class="flex flex-col gap-2"
  >
    <EffectSectionToggle
      icon="tabler:file-description"
      :label="EFFECT_DESCRIPTION_LABELS.title"
    />

    <template #content>
      <div class="flex flex-col gap-2 px-1 pb-1">
        <UTextarea
          v-model="description"
          :rows="EFFECT_DESCRIPTION_ROWS"
          autoresize
          class="w-full"
          :placeholder="EFFECT_DESCRIPTION_LABELS.placeholder"
        />

        <UButton
          icon="tabler:wand"
          color="neutral"
          variant="outline"
          size="xs"
          class="self-end"
          :label="EFFECT_DESCRIPTION_LABELS.fillFromSummary"
          :title="EFFECT_DESCRIPTION_LABELS.fillFromSummaryHint"
          @click.left.exact.prevent="fillFromSummary"
        />
      </div>
    </template>
  </UCollapsible>
</template>
