<script setup lang="ts">
  /**
   * Плашка под заголовком записи: пояснение (категория, тип) слева
   * и необязательная подпись справа. Источник записи выводится в шапке.
   * Замена `DetailTopBar` старого SPA.
   */
  const { left = undefined } = defineProps<{
    left?: string;
  }>();

  const slots = defineSlots<{
    /** Левая часть с разметкой, например со ссылками. */
    left?: () => unknown;
    /** Правая часть. */
    default?: () => unknown;
  }>();
</script>

<template>
  <div
    v-if="left || slots.left || slots.default"
    class="flex flex-col justify-between gap-3 rounded-lg bg-elevated px-3 py-3 xl:flex-row"
  >
    <span
      v-if="left || slots.left"
      class="flex-auto italic"
    >
      <slot name="left">{{ left }}</slot>
    </span>

    <span
      v-if="slots.default"
      class="shrink-0"
    >
      <slot />
    </span>
  </div>
</template>
