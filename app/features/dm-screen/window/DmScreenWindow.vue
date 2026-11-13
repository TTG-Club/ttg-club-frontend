<script setup lang="ts">
  import type { Position } from '@vueuse/core';

  import type { DmScreenResizeEdges, DmScreenWindow } from '../model';

  import { provideContentLinkHandler } from '~content/composables';
  import { EXTERNAL_LINK_TARGET } from '~content/model';
  import {
    provideSectionEntryCompact,
    provideSectionOpener,
  } from '~section/composables';

  import { useDmScreen, useDmScreenSnap } from '../composables';
  import {
    DM_SCREEN_HIGHLIGHT_CLASS,
    DM_SCREEN_ICON,
    DM_SCREEN_RESIZE_HANDLES,
    DM_SCREEN_TEXT,
    DM_SCREEN_WINDOW_MIN_SIZE,
    getDmScreenEntryRoot,
    getDmScreenNoteToggle,
    getDmScreenWindowIcon,
    isDmScreenNotePath,
    isDmScreenPath,
    keepDmScreenWindowReachable,
    resizeDmScreenWindow,
    snapDmScreenWindow,
  } from '../model';
  import DmScreenEntry from './DmScreenEntry.vue';
  import DmScreenNote from './DmScreenNote.vue';

  /**
   * Окно записи на ширме, не блокирующее страницу. Тянется за шапку и
   * примагничивается к краям холста и других окон (Alt — без магнита),
   * растягивается за любую сторону или угол — тоже с магнитом, в том числе
   * до ширины или высоты соседнего окна, — сворачивается в плашку (кнопкой
   * или двойным кликом по шапке) и закрывается. Под шапку ширмы окно не
   * заходит. Если окно отпустить у бокового края холста или над местом в
   * панели раскладок, оно занимает это место целиком. Внутри — карточка записи любого
   * раздела; переходы внутри записи (вкладки класса, подрасы) остаются в
   * окне, ссылки на другие записи открывают новые окна, а остальные
   * страницы сайта — новую вкладку: со страницы ширмы клик не уводит.
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
    viewport,
    highlightedId,
  } = useDmScreen();

  const root = useTemplateRef<HTMLElement>('root');
  const handle = useTemplateRef<HTMLElement>('handle');

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
  } = useDmScreenSnap();

  const sectionIcon = computed(() => getDmScreenWindowIcon(screenWindow.path));

  /**
   * Место, с которого окно можно ухватить на текущем экране.
   * @param position - желаемое место
   */
  function reachable(position: Position): Position {
    return keepDmScreenWindowReachable(position, screenWindow, viewport.value);
  }

  // Сохранённое место могло остаться за краем меньшего экрана
  const { x, y } = useDraggable(root, {
    handle,
    initialValue: reachable(screenWindow),
    preventDefault: true,
    onStart: startDrag,
    onMove: snapPosition,
    onEnd: savePosition,
  });

  // Размер, пока окно растягивают: сохраняется итог, а не каждый шаг
  const width = ref(screenWindow.width);
  const height = ref(screenWindow.height);

  // Место и размер может поменять не только указатель, но и раскладка по
  // сетке и «Уменьшить все»
  watch(
    () => [
      screenWindow.x,
      screenWindow.y,
      screenWindow.width,
      screenWindow.height,
    ],
    ([nextX = 0, nextY = 0, nextWidth = 0, nextHeight = 0]) => {
      x.value = nextX;
      y.value = nextY;
      width.value = nextWidth;
      height.value = nextHeight;
    },
  );

  // Шапка ширмы стала выше (кнопки перенеслись): окно выходит из-под неё
  watch(
    () => viewport.value.top,
    () => {
      const next = reachable({ x: x.value, y: y.value });

      x.value = next.x;
      y.value = next.y;
    },
  );

  const windowStyle = computed(() => ({
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${width.value}px`,
    height: `${height.value}px`,
    minWidth: `${DM_SCREEN_WINDOW_MIN_SIZE.width}px`,
    minHeight: `${DM_SCREEN_WINDOW_MIN_SIZE.height}px`,
    zIndex: screenWindow.layer,
  }));

  /** Остальные развёрнутые окна: к ним окно примагничивается. */
  function getOthers(): Array<DmScreenWindow> {
    return visibleWindows.value.filter((other) => other.id !== screenWindow.id);
  }

  /** Растягивание, которое идёт сейчас: с чего оно началось. */
  let resizing:
    | {
        edges: DmScreenResizeEdges;
        pointer: Position;
        rect: Position & { width: number; height: number };
      }
    | undefined;

  /**
   * Начало растягивания за сторону или угол: указатель закрепляется за
   * ручкой, чтобы она не терялась, когда он уходит с неё.
   * @param edges - за какие стороны тянут
   * @param event - нажатие на ручку
   */
  function startResize(edges: DmScreenResizeEdges, event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    resizing = {
      edges,
      pointer: { x: event.clientX, y: event.clientY },
      rect: {
        x: x.value,
        y: y.value,
        width: width.value,
        height: height.value,
      },
    };
  }

  /**
   * Меняет размер окна вслед за указателем, примагничивая сторону, которую
   * тянут. С зажатым Alt окно растягивается свободно.
   * @param event - движение указателя
   */
  function moveResize(event: PointerEvent): void {
    if (!resizing) {
      return;
    }

    const next = resizeDmScreenWindow(
      resizing.rect,
      resizing.edges,
      {
        x: event.clientX - resizing.pointer.x,
        y: event.clientY - resizing.pointer.y,
      },
      viewport.value,
      event.altKey ? undefined : getOthers(),
    );

    x.value = next.x;
    y.value = next.y;
    width.value = next.width;
    height.value = next.height;
  }

  /** Конец растягивания: место и размер окна сохраняются. */
  function endResize(): void {
    if (!resizing) {
      return;
    }

    resizing = undefined;

    update(screenWindow.id, {
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value,
    });
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
    // В редакторе заметки по ссылке ставят курсор, а не переходят
    if (
      event.target instanceof Element
      && event.target.closest('[contenteditable="true"], textarea')
    ) {
      return;
    }

    const link =
      event.target instanceof Element ? event.target.closest('a[href]') : null;

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
        origin: { x: event.clientX, y: event.clientY },
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

  /**
   * Начало перетаскивания: окно встаёт сверху. С кнопок шапки окно не
   * тянется, иначе они не нажимались бы.
   * @param _position - точка начала
   * @param event - нажатие
   */
  function startDrag(
    _position: Position,
    event: PointerEvent,
  ): false | undefined {
    if (event.target instanceof Element && event.target.closest('button')) {
      return false;
    }

    focus(screenWindow.id);
    startSnapDrag(screenWindow.id);

    return undefined;
  }

  /**
   * Примагничивает окно, пока его тащат: к краям холста и других окон. С
   * зажатым Alt окно двигается свободно, но под шапку ширмы не заходит и
   * тогда.
   * @param position - куда окно притащили
   * @param event - движение указателя
   */
  function snapPosition(position: Position, event: PointerEvent): void {
    const snapped = event.altKey
      ? position
      : snapDmScreenWindow(
          { ...position, width: width.value, height: height.value },
          getOthers(),
          viewport.value,
        );

    x.value = snapped.x;
    y.value = Math.max(snapped.y, viewport.value.top ?? 0);

    moveSnapDrag({ x: event.clientX, y: event.clientY });
  }

  /**
   * Сохраняет место окна после перетаскивания; шапку, утащенную за край,
   * возвращает на экран.
   * @param position - новое место
   */
  function savePosition(position: Position): void {
    // Окно отпустили над местом раскладки: оно занимает это место целиком
    const zoneRect = endSnapDrag();

    if (zoneRect) {
      x.value = zoneRect.x;
      y.value = zoneRect.y;
      width.value = zoneRect.width;
      height.value = zoneRect.height;

      update(screenWindow.id, zoneRect);

      return;
    }

    const next = reachable(position);

    x.value = next.x;
    y.value = next.y;

    update(screenWindow.id, next);
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
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }

    minimizeWindow();
  }
</script>

<template>
  <section
    ref="root"
    role="dialog"
    aria-modal="false"
    :aria-label="screenWindow.title"
    :style="windowStyle"
    class="pointer-events-auto absolute flex flex-col overflow-hidden rounded-lg border border-default bg-default shadow-xl"
    :class="highlightClass"
    @pointerdown.capture="focusWindow"
  >
    <header
      ref="handle"
      class="flex shrink-0 cursor-move items-center gap-2 border-b border-default bg-elevated py-1 pr-1 pl-3 select-none"
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
      @pointermove="moveResize"
      @pointerup="endResize"
      @pointercancel="endResize"
    />
  </section>
</template>
