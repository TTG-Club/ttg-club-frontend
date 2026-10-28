<script setup lang="ts">
  /**
   * Раскладка записи, как на new.ttg.club: узкая колонка свойств слева и
   * текст справа. Колонки зависят от ширины контейнера, а не окна: в дровере
   * и на телефоне они идут столбиком, на широкой странице — рядом.
   * Шапка на широкой странице стоит над текстом, правее свойств, а
   * столбиком — над всем.
   */
  defineSlots<{
    /** Шапка над текстом, например кнопки переходов. */
    header?: () => unknown;
    /** Колонка свойств; без неё текст занимает всю ширину. */
    aside?: () => unknown;
    default: () => unknown;
  }>();
</script>

<template>
  <div class="@container w-full min-w-0">
    <div
      class="grid grid-cols-1 gap-4 @min-3xl:gap-x-7"
      :class="{ '@min-3xl:grid-cols-[20rem_minmax(0,1fr)]': !!$slots.aside }"
    >
      <div
        v-if="$slots.header"
        class="min-w-0"
        :class="{ '@min-3xl:col-start-2': !!$slots.aside }"
      >
        <slot name="header" />
      </div>

      <div
        v-if="$slots.aside"
        class="flex w-full flex-col gap-4 @min-3xl:col-start-1 @min-3xl:row-start-1"
        :class="{ '@min-3xl:row-span-2': !!$slots.header }"
      >
        <slot name="aside" />
      </div>

      <div class="min-w-0">
        <slot />
      </div>
    </div>
  </div>
</template>
