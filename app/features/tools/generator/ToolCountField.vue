<script setup lang="ts">
  import { TOOL_COUNT_MAX, TOOL_COUNT_MIN, TOOLS_TEXT } from '../model';

  /** Сколько результатов получить за одно нажатие. */
  const count = defineModel<number>({ default: TOOL_COUNT_MIN });
</script>

<template>
  <UFormField :label="TOOLS_TEXT.count">
    <UInputNumber
      v-model="count"
      :min="TOOL_COUNT_MIN"
      :max="TOOL_COUNT_MAX"
      class="w-full"
    />
  </UFormField>
</template>
