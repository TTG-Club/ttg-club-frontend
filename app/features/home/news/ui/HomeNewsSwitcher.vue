<script setup lang="ts">
  import {
    HOME_NEWS_FIRST_ROTATE_SECONDS,
    HOME_NEWS_ROTATE_SECONDS,
    HOME_NEWS_ROTATION_ICON,
    HOME_NEWS_ROTATION_TEXT,
  } from '../../model';

  const {
    items,
    activeIndex,
    isStopped,
    isRunning,
    compact = false,
  } = defineProps<{
    /** Новости блока в порядке показа */
    items: ReadonlyArray<{ id: string; title: string }>;
    /** Номер показанной новости, с нуля */
    activeIndex: number;
    /** Остановил ли читатель автосмену кнопкой паузы */
    isStopped: boolean;
    /** Идёт ли сейчас отсчёт до следующей новости */
    isRunning: boolean;
    /** Короткая полоска отсчёта — для узкой панели */
    compact?: boolean;
  }>();

  defineEmits<{
    select: [index: number];
    next: [];
    previous: [];
    toggle: [];
  }>();

  const style = useCssModule();

  const activeTrackClass = computed(() =>
    compact ? 'w-8 bg-current/40' : 'w-14 bg-current/40',
  );

  const dots = computed(() =>
    items.map((news, index) => {
      const isActive = index === activeIndex;

      return {
        id: news.id,
        index,
        isActive,
        label: `${HOME_NEWS_ROTATION_TEXT.item} ${index + 1}: ${news.title}`,
        current: isActive ? true : undefined,
        trackClass: isActive
          ? activeTrackClass.value
          : 'w-2 bg-current group-hover/dot:text-primary',
      };
    }),
  );

  // Пока кнопка паузы не нажата, полоска показывает отсчёт; на паузе стоит
  // заполненной — видно, какая новость открыта, но ничего не «тикает».
  // Замерший отсчёт ярче идущего: видно, что новость придержана, а не
  // зависла
  const fillClass = computed(() => [
    isStopped ? undefined : style.countdown,
    isRunning ? 'bg-primary/65' : [style.held, 'bg-primary'],
  ]);

  const fillStyle = computed(() => {
    const seconds =
      activeIndex === 0
        ? HOME_NEWS_FIRST_ROTATE_SECONDS
        : HOME_NEWS_ROTATE_SECONDS;

    return { '--rotate-duration': `${seconds}s` };
  });

  const toggleIcon = computed(() =>
    isStopped ? HOME_NEWS_ROTATION_ICON.play : HOME_NEWS_ROTATION_ICON.pause,
  );

  const toggleLabel = computed(() =>
    isStopped ? HOME_NEWS_ROTATION_TEXT.play : HOME_NEWS_ROTATION_TEXT.pause,
  );
</script>

<template>
  <!--
    Переключатель новостей для подвала панели: точки с отсчётом, пауза и
    стрелки. Сам отсчёт — CSS-анимация полоски: её конец просит следующую
    новость, а остановка анимации и есть пауза.
  -->
  <div
    role="group"
    :aria-label="HOME_NEWS_ROTATION_TEXT.switcher"
    class="flex items-center"
  >
    <!-- Кнопка шире своей точки: попасть в пару пикселей пальцем нельзя, а
      зазор между точками — это её поля -->
    <button
      v-for="dot in dots"
      :key="dot.id"
      type="button"
      :aria-label="dot.label"
      :aria-current="dot.current"
      :title="dot.label"
      class="group/dot flex h-8 cursor-pointer items-center px-1"
      @click.left.exact.prevent="$emit('select', dot.index)"
    >
      <span
        class="relative block h-2 overflow-hidden rounded-full text-dimmed transition-colors"
        :class="dot.trackClass"
      >
        <!-- Полоска пересоздаётся с каждой новостью — отсчёт начинается
          заново. Растёт через transform, без пересчёта вёрстки -->
        <span
          v-if="dot.isActive"
          :key="activeIndex"
          class="absolute inset-0 origin-left rounded-full transition-colors duration-200"
          :class="fillClass"
          :style="fillStyle"
          @animationend="$emit('next')"
        />
      </span>
    </button>
  </div>

  <!-- Кнопки есть только там, где подвалу хватает ширины: в узкой панели
    остаются точки, а ссылка «смотреть всё» не сжимается до обрывка -->
  <span
    aria-hidden="true"
    class="hidden h-4 w-px bg-accented @[20rem]:block"
  />

  <div class="hidden items-center @[20rem]:flex">
    <UButton
      :icon="toggleIcon"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      color="neutral"
      variant="ghost"
      size="xs"
      @click.left.exact.prevent="$emit('toggle')"
    />

    <UButton
      :icon="HOME_NEWS_ROTATION_ICON.previous"
      :aria-label="HOME_NEWS_ROTATION_TEXT.previous"
      :title="HOME_NEWS_ROTATION_TEXT.previous"
      color="neutral"
      variant="ghost"
      size="xs"
      @click.left.exact.prevent="$emit('previous')"
    />

    <UButton
      :icon="HOME_NEWS_ROTATION_ICON.next"
      :aria-label="HOME_NEWS_ROTATION_TEXT.next"
      :title="HOME_NEWS_ROTATION_TEXT.next"
      color="neutral"
      variant="ghost"
      size="xs"
      @click.left.exact.prevent="$emit('next')"
    />
  </div>
</template>

<style lang="scss" module>
  .countdown {
    animation: news-countdown var(--rotate-duration) linear both;
  }

  .held {
    animation-play-state: paused;
  }

  @keyframes news-countdown {
    from {
      transform: scaleX(0);
    }

    to {
      transform: scaleX(1);
    }
  }
</style>
