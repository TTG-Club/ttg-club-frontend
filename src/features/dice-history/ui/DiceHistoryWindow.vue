<template>
  <div
    ref="container"
    :class="$style['history-window']"
  >
    <div :class="$style['history-window__content']">
      <div
        ref="resizeTrigger"
        :class="$style['history-window__resize-trigger']"
      />

      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    useEventListener,
    useLocalStorage,
    useResizeObserver
  } from '@vueuse/core';
  import {
    onMounted,
    onUnmounted,
    ref,
    useCssModule,
    nextTick,
    watchEffect
  } from 'vue';

  import { useAppBreakpoints } from '@/shared/composables/useAppBreakpoints';

  const emit = defineEmits<{
    (event: 'resize:start', height: number): void;
    (event: 'resize', deltaHeight: number): void;
    (event: 'resize:end', height: number): void;
  }>();

  const $style = useCssModule();

  const container = ref<HTMLElement>();
  const resizeTrigger = ref<HTMLElement>();

  const resizing = ref(false);

  const minTopOffset = 24;
  const minHeight = 221;
  const height = useLocalStorage('history-roll-height', minHeight);

  if (height.value <= minHeight) {
    height.value = minHeight;
  }

  let y = 0;
  let prevY = 0;

  function adjustHeight() {
    if (!container.value) {
      return;
    }

    const { top } = container.value!.getBoundingClientRect();

    if (top < minTopOffset) {
      const newHeight = height.value - minTopOffset + top;

      if (newHeight >= minHeight) {
        height.value = newHeight;
      }
    }
  }

  function start(event: PointerEvent) {
    const target = event.target as HTMLElement;

    if (resizeTrigger.value !== target) {
      return;
    }

    resizing.value = true;
    y = event.y;
    window.document.body.style.userSelect = 'none';

    emit('resize:start', height.value);
  }

  function move(event: PointerEvent) {
    if (!resizing.value) {
      return;
    }

    const prevHeight = height.value;

    prevY = y;
    y = Math.max(event.y, minTopOffset);

    height.value += prevY - y;

    if (height.value < minHeight) {
      height.value = minHeight;
    }

    emit('resize', height.value - prevHeight);
  }

  function end() {
    adjustHeight();

    resizing.value = false;
    window.document.body.style.userSelect = '';

    emit('resize:end', height.value);
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
</script>

<style module lang="scss">
  @use '@/assets/styles/variables/breakpoints' as *;
  @use 'variables' as *;

  .history-window {
    --fab-size: 32px;

    z-index: 13;
    position: fixed;
    transform-origin: right bottom;
    inset: 8px;
    bottom: calc(56px + 8px + var(--safe-area-inset-bottom));

    @include media-min($xl) {
      --fab-size: 50px;
    }

    @include media-min($md) {
      top: unset;
      right: $x-offset;
      bottom: calc(var(--fab-size) + $y-offset + 8px);
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
