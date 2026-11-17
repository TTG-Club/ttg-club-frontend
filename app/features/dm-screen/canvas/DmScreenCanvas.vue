<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { DmScreenPoint, DmScreenView } from '../model';

  import {
    useDmScreen,
    useDmScreenSnap,
    useDmScreenView,
  } from '../composables';
  import { DmScreenClearModal } from '../dialogs';
  import {
    DM_SCREEN_BACKDROP,
    DM_SCREEN_CANVAS_CLASS,
    DM_SCREEN_ICON,
    DM_SCREEN_PANNING_CLASS,
    DM_SCREEN_POINTER_BUTTON,
    DM_SCREEN_SNAP_PICKER_POSITIONS,
    DM_SCREEN_TEXT,
    DM_SCREEN_TITLE,
    DM_SCREEN_ZOOM,
    getDmScreenBackdropStep,
    getDmScreenFieldOffset,
    isDmScreenRectVisible,
  } from '../model';
  import { DmScreenWindow } from '../window';
  import DmScreenArrangePicker from './DmScreenArrangePicker.vue';
  import DmScreenDividers from './DmScreenDividers.vue';
  import DmScreenDock from './DmScreenDock.vue';
  import DmScreenList from './DmScreenList.vue';
  import DmScreenNavigator from './DmScreenNavigator.vue';
  import DmScreenSearch from './DmScreenSearch.vue';
  import DmScreenSnap from './DmScreenSnap.vue';

  /** Поле начали тянуть: где был указатель и какой был обзор. */
  interface PanGesture {
    pointer: DmScreenPoint;
    view: DmScreenView;
  }

  /**
   * Ширма Мастера: шапка с поиском и кнопками, под ней холст. На широком
   * экране записи стоят окнами на большом поле, а холст показывает его
   * часть; на телефоне записи идут списком. Холст занимает всё место под
   * шапкой и сам сообщает ширме свои размеры. Заголовок и кнопки в шапке
   * задаёт страница: у гостевой ширмы — приглашение войти, у ширмы из
   * аккаунта — её имя.
   *
   * Поле двигают, потянув за пустое место или средней кнопкой мыши где
   * угодно, и отдаляют колёсиком: над пустым местом — сразу, над окном — с
   * зажатым Ctrl (без него колёсико листает запись в окне).
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
    visibleWindows,
    isWindowed,
    toBoardPoint,
    addNote,
    minimizeAll,
    restoreAll,
    clear,
  } = useDmScreen();

  const { pickerPosition, setPickerPosition } = useDmScreenSnap();

  const { view, board, setCanvas, toCanvasPoint, pan, zoomTo, fit } =
    useDmScreenView();

  const canvas = useTemplateRef<HTMLElement>('canvas');

  const {
    left: canvasLeft,
    top: canvasTop,
    width: canvasWidth,
    height: canvasHeight,
  } = useElementBounding(canvas);

  // Без холста (телефон, страница закрыта) ширма считает место по окну
  // браузера
  watchEffect(() => {
    if (isWindowed.value && canvasWidth.value > 0 && canvasHeight.value > 0) {
      setCanvas({
        x: canvasLeft.value,
        y: canvasTop.value,
        width: canvasWidth.value,
        height: canvasHeight.value,
      });
    } else {
      setCanvas();
    }
  });

  onBeforeUnmount(() => {
    setCanvas();
  });

  const hasVisibleWindows = computed(() => visibleWindows.value.length > 0);

  // Окна могли остаться вдали от сохранённого обзора (ширму аккаунта
  // собрали на другом устройстве): тогда холст сразу показывает их все
  whenever(
    () => isWindowed.value && canvasWidth.value > 0 && hasVisibleWindows.value,
    () => {
      const isAnyVisible = visibleWindows.value.some((screenWindow) =>
        isDmScreenRectVisible(screenWindow, board.value),
      );

      if (!isAnyVisible) {
        fit(visibleWindows.value);
      }
    },
    { once: true },
  );

  const fieldOffset = computed(() => getDmScreenFieldOffset(view.value));

  // Слой поля: окна стоят в нём по координатам поля, а сдвиг и масштаб
  // задаёт обзор
  const fieldStyle = computed(() => ({
    transform: `translate(${fieldOffset.value.x}px, ${fieldOffset.value.y}px) scale(${view.value.zoom})`,
  }));

  // Точки на пустом месте едут вместе с полем: видно, что оно двигается
  const backdropStyle = computed(() => {
    const step = getDmScreenBackdropStep(view.value.zoom);

    return {
      backgroundImage: DM_SCREEN_BACKDROP.image,
      backgroundSize: `${step}px ${step}px`,
      backgroundPosition: `${fieldOffset.value.x}px ${fieldOffset.value.y}px`,
    };
  });

  const surface = useTemplateRef<HTMLElement>('surface');

  /** Жест, которым сейчас тянут поле. */
  let panGesture: PanGesture | undefined;

  const isPanning = ref(false);

  const canvasClass = computed(() =>
    isPanning.value ? DM_SCREEN_PANNING_CLASS : '',
  );

  /**
   * Поле начинают тянуть: основной кнопкой за пустое место или средней где
   * угодно — когда окна закрывают холст целиком, пустого места нет.
   * @param event - нажатие на холст
   */
  function startPan(event: PointerEvent): void {
    const isSurfaceDrag =
      event.button === DM_SCREEN_POINTER_BUTTON.main
      && event.target === surface.value;

    const isMiddleDrag = event.button === DM_SCREEN_POINTER_BUTTON.middle;

    if (
      !(isSurfaceDrag || isMiddleDrag)
      || !(event.currentTarget instanceof HTMLElement)
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    panGesture = {
      pointer: { x: event.clientX, y: event.clientY },
      view: view.value,
    };

    isPanning.value = true;
  }

  /**
   * Поле тянут: оно едет за указателем.
   * @param event - движение указателя
   */
  function movePan(event: PointerEvent): void {
    if (!panGesture) {
      return;
    }

    pan(panGesture.view, {
      x: event.clientX - panGesture.pointer.x,
      y: event.clientY - panGesture.pointer.y,
    });
  }

  /** Поле отпустили. */
  function endPan(): void {
    panGesture = undefined;
    isPanning.value = false;
  }

  /**
   * Колёсико меняет масштаб вокруг указателя: над пустым местом — сразу,
   * над окном — только с Ctrl, иначе оно листает запись в окне. Щипок на
   * тачпаде браузер присылает тем же колёсиком с Ctrl.
   * @param event - прокрутка колёсика
   */
  function zoomByWheel(event: WheelEvent): void {
    if (!event.ctrlKey && event.target !== surface.value) {
      return;
    }

    event.preventDefault();

    const distance =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * DM_SCREEN_ZOOM.wheelLineHeight
        : event.deltaY;

    zoomTo(
      view.value.zoom * Math.exp(-distance * DM_SCREEN_ZOOM.wheelRate),
      toCanvasPoint({ x: event.clientX, y: event.clientY }),
    );
  }

  // Не через шаблон: страницу прокрутка двигать не должна, а отменить её
  // можно только в непассивном обработчике
  useEventListener(canvas, 'wheel', zoomByWheel, { passive: false });

  const rootClass = computed(() =>
    isWindowed.value
      ? DM_SCREEN_CANVAS_CLASS.windowed
      : DM_SCREEN_CANVAS_CLASS.list,
  );

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
    addNote(toBoardPoint({ x: event.clientX, y: event.clientY }));
  }

  const isEmpty = computed(() => !windows.value.length);

  // Кнопки раскладки видны, пока на ширме есть записи, в том числе когда
  // все окна свёрнуты: «Выровнять» их и развернёт
  const isLayoutControlsVisible = computed(
    () => isWindowed.value && !isEmpty.value,
  );

  // Когда свёрнуты все окна, сворачивать нечего: кнопка разворачивает их
  const minimizeToggle = computed(() =>
    visibleWindows.value.length
      ? {
          text: DM_SCREEN_TEXT.minimizeAll,
          icon: DM_SCREEN_ICON.minimizeAll,
          run: minimizeAll,
        }
      : {
          text: DM_SCREEN_TEXT.restoreAll,
          icon: DM_SCREEN_ICON.restoreAll,
          run: restoreAll,
        },
  );

  /** Настройки панели раскладок: где её показывать или скрыть. */
  const snapPickerItems = computed<Array<DropdownMenuItem>>(() => [
    { type: 'label', label: DM_SCREEN_TEXT.snapPickerSettings },
    ...DM_SCREEN_SNAP_PICKER_POSITIONS.map(
      ({ value, label, icon }): DropdownMenuItem => ({
        label,
        icon,
        type: 'checkbox',
        checked: pickerPosition.value === value,
        onSelect: () => setPickerPosition(value),
      }),
    ),
  ]);
