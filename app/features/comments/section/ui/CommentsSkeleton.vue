<script setup lang="ts">
  /** Заглушка ленты, пока комментарии грузятся. */
  const { rows = 3 } = defineProps<{
    /** Число строк-заглушек. */
    rows?: number;
  }>();
</script>

<template>
  <div class="flex flex-col gap-5">
    <div
      v-for="row in rows"
      :key="row"
      class="flex gap-3"
    >
      <USkeleton class="size-7 shrink-0 rounded-full" />

      <div class="flex flex-1 flex-col gap-2">
        <USkeleton class="h-3 w-40" />

        <USkeleton class="h-3 w-full" />

        <USkeleton class="h-3 w-2/3" />
      </div>
    </div>
  </div>
</template>
