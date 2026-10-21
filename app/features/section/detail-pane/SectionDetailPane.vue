<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import { SECTION_ICON, SECTION_TEXT } from '../model';

  /** Панель открытой записи раздела: заголовок, закрытие и содержимое. */
  const {
    title,
    subtitle = undefined,
    closeTo,
    isLoading = false,
    isError = false,
  } = defineProps<{
    title: string;
    subtitle?: string;
    closeTo: RouteLocationRaw;
    isLoading?: boolean;
    isError?: boolean;
  }>();
</script>

<template>
  <article class="flex flex-col gap-4 pt-2">
    <header class="flex items-start gap-3 border-b border-default pb-3">
      <div class="min-w-0 flex-auto">
        <USkeleton
          v-if="isLoading && !title"
          class="h-8 w-2/3"
        />

        <h2
          v-else
          class="text-2xl text-highlighted"
        >
          {{ title }}
        </h2>

        <div
          v-if="subtitle"
          class="text-sm text-muted"
        >
          {{ subtitle }}
        </div>
      </div>

      <slot name="actions" />

      <UButton
        :to="closeTo"
        :icon="SECTION_ICON.close"
        :aria-label="SECTION_TEXT.close"
        color="neutral"
        variant="ghost"
      />
    </header>

    <div
      v-if="isLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 6"
        :key="index"
        class="h-4 w-full"
      />
    </div>

    <UEmpty
      v-else-if="isError"
      :icon="SECTION_ICON.empty"
      :title="SECTION_TEXT.detailError"
    />

    <slot v-else />
  </article>
</template>
