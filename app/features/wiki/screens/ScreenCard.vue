<script setup lang="ts">
  import { useSectionOpener } from '~section/composables';

  /**
   * Корневой раздел ширмы в списке: карточка с названиями. Клик открывает
   * раздел так, как велит режим страницы ширмы.
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

  const opener = useSectionOpener();

  const cardClass = computed(() =>
    !!to && opener?.activePath.value === to
      ? 'border-primary bg-primary/10 ring-1 ring-primary/50'
      : 'border-default bg-elevated/50 hover:bg-elevated',
  );

  /**
   * Открывает раздел через страницу ширмы, если она умеет.
   * @param event - клик по карточке
   */
  function open(event: MouseEvent): void {
    if (!to || !opener) {
      return;
    }

    event.preventDefault();
    opener.open(to);
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
