<script setup lang="ts">
  /**
   * Шапка раздела над списком, как в старом SPA: заголовок и поиск с
   * фильтром одной строкой, а на узком месте — друг под другом. Липнет к
   * верху, пока список прокручивается.
   */
  const { title } = defineProps<{
    title: string;
  }>();

  defineSlots<{
    /** Поиск, фильтр и меню раздела. */
    default?: () => unknown;
  }>();
</script>

<template>
  <header
    class="@container sticky top-0 z-10 border-b border-default bg-default/80 backdrop-blur-lg"
  >
    <div
      class="flex flex-col gap-3 px-4 py-3 md:py-4 @3xl:flex-row @3xl:items-center @3xl:gap-6"
    >
      <h1 class="shrink-0 text-2xl text-highlighted">
        {{ title }}
      </h1>

      <div class="min-w-0 flex-auto @3xl:max-w-2xl">
        <slot />
      </div>
    </div>
  </header>
</template>
