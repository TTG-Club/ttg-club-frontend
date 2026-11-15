<script setup lang="ts">
  import { BOOK_COVER_PLACEHOLDER_ICON } from '../model';

  /**
   * Маленькая обложка в плитке списка. У книги без обложки — значок
   * в рамке того же размера, чтобы названия стояли ровно.
   */
  const { url = undefined, alt } = defineProps<{
    url?: string | null;
    alt: string;
  }>();
</script>

<template>
  <span
    class="flex aspect-3/4 w-9 flex-none items-center justify-center overflow-hidden rounded-sm border border-default bg-muted"
  >
    <img
      v-if="url"
      :src="url"
      :alt="alt"
      loading="lazy"
      class="size-full object-cover"
    />

    <UIcon
      v-else
      :name="BOOK_COVER_PLACEHOLDER_ICON"
      class="size-5 text-dimmed"
    />
  </span>
</template>
