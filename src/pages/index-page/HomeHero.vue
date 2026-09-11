<script setup lang="ts">
  import HomeSearch from './HomeSearch.vue';
  import HomeTools from './HomeTools.vue';
  import { HOME_HERO_SUBTITLE, HOME_HERO_TITLE } from './model';
</script>

<template>
  <!--
    Шапка главной идёт во всю ширину контейнера страницы: колонка контента
    начинается только ниже, в сетке блоков. `isolate` держит декоративные слои
    внутри шапки.
  -->
  <section class="home-hero">
    <div
      aria-hidden="true"
      class="home-hero__decor"
    >
      <!-- Свечение по центру — «очаг», к которому стягивается взгляд -->
      <div class="home-hero__glow" />

      <!-- Волосяная клетка: даёт фактуру пустому месту по краям -->
      <div class="home-hero__grid" />
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
  </section>
</template>

<style lang="scss" scoped>
  .home-hero {
    isolation: isolate;
    position: relative;

    overflow: hidden;

    /* Шапка выходит на поля контейнера (#container), чтобы свечение и клетка
       тянулись от края до края, а содержимое осталось в колонке */
    margin-inline: -16px;
    padding-inline: 16px;

    border-bottom: 1px solid var(--border);

    @include media-min($xl) {
      margin-inline: -24px;
      padding-inline: 24px;
    }

    &__decor {
      pointer-events: none;
      position: absolute;
      z-index: -1;
      inset: 0;
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

    &__grid {
      position: absolute;
      inset: 0;

      /* Клетка видна только по краям — под текстом она мешала бы читать */
      opacity: 0.75;

      /* Два повтора с одним шагом дают квадратную клетку, а не полоски */
      background-image: repeating-linear-gradient(
          to right,
          var(--border) 0 1px,
          transparent 1px 96px
        ),
        repeating-linear-gradient(
          to bottom,
          var(--border) 0 1px,
          transparent 1px 96px
        );

      -webkit-mask-image: linear-gradient(
        to right,
        #000 0%,
        transparent 24%,
        transparent 76%,
        #000 100%
      );
      mask-image: linear-gradient(
        to right,
        #000 0%,
        transparent 24%,
        transparent 76%,
        #000 100%
      );
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
