<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  /** Запись в списке раздела: русское и английское название. */
  const {
    to,
    title,
    subtitle = undefined,
  } = defineProps<{
    to: RouteLocationRaw;
    title: string;
    subtitle?: string;
  }>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 rounded-md border border-default px-3 py-2 transition-colors hover:bg-elevated"
    active-class="bg-elevated border-accented"
  >
    <slot name="leading" />

    <div class="min-w-0 flex-auto">
      <div class="truncate text-highlighted">
        {{ title }}
      </div>

      <div
        v-if="subtitle"
        class="truncate text-sm text-muted"
      >
        {{ subtitle }}
      </div>
    </div>

    <slot name="trailing" />
  </NuxtLink>
</template>
