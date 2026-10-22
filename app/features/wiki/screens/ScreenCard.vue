<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  /** Корневой раздел ширмы в списке: карточка с названиями. */
  const {
    to = undefined,
    title,
    subtitle,
  } = defineProps<{
    to?: RouteLocationRaw;
    title: string;
    subtitle: string;
  }>();
</script>

<template>
  <NuxtLink
    :to="to"
    active-class="border-primary"
    class="block rounded-xl border border-default bg-elevated/50 p-3 transition-colors hover:bg-elevated xl:p-4"
  >
    <span class="block font-medium text-highlighted">{{ title }}</span>

    <span class="mt-1 block text-sm text-muted">{{ subtitle }}</span>
  </NuxtLink>
</template>
