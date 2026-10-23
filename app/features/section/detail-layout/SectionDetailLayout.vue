<script setup lang="ts">
  /**
   * Раскладка записи, как на new.ttg.club: узкая колонка свойств слева и
   * текст справа. Колонки зависят от ширины контейнера, а не окна: в дровере
   * и на телефоне они идут столбиком, на широкой странице — рядом.
   */
  defineSlots<{
    /** Колонка свойств; без неё текст занимает всю ширину. */
    aside?: () => unknown;
    default: () => unknown;
  }>();
</script>

<template>
  <div class="@container w-full min-w-0">
    <div class="flex flex-col gap-4 @min-3xl:flex-row @min-3xl:gap-7">
      <div
        v-if="$slots.aside"
        class="flex w-full flex-col gap-4 @min-3xl:w-80 @min-3xl:flex-none"
      >
        <slot name="aside" />
      </div>

      <div class="min-w-0 flex-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
