<script setup lang="ts">
  /** Ячейка таблицы характеристик: подпись и значение. */
  const { label } = defineProps<{
    label: string;
  }>();

  defineSlots<{
    default: () => unknown;
  }>();
</script>

<template>
  <div class="-mr-px -mb-px border-r border-b border-default px-6 py-2.5">
    <dt class="mb-1 font-medium text-highlighted">
      {{ label }}
    </dt>

    <dd>
      <slot />
    </dd>
  </div>
</template>
