<script setup lang="ts">
  /**
   * Раскладка записи, как на new.ttg.club: узкая колонка свойств слева и
   * текст справа. Колонки зависят от ширины контейнера, а не окна: в дровере
   * и на телефоне они идут столбиком, на широкой странице — рядом.
   * Шапка на широкой странице стоит над текстом, правее свойств, а
   * столбиком — над всем.
   */
  const { isAsideOnTop = false } = defineProps<{
    /** Колонка свойств всегда над текстом, даже на широкой странице. */
    isAsideOnTop?: boolean;
  }>();

  const slots = defineSlots<{
    /** Шапка над текстом, например кнопки переходов. */
    header?: () => unknown;
    /** Колонка свойств; без неё текст занимает всю ширину. */
    aside?: () => unknown;
    default: () => unknown;
  }>();

  /** Колонки рядом: есть колонка свойств и она не стоит над текстом. */
  const isSideBySide = computed(() => !!slots.aside && !isAsideOnTop);

  const gridClass = computed(() =>
    isSideBySide.value ? '@min-3xl:grid-cols-[20rem_minmax(0,1fr)]' : '',
  );

  const headerClass = computed(() =>
    isSideBySide.value ? '@min-3xl:col-start-2' : '',
  );

  const asideClass = computed(() => {
    if (!isSideBySide.value) {
      return '';
    }

    return slots.header
      ? '@min-3xl:col-start-1 @min-3xl:row-span-2 @min-3xl:row-start-1'
      : '@min-3xl:col-start-1 @min-3xl:row-start-1';
  });
</script>

<template>
  <div class="@container w-full min-w-0">
    <div
      class="grid grid-cols-1 gap-4 @min-3xl:gap-x-7"
      :class="gridClass"
    >
      <div
        v-if="$slots.header"
        class="min-w-0"
        :class="headerClass"
      >
        <slot name="header" />
      </div>

      <div
        v-if="$slots.aside"
        class="flex w-full flex-col gap-4"
        :class="asideClass"
      >
        <slot name="aside" />
      </div>

      <div class="min-w-0">
        <slot />
      </div>
    </div>
  </div>
</template>
