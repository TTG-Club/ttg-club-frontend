<script setup lang="ts">
  import { SECTION_ICON } from '../model';

  /**
   * Раскрывающийся блок записи, как на new.ttg.club: крупный заголовок со
   * стрелкой, по клику текст прячется и открывается снова.
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
</script>

<template>
  <UCollapsible
    :default-open="defaultOpen"
    :ui="{ content: 'pt-3' }"
  >
    <template #default="{ open }">
      <h4
        class="flex cursor-pointer items-center gap-2 text-xl font-semibold text-highlighted"
      >
        <UIcon
          :name="SECTION_ICON.expand"
          :class="open ? '-rotate-180' : undefined"
          class="flex-none transition-transform duration-150 ease-in-out"
        />

        <span>{{ title }}</span>

        <slot name="badge" />
      </h4>
    </template>

    <template #content>
      <slot />
    </template>
  </UCollapsible>
</template>
