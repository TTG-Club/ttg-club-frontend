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

  watch(isOpened, (value) => {
    isScrollLocked.value = value;
  });
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

    <Transition name="fade">
      <div
        v-if="isOpened"
        class="fixed inset-0 z-180 cursor-pointer bg-overlay backdrop-blur-xs"
        @click.left.exact.self.prevent.stop="close"
      />
    </Transition>

    <Transition name="sidebar-popover">
      <div
        v-if="isOpened"
        class="flex flex-col overflow-auto overscroll-contain rounded-xl border border-default shadow-2xl backdrop-blur-lg"
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
