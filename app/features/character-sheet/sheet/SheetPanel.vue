<script setup lang="ts">
  /** Блок листа: рамка, заголовок и действия справа от него. */
  const { title = '' } = defineProps<{
    title?: string;
  }>();

  defineSlots<{
    default: () => unknown;
    actions?: () => unknown;
  }>();
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-xl border border-default bg-elevated/40 p-3"
  >
    <header
      v-if="title || $slots.actions"
      class="flex min-h-7 items-center justify-between gap-2"
    >
      <h3 class="text-sm font-semibold tracking-wide text-muted uppercase">
        {{ title }}
      </h3>

      <div
        v-if="$slots.actions"
        class="flex items-center gap-1"
      >
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