</script>

<template>
  <div
    class="flex flex-col"
    :class="rootClass"
  >
    <!-- Шапка выше холста по слою: список поиска ложится поверх окон -->
    <header
      class="relative z-10 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-default p-4"
    >
      <slot name="heading">
        <h1 class="text-2xl text-highlighted">
          {{ DM_SCREEN_TITLE }}
        </h1>
      </slot>

      <!-- Поиск и кнопки прижаты к правому краю, поиск — первым -->
      <div
        class="ml-auto flex flex-auto flex-wrap items-center justify-end gap-2"
      >
        <DmScreenSearch />

        <UButton
          :icon="DM_SCREEN_ICON.note"
          :label="DM_SCREEN_TEXT.addNote"
          color="neutral"
          variant="outline"
          @click.left.exact.prevent="createNote"
        />

        <DmScreenArrangePicker v-if="isLayoutControlsVisible" />

        <UTooltip
          v-if="isLayoutControlsVisible"
          :text="minimizeToggle.text"
        >
          <UButton
            :icon="minimizeToggle.icon"
            :aria-label="minimizeToggle.text"
            color="neutral"
            variant="outline"
            @click.left.exact.prevent="minimizeToggle.run"
          />
        </UTooltip>

        <UDropdownMenu
          v-if="isWindowed"
          :items="snapPickerItems"
        >
          <UButton
            :icon="DM_SCREEN_ICON.snapPickerSettings"
            :aria-label="DM_SCREEN_TEXT.snapPickerSettings"
            color="neutral"
            variant="outline"
          />
        </UDropdownMenu>

        <UButton
          v-if="!isEmpty"
          :icon="DM_SCREEN_ICON.delete"
          :label="DM_SCREEN_TEXT.clear"
          color="error"
          variant="outline"
          @click.left.exact.prevent="openClear"
        />

        <slot name="actions" />
      </div>
    </header>

    <div
      v-if="isWindowed"
      ref="canvas"
      class="relative min-h-0 flex-auto overflow-hidden"
      :class="canvasClass"
      @pointerdown="startPan"
      @pointermove="movePan"
      @pointerup="endPan"
      @pointercancel="endPan"
    >
      <!-- Пустое место поля: за него поле тянут -->
      <div
        ref="surface"
        aria-hidden="true"
        :style="backdropStyle"
        class="absolute inset-0 cursor-grab touch-none"
      />

      <div
        v-if="isEmpty"
        class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto p-4"
      >
        <div
          class="pointer-events-auto flex max-w-lg flex-col items-center gap-4"
        >
          <UEmpty
            :icon="DM_SCREEN_ICON.screen"
            :title="DM_SCREEN_TEXT.emptyTitle"
            :description="DM_SCREEN_TEXT.emptyDescription"
          />

          <slot name="emptyNote" />
        </div>
      </div>

      <!--
        Слой поля. Свой слой: номера слоёв окон не спорят с остальной
        страницей. Сам слой места не занимает, поэтому не закрывает пустое
        место поля от указателя
      -->
      <div
        :style="fieldStyle"
        class="absolute top-0 left-0 isolate origin-top-left"
      >
        <DmScreenWindow
          v-for="screenWindow in visibleWindows"
          :key="screenWindow.id"
          :screen-window="screenWindow"
        />
      </div>

      <!-- Общие границы — в координатах поля, но поверх всех окон -->
      <div
        :style="fieldStyle"
        class="absolute top-0 left-0 origin-top-left"
      >
        <DmScreenDividers />
      </div>

      <DmScreenSnap />

      <DmScreenDock />

      <DmScreenNavigator />
    </div>

    <div
      v-else-if="isEmpty"
      class="m-auto flex max-w-lg flex-col items-center gap-4 p-4"
    >
      <UEmpty
        :icon="DM_SCREEN_ICON.screen"
        :title="DM_SCREEN_TEXT.emptyTitle"
        :description="DM_SCREEN_TEXT.emptyDescription"
      />

      <slot name="emptyNote" />
    </div>

    <DmScreenList
      v-else
      class="p-4"
    />

    <DmScreenClearModal
      v-model:open="isClearOpen"
      @confirm="clear"
    />
  </div>
</template>
