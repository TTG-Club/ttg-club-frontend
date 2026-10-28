<script setup lang="ts">
  import {
    SECTION_SPLIT_DEFAULT_SIZE,
    SECTION_SPLIT_MAX_SIZE,
    SECTION_SPLIT_MIN_SIZE,
    SECTION_SPLIT_STORAGE_KEY,
  } from '../model';
  import SectionTopBar from './SectionTopBar.vue';

  /**
   * Раскладка раздела, как на new.ttg.club: слева колонка с заголовком,
   * поиском и фильтром, справа список. В широком режиме рядом со списком
   * стоит панель записи, а граница между ними перетаскивается.
   *
   * Списки справочника ставят заголовок, поиск и фильтр шапкой над списком,
   * как в старом SPA: колонка слева отнимает у них слишком много места.
   */
  const {
    title,
    isSplit = false,
    isTopBar = false,
  } = defineProps<{
    title: string;
    /** Широкий режим: список и запись рядом на весь экран. */
    isSplit?: boolean;
    /** Заголовок и управление шапкой над списком, а не колонкой слева. */
    isTopBar?: boolean;
  }>();

  defineSlots<{
    controls?: () => unknown;
    default: () => unknown;
    detail?: () => unknown;
  }>();
</script>

<template>
  <div
    v-if="isSplit"
    class="flex h-dvh w-full"
  >
    <aside
      v-if="!isTopBar"
      class="scrollbar-none flex w-75 shrink-0 flex-col gap-4 overflow-y-auto border-r border-default p-4 pt-6"
    >
      <h1 class="text-2xl text-highlighted">
        {{ title }}
      </h1>

      <slot name="controls" />
    </aside>

    <UDashboardGroup
      storage="cookie"
      :storage-key="SECTION_SPLIT_STORAGE_KEY"
      :ui="{ base: 'relative inset-auto flex h-dvh flex-1 overflow-hidden' }"
    >
      <UDashboardPanel
        id="section-list"
        resizable
        :default-size="SECTION_SPLIT_DEFAULT_SIZE"
        :min-size="SECTION_SPLIT_MIN_SIZE"
        :max-size="SECTION_SPLIT_MAX_SIZE"
        class="border-r border-default"
      >
        <div
          v-if="isTopBar"
          class="h-full overflow-y-auto"
        >
          <SectionTopBar :title="title">
            <slot name="controls" />
          </SectionTopBar>

          <div class="px-4 pt-4 pb-8">
            <slot />
          </div>
        </div>

        <div
          v-else
          class="h-full overflow-y-auto px-4 pt-6 pb-8"
        >
          <slot />
        </div>
      </UDashboardPanel>

      <UDashboardPanel id="section-detail">
        <div class="h-full overflow-y-auto px-6 pt-4 pb-8">
          <slot name="detail" />
        </div>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>

  <div
    v-else-if="isTopBar"
    class="mx-auto flex w-full flex-col lg:max-w-330"
  >
    <SectionTopBar :title="title">
      <slot name="controls" />
    </SectionTopBar>

    <div class="flex min-w-0 flex-auto flex-col px-4 pt-4 pb-8">
      <slot />
    </div>
  </div>

  <div
    v-else
    class="mx-auto flex w-full flex-col lg:max-w-330 lg:flex-row"
  >
    <aside
      class="sticky top-0 z-10 scrollbar-none shrink-0 border-default bg-default/80 backdrop-blur-lg lg:h-dvh lg:overflow-y-auto lg:border-r"
    >
      <div class="flex w-full flex-col gap-4 p-4 md:pt-6 lg:w-75">
        <h1 class="text-2xl text-highlighted">
          {{ title }}
        </h1>

        <slot name="controls" />
      </div>
    </aside>

    <div class="flex min-w-0 flex-auto flex-col px-4 pb-8 lg:pt-6">
      <slot />
    </div>
  </div>
</template>
