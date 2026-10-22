<script setup lang="ts">
  /** Показатель участника: подпись сверху, значение или контрол под ней. */
  const { label } = defineProps<{
    label: string;
  }>();
</script>

<template>
  <div class="flex shrink-0 flex-col items-center gap-0.5">
    <span class="text-xs text-muted">{{ label }}</span>

    <slot />
  </div>
</template>
