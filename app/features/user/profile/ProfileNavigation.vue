<script setup lang="ts">
  import {
    PROFILE_ICON,
    PROFILE_NAVIGATION_FADE,
    PROFILE_NAVIGATION_SCROLL_OFFSET,
    PROFILE_SECTIONS,
    PROFILE_TEXT,
  } from '../model';

  /**
   * Переключатель разделов личного кабинета, как на new.ttg.club: на широком
   * экране колонка крупных кнопок, на телефоне лента вкладок в рамке с
   * затуханием по краям и стрелками, пока есть куда листать.
   */
  const { isFull = false } = defineProps<{
    /** Колонка на всю ширину вместо ленты. */
    isFull?: boolean;
  }>();

  const scroller = useTemplateRef<HTMLElement>('scroller');

  const { arrivedState } = useScroll(scroller, {
    offset: { right: PROFILE_NAVIGATION_SCROLL_OFFSET },
  });

  const canScrollLeft = computed(() => !isFull && !arrivedState.left);

  const canScrollRight = computed(() => !isFull && !arrivedState.right);

  const fadeMask = computed(() => {
    if (canScrollLeft.value && canScrollRight.value) {
      return PROFILE_NAVIGATION_FADE.both;
    }

    if (canScrollRight.value) {
      return PROFILE_NAVIGATION_FADE.right;
    }

    return canScrollLeft.value
      ? PROFILE_NAVIGATION_FADE.left
      : PROFILE_NAVIGATION_FADE.none;
  });

  const scrollerStyle = computed(() => ({
    maskImage: fadeMask.value,
    WebkitMaskImage: fadeMask.value,
  }));

  const navigationClass = computed(() =>
    isFull
      ? ''
      : 'relative flex items-center overflow-hidden rounded-xl border border-default bg-elevated',
  );

  const scrollerClass = computed(() =>
    isFull
      ? 'flex flex-col gap-2'
      : 'scrollbar-none flex gap-1 overflow-x-auto p-1.5',
  );

  const tabSize = computed(() => (isFull ? 'lg' : 'md'));

  const tabClass = computed(() => (isFull ? 'w-full shrink-0' : 'shrink-0'));
</script>

<template>
  <nav
    :aria-label="PROFILE_TEXT.navigation"
    :class="navigationClass"
  >
    <UIcon
      v-if="canScrollLeft"
      :name="PROFILE_ICON.scrollLeft"
      class="pointer-events-none absolute top-1/2 left-0.5 z-10 size-5 -translate-y-1/2 animate-pulse text-dimmed"
    />

    <div
      ref="scroller"
      :class="scrollerClass"
      :style="scrollerStyle"
    >
      <UButton
        v-for="section in PROFILE_SECTIONS"
        :key="section.to"
        :to="section.to"
        :label="section.label"
        :icon="section.icon"
        :size="tabSize"
        :class="tabClass"
        active-variant="solid"
        active-color="primary"
        color="neutral"
        variant="ghost"
        exact
      />
    </div>

    <UIcon
      v-if="canScrollRight"
      :name="PROFILE_ICON.scrollRight"
      class="pointer-events-none absolute top-1/2 right-0.5 z-10 size-5 -translate-y-1/2 animate-pulse text-dimmed"
    />
  </nav>
</template>
