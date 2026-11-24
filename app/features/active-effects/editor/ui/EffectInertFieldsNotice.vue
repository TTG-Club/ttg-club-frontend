<script setup lang="ts">
  import type { InertEffectField } from '../../model';

  import {
    describeInertEffectFields,
    EFFECT_INERT_FIELDS_LABELS,
  } from '../../model';

  /**
   * Плашка «эти настройки здесь не работают». Поля не стираются молча: запись
   * могла прийти из старого редактора, и решает автор — кнопкой «Убрать».
   */
  const { fields } = defineProps<{
    /** Неработающие поля эффекта. */
    fields: readonly InertEffectField[];
  }>();

  const emit = defineEmits<{
    /** Убрать неработающие поля. */
    clear: [];
  }>();

  /** Перечисление неработающих настроек. */
  const description = computed(() => describeInertEffectFields(fields));
</script>

<template>
  <UAlert
    color="warning"
    variant="subtle"
    icon="tabler:alert-triangle"
    orientation="horizontal"
    :title="EFFECT_INERT_FIELDS_LABELS.title"
    :description="description"
  >
    <template #actions>
      <UButton
        color="warning"
        variant="soft"
        size="xs"
        icon="tabler:eraser"
        :label="EFFECT_INERT_FIELDS_LABELS.clear"
        @click.left.exact.prevent="emit('clear')"
      />
    </template>
  </UAlert>
</template>
