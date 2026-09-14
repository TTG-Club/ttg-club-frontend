<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useHomeHeroMotion } from './composable';
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

  const hero = ref<HTMLElement>();

  // Пока шапки не видно, её бесконечные анимации (повозка, дым, свет по
  // рамке поиска) стоят: браузер не считает кадры ради того, что за экраном
  const {
    state: motionState,
    isSupported: isMotionSupported,
    isEnabled: isMotionEnabled,
    isVisible: isHeroVisible,
    toggle: toggleMotion,
  } = useHomeHeroMotion(hero);

  const motionToggleLabel = computed(() =>
    isMotionEnabled.value
      ? HOME_HERO_MOTION_PAUSE_LABEL
      : HOME_HERO_MOTION_PLAY_LABEL,
  );
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину контейнера страницы: колонка контента
    начинается только ниже, в сетке блоков. `isolate` держит декоративные слои
    — карту и свечение — внутри шапки, под её содержимым.
  -->
  <section
    ref="hero"
    :class="['home-hero', { 'home-hero_offscreen': !isHeroVisible }]"
  >
    <div
      aria-hidden="true"
      class="home-hero__decor"
    >
      <!-- Карта деревни с высоты птичьего полёта: рисунок под каждую тему
        лежит в `public/img/<тема>/hero-map.svg`, выбирает его переменная
        `--hero-map-image`. Сверху — повозка и дым, они анимированы отдельно
        от рисунка -->
      <div class="home-hero__map">
        <div class="home-hero__map-image" />

        <home-hero-motion
          :state="motionState"
          class="home-hero__map-motion"
        />
      </div>

      <!-- Свечение по центру — «очаг», к которому стягивается взгляд -->
      <div class="home-hero__glow" />
    </div>

    <div class="home-hero__inner">
      <!--
        Место строки живых счётчиков, как на new.ttg.club. Своей статистики у
        этого сайта нет, поэтому строка пустая, но высоту держим: шапка
        сохраняет ритм, и счётчики встанут сюда без перекройки.
      -->
      <div
        aria-hidden="true"
        class="home-hero__stats"
      />

      <h1 class="home-hero__title">
        <span class="home-hero__title-main">{{ HOME_HERO_TITLE }}</span>

        <span class="home-hero__title-sub">{{ HOME_HERO_SUBTITLE }}</span>
      </h1>

      <home-search />

      <home-tools />
    </div>

    <!-- Пауза и запуск повозки с дымом. На телефонах анимации нет, и кнопки
      тоже -->
    <button
      v-if="isMotionSupported"
      :aria-label="motionToggleLabel"
      :title="motionToggleLabel"
      class="home-hero__motion-toggle"
      type="button"
      @click.left.exact.prevent="toggleMotion"
    >
      <svg-icon
        :icon="
          isMotionEnabled
            ? HOME_HERO_MOTION_PAUSE_ICON
            : HOME_HERO_MOTION_PLAY_ICON
        "
        :size="14"
      />
    </button>
  </section>
</template>

