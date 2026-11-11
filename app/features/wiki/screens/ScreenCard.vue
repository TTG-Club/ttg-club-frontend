<script setup lang="ts">
  import { useScreenWindows } from '../composables';

  /**
   * Корневой раздел ширмы в списке: карточка с названиями. Клик открывает
   * раздел окном поверх сайта, а где окон нет (телефон) — его страницей.
   */
  const {
    to = undefined,
    title,
    subtitle,
  } = defineProps<{
    /** Адрес раздела ширмы. */
    to?: string;
    title: string;
    subtitle: string;
  }>();

  const { isAvailable, isOpen, open: openWindow } = useScreenWindows();

  const cardClass = computed(() =>
    !!to && isOpen(to)
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated/50 hover:bg-elevated',
  );

  /**
   * Открывает раздел окном рядом с точкой клика, если окна есть.
   * @param event - клик по карточке
   */
  function open(event: MouseEvent): void {
    if (!to || !isAvailable.value) {
      return;
    }

    event.preventDefault();

    openWindow({
      path: to,
      title,
      origin: { x: event.clientX, y: event.clientY },
    });
  }
</script>

<template>
  <NuxtLink
    :to="to"
    :class="cardClass"
    class="block rounded-xl border p-3 transition-colors xl:p-4"
    @click.left.exact.capture="open"
  >
    <span class="block font-medium text-highlighted">{{ title }}</span>

    <span class="mt-1 block text-sm text-muted">{{ subtitle }}</span>
  </NuxtLink>
</template>
