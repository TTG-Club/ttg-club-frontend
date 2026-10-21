<script setup lang="ts">
  import { useHomeHeroMotion } from './composables';
  import HomeHeroMotion from './HomeHeroMotion.vue';
  import HomeSearch from './HomeSearch.vue';
  import HomeTools from './HomeTools.vue';
  import {
    HOME_HERO_MOTION_PAUSE_ICON,
    HOME_HERO_MOTION_PAUSE_LABEL,
    HOME_HERO_MOTION_PLAY_ICON,
    HOME_HERO_MOTION_PLAY_LABEL,
    HOME_HERO_SUBTITLE,
    HOME_HERO_TITLE,
  } from './model';

  const styles = useCssModule();

  const heroRef = useTemplateRef<HTMLElement>('heroRef');

  // Пока шапки не видно, её бесконечные анимации (повозка, дым, свет по
  // рамке поиска) стоят: браузер не считает кадры ради того, что за экраном
  const {
    state: motionState,
    isSupported: isMotionSupported,
    isEnabled: isMotionEnabled,
    isVisible: isHeroVisible,
    toggle: toggleMotion,
  } = useHomeHeroMotion(heroRef);

  const heroClass = computed(() =>
    isHeroVisible.value ? undefined : styles.offscreen,
  );

  const motionToggleLabel = computed(() =>
    isMotionEnabled.value
      ? HOME_HERO_MOTION_PAUSE_LABEL
      : HOME_HERO_MOTION_PLAY_LABEL,
  );

  const motionToggleIcon = computed(() =>
    isMotionEnabled.value
      ? HOME_HERO_MOTION_PAUSE_ICON
      : HOME_HERO_MOTION_PLAY_ICON,
  );
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину страницы: колонка контента начинается
    только ниже, в сетке блоков. `isolate` держит декоративные слои — карту и
    свечение — внутри шапки, под её содержимым. Фон страницы шапка закрывает
    своим цветом: картинка карты уже наложена на него.
  -->
  <section
    ref="heroRef"
    class="relative isolate w-full overflow-hidden border-b border-default bg-main px-4 xl:px-6"
    :class="heroClass"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-1"
    >
      <!-- Карта деревни с высоты птичьего полёта: рисунок под каждую тему
        лежит в `public/img/<тема>/hero-map.webp`, выбирает его переменная
        `--hero-map-image`. Сверху — повозка и дым, они анимированы отдельно
        от рисунка -->
      <div :class="$style.map">
        <div :class="$style.mapImage" />

        <HomeHeroMotion
          :state="motionState"
          :class="$style.mapMotion"
        />
      </div>

      <!-- Свечение по центру — «очаг», к которому стягивается взгляд -->
      <div :class="$style.glow" />
    </div>

    <div
      class="mx-auto flex w-full max-w-(--max-content) flex-col items-center gap-5 pt-6 pb-8 sm:gap-6 lg:pt-10 lg:pb-12 2xl:max-w-(--max-content-wide)"
    >
      <!--
        Место строки живых счётчиков, как на new.ttg.club. Своей статистики у
        этого сайта нет, поэтому строка пустая, но высоту держим: шапка
        сохраняет ритм, и счётчики встанут сюда без перекройки.
      -->
      <div
        aria-hidden="true"
        class="h-4"
      />

      <!-- Кегль на всех ширинах примерно на четверть мельче, чем на
        new.ttg.club, — при переносе раскладки его не возвращать. На 360px и
        уже заголовок ужат: в полный размер он занимал пять строк и
        выталкивал поиск за первый экран -->
      <h1
        class="max-w-4xl text-center text-2xl leading-tight font-semibold tracking-tight text-balance max-2xs:text-xl 3xl:text-4xl sm:text-[28px] xl:text-[32px]"
      >
        <span class="block text-highlighted">{{ HOME_HERO_TITLE }}</span>

        <span class="block text-muted max-2xs:text-base">
          {{ HOME_HERO_SUBTITLE }}
        </span>
      </h1>

      <HomeSearch />

      <HomeTools />
    </div>

    <!-- Пауза и запуск повозки с дымом — в левом нижнем углу, на полях шапки:
      не спорит с поиском и лентой инструментов. На телефонах и планшетах
      анимации нет, и кнопки тоже -->
    <UTooltip
      v-if="isMotionSupported"
      :text="motionToggleLabel"
      :content="{ side: 'right' }"
    >
      <UButton
        :icon="motionToggleIcon"
        :aria-label="motionToggleLabel"
        color="neutral"
        variant="outline"
        size="xs"
        square
        class="absolute bottom-2.5 left-4 rounded-full xl:left-6"
        @click.left.exact.prevent="toggleMotion"
      />
    </UTooltip>
  </section>
</template>

<style lang="scss" module>
  /* Уже этой ширины карта не сжимается: края уходят за экран, а дома
     остаются различимыми */
  $mapMinWidth: 1600px;

  /* Середина карты, видная на экране уже 768px (`hero-map-sm.webp`) */
  $mapSmallWidth: 768px;

  /* Свет по рамке поиска за экраном стоит (`--home-hero-play-state` читает
     HomeSearch); повозкой и дымом управляет `useHomeHeroMotion` */
  .offscreen {
    --home-hero-play-state: paused;
  }

  .map {
    position: absolute;
    inset: 0;

    opacity: var(--hero-map-opacity);

    /* Под заголовком и поиском карта почти растворяется, по бокам видна
       целиком; сверху и снизу тает, чтобы не упираться в края шапки */
    mask-image:
      linear-gradient(
        to right,
        #000 12%,
        rgb(0 0 0 / 22%) 32%,
        rgb(0 0 0 / 22%) 68%,
        #000 88%
      ),
      linear-gradient(
        to bottom,
        transparent 0%,
        #000 15%,
        #000 85%,
        transparent 100%
      );
    mask-composite: intersect;
  }

  /* Масштаб карты задаёт только ширина шапки, не высота: холст с запасом по
     высоте, поэтому шапку он закрывает и так. Карта — готовая растровая копия
     рисунка: своим слоем (`will-change`) она не перерисовывается, когда
     меняется что-то над ней: повозка, машинка в поиске, наведение на кнопки */
  .mapImage {
    will-change: transform;
    position: absolute;
    inset: 0;
    background: var(--hero-map-image) center / max(100%, $mapMinWidth) auto
      no-repeat;

    /* На узком экране видна только середина карты — её и грузим */
    @media (width < 768px) {
      background-image: var(--hero-map-image-sm);
      background-size: $mapSmallWidth auto;
    }
  }

  /* Холст повозки и дыма — ровно там, где фоновая картинка карты: та же
     ширина, по центру шапки. Пропорции — холст карты `HOME_HERO_MAP_VIEWBOX` */
  .mapMotion {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    aspect-ratio: 3200 / 1100;
    width: max(100%, $mapMinWidth);
    height: auto;
  }

  /* Слои свечения прозрачны целиком, а не цветом: так оттенок берётся прямо
     из переменной темы и следует за её сменой */
  .glow {
    position: absolute;
    inset: 0;

    &::before,
    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    &::before {
      opacity: 0.16;
      background: radial-gradient(
        60% 70% at 50% 0%,
        var(--primary) 0%,
        transparent 70%
      );
    }

    &::after {
      opacity: 0.55;
      background: radial-gradient(
        90% 100% at 50% 100%,
        var(--bg-sub-menu) 0%,
        transparent 75%
      );
    }
  }
</style>