<style lang="scss" scoped>
  /* Уже этой ширины карта не сжимается: края уходят за экран, а дома
     остаются различимыми */
  $map-min-width: 1600px;

  .home-hero {
    isolation: isolate;
    position: relative;

    overflow: hidden;

    /* Шапка выходит на поля контейнера (#container), чтобы свечение и карта
       тянулись от края до края, а содержимое осталось в колонке */
    margin-inline: -16px;
    padding-inline: 16px;

    /* Фон страницы с картинкой в правом нижнем углу (`#dnd5club::after`)
       закреплён на экране. Шапка его закрывает: картинка обрезается по её
       нижней границе, а не просвечивает под картой */
    background-color: var(--bg-main);
    border-bottom: 1px solid var(--border);

    @include media-min($xl) {
      margin-inline: -24px;
      padding-inline: 24px;
    }

    /* Свет по рамке поиска за экраном стоит; повозкой и дымом управляет
       `useHomeHeroMotion` */
    &_offscreen {
      --home-hero-play-state: paused;
    }

    &__decor {
      pointer-events: none;
      position: absolute;
      z-index: -1;
      inset: 0;
    }

    &__map {
      position: absolute;
      inset: 0;

      opacity: var(--hero-map-opacity);

      -webkit-mask-composite: source-in;
      mask-composite: intersect;

      /* Под заголовком и поиском карта почти растворяется, по бокам видна
         целиком; сверху и снизу тает, чтобы не упираться в края шапки */
      -webkit-mask-image: linear-gradient(
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
      mask-image: linear-gradient(
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
    }

    /* Масштаб карты задаёт только ширина шапки, не высота: холст с запасом
       по высоте, поэтому шапку он закрывает и так.

       Рисунок тяжёлый — сотни фигур и шумовые фильтры, растрировать его
       дорого. Поэтому карта лежит в своём слое композиции (`will-change`):
       браузер растрирует её один раз, а повозка, машинка в поиске и наведение
       на кнопки над ней перерисовываются, не трогая карту */
    &__map-image {
      will-change: transform;
      position: absolute;
      inset: 0;
      background: var(--hero-map-image) center / max(100%, $map-min-width) auto
        no-repeat;
    }

    /* Холст повозки и дыма — ровно там, где фоновая картинка карты:
       та же ширина, по центру шапки */
    &__map-motion {
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;

      aspect-ratio: 3200 / 1100;
      width: max(100%, $map-min-width);
      height: auto;
    }

    /* Кнопка в левом нижнем углу, на полях шапки: не спорит с поиском и
       лентой инструментов, но под рукой */
    &__motion-toggle {
      cursor: pointer;

      position: absolute;
      bottom: 10px;
      left: 16px;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 28px;
      height: 28px;
      padding: 0;

      color: var(--text-g-color);

      background-color: color-mix(
        in srgb,
        var(--bg-secondary) 85%,
        transparent
      );
      border: 1px solid var(--border);
      border-radius: 50%;

      transition:
        color 0.2s ease,
        border-color 0.2s ease;

      &:hover,
      &:focus-visible {
        color: var(--primary);
        border-color: color-mix(in srgb, var(--primary) 60%, transparent);
      }

      &:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      @include media-min($xl) {
        left: 24px;
      }
    }

    /* Слои свечения прозрачны целиком, а не цветом: так оттенок берётся прямо
       из переменной темы и следует за её сменой */
    &__glow {
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

    &__inner {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;

      width: 100%;
      max-width: var(--max-content);
      margin-inline: auto;
      padding-block: 24px 32px;

      @include media-min($sm) {
        gap: 24px;
      }

      @include media-min($lg) {
        padding-block: 40px 48px;
      }

      @include media-min($xxl) {
        max-width: var(--max-content-wide);
      }
    }

    /* Высота строки счётчиков на new.ttg.club */
    &__stats {
      height: 16px;
    }

    &__title {
      max-width: 896px;
      margin: 0;

      /* Кегль на всех ширинах примерно на четверть мельче, чем на
         new.ttg.club, — при переносе раскладки его не возвращать */
      font-family: 'Open Sans', sans-serif;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.25;
      text-align: center;
      text-wrap: balance;
      letter-spacing: -0.025em;

      @include media-min($sm) {
        font-size: 28px;
      }

      @include media-min($xl) {
        font-size: 32px;
      }

      @media (min-width: 1700px) {
        font-size: 36px;
      }

      /* На 360px и уже заголовок ужат: в полный размер он занимал пять строк
         и выталкивал поиск за первый экран */
      @media (max-width: 360px) {
        font-size: 20px;
      }
    }

    &__title-main {
      display: block;
      color: var(--text-color-title);
    }

    &__title-sub {
      display: block;
      color: var(--text-g-color);

      @media (max-width: 360px) {
        font-size: 16px;
      }
    }
  }
</style>
