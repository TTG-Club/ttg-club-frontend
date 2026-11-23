<script setup lang="ts">
  import { SHEET_ICON, SHEET_LIST_ICON, SHEET_LIST_TEXT } from '../model';

  /** Пунктирный слот создания листа в конце сетки карточек. */
  const { isDisabled = false, isLoading = false } = defineProps<{
    /** Заблокировать создание (мутация списка в процессе). */
    isDisabled?: boolean;

    /** Показать индикатор загрузки во время создания. */
    isLoading?: boolean;
  }>();

  const emit = defineEmits<{
    create: [];
  }>();

  const iconName = computed(() =>
    isLoading ? SHEET_ICON.loading : SHEET_LIST_ICON.create,
  );

  const iconClass = computed(() => (isLoading ? 'animate-spin' : ''));
</script>

<template>
  <!-- Минимальная высота совпадает с карточкой листа: в сетке строка тянется
    по самому высокому элементу -->
  <button
    type="button"
    class="group flex min-h-20 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-default bg-elevated/40 p-3 text-muted transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
    :disabled="isDisabled || isLoading"
    :aria-label="SHEET_LIST_TEXT.createAria"
    @click.left.exact.prevent="emit('create')"
  >
    <UIcon
      :name="iconName"
      class="size-7 shrink-0 transition-transform group-hover:scale-110"
      :class="iconClass"
    />

    <span class="text-sm font-medium">{{ SHEET_LIST_TEXT.create }}</span>
  </button>
</template>
