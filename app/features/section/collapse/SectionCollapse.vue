<script setup lang="ts">
  import type { AccordionItem } from '@nuxt/ui';

  import { SECTION_COLLAPSE_VALUE } from '../model';

  /**
   * Аккордеон записи, как на new.ttg.club: крупный заголовок со стрелкой,
   * по клику текст плавно прячется и открывается снова.
   */
  const { title, defaultOpen = false } = defineProps<{
    title: string;
    /** Открыт ли блок сразу. */
    defaultOpen?: boolean;
  }>();

  defineSlots<{
    /** Подпись справа от заголовка, например книга. */
    badge?: () => unknown;
    default: () => unknown;
  }>();

  const items = computed<AccordionItem[]>(() => [
    { label: title, value: SECTION_COLLAPSE_VALUE },
  ]);

  const defaultValue = defaultOpen ? SECTION_COLLAPSE_VALUE : undefined;
</script>

<template>
  <UAccordion
    :items="items"
    :default-value="defaultValue"
    :ui="{
      item: 'border-b-0',
      trigger:
        'cursor-pointer gap-2 py-0 text-xl font-semibold text-highlighted',
      label: 'flex items-center gap-2',
      body: 'pt-3 text-base',
    }"
  >
    <template #default>
      <span>{{ title }}</span>

      <slot name="badge" />
    </template>

    <template #body>
      <slot />
    </template>
  </UAccordion>
</template>
