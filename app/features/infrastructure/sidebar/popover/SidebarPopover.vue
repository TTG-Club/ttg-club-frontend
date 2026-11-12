<script setup lang="ts">
  /**
   * Всплывающая панель боковой навигации, как в старом SPA: на телефоне
   * поднимается над нижней панелью, на десктопе открывается справа от боковой.
   */
  const { isMenu = false } = defineProps<{
    /** Панель главного меню: шире обычной. */
    isMenu?: boolean;
  }>();

  const isOpened = defineModel<boolean>({ default: false });

  const style = useCssModule();

  const graphicsProbe = useGraphicsProbe();

  const bodyClasses = computed(() => [style.body, { [style.menu]: isMenu }]);

  const isScrollLocked = useScrollLock(() =>
    import.meta.client ? document.body : null,
  );

  function close() {
    isOpened.value = false;
  }

  function toggle() {
    isOpened.value = !isOpened.value;
  }

  onKeyStroke('Escape', (event) => {
    if (!isOpened.value) {
      return;
    }

    event.preventDefault();
    close();
  });

  /**
   * Содержимое панели собрано. Сборка меню из десятков кнопок занимает
   * десятки миллисекунд — если делать её по клику, анимация открытия
   * начинается с рывка. Поэтому панель собирается один раз в простое после
   * загрузки страницы и дальше только прячется и показывается.
   */
  const isRendered = ref(false);

  onNuxtReady(() => {
    isRendered.value = true;
  });

  watch(isOpened, (value) => {
    // Открыли раньше, чем страница дошла до простоя
    if (value) {
      isRendered.value = true;
    }

    isScrollLocked.value = value;
  });

  /**
   * При открытии возвращает панель к началу: она не пересоздаётся и помнит
   * прокрутку с прошлого раза.
   * @param element - панель
   */
  function resetScroll(element: Element): void {
    element.scrollTop = 0;
  }
</script>

<template>
  <div class="size-10 shrink-0">
    <div
      class="relative size-full"
      :class="{ 'z-200': isOpened }"
    >
      <slot
        name="trigger"
        :is-opened="isOpened"
        :toggle="toggle"
      />
    </div>

    <!--
      Размытие во весь экран видеокарта пересчитывает на каждом кадре, пока
      меню открывается и пока в нём что-то движется: в режиме
      «производительность» его нет (см. `tailwind.css`).
    -->
    <Transition name="fade">
      <div
        v-if="isOpened"
        class="fixed inset-0 z-180 cursor-pointer bg-overlay backdrop-blur-xs"
        @click.left.exact.self.prevent.stop="close"
      />
    </Transition>

    <!--
      По кадрам открытия сайт понимает, тянет ли устройство размытие. Условие
      сборки стоит на самой анимации, а не на панели: иначе заранее собранная
      скрытая панель «открывалась» бы для неё и портила замер.
    -->
    <Transition
      v-if="isRendered"
      name="sidebar-popover"
      @before-enter="graphicsProbe.start"
      @enter="resetScroll"
      @after-enter="graphicsProbe.finish"
      @enter-cancelled="graphicsProbe.cancel"
    >
      <!-- Без размытия полупрозрачная панель нечитаема: под градиент ложится плотный фон -->
      <div
        v-show="isOpened"
        class="flex flex-col overflow-auto overscroll-contain rounded-xl border border-default shadow-2xl backdrop-blur-lg performance:bg-main"
        :class="bodyClasses"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" module>
  .body {
    position: absolute;
    z-index: 190;
    bottom: calc(64px + env(safe-area-inset-bottom));
    left: 8px;
    transform-origin: bottom left;

    width: fit-content;
    max-width: calc(100vw - 16px);
    max-height: calc(100dvh - 72px - env(safe-area-inset-bottom));

    background-image: var(--bg-gradient);

    &.menu {
      width: calc(100vw - 16px);
    }

    @media (width >= 768px) {
      top: 16px;
      bottom: auto;
      left: 72px;
      transform-origin: top left;

      max-width: 1100px;
      max-height: calc(100dvh - 32px);

      &.menu {
        width: calc(100vw - 88px);
        max-width: 1040px;
      }
    }
  }
</style>

<style>
  .sidebar-popover-enter-from,
  .sidebar-popover-leave-to {
    transform: scale(0);
    opacity: 0;
  }

  .sidebar-popover-enter-active,
  .sidebar-popover-leave-active {
    /* Размытие под панелью включается после анимации: пока панель меняет
       размер, оно пересчитывалось бы на каждом кадре. Запись с приставкой —
       для Safari до 18-й версии: Tailwind задаёт размытие и ею тоже. */
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    transition:
      transform 0.25s cubic-bezier(0.215, 0.61, 0.355, 1),
      opacity 0.25s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
</style>
