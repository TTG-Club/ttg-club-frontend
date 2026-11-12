<script setup lang="ts">
  import type { Position } from '@vueuse/core';

  import type {
    DmScreenPoint,
    DmScreenRect,
    DmScreenResizeEdge,
    DmScreenWindow,
  } from '../model';

  import { provideContentLinkHandler } from '~content/composables';
  import { EXTERNAL_LINK_TARGET } from '~content/model';
  import {
    provideSectionEntryCompact,
    provideSectionOpener,
  } from '~section/composables';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ICON,
    DM_SCREEN_RESIZE_EDGES,
    DM_SCREEN_TEXT,
    DM_SCREEN_WINDOW_MIN_SIZE,
    getDmScreenEntryRoot,
    getDmScreenWindowIcon,
    isDmScreenNotePath,
    isDmScreenPath,
    keepDmScreenWindowReachable,
    resizeDmScreenWindow,
    snapDmScreenResize,
    snapDmScreenWindow,
  } from '../model';
  import DmScreenEntry from './DmScreenEntry.vue';
  import DmScreenNote from './DmScreenNote.vue';

  /**
   * Окно записи на ширме, не блокирующее страницу. Тянется за шапку и
   * примагничивается к краям холста и других окон (Alt — без магнита),
   * растягивается за любую сторону и любой угол (видимого уголка нет) и
   * тоже примагничивается,
   * сворачивается в плашку (кнопкой или
   * двойным кликом по шапке) и закрывается. Внутри — карточка записи любого
   * раздела; переходы внутри записи (вкладки класса, подрасы) остаются в
   * окне, ссылки на другие записи открывают новые окна, а остальные
   * страницы сайта — новую вкладку: со страницы ширмы клик не уводит.
   */
  const { screenWindow } = defineProps<{
    screenWindow: DmScreenWindow;
  }>();

  const { add, navigate, close, minimize, focus, update, visibleWindows } =
    useDmScreen();

  const root = useTemplateRef<HTMLElement>('root');
  const handle = useTemplateRef<HTMLElement>('handle');

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  const isNote = computed(() => isDmScreenNotePath(screenWindow.path));

  const sectionIcon = computed(() => getDmScreenWindowIcon(screenWindow.path));

  /**
   * Место, с которого окно можно ухватить на текущем экране.
   * @param position - желаемое место
   */
  function reachable(position: Position): Position {
    return keepDmScreenWindowReachable(position, screenWindow, {
      width: viewportWidth.value,
      height: viewportHeight.value,
    });
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

  // Место может поменять не только перетаскивание, но и раскладка по сетке
  watch(
    () => [screenWindow.x, screenWindow.y],
    ([nextX = 0, nextY = 0]) => {
      x.value = nextX;
      y.value = nextY;
    },
  );

  /** Размер окна сейчас: пока окно тянут, он меняется до сохранения. */
  const width = ref(screenWindow.width);
  const height = ref(screenWindow.height);

  // Размер может поменять и раскладка: «Выровнять», «Уменьшить все»
  watch(
    () => [screenWindow.width, screenWindow.height],
    ([nextWidth = width.value, nextHeight = height.value]) => {
      width.value = nextWidth;
      height.value = nextHeight;
    },
  );

  /** Начало растягивания: за что тянут, откуда и каким было окно. */
  interface ResizeStart {
    edge: DmScreenResizeEdge;
    pointer: DmScreenPoint;
    rect: DmScreenRect;
  }

  let resizeStart: ResizeStart | undefined;

  const windowStyle = computed(() => ({
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${width.value}px`,
    height: `${height.value}px`,
    minWidth: `${DM_SCREEN_WINDOW_MIN_SIZE.width}px`,
    minHeight: `${DM_SCREEN_WINDOW_MIN_SIZE.height}px`,
    zIndex: screenWindow.layer,
  }));

  /**
   * Начинает растягивать окно за сторону или угол: указатель захватывается,
   * чтобы движение доходило, даже когда он уходит с узкой полосы.
   * @param edge - сторона или угол
   * @param event - нажатие на полосу
   */
  function startResize(edge: DmScreenResizeEdge, event: PointerEvent): void {
    if (event.currentTarget instanceof Element) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    focus(screenWindow.id);

    resizeStart = {
      edge,
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
   * Растягивает окно вслед за указателем; подвижные края примагничиваются
   * к краям холста и других окон. С зажатым Alt — без магнита.
   * @param event - движение указателя
   */
  function moveResize(event: PointerEvent): void {
    if (!resizeStart) {
      return;
    }

    const resized = resizeDmScreenWindow(resizeStart.rect, resizeStart.edge, {
      x: event.clientX - resizeStart.pointer.x,
      y: event.clientY - resizeStart.pointer.y,
    });

    const next = event.altKey
      ? resized
      : snapDmScreenResize(
          resized,
          resizeStart.edge,
          visibleWindows.value.filter((item) => item.id !== screenWindow.id),
          { width: viewportWidth.value, height: viewportHeight.value },
        );

    x.value = next.x;
    y.value = next.y;
    width.value = next.width;
    height.value = next.height;
  }

  /** Сохраняет итог растягивания: место и размер разом. */
  function endResize(): void {
    if (!resizeStart) {
      return;
    }

    resizeStart = undefined;

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

    return undefined;
  }

  /**
   * Примагничивает окно, пока его тащат: к краям холста и других окон. С
   * зажатым Alt окно двигается свободно.
   * @param position - куда окно притащили
   * @param event - движение указателя
   */
  function snapPosition(position: Position, event: PointerEvent): void {
    if (event.altKey || !root.value) {
      return;
    }

    const others = visibleWindows.value.filter(
      (item) => item.id !== screenWindow.id,
    );

    // Размер — с самого окна: после растягивания сохранённый мог отстать
    const snapped = snapDmScreenWindow(
      {
        ...position,
        width: root.value.offsetWidth,
        height: root.value.offsetHeight,
      },
      others,
      { width: viewportWidth.value, height: viewportHeight.value },
    );

    x.value = snapped.x;
    y.value = snapped.y;
  }

  /**
   * Сохраняет место окна после перетаскивания; шапку, утащенную за край,
   * возвращает на экран.
   * @param position - новое место
   */
  function savePosition(position: Position): void {
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
        :screen-window="screenWindow"
      />

      <DmScreenEntry
        v-else
        :key="screenWindow.path"
        :path="screenWindow.path"
        @loaded="syncTitle"
      />
    </div>

    <!-- Невидимые полосы по краям: растягивание за любую сторону и угол -->
    <div
      v-for="item in DM_SCREEN_RESIZE_EDGES"
      :key="item.edge"
      :class="item.class"
      class="absolute touch-none"
      @pointerdown.left="startResize(item.edge, $event)"
      @pointermove="moveResize"
      @pointerup="endResize"
      @pointercancel="endResize"
    />
  </section>
</template>
