<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT, DM_SCREEN_TITLE } from '../model';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenWindows from './DmScreenWindows.vue';

  /**
   * Ширма Мастера: пустой холст с поиском сверху. Добавленные записи на
   * широком экране — окна, на телефоне — список.
   */
  const { windows, isWindowed } = useDmScreen();

  const isEmpty = computed(() => !windows.value.length);
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-4 p-4">
    <!-- Шапка после слоя окон в разметке: поиск ложится поверх окон -->
    <DmScreenWindows v-if="isWindowed" />

    <header class="relative flex flex-wrap items-center gap-x-6 gap-y-3">
      <h1 class="text-2xl text-highlighted">
        {{ DM_SCREEN_TITLE }}
      </h1>

      <DmScreenSearch />
    </header>

    <UEmpty
      v-if="isEmpty"
      :icon="DM_SCREEN_ICON.screen"
      :title="DM_SCREEN_TEXT.emptyTitle"
      :description="DM_SCREEN_TEXT.emptyDescription"
      class="m-auto max-w-lg"
    />

    <DmScreenList v-else-if="!isWindowed" />
  </div>
</template>
