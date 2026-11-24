<script setup lang="ts">
  /**
   * Оболочка шага формы эффекта: номер, иконка, заголовок и содержимое. Номер
   * считает форма — по шагам, которые показаны.
   */
  defineProps<{
    /** Порядковый номер шага среди показанных. */
    stepNumber: number;
    /** Заголовок шага. */
    title: string;
    /** Иконка шага. */
    icon: string;
  }>();

  defineSlots<{
    /** Содержимое шага. */
    default: () => unknown;
  }>();
</script>

<template>
  <section class="rounded-lg border border-default bg-elevated/30 px-4 py-3">
    <header class="mb-3 flex items-center gap-2">
      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
      >
        {{ stepNumber }}
      </span>

      <UIcon
        :name="icon"
        class="size-4 shrink-0 text-muted"
      />

      <h3 class="flex-1 text-sm font-semibold text-highlighted">
        {{ title }}
      </h3>
    </header>

    <div class="flex flex-col gap-3">
      <slot />
    </div>
  </section>
</template>
