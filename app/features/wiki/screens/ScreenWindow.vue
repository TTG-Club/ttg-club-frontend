<script setup lang="ts">
  import type { Position } from '@vueuse/core';

  import type { ScreenWindowState } from '../model';

  import { provideSectionOpener } from '~section/composables';

  import { useScreenWindows } from '../composables';
  import {
    keepScreenWindowReachable,
    SCREEN_WINDOW_ICON,
    SCREEN_WINDOW_MIN_SIZE,
    SCREEN_WINDOW_RESIZE_SAVE_DELAY,
    SCREEN_WINDOW_TEXT,
    SCREENS_SECTION,
  } from '../model';
  import ScreenEntry from './ScreenEntry.vue';
  import ScreenIcon from './ScreenIcon.vue';

  /**
   * Окно раздела ширмы поверх сайта, не блокирующее страницу. Тянется за
   * шапку, растягивается за правый нижний угол, сворачивается в плашку и
   * закрывается. Место и размер сохраняются, когда их меняют.
   */
  const { screenWindow } = defineProps<{
    screenWindow: ScreenWindowState;
  }>();

  const { open, close, minimize, focus, update } = useScreenWindows();

  const root = useTemplateRef<HTMLElement>('root');
  const handle = useTemplateRef<HTMLElement>('handle');

  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  /**
   * Место, с которого окно можно ухватить на текущем экране.
   * @param position - желаемое место
   */
  function reachable(position: Position): Position {
    return keepScreenWindowReachable(position, screenWindow, {
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
    onEnd: savePosition,
  });

  const windowStyle = computed(() => ({
    left: `${x.value}px`,
    top: `${y.value}px`,
    width: `${screenWindow.width}px`,
    height: `${screenWindow.height}px`,
    minWidth: `${SCREEN_WINDOW_MIN_SIZE.width}px`,
    minHeight: `${SCREEN_WINDOW_MIN_SIZE.height}px`,
    zIndex: screenWindow.layer,
  }));

  // Браузер сам меняет размер за уголок; сохраняется итог, а не каждый шаг
  const saveSize = useDebounceFn((width: number, height: number) => {
    if (width !== screenWindow.width || height !== screenWindow.height) {
      update(screenWindow.id, { width, height });
    }
  }, SCREEN_WINDOW_RESIZE_SAVE_DELAY);

  useResizeObserver(root, () => {
    if (root.value) {
      void saveSize(root.value.offsetWidth, root.value.offsetHeight);
    }
  });

  // Карточка раздела закрывает окно, а не колонку страницы под ним
  provideSectionOpener({
    activePath: computed(() => screenWindow.path),
    open: (path: string) => open({ path, title: SCREENS_SECTION.title }),
    close: closeWindow,
  });

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
    class="pointer-events-auto absolute flex resize flex-col overflow-hidden rounded-lg border border-default bg-default shadow-xl"
    @pointerdown.capture="focusWindow"
  >
    <header
      ref="handle"
      class="flex shrink-0 cursor-move items-center gap-2 border-b border-default bg-elevated py-1 pr-1 pl-3 select-none"
      @dblclick.left.exact.prevent="minimizeByHeader"
    >
      <ScreenIcon
        :markup="screenWindow.icon"
        size="sm"
      />

      <span class="min-w-0 flex-auto truncate text-sm text-highlighted">
        {{ screenWindow.title }}
      </span>

      <UTooltip :text="SCREEN_WINDOW_TEXT.minimize">
        <UButton
          :icon="SCREEN_WINDOW_ICON.minimize"
          :aria-label="SCREEN_WINDOW_TEXT.minimize"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="minimizeWindow"
        />
      </UTooltip>

      <UTooltip :text="SCREEN_WINDOW_TEXT.close">
        <UButton
          :icon="SCREEN_WINDOW_ICON.close"
          :aria-label="SCREEN_WINDOW_TEXT.close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.left.exact.prevent="closeWindow"
        />
      </UTooltip>
    </header>

    <div class="min-h-0 flex-auto overflow-y-auto px-4 pb-4">
      <Suspense>
        <ScreenEntry :path="screenWindow.path" />

        <template #fallback>
          <div class="flex flex-col gap-2 pt-4">
            <USkeleton class="h-8 w-2/3" />

            <USkeleton
              v-for="index in 6"
              :key="index"
              class="h-4 w-full"
            />
          </div>
        </template>
      </Suspense>
    </div>
  </section>
</template>
