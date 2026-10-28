<script setup lang="ts">
  /** Строка блока характеристик: жирная подпись и значение. */
  const { label } = defineProps<{
    label: string;
  }>();

  defineSlots<{
    default: () => unknown;
  }>();
</script>

<template>
  <p>
    <b class="mr-1 font-semibold text-highlighted">{{ label }}</b>

    <span>
      <slot />
    </span>
  </p>
</template>
