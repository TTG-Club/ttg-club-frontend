<script lang="ts" setup>
  // TODO: Consider renaming this component
  import {
    useEventListener,
    useLocalStorage,
    useResizeObserver,
  } from '@vueuse/core';
  import { onMounted, onUnmounted, ref, nextTick, watchEffect } from 'vue';

  import { useAppBreakpoints } from '@/shared/composables/useAppBreakpoints';

  const emit = defineEmits<{
    (event: 'resize:start', height: number): void;
    (event: 'resize', deltaHeight: number): void;
    (event: 'resize:end', height: number): void;
  }>();

  const MIN_TOP_OFFSET = 24;
  const MIN_HEIGHT = 221;

  const container = ref<HTMLElement>();
  const resizeTrigger = ref<HTMLElement>();
  const height = useLocalStorage('bottom-right-window-height', MIN_HEIGHT);

  if (height.value <= MIN_HEIGHT) {
    height.value = MIN_HEIGHT;
  }

  const mdAndHigher = useAppBreakpoints().greaterOrEqual('md');

  useEventListener(document, 'pointerdown', start);
  useEventListener(document, 'pointermove', move);
  useEventListener(document, 'pointerup', end);

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      adjustHeight();
    }
  });

  useResizeObserver(document.body, () => {
    adjustHeight();
  });

  watchEffect(() => {
    if (!container.value) {
      return;
    }

    container.value.style.height = mdAndHigher.value ? `${height.value}px` : '';
  });

  onMounted(() => {
    nextTick(() => {
      adjustHeight();
    });
  });

  onUnmounted(() => {
    end();
  });

  let resizing = false;

  let y = 0;
  let prevY = 0;

  function adjustHeight() {
    if (!container.value) {
      return;
    }

    const { top } = container.value.getBoundingClientRect();

    if (top < MIN_TOP_OFFSET) {
      const newHeight = height.value - MIN_TOP_OFFSET + top;

      if (newHeight >= MIN_HEIGHT) {
        height.value = newHeight;
      }
    }
  }

  function start(event: PointerEvent) {
    if (resizeTrigger.value !== event.target) {
      return;
    }

    resizing = true;
    y = event.y;
    window.document.body.style.userSelect = 'none';

    emit('resize:start', height.value);
  }

  function move(event: PointerEvent) {
    if (!resizing) {
      return;
    }

    const prevHeight = height.value;

    prevY = y;
    y = Math.max(event.y, MIN_TOP_OFFSET);

    height.value += prevY - y;

    if (height.value < MIN_HEIGHT) {
      height.value = MIN_HEIGHT;
    }

    emit('resize', height.value - prevHeight);
  }

  function end() {
    adjustHeight();

    resizing = false;
    window.document.body.style.userSelect = '';

    emit('resize:end', height.value);
  }
</script>

<template>
  <div
    ref="container"
    class="bottom-right-window"
  >
    <div class="bottom-right-window__content">
      <div
        ref="resizeTrigger"
        class="bottom-right-window__resize-trigger"
      />

      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .bottom-right-window {
    z-index: 13;
    position: fixed;
    transform-origin: right bottom;
    inset: 8px;
    bottom: calc(56px + 8px + var(--safe-area-inset-bottom));

    @include media-min($md) {
      top: unset;
      right: var(--fab-y-offset);
      bottom: calc(var(--fab-size) + var(--fab-y-offset) + 8px);
      left: unset;
      width: 300px;
    }

    &__content {
      position: relative;
      width: 100%;
      height: 100%;
    }

    &__resize-trigger {
      display: none;
      position: absolute;
      top: -3px;
      left: 0;
      right: 0;
      height: 7px;
      cursor: n-resize;

      @include media-min($md) {
        display: block;
      }
    }
  }
</style>
