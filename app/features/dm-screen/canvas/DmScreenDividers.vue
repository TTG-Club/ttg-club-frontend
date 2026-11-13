<script setup lang="ts">
  import type { DmScreenDivider, DmScreenTile } from '../model';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_DIVIDER_ACTIVE_CLASS,
    DM_SCREEN_DIVIDER_CLASS,
    getDmScreenDividerPointer,
    getDmScreenDividerRect,
    getDmScreenDividers,
    getDmScreenRectStyle,
    moveDmScreenDivider,
  } from '../model';

  /**
   * Общие границы соседних окон, как у окон Windows 11. Между окнами,
   * стоящими через промежуток сетки, при наведении появляется полоска: за
   * неё тянут, и окна по обе стороны меняют размер разом, а промежуток
   * остаётся. Пока границу тянут, окна лишь показывают новый размер; в
   * ширму он пишется, когда границу отпускают.
   */
  const { visibleWindows, setPreviewRects, updateRects } = useDmScreen();

  const dividers = computed(() => getDmScreenDividers(visibleWindows.value));

  /** Граница, которую тянут: откуда начали и что получилось. */
  const dragged = shallowRef<{
    divider: DmScreenDivider;
    origin: number;
    position: number;
    tiles: Array<DmScreenTile>;
  }>();

  const dividerViews = computed(() =>
    dividers.value.map((divider) => {
      const active =
        dragged.value?.divider.key === divider.key ? dragged.value : undefined;

      const look = divider.isVertical
        ? DM_SCREEN_DIVIDER_CLASS.vertical
        : DM_SCREEN_DIVIDER_CLASS.horizontal;

      return {
        divider,
        style: getDmScreenRectStyle(
          getDmScreenDividerRect(divider, active?.position),
        ),
        rootClass: look.root,
        barClass: active
          ? [look.bar, DM_SCREEN_DIVIDER_ACTIVE_CLASS]
          : [look.bar],
      };
    }),
  );

  /**
   * Границу начали тянуть: указатель закрепляется за ней, чтобы она не
   * терялась, когда он уходит с неё.
   * @param divider - граница
   * @param event - нажатие на границу
   */
  function startDrag(divider: DmScreenDivider, event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    dragged.value = {
      divider,
      origin: getDmScreenDividerPointer(divider, {
        x: event.clientX,
        y: event.clientY,
      }),
      position: divider.position,
      tiles: [],
    };
  }

  /**
   * Границу тянут: окна по обе стороны показывают новый размер.
   * @param event - движение указателя
   */
  function moveDrag(event: PointerEvent): void {
    const active = dragged.value;

    if (!active) {
      return;
    }

    const moved = moveDmScreenDivider(
      active.divider,
      getDmScreenDividerPointer(active.divider, {
        x: event.clientX,
        y: event.clientY,
      }) - active.origin,
      visibleWindows.value,
    );

    dragged.value = { ...active, ...moved };
    setPreviewRects(moved.tiles);
  }

  /** Границу отпустили: новый размер окон записывается в ширму. */
  function endDrag(): void {
    const active = dragged.value;

    if (!active) {
      return;
    }

    dragged.value = undefined;

    updateRects(active.tiles);
    setPreviewRects();
  }
</script>

<template>
  <div
    v-for="view in dividerViews"
    :key="view.divider.key"
    aria-hidden="true"
    :style="view.style"
    class="group fixed flex touch-none items-center justify-center"
    :class="view.rootClass"
    @pointerdown.left.prevent="startDrag(view.divider, $event)"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <div
      class="rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
      :class="view.barClass"
    />
  </div>
</template>
