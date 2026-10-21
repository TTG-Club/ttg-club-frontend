<script setup lang="ts">
  /**
   * Раздел справочника: заголовок, поиск и фильтр, список и панель записи.
   * На десктопе запись открывается справа от списка, на телефоне — вместо
   * него, как в старом SPA.
   */
  const { title, isDetailOpen = false } = defineProps<{
    title: string;
    isDetailOpen?: boolean;
  }>();

  const listClass = computed(() =>
    isDetailOpen ? 'max-lg:hidden' : undefined,
  );
</script>

<template>
  <div class="flex gap-6">
    <div
      :class="listClass"
      class="min-w-0 flex-1"
    >
      <div class="sticky top-0 z-10 flex flex-col gap-3 bg-default pt-2 pb-4">
        <h1 class="text-2xl text-highlighted lg:text-3xl">
          {{ title }}
        </h1>

        <slot name="controls" />
      </div>

      <slot />
    </div>

    <aside
      v-if="isDetailOpen"
      class="min-w-0 flex-1 lg:sticky lg:top-0 lg:max-h-dvh lg:w-[55%] lg:flex-none lg:overflow-y-auto lg:border-l lg:border-default lg:pl-6"
    >
      <slot name="detail" />
    </aside>
  </div>
</template>
