<script setup lang="ts">
  import { SECTION_ICON } from '../../model';

  /**
   * Место обложки книги в строке панели источников, как на new.ttg.club:
   * значок книги, у выбранной — рамка и отметка в углу.
   */
  const { isSelected = false } = defineProps<{
    isSelected?: boolean;
  }>();

  const frameClass = computed(() =>
    isSelected ? 'ring ring-primary/40 text-muted' : 'opacity-60',
  );
</script>

<template>
  <span class="relative shrink-0">
    <span
      class="flex h-10 w-7 items-center justify-center rounded-sm bg-elevated text-dimmed"
      :class="frameClass"
    >
      <UIcon
        :name="SECTION_ICON.book"
        class="size-4"
      />
    </span>

    <span
      v-if="isSelected"
      class="absolute -right-1.5 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary text-inverted ring-2 ring-default"
    >
      <UIcon
        :name="SECTION_ICON.checked"
        class="size-3"
      />
    </span>
  </span>
</template>
