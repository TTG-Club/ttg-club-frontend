<script setup lang="ts">
  import HomeEyebrow from './HomeEyebrow.vue';

  const {
    label = undefined,
    icon = undefined,
    flush = false,
    fill = false,
  } = defineProps<{
    /** Моно-подпись в шапке панели; без неё шапка не рисуется */
    label?: string;
    /** Иконка рядом с подписью */
    icon?: string;
    /** Содержимое без внутренних отступов — для картинки во всю ширину */
    flush?: boolean;
    /** Тело тянется на высоту панели и раскладывает содержимое столбцом */
    fill?: boolean;
  }>();

  // min-h-0 — чтобы содержимое могло прокручиваться внутри, когда высоту
  // панели задаёт раскладка, а не содержимое
  const bodyClass = computed(() => [
    flush ? undefined : 'p-3',
    fill ? 'flex min-h-0 flex-auto flex-col' : undefined,
  ]);
</script>

<template>
  <section
    class="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-muted transition-colors duration-200 hover:border-secondary-hover"
  >
    <header
      v-if="label"
      class="flex shrink-0 items-center justify-between gap-2 border-b border-default px-3 py-2.5"
    >
      <HomeEyebrow
        :label="label"
        :icon="icon"
      />
    </header>

    <div :class="bodyClass">
      <slot />
    </div>
  </section>
</template>
