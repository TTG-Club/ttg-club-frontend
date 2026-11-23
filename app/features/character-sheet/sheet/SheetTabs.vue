<script setup lang="ts">
  import type { SheetTab } from '../model';

  import {
    SHEET_TABS,
    SHEET_TABS_SCROLL,
    SHEET_TABS_SCROLL_LABELS,
  } from '../model';

  /**
   * Вкладки листа, как на new.ttg.club: лента без значков и без полосы
   * прокрутки, у краёв — стрелки, пока ряд не помещается; активная вкладка
   * подтягивается в видимую часть. Содержимое прокручивается внутри, когда
   * высоту блока ограничивает лист.
   */
  const activeTab = defineModel<SheetTab>({ required: true });

  defineSlots<Record<SheetTab, () => unknown>>();

  const tabItems = SHEET_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
  }));

  const stripRef = useTemplateRef<HTMLElement>('strip');

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

  onMounted(updateStripScroll);

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

  // Активная вкладка за краем ленты подтягивается в видимую часть
  watch(activeTab, async () => {
    await nextTick();

    stripRef.value
      ?.querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
  });
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="relative shrink-0">
      <div
        ref="strip"
        class="scrollbar-none overflow-x-auto overscroll-x-contain"
      >
        <UTabs
          v-model="activeTab"
          :items="tabItems"
          :content="false"
          color="primary"
          variant="link"
          :ui="{ list: 'w-max min-w-full', trigger: 'shrink-0' }"
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

    <div class="min-h-0 grow overflow-y-auto pt-2">
      <slot :name="activeTab" />
    </div>
  </div>
</template>
