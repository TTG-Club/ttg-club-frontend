<script setup lang="ts">
  import type {
    DmScreenPoint,
    DmScreenRect,
    DmScreenResizeEdges,
    DmScreenWindow,
  } from '../model';

  import { provideContentLinkHandler } from '~content/composables';
  import { EXTERNAL_LINK_TARGET } from '~content/model';
  import {
    provideSectionEntryCompact,
    provideSectionOpener,
  } from '~section/composables';

  import {
    useDmScreen,
    useDmScreenSnap,
    useDmScreenView,
  } from '../composables';
  import {
    DM_SCREEN_BACKGROUND_CLASS,
    DM_SCREEN_EDITABLE_SELECTOR,
    DM_SCREEN_HIGHLIGHT_CLASS,
    DM_SCREEN_ICON,
    DM_SCREEN_LINK_SELECTOR,
    DM_SCREEN_RESIZE_HANDLES,
    DM_SCREEN_TEXT,
    getDmScreenEntryRoot,
    getDmScreenNoteToggle,
    getDmScreenRectStyle,
    getDmScreenWindowIcon,
    isDmScreenNotePath,
    isDmScreenPath,
    isOutsideDmScreenControl,
    keepDmScreenWindowBelowHeader,
    keepDmScreenWindowOnField,
    resizeDmScreenWindow,
    snapDmScreenWindow,
  } from '../model';
  import DmScreenEntry from './DmScreenEntry.vue';
  import DmScreenNote from './DmScreenNote.vue';

  /** С чего началось перетаскивание или растягивание окна. */
  interface PointerGesture {
    pointer: DmScreenPoint;
    rect: DmScreenRect;
    /** Стороны, за которые тянут; без них окно двигают целиком. */
    edges?: DmScreenResizeEdges;
  }

  /**
   * Окно записи на поле ширмы, не блокирующее страницу. Тянется за шапку и
   * примагничивается к краям холста и других окон (Alt — без магнита),
   * растягивается за любую сторону или угол — тоже с магнитом, в том числе
   * до ширины или высоты соседнего окна, — сворачивается в плашку (кнопкой
   * или двойным кликом по шапке) и закрывается. За край поля и под
   * шапку ширмы окно не уходит. Если окно отпустить у бокового края холста или над местом в
   * панели раскладок, оно занимает это место целиком. Размер соседних окон
   * разом меняет общая граница между ними (`DmScreenDividers`). Внутри —
   * карточка записи любого раздела; переходы внутри записи (вкладки класса,
   * подрасы) остаются в окне, ссылки на другие записи открывают новые окна,
   * а остальные страницы сайта — новую вкладку: со страницы ширмы клик не
   * уводит.
   */
  const { screenWindow } = defineProps<{
    screenWindow: DmScreenWindow;
  }>();

  const {
    add,
    navigate,
    close,
    minimize,
    focus,
    update,
    visibleWindows,
    board,
    toBoardPoint,
    highlightedId,
    previewRects,
  } = useDmScreen();

  const { view } = useDmScreenView();

  // Рамка окна, на которое указали вместо создания нового
  const highlightClass = computed(() =>
    highlightedId.value === screenWindow.id ? DM_SCREEN_HIGHLIGHT_CLASS : '',
  );

  const isNote = computed(() => isDmScreenNotePath(screenWindow.path));

  // Правку заметки переключает кнопка в шапке окна
  const isNoteEditing = ref(false);

  const noteToggleButton = computed(() =>
    getDmScreenNoteToggle(isNoteEditing.value),
  );

  /** Переключает просмотр и правку заметки. */
  function toggleNoteEditing(): void {
    isNoteEditing.value = !isNoteEditing.value;
  }

  const {
    startDrag: startSnapDrag,
    moveDrag: moveSnapDrag,
    endDrag: endSnapDrag,
    isBackground,
  } = useDmScreenSnap();

  // Пока в раскладку подбирают окна, не поставленные в неё уходят на
  // второй план
  const backgroundClass = computed(() =>
    isBackground(screenWindow.id) ? DM_SCREEN_BACKGROUND_CLASS : '',
  );

  const sectionIcon = computed(() => getDmScreenWindowIcon(screenWindow.path));

  /** Жест, который идёт сейчас. */
  let gesture: PointerGesture | undefined;

  /** Где окно стоит, пока его двигают или растягивают. */
  const liveRect = shallowRef<DmScreenRect>();

  // Место окна на поле: под указателем, в предпросмотре общей границы с
  // соседом или сохранённое
  const rect = computed<DmScreenRect>(
    () =>
      liveRect.value ?? previewRects.value.get(screenWindow.id) ?? screenWindow,
  );

  const windowStyle = computed(() => ({
    ...getDmScreenRectStyle(rect.value),
    zIndex: screenWindow.layer,
  }));

  /** Остальные развёрнутые окна: к ним окно примагничивается. */
  function getOthers(): Array<DmScreenWindow> {
    return visibleWindows.value.filter((other) => other.id !== screenWindow.id);
  }

  /**
   * Начало жеста: указатель закрепляется за шапкой или ручкой, чтобы она не
   * терялась, когда он уходит с неё.
   * @param event - нажатие
   * @param edges - стороны, за которые тянут; без них окно двигают
   */
  function startGesture(
    event: PointerEvent,
    edges?: DmScreenResizeEdges,
  ): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    gesture = {
      pointer: { x: event.clientX, y: event.clientY },
      rect: rect.value,
      edges,
    };
  }

  /**
   * Окно берут за шапку. С кнопок шапки оно не тянется: иначе указатель
   * закрепился бы за шапкой и клик до кнопки не дошёл бы.
   * @param event - нажатие на шапку
   */
  function startDrag(event: PointerEvent): void {
    if (!isOutsideDmScreenControl(event.target)) {
      return;
    }

    event.preventDefault();
    startGesture(event);
    startSnapDrag(screenWindow.id);
  }

  /**
   * Окно берут за сторону или угол.
   * @param edges - за какие стороны тянут
   * @param event - нажатие на ручку
   */
  function startResize(edges: DmScreenResizeEdges, event: PointerEvent): void {
    startGesture(event, edges);
  }

  /**
   * Указатель двигается: окно идёт за ним или меняет размер. С зажатым Alt
   * магнита нет, но за край поля окно не уходит и тогда. Указатель идёт по
   * экрану, а окно — по полю: на отдалённом поле тот же путь указателя
   * сдвигает окно дальше.
   * @param event - движение указателя
   */
  function moveGesture(event: PointerEvent): void {
    if (!gesture) {
      return;
    }

    const delta = {
      x: (event.clientX - gesture.pointer.x) / view.value.zoom,
      y: (event.clientY - gesture.pointer.y) / view.value.zoom,
    };

    const others = event.altKey ? undefined : getOthers();

    if (gesture.edges) {
      liveRect.value = keepDmScreenWindowOnField(
        resizeDmScreenWindow(
          gesture.rect,
          gesture.edges,
          delta,
          board.value,
          others,
        ),
      );

      return;
    }

    const moved = {
      ...gesture.rect,
      x: gesture.rect.x + delta.x,
      y: gesture.rect.y + delta.y,
    };

    // Под шапку ширмы окно не заходит и без магнита
    const position = keepDmScreenWindowBelowHeader(
      others ? snapDmScreenWindow(moved, others, board.value) : moved,
      board.value,
    );

    liveRect.value = keepDmScreenWindowOnField({
      ...moved,
      x: Math.round(position.x),
      y: Math.round(position.y),
    });

    moveSnapDrag({ x: event.clientX, y: event.clientY });
  }

  /**
   * Жест закончился: место и размер окна записываются в ширму. Окно,
   * отпущенное над местом раскладки, занимает его целиком.
   */
  function endGesture(): void {
    const finished = gesture;
    const current = liveRect.value;

    gesture = undefined;
    liveRect.value = undefined;

    if (!finished) {
      return;
    }

    const zoneRect = finished.edges ? undefined : endSnapDrag();

    if (zoneRect) {
      update(screenWindow.id, zoneRect);

      return;
    }

    // Нажали и отпустили, не сдвинув: менять в ширме нечего
    if (current) {
      update(screenWindow.id, current);
    }
  }

  // Переходы самой записи (вкладки класса, подрасы) — в этом же окне, а
  // закрытие карточки закрывает окно
  provideSectionOpener({
    activePath: computed(() => screenWindow.path),
    open: (path: string) => navigate(screenWindow.id, path),
    close: closeWindow,
  });

  // Закладка, меню и закрытие записи дублировали бы кнопки окна, а
  // обсуждение во время игры не нужно
  provideSectionEntryCompact();

  // Ссылки из текста на записи ширмы встают новыми окнами рядом с кликом
  provideContentLinkHandler((request) => {
    if (!isDmScreenPath(request.path)) {
      return false;
    }

    add(request);

    return true;
  });

  /**
   * Внутренняя ссылка из окна: та же запись — в этом окне, другая запись —
   * новым окном рядом с кликом, прочие страницы — в новой вкладке.
   * Перехватывается до карточки, поэтому её собственный переход не
   * срабатывает.
   * @param event - клик левой кнопкой без модификаторов
   */
  function handleLinkClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }

    // В редакторе заметки по ссылке ставят курсор, а не переходят
    if (event.target.closest(DM_SCREEN_EDITABLE_SELECTOR)) {
      return;
    }

    const link = event.target.closest(DM_SCREEN_LINK_SELECTOR);

    const href = link?.getAttribute('href');

    // Внешние ссылки и так открываются в новой вкладке
    if (!link || !href?.startsWith('/')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const entryRoot = getDmScreenEntryRoot(href);

    if (entryRoot && entryRoot === getDmScreenEntryRoot(screenWindow.path)) {
      navigate(screenWindow.id, href);

      return;
    }

    if (isDmScreenPath(href)) {
      add({
        path: href,
        title: link.textContent?.trim() || href,
        origin: toBoardPoint({ x: event.clientX, y: event.clientY }),
      });

      return;
    }

    window.open(href, EXTERNAL_LINK_TARGET);
  }

  /**
   * Название загруженной записи в шапке окна.
   * @param title - название записи
   */
  function syncTitle(title: string): void {
    if (title && title !== screenWindow.title) {
      update(screenWindow.id, { title });
    }
  }

  function focusWindow(): void {
    focus(screenWindow.id);
  }

  function minimizeWindow(): void {
    minimize(screenWindow.id);
  }

  function closeWindow(): void {
    close(screenWindow.id);
  }

  /**
   * Двойной клик по шапке сворачивает окно, как в оконных системах.
   * Быстрые клики по кнопкам шапки окно не сворачивают.
   * @param event - двойной клик
   */
  function minimizeByHeader(event: MouseEvent): void {
    if (isOutsideDmScreenControl(event.target)) {
      minimizeWindow();
    }
  }
