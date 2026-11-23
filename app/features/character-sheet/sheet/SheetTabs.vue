<script setup lang="ts">
  import type { SheetTab } from '../model';

  import {
    SHEET_DEFAULT_TAB,
    SHEET_MAIN_TAB,
    SHEET_TABS,
    SHEET_TABS_SCROLL,
    SHEET_TABS_SCROLL_LABELS,
    SHEET_TABS_SWIPE,
  } from '../model';

  /**
   * Вкладки листа, как на new.ttg.club: лента без значков и без полосы
   * прокрутки, у краёв — стрелки, пока ряд не помещается; активная вкладка
   * подтягивается в видимую часть. На узком листе первой стоит «Основное» со
   * сводкой, а свайп по содержимому листает разделы. На широком содержимое
   * прокручивается внутри, когда высоту блока ограничивает лист.
   */
  const { hasMainTab = false } = defineProps<{
    /** Узкий лист: первой идёт вкладка «Основное» (слот `#main`). */
    hasMainTab?: boolean;
  }>();

  const activeTab = defineModel<SheetTab>({ required: true });

  defineSlots<Record<SheetTab, () => unknown>>();

  /** Смена раздела: пользователем — с анимацией, раскладкой — мгновенно. */
  type TabTransition = 'tab-forward' | 'tab-backward' | 'tab-none';

  /** Ось жеста: пока `none` — решаем, чей он; вертикальный отдаём странице. */
  type GestureAxis = 'none' | 'horizontal' | 'vertical';

  const tabs = computed<ReadonlyArray<{ value: SheetTab; label: string }>>(
    () => (hasMainTab ? [SHEET_MAIN_TAB, ...SHEET_TABS] : SHEET_TABS),
  );

  const tabItems = computed(() =>
    tabs.value.map((tab) => ({ value: tab.value, label: tab.label })),
  );

  /** Пользователь сам выбрал раздел — раскладка больше его не переключает. */
  const hasUserChoice = ref(false);

  const tabTransition = ref<TabTransition>('tab-none');

  const stripRef = useTemplateRef<HTMLElement>('strip');
  const contentRef = useTemplateRef<HTMLElement>('content');

  const scrollLeft = ref(0);
  const scrollMax = ref(0);

  function updateStripScroll(): void {
    const strip = stripRef.value;

    if (!strip) {
      return;
    }

    scrollLeft.value = strip.scrollLeft;
    scrollMax.value = strip.scrollWidth - strip.clientWidth;
  }

  // Прокрутка оставляет доли пикселя: сравнение с запасом, иначе стрелка
  // висела бы у самого края
  const canScrollLeft = computed(
    () => scrollLeft.value > SHEET_TABS_SCROLL.epsilon,
  );

  const canScrollRight = computed(
    () => scrollLeft.value < scrollMax.value - SHEET_TABS_SCROLL.epsilon,
  );

  useEventListener(stripRef, 'scroll', updateStripScroll, { passive: true });
  useResizeObserver(stripRef, updateStripScroll);

  /**
   * Прокручивает ленту на долю её ширины.
   * @param direction - -1 влево, 1 вправо
   */
  function scrollStrip(direction: -1 | 1): void {
    const strip = stripRef.value;

    strip?.scrollBy({
      left: direction * strip.clientWidth * SHEET_TABS_SCROLL.stepRatio,
      behavior: 'smooth',
    });
  }

  function scrollStripLeft(): void {
    scrollStrip(-1);
  }

  function scrollStripRight(): void {
    scrollStrip(1);
  }

  /**
   * Подтягивает активную вкладку в видимую часть ленты.
   * @param behavior - плавно (выбор пользователя) или разом (смена раскладки)
   */
  async function scrollActiveTabIntoView(
    behavior: 'auto' | 'smooth',
  ): Promise<void> {
    await nextTick();

    stripRef.value
      ?.querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
  }

  // «Основное» появляется и пропадает вместе с раскладкой. Пока раздел не
  // выбран вручную, узкий лист открывается на сводке; на широком сводка стоит
  // слева, и вкладка с ней пропадает. Подмена раскладкой — без анимации
  watch(
    () => hasMainTab,
    (isNarrow) => {
      tabTransition.value = 'tab-none';

      if (!isNarrow && activeTab.value === SHEET_MAIN_TAB.value) {
        activeTab.value = SHEET_DEFAULT_TAB;
      }

      if (isNarrow && !hasUserChoice.value) {
        activeTab.value = SHEET_MAIN_TAB.value;
      }

      scrollActiveTabIntoView('auto');
    },
    { immediate: true },
  );

  onMounted(updateStripScroll);

  /**
   * Переключение раздела самим пользователем — вкладкой или свайпом: уходящий
   * раздел уезжает в сторону направления, приходящий проявляется на месте.
   * @param value - раздел
   */
  function selectTab(value: SheetTab): void {
    const currentIndex = tabs.value.findIndex(
      (tab) => tab.value === activeTab.value,
    );

    const nextIndex = tabs.value.findIndex((tab) => tab.value === value);

    if (nextIndex < 0 || nextIndex === currentIndex) {
      return;
    }

    tabTransition.value =
      nextIndex > currentIndex ? 'tab-forward' : 'tab-backward';

    hasUserChoice.value = true;
    activeTab.value = value;

    scrollActiveTabIntoView('smooth');
  }

  /**
   * Выбор раздела кликом по ленте.
   * @param value - значение вкладки из `UTabs`
   */
  function onTabChange(value: string | number): void {
    const tab = tabs.value.find((item) => item.value === value);

    if (tab) {
      selectTab(tab.value);
    }
  }

  /**
   * Соседний раздел; за краем ленты — ничего: зацикливание сбивает ощущение
   * места в списке разделов.
   * @param step - -1 предыдущий, 1 следующий
   */
  function getAdjacentTab(step: -1 | 1): SheetTab | undefined {
    const currentIndex = tabs.value.findIndex(
      (tab) => tab.value === activeTab.value,
    );

    return tabs.value[currentIndex + step]?.value;
  }

  /*
   * Свайп по содержимому листает разделы: на телефоне это привычнее, чем
   * целиться в узкую ленту. Жест ведём сами, а не через `useSwipe`: тому нужен
   * пассивный слушатель (страницу под пальцем не удержать) либо
   * `passive: false` с первого касания, который глушит прокрутку. Здесь ось
   * выбирается на первых пикселях, и только горизонтальный жест забирает
   * событие себе.
   */
  let gestureAxis: GestureAxis = 'none';
  let gestureStartX = 0;
  let gestureStartY = 0;

  /** Жест начался на элементе, который обрабатывает его сам. */
  let isSwipeIgnored = false;

  /** Сдвиг раздела под пальцем, px, и прозрачность на этом сдвиге. */
  const dragOffset = ref(0);
  const dragOpacity = ref(1);

  /** Палец отпущен: сдвиг доигрывает переходом, а не следует за пальцем. */
  const isDragSettling = ref(false);

  // Позицию и затухание отдаём в CSS переменными: классы перехода Vue
  // перебивают обе величины, и уход в сторону доигрывает с той точки, где
  // палец отпустили
  const paneStyle = computed(() => ({
    '--tab-drag-x': `${dragOffset.value}px`,
    '--tab-drag-opacity': `${dragOpacity.value}`,
  }));

  const paneClass = computed(() =>
    isDragSettling.value ? 'tab-pane tab-pane--settling' : 'tab-pane',
  );

  // На широком листе содержимое прокручивается внутри; `pr-2` отодвигает
  // управление у правого края от полосы прокрутки
  const contentClass = computed(() =>
    hasMainTab ? 'pt-2' : 'min-h-0 grow overflow-y-auto pt-2 pr-2',
  );

  /**
   * Обрабатывает ли жест сам элемент под пальцем: поля ввода, редактор и
   * блоки с горизонтальной прокруткой (широкая таблица) — по ним свайп
   * разделы не листает.
   * @param target - элемент, на котором начался жест
   */
  function isGestureOwnedByContent(target: EventTarget | null): boolean {
    let element = target instanceof Element ? target : null;

    while (element && element !== contentRef.value) {
      if (element.matches('input, textarea, select, [contenteditable]')) {
        return true;
      }

      const { overflowX } = window.getComputedStyle(element);

      const canScrollX =
        overflowX === 'auto'
        || overflowX === 'scroll'
        || overflowX === 'overlay';

      if (
        canScrollX
        && element.scrollWidth
          > element.clientWidth + SHEET_TABS_SWIPE.overflowEpsilon
      ) {
        return true;
      }

      element = element.parentElement;
    }

    return false;
  }

  /**
   * Ведёт раздел за пальцем: он отъезжает в сторону жеста и гаснет. У края
   * ленты, где листать некуда, сдвиг гасится сопротивлением и без затухания.
   * @param deltaX - путь пальца по горизонтали; меньше нуля — влево
   */
  function updateDragOffset(deltaX: number): void {
    const width = contentRef.value?.clientWidth ?? 0;

    // Дальше своей ширины раздел не уезжает: иначе уход в сторону доигрывал
    // бы назад, к пальцу
    const distance = Math.min(
      Math.abs(deltaX) - SHEET_TABS_SWIPE.deadzone,
      width,
    );

    if (width <= 0 || distance <= 0) {
      dragOffset.value = 0;
      dragOpacity.value = 1;

      return;
    }

    const step = deltaX < 0 ? 1 : -1;
    const hasTarget = getAdjacentTab(step) !== undefined;

    dragOffset.value =
      -step * distance * (hasTarget ? 1 : SHEET_TABS_SWIPE.resistance);

    const progress = Math.min(
      1,
      distance / (width * SHEET_TABS_SWIPE.fadeSpan),
    );

    dragOpacity.value = hasTarget ? 1 - progress * SHEET_TABS_SWIPE.maxFade : 1;
  }

  /** Жест закончен: сдвинутый раздел возвращается с переходом. */
  function settleDrag(): void {
    if (dragOffset.value === 0) {
      return;
    }

    isDragSettling.value = true;
    dragOffset.value = 0;
    dragOpacity.value = 1;
  }

  /**
   * Начало касания: точка отсчёта и решение, наш ли жест. Мультитач —
   * масштабирование, его не перехватываем.
   * @param event - касание
   */
  function onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];

    isSwipeIgnored =
      !touch
      || event.touches.length > 1
      || isGestureOwnedByContent(event.target);

    gestureAxis = 'none';
    isDragSettling.value = false;

    if (!touch) {
      return;
    }

    gestureStartX = touch.clientX;
    gestureStartY = touch.clientY;
  }

  /**
   * Движение пальца: выбирает ось и ведёт раздел, если ось горизонтальная.
   * @param event - касание
   */
  function onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];

    if (isSwipeIgnored || !touch) {
      return;
    }

    const deltaX = touch.clientX - gestureStartX;
    const deltaY = touch.clientY - gestureStartY;

    if (gestureAxis === 'none') {
      if (
        Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SHEET_TABS_SWIPE.axisLock
      ) {
        return;
      }

      gestureAxis =
        Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (gestureAxis === 'vertical') {
      return;
    }

    // Жест наш: страница под пальцем стоит, иначе её тянет вертикальным
    // дрейфом пальца
    if (event.cancelable) {
      event.preventDefault();
    }

    updateDragOffset(deltaX);
  }

  /**
   * Палец отпущен: дотянувший до порога жест переключает раздел; палец влево —
   * следующий.
   * @param event - касание
   */
  function onTouchEnd(event: TouchEvent): void {
    const wasHorizontal = gestureAxis === 'horizontal' && !isSwipeIgnored;

    gestureAxis = 'none';
    settleDrag();

    const touch = event.changedTouches[0];

    if (!wasHorizontal || !touch) {
      return;
    }

    const deltaX = touch.clientX - gestureStartX;

    if (Math.abs(deltaX) < SHEET_TABS_SWIPE.threshold) {
      return;
    }

    const next = getAdjacentTab(deltaX < 0 ? 1 : -1);

    if (next) {
      selectTab(next);
    }
  }

  /** Жест прерван системой — раздел просто возвращается. */
  function onTouchCancel(): void {
    gestureAxis = 'none';
    settleDrag();
  }

  // touchmove слушаем активно: только так работает `preventDefault`
  useEventListener(contentRef, 'touchstart', onTouchStart, { passive: true });
  useEventListener(contentRef, 'touchmove', onTouchMove, { passive: false });
  useEventListener(contentRef, 'touchend', onTouchEnd, { passive: true });

  useEventListener(contentRef, 'touchcancel', onTouchCancel, {
    passive: true,
  });

  /**
   * Высота уходящего раздела держит блок, пока приходящий не встал: иначе
   * содержимое на кадр схлопывается, и лента вкладок дёргается вверх.
   */
  const paneMinHeight = ref('');

  /**
   * Запоминает высоту уходящего раздела.
   * @param element - корень раздела
   */
  function onPaneBeforeLeave(element: Element): void {
    paneMinHeight.value = `${element.getBoundingClientRect().height}px`;
  }

  function onPaneAfterEnter(): void {
    paneMinHeight.value = '';
  }
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="relative shrink-0">
      <div
        ref="strip"
        class="scrollbar-none overflow-x-auto overscroll-x-contain"
      >
        <!-- key по числу вкладок: полоска активной вкладки пересчитывается
          только при смене значения или размеров, а появление «Основного»
          лишь сдвигает активную вкладку -->
        <UTabs
          :key="tabItems.length"
          :model-value="activeTab"
          :items="tabItems"
          :content="false"
          color="primary"
          variant="link"
          :ui="{ list: 'w-max min-w-full self-start', trigger: 'shrink-0' }"
          @update:model-value="onTabChange"
        />
      </div>

      <UButton
        v-if="canScrollLeft"
        icon="tabler:chevron-left"
        color="neutral"
        variant="soft"
        size="xs"
        square
        class="absolute top-1/2 left-0 z-10 -translate-y-1/2"
        :aria-label="SHEET_TABS_SCROLL_LABELS.left"
        @click.left.exact.prevent="scrollStripLeft"
      />

      <UButton
        v-if="canScrollRight"
        icon="tabler:chevron-right"
        color="neutral"
        variant="soft"
        size="xs"
        square
        class="absolute top-1/2 right-0 z-10 -translate-y-1/2"
        :aria-label="SHEET_TABS_SCROLL_LABELS.right"
        @click.left.exact.prevent="scrollStripRight"
      />
    </div>

    <!-- overflow-x-clip (не hidden): обрезает уезжающий раздел, но не делает
      блок горизонтальным контейнером прокрутки -->
    <div
      ref="content"
      class="tab-content overflow-x-clip"
      :class="contentClass"
      :style="{ minHeight: paneMinHeight }"
    >
      <Transition
        :name="tabTransition"
        mode="out-in"
        @before-leave="onPaneBeforeLeave"
        @after-enter="onPaneAfterEnter"
      >
        <div
          :key="activeTab"
          :class="paneClass"
          :style="paneStyle"
        >
          <slot :name="activeTab" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
  /* Подмена раздела меняет высоту страницы, и браузер «якорит» прокрутку —
     лента вкладок дёргалась бы вверх */
  .tab-content {
    overflow-anchor: none;
  }

  /* Раздел едет за пальцем и гаснет; правила переходов ниже перебивают
     позицию пальца, и уход доигрывает с той точки, где палец отпустили */
  .tab-pane {
    transform: translateX(var(--tab-drag-x, 0));
    opacity: var(--tab-drag-opacity, 1);
  }

  .tab-pane--settling {
    transition:
      transform 0.2s ease-out,
      opacity 0.2s ease-out;
  }

  /* Уходит только текущий раздел; следующий проявляется уже на месте.
     У `tab-none` правил нет намеренно: смена раскладки — без анимации */
  .tab-forward-leave-active,
  .tab-backward-leave-active {
    transition:
      transform 0.18s ease-in,
      opacity 0.18s ease-in;
  }

  .tab-forward-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  .tab-backward-leave-to {
    transform: translateX(100%);
    opacity: 0;
  }

  .tab-forward-enter-active,
  .tab-backward-enter-active {
    transition: opacity 0.15s ease-out;
  }

  .tab-forward-enter-from,
  .tab-backward-enter-from {
    opacity: 0;
  }
</style>
