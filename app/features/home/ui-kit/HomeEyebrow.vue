<script setup lang="ts">
  /**
   * Микро-подпись блока: моноширинный капс с широким трекингом. Единственный
   * вид заголовка второго уровня на главной.
   */
  const { icon = undefined, accent = false } = defineProps<{
    /** Текст подписи, пишется как есть — регистр задаёт CSS */
    label: string;
    /** Необязательная иконка слева */
    icon?: string;
    /** Цвет ссылки — для подписей на тёмной картинке */
    accent?: boolean;
  }>();

  const colorClass = computed(() => (accent ? 'text-link' : 'text-muted'));
</script>

<template>
  <span
    class="flex min-w-0 items-center gap-1.5 font-mono text-[11px] leading-none font-medium tracking-[0.18em] uppercase"
    :class="colorClass"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      class="size-3.5 shrink-0 text-primary"
    />

    <span class="truncate">{{ label }}</span>
  </span>
</template>