</script>

<template>
  <section
    role="dialog"
    aria-modal="false"
    :aria-label="screenWindow.title"
    :style="windowStyle"
    class="absolute flex flex-col overflow-hidden rounded-lg border border-default bg-default shadow-xl"
    :class="[highlightClass, backgroundClass]"
    @pointerdown.capture="focusWindow"
  >
    <header
      class="flex shrink-0 cursor-move touch-none items-center gap-2 border-b border-default bg-elevated py-1 pr-1 pl-3 select-none"
      @pointerdown.left="startDrag"
      @pointermove="moveGesture"
      @pointerup="endGesture"
      @pointercancel="endGesture"
      @dblclick.left.exact.prevent="minimizeByHeader"
    >
      <UIcon
        :name="sectionIcon"
        class="size-4 shrink-0 text-primary"
      />

      <span class="min-w-0 flex-auto truncate text-sm text-highlighted">
        {{ screenWindow.title }}
      </span>

      <UTooltip
        v-if="isNote"
        :text="noteToggleButton.label"
      >
        <UButton
          :icon="noteToggleButton.icon"
          :aria-label="noteToggleButton.label"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="toggleNoteEditing"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.minimize">
        <UButton
          :icon="DM_SCREEN_ICON.minimize"
          :aria-label="DM_SCREEN_TEXT.minimize"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="minimizeWindow"
        />
      </UTooltip>

      <UTooltip :text="DM_SCREEN_TEXT.close">
        <UButton
          :icon="DM_SCREEN_ICON.close"
          :aria-label="DM_SCREEN_TEXT.close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="closeWindow"
        />
      </UTooltip>
    </header>

    <div
      class="min-h-0 flex-auto overflow-y-auto px-4 pb-4"
      @click.left.exact.capture="handleLinkClick"
    >
      <DmScreenNote
        v-if="isNote"
        v-model:editing="isNoteEditing"
        :screen-window="screenWindow"
      />

      <DmScreenEntry
        v-else
        :key="screenWindow.path"
        :path="screenWindow.path"
        @loaded="syncTitle"
      />
    </div>

    <!-- Ручки поверх краёв окна: углы после сторон, поэтому выше них -->
    <div
      v-for="resizeHandle in DM_SCREEN_RESIZE_HANDLES"
      :key="resizeHandle.key"
      aria-hidden="true"
      class="absolute touch-none"
      :class="resizeHandle.class"
      @pointerdown.left.prevent="startResize(resizeHandle.edges, $event)"
      @pointermove="moveGesture"
      @pointerup="endGesture"
      @pointercancel="endGesture"
    />
  </section>
</template>
