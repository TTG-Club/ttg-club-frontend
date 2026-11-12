<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import { DM_SCREEN_ICON, DM_SCREEN_TEXT, DM_SCREEN_TITLE } from '../model';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenWindows from './DmScreenWindows.vue';

  /**
   * Холст ширмы с поиском сверху. Добавленные записи на широком экране —
   * окна, на телефоне — список. Заголовок и кнопки в шапке задаёт
   * страница: у гостевой ширмы — приглашение войти, у ширмы из аккаунта —
   * её имя и путь к списку ширм. Плашек под шапкой нет: их перекрыли бы
   * окна.
   */
  defineSlots<{
    /** Заголовок ширмы; без него — «Ширма Мастера». */
    heading?: () => unknown;
    /** Кнопки в конце шапки, например «Войти». */
    actions?: () => unknown;
  }>();

  const {
    windows,
    visibleWindows,
    isWindowed,
    arrange,
    shrinkAll,
    minimizeAll,
  } = useDmScreen();

  // Выравнивать и сворачивать есть что, только пока окна развёрнуты
  const isArrangeAvailable = computed(
    () => isWindowed.value && visibleWindows.value.length > 0,
  );

  const isEmpty = computed(() => !windows.value.length);
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-4 p-4">
    <!-- Шапка после слоя окон в разметке: поиск ложится поверх окон -->
    <DmScreenWindows v-if="isWindowed" />

    <header class="relative flex flex-wrap items-center gap-x-6 gap-y-3">
      <slot name="heading">
        <h1 class="text-2xl text-highlighted">
          {{ DM_SCREEN_TITLE }}
        </h1>
      </slot>

      <DmScreenSearch />

      <UButton
        v-if="!isEmpty && isWindowed"
        :icon="DM_SCREEN_ICON.arrange"
        :label="DM_SCREEN_TEXT.arrange"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="arrange"
      />

      <UButton
        v-if="isArrangeAvailable"
        :icon="DM_SCREEN_ICON.shrinkAll"
        :label="DM_SCREEN_TEXT.shrinkAll"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="shrinkAll"
      />

      <UButton
        v-if="isArrangeAvailable"
        :icon="DM_SCREEN_ICON.minimizeAll"
        :label="DM_SCREEN_TEXT.minimizeAll"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="minimizeAll"
      />

      <slot name="actions" />
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
