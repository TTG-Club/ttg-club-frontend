<script setup lang="ts">
  import { useDmScreen } from '../composables';
  import { DmScreenClearModal } from '../dialogs';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_TEXT,
    DM_SCREEN_TITLE,
    DM_SCREEN_TOP_GAP,
  } from '../model';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenSnap from './DmScreenSnap.vue';
  import DmScreenWindows from './DmScreenWindows.vue';

  /**
   * Холст ширмы с поиском сверху. Добавленные записи на широком экране —
   * окна, на телефоне — список. Заголовок и кнопки в шапке задаёт
   * страница: у гостевой ширмы — приглашение войти, у ширмы из аккаунта —
   * её имя. Плашек под шапкой нет: их перекрыли бы окна. Шапку от холста
   * отделяет полоса: выше неё окна не встают, не перетаскиваются и не
   * растягиваются.
   */
  defineSlots<{
    /** Заголовок ширмы; без него — «Ширма Мастера». */
    heading?: () => unknown;
    /** Кнопки в конце шапки. */
    actions?: () => unknown;
    /**
     * Подсказка по центру пустой ширмы под её описанием, например
     * приглашение войти у гостя.
     */
    emptyNote?: () => unknown;
  }>();

  const {
    windows,
    isWindowed,
    addNote,
    arrange,
    shrinkAll,
    minimizeAll,
    clear,
    setTopInset,
  } = useDmScreen();

  const header = useTemplateRef<HTMLElement>('header');

  const { bottom: headerBottom } = useElementBounding(header);

  // Кнопки шапки на узком экране переносятся на вторую строку: окна
  // отступают от настоящего низа шапки, а не от её обычной высоты
  watchEffect(() => {
    if (isWindowed.value && headerBottom.value > 0) {
      setTopInset(Math.ceil(headerBottom.value) + DM_SCREEN_TOP_GAP);
    } else {
      setTopInset();
    }
  });

  onBeforeUnmount(() => {
    setTopInset();
  });

  const isClearOpen = ref(false);

  /** Спрашивает, очистить ли ширму. */
  function openClear(): void {
    isClearOpen.value = true;
  }

  /**
   * Кладёт пустую заметку рядом с кнопкой.
   * @param event - клик по кнопке
   */
  function createNote(event: MouseEvent): void {
    addNote({ x: event.clientX, y: event.clientY });
  }

  const isEmpty = computed(() => !windows.value.length);

  // Кнопки раскладки видны, пока на ширме есть записи, в том числе когда
  // все окна свёрнуты: «Выровнять» и «Уменьшить» их и развернут
  const isLayoutControlsVisible = computed(
    () => isWindowed.value && !isEmpty.value,
  );
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-4 p-4">
    <!-- Шапка после слоя окон в разметке: поиск ложится поверх окон -->
    <DmScreenWindows v-if="isWindowed" />

    <DmScreenSnap v-if="isWindowed" />

    <header
      ref="header"
      class="relative -mx-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-default px-4 pb-4"
    >
      <slot name="heading">
        <h1 class="text-2xl text-highlighted">
          {{ DM_SCREEN_TITLE }}
        </h1>
      </slot>

      <DmScreenSearch />

      <UButton
        :icon="DM_SCREEN_ICON.note"
        :label="DM_SCREEN_TEXT.addNote"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="createNote"
      />

      <UButton
        v-if="isLayoutControlsVisible"
        :icon="DM_SCREEN_ICON.arrange"
        :label="DM_SCREEN_TEXT.arrange"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="arrange"
      />

      <UButton
        v-if="isLayoutControlsVisible"
        :icon="DM_SCREEN_ICON.shrinkAll"
        :label="DM_SCREEN_TEXT.shrinkAll"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="shrinkAll"
      />

      <UButton
        v-if="isLayoutControlsVisible"
        :icon="DM_SCREEN_ICON.minimizeAll"
        :label="DM_SCREEN_TEXT.minimizeAll"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="minimizeAll"
      />

      <UButton
        v-if="!isEmpty"
        :icon="DM_SCREEN_ICON.delete"
        :label="DM_SCREEN_TEXT.clear"
        color="error"
        variant="outline"
        @click.left.exact.prevent="openClear"
      />

      <slot name="actions" />
    </header>

    <div
      v-if="isEmpty"
      class="m-auto flex max-w-lg flex-col items-center gap-4"
    >
      <UEmpty
        :icon="DM_SCREEN_ICON.screen"
        :title="DM_SCREEN_TEXT.emptyTitle"
        :description="DM_SCREEN_TEXT.emptyDescription"
      />

      <slot name="emptyNote" />
    </div>

    <DmScreenList v-else-if="!isWindowed" />

    <DmScreenClearModal
      v-model:open="isClearOpen"
      @confirm="clear"
    />
  </div>
</template>
