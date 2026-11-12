<script setup lang="ts">
  import type { ComponentPublicInstance } from 'vue';

  import { NewsHero } from '~news/card';
  import { NewsDrawer } from '~news/drawer';
  import {
    getNewsListUrl,
    getNewsSearchPath,
    NEWS_KINDS,
    parseNewsList,
  } from '~news/model';

  import { useHomeNewsReader, useHomeNewsRotation } from '../composables';
  import {
    HOME_NEWS_ALL_LABEL,
    HOME_NEWS_COUNT,
    HOME_NEWS_DATA_KEY,
    HOME_NEWS_EMPTY_TEXT,
    HOME_NEWS_ICON,
    HOME_NEWS_LABEL,
    HOME_NEWS_ROTATE_SECONDS,
    HOME_NEWS_ROTATION_ICON,
    HOME_NEWS_ROTATION_TEXT,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const api = useApi();

  const style = useCssModule();

  /**
   * Новости сайта: на месте всегда одна новость обложкой, свежие сменяют
   * друг друга по таймеру или по переключателю в подвале панели. Новости пишут
   * и публикуют на новом сайте, здесь они только читаются — в панели
   * справа, а страница открывается на новом сайте.
   */
  const { newSiteUrl } = useRuntimeConfig().public;

  // Клиентская загрузка: блок ниже первого экрана и не должен держать ответ
  // главной в ожидании бэкенда нового сайта. Пока запрос идёт — скелетон
  const {
    data: newsList,
    status,
    refresh,
  } = useAsyncData(
    HOME_NEWS_DATA_KEY,
    async () =>
      parseNewsList(
        await api(getNewsSearchPath('site'), {
          query: { ...NEWS_KINDS.site.searchQuery, cnt: HOME_NEWS_COUNT },
        }),
      ),
    { default: () => [], lazy: true, server: false },
  );

  const { isLoading, isDrawerOpen, openedUrl, open } = useHomeNewsReader(
    newsList,
    status,
    refresh,
  );

  const newsCount = computed(() => newsList.value.length);

  // Следим за всей панелью: переключатель стоит в её подвале, и курсор на
  // стрелках тоже должен придерживать отсчёт
  const panel = useTemplateRef<ComponentPublicInstance>('panel');

  // Наведению нужен сам элемент панели, а не её компонент
  const panelElement = computed(() => unrefElement(panel));

  const isHovered = useElementHover(panelElement);

  const { focused: isFocused } = useFocusWithin(panelElement);

  const isVideoOpen = ref(false);

  // Отсчёт замирает, пока новость разглядывают или читают: курсор или фокус
  // на блоке, открыта панель чтения или ролик
  const isHeld = computed(
    () =>
      isHovered.value
      || isFocused.value
      || isDrawerOpen.value
      || isVideoOpen.value,
  );

  const {
    activeIndex,
    isStopped,
    isRunning,
    select,
    showNext,
    showPrevious,
    toggleStopped,
  } = useHomeNewsRotation(newsCount, isHeld);

  const activeNews = computed(() => newsList.value[activeIndex.value]);

  const hasSwitcher = computed(() => newsCount.value > 1);

  const dots = computed(() =>
    newsList.value.map((news, index) => {
      const isActive = index === activeIndex.value;

      return {
        id: news.id,
        index,
        isActive,
        label: `${HOME_NEWS_ROTATION_TEXT.item} ${index + 1}: ${news.title}`,
        current: isActive ? ('true' as const) : undefined,
        trackClass: isActive
          ? 'w-14 bg-current/40'
          : 'w-2 bg-current group-hover/dot:text-primary',
      };
    }),
  );

  // Пока кнопка паузы не нажата, полоска показывает отсчёт; на паузе стоит
  // заполненной — видно, какая новость открыта, но ничего не «тикает»
  // Замерший отсчёт ярче идущего: видно, что новость придержана, а не
  // зависла
  const fillClass = computed(() => [
    isStopped.value ? undefined : style.countdown,
    isRunning.value ? 'bg-primary/65' : [style.held, 'bg-primary'],
  ]);

  const fillStyle = { '--rotate-duration': `${HOME_NEWS_ROTATE_SECONDS}s` };

  const toggleIcon = computed(() =>
    isStopped.value
      ? HOME_NEWS_ROTATION_ICON.play
      : HOME_NEWS_ROTATION_ICON.pause,
  );

  const toggleLabel = computed(() =>
    isStopped.value
      ? HOME_NEWS_ROTATION_TEXT.play
      : HOME_NEWS_ROTATION_TEXT.pause,
  );

  /**
   * Запоминает, открыт ли ролик показанной новости.
   *
   * @param isOpen - открыт ли ролик
   */
  function handleVideo(isOpen: boolean): void {
    isVideoOpen.value = isOpen;
  }

  const listUrl = getNewsListUrl('site', newSiteUrl);
</script>

<template>
  <HomePanel
    ref="panel"
    :label="HOME_NEWS_LABEL"
    :icon="HOME_NEWS_ICON"
    :to="listUrl"
    :link-label="HOME_NEWS_ALL_LABEL"
    flush
  >
    <!-- Переключатель стоит в подвале, в одной строке со ссылкой на все
      новости: точки с отсчётом, пауза и стрелки -->
    <template
      v-if="hasSwitcher"
      #aside
    >
      <div
        role="group"
        :aria-label="HOME_NEWS_ROTATION_TEXT.switcher"
        class="flex items-center"
      >
        <!-- Кнопка шире своей точки: попасть в полтора пикселя пальцем
          нельзя, а зазор между точками — это её поля -->
        <button
          v-for="dot in dots"
          :key="dot.id"
          type="button"
          :aria-label="dot.label"
          :aria-current="dot.current"
          :title="dot.label"
          class="group/dot flex h-8 cursor-pointer items-center px-1"
          @click.left.exact.prevent="select(dot.index)"
        >
          <span
            class="relative block h-2 overflow-hidden rounded-full text-dimmed transition-colors"
            :class="dot.trackClass"
          >
            <!-- Полоска пересоздаётся с каждой новостью — отсчёт начинается
              заново. Растёт через transform, без пересчёта вёрстки; её
              конец и листает новость -->
            <span
              v-if="dot.isActive"
              :key="activeIndex"
              class="absolute inset-0 origin-left rounded-full transition-colors duration-200"
              :class="fillClass"
              :style="fillStyle"
              @animationend="showNext"
            />
          </span>
        </button>
      </div>

      <span
        aria-hidden="true"
        class="h-4 w-px bg-accented"
      />

      <div class="flex items-center">
        <UButton
          :icon="toggleIcon"
          :aria-label="toggleLabel"
          :title="toggleLabel"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="toggleStopped"
        />

        <UButton
          :icon="HOME_NEWS_ROTATION_ICON.previous"
          :aria-label="HOME_NEWS_ROTATION_TEXT.previous"
          :title="HOME_NEWS_ROTATION_TEXT.previous"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="showPrevious"
        />

        <UButton
          :icon="HOME_NEWS_ROTATION_ICON.next"
          :aria-label="HOME_NEWS_ROTATION_TEXT.next"
          :title="HOME_NEWS_ROTATION_TEXT.next"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="showNext"
        />
      </div>
    </template>

    <!-- Скелетон повторяет обложку, чтобы лента не прыгала, когда новости
      приедут -->
    <div
      v-if="isLoading"
      class="flex flex-col"
    >
      <USkeleton
        class="aspect-16/10 w-full rounded-none sm:aspect-2/1 xl:aspect-21/9"
      />
    </div>

    <p
      v-else-if="!activeNews"
      class="m-3 rounded-xl border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
    >
      {{ HOME_NEWS_EMPTY_TEXT }}
    </p>

    <div
      v-else
      class="flex flex-col"
    >
      <!-- Новая обложка проявляется поверх места прежней: обложки одного
        размера, вёрстка под ними не двигается. Проявление — CSS-анимация
        самой обложки, а не Transition: ей не нужно ждать ухода прежней -->
      <NewsHero
        :key="activeNews.id"
        :news="activeNews"
        kind="site"
        :class="$style.appear"
        @open="open(activeNews.url)"
        @video="handleVideo"
      />
    </div>

    <NewsDrawer
      v-model:open="isDrawerOpen"
      kind="site"
      :url="openedUrl"
    />
  </HomePanel>
</template>

<style lang="scss" module>
  .countdown {
    animation: news-countdown var(--rotate-duration) linear both;
  }

  .held {
    animation-play-state: paused;
  }

  .appear {
    animation: news-appear 0.25s ease-out both;
  }

  @keyframes news-appear {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .appear {
      animation: none;
    }
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
