<script setup lang="ts">
  import { useDmScreen, useDmScreenView } from '../composables';
  import {
    DM_SCREEN_FIELD,
    DM_SCREEN_ICON,
    DM_SCREEN_MINIMAP_MIN_ZOOM,
    DM_SCREEN_MINIMAP_PADDING,
    DM_SCREEN_MINIMAP_SIZE,
    DM_SCREEN_MINIMAP_STORAGE_KEY,
    DM_SCREEN_MINIMAP_TOGGLE_VARIANT,
    DM_SCREEN_TEXT,
    DM_SCREEN_ZOOM,
    fitDmScreenView,
    formatDmScreenZoom,
    getDmScreenRectStyle,
    getDmScreenSizeStyle,
    toDmScreenCanvasRect,
    toDmScreenFieldPoint,
  } from '../model';

  /**
   * Обзор ширмы у правого верхнего угла холста: миникарта и под ней кнопки
   * масштаба и «показать все окна». Миникарта — всё поле целиком: на ней
   * видны окна и рамка того, что сейчас на холсте; клик или протяжка по ней
   * переносит обзор в это место. Показывать ли миникарту, хранится в
   * localStorage.
   */
  const { visibleWindows } = useDmScreen();

  const { view, board, zoomIn, zoomOut, resetZoom, centerOn, fit } =
    useDmScreenView();

  /** Как поле ложится на миникарту: целиком и по центру. */
  const MINIMAP_VIEW = fitDmScreenView(
    DM_SCREEN_FIELD,
    DM_SCREEN_MINIMAP_SIZE,
    DM_SCREEN_MINIMAP_PADDING,
    DM_SCREEN_MINIMAP_MIN_ZOOM,
  );

  const isMinimapOpen = useLocalStorage(DM_SCREEN_MINIMAP_STORAGE_KEY, true);

  const minimapToggleLabel = computed(() =>
    isMinimapOpen.value
      ? DM_SCREEN_TEXT.minimapHide
      : DM_SCREEN_TEXT.minimapShow,
  );

  const minimapToggleVariant = computed(() =>
    isMinimapOpen.value
      ? DM_SCREEN_MINIMAP_TOGGLE_VARIANT.open
      : DM_SCREEN_MINIMAP_TOGGLE_VARIANT.closed,
  );

  /** Показывает или прячет миникарту. */
  function toggleMinimap(): void {
    isMinimapOpen.value = !isMinimapOpen.value;
  }

  const zoomLabel = computed(() => formatDmScreenZoom(view.value.zoom));

  const isZoomInDisabled = computed(
    () => view.value.zoom >= DM_SCREEN_ZOOM.max,
  );

  const isZoomOutDisabled = computed(
    () => view.value.zoom <= DM_SCREEN_ZOOM.min,
  );

  /** Отдаляет поле так, чтобы на холсте были видны все развёрнутые окна. */
  function fitWindows(): void {
    fit(visibleWindows.value);
  }

  const minimapStyle = getDmScreenSizeStyle(DM_SCREEN_MINIMAP_SIZE);

  const minimapTiles = computed(() =>
    visibleWindows.value.map((screenWindow) => ({
      id: screenWindow.id,
      style: getDmScreenRectStyle(
        toDmScreenCanvasRect(screenWindow, MINIMAP_VIEW),
      ),
    })),
  );

  const frameStyle = computed(() =>
    getDmScreenRectStyle(toDmScreenCanvasRect(board.value, MINIMAP_VIEW)),
  );

  const minimap = useTemplateRef<HTMLElement>('minimap');

  /** Миникарту тянут: обзор идёт за указателем. */
  let isDragging = false;

  /**
   * Переносит обзор в место поля под указателем на миникарте.
   * @param event - нажатие или движение указателя
   */
  function moveTo(event: PointerEvent): void {
    if (!minimap.value) {
      return;
    }

    const bounds = minimap.value.getBoundingClientRect();

    centerOn(
      toDmScreenFieldPoint(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        MINIMAP_VIEW,
      ),
    );
  }

  /**
   * На миникарту нажали: обзор переносится сразу и дальше идёт за
   * указателем, пока его не отпустят.
   * @param event - нажатие
   */
  function startDrag(event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDragging = true;
    moveTo(event);
  }

  /**
   * Указатель двигается по миникарте.
   * @param event - движение указателя
   */
  function moveDrag(event: PointerEvent): void {
    if (isDragging) {
      moveTo(event);
    }
  }

  /** Миникарту отпустили. */
  function endDrag(): void {
    isDragging = false;
  }
</script>

<template>
  <div
    role="toolbar"
    :aria-label="DM_SCREEN_TEXT.navigator"
    class="absolute top-4 right-4 flex flex-col items-end gap-1.5"
  >
    <div
      v-if="isMinimapOpen"
      ref="minimap"
      :aria-label="DM_SCREEN_TEXT.minimap"
      :style="minimapStyle"
      class="relative cursor-pointer touch-none overflow-hidden rounded-lg border border-default bg-elevated/90 shadow-lg"
      @pointerdown.left.prevent="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <div
        v-for="tile in minimapTiles"
        :key="tile.id"
        :style="tile.style"
        class="pointer-events-none absolute rounded-xs bg-inverted/50"
      />

      <div
        :style="frameStyle"
        class="pointer-events-none absolute rounded-xs border border-primary bg-primary/15"
      />
    </div>

    <div
      class="flex items-center rounded-lg border border-default bg-elevated shadow-lg"
    >
      <UTooltip :text="DM_SCREEN_TEXT.zoomOut">
        <UButton
          :icon="DM_SCREEN_ICON.zoomOut"
          :aria-label="DM_SCREEN_TEXT.zoomOut"
          :disabled="isZoomOutDisabled"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="zoomOut"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.zoomReset">
        <UButton
          :label="zoomLabel"
          :aria-label="DM_SCREEN_TEXT.zoomReset"
          color="neutral"
          variant="ghost"
          size="sm"
          class="w-14 justify-center tabular-nums"
          @click.left.exact.prevent="resetZoom"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.zoomIn">
        <UButton
          :icon="DM_SCREEN_ICON.zoomIn"
          :aria-label="DM_SCREEN_TEXT.zoomIn"
          :disabled="isZoomInDisabled"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="zoomIn"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.fit">
        <UButton
          :icon="DM_SCREEN_ICON.fit"
          :aria-label="DM_SCREEN_TEXT.fit"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="fitWindows"
        />
      </UTooltip>

      <UTooltip :text="minimapToggleLabel">
        <UButton
          :icon="DM_SCREEN_ICON.minimap"
          :aria-label="minimapToggleLabel"
          :variant="minimapToggleVariant"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="toggleMinimap"
        />
      </UTooltip>
    </div>
  </div>
</template>
