<script setup lang="ts">
  import { SECTION_GRID_CLASS } from '~section/model';

  /**
   * Группа добычи с заголовком между линиями, как группы в списках
   * разделов, и плитками под ним.
   */
  const { title, gridClass = SECTION_GRID_CLASS.tiles } = defineProps<{
    title: string;
    /** Сетка плиток; у монет своя, помельче. */
    gridClass?: string;
  }>();

  defineSlots<{
    default: () => unknown;
  }>();
</script>

<template>
  <section class="@container flex flex-col gap-2">
    <h2
      class="flex items-center gap-3 pt-2 text-sm font-semibold text-muted before:h-px before:flex-auto before:bg-(--ui-border) after:h-px after:flex-auto after:bg-(--ui-border)"
    >
      {{ title }}
    </h2>

    <div :class="gridClass">
      <slot />
    </div>
  </section>
</template>
