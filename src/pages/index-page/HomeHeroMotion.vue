<script setup lang="ts">
  import { useHomeMapTravel } from './composable';
  import {
    getHomeMapBoxStyle,
    getHomeMapFigureTransform,
    HOME_HERO_CHIMNEYS,
    HOME_HERO_HORSE_LEAD,
    HOME_HERO_HORSE_PARKING,
    HOME_HERO_HORSE_SIZE,
    HOME_HERO_MAP_VIEWBOX,
    HOME_HERO_SMOKE_PUFF_SIZE,
    HOME_HERO_WAGON_LAP,
    HOME_HERO_WAGON_PARKING,
    HOME_HERO_WAGON_ROUTE,
    HOME_HERO_WAGON_SIZE,
  } from './model';

  import type {
    HomeHeroMotionState,
    HomeMapPlacement,
    HomeMapPoint,
    HomeMapSize,
  } from './model';
  import type { CSSProperties } from 'vue';

  const props = defineProps<{
    /** Едет, замерла или анимации нет вовсе (см. `useHomeHeroMotion`) */
    state: HomeHeroMotionState;
  }>();

  /** Клубов на трубу: они идут друг за другом со сдвигом в треть цикла */
  const PUFFS_PER_CHIMNEY = 3;

  const canvas = ref<HTMLElement>();
  const route = ref<SVGPathElement>();
  const wagon = ref<HTMLElement>();
  const horse = ref<HTMLElement>();

  // Сцена в единицах карты растягивается на ширину холста
  const { width: canvasWidth } = useElementSize(canvas);

  const stageScale = computed(
    () => canvasWidth.value / HOME_HERO_MAP_VIEWBOX.width,
  );

  const isAnimated = computed(() => props.state !== 'static');

  const isPaused = computed(() => props.state === 'paused');

  useHomeMapTravel(wagon, route, {
    size: HOME_HERO_WAGON_SIZE,
    duration: HOME_HERO_WAGON_LAP,
    enabled: isAnimated,
    paused: isPaused,
  });

  useHomeMapTravel(horse, route, {
    size: HOME_HERO_HORSE_SIZE,
    lead: HOME_HERO_HORSE_LEAD,
    duration: HOME_HERO_WAGON_LAP,
    enabled: isAnimated,
    paused: isPaused,
  });

  const canvasViewBox = Object.values(HOME_HERO_MAP_VIEWBOX).join(' ');

  /**
   * Слой фигуры в левом верхнем углу сцены, сдвинутый на стоянку.
   * @param size - размер фигуры
   * @param parking - где она стоит без анимации
   */
  const getFigureStyle = (
    size: HomeMapSize,
    parking: HomeMapPlacement,
  ): CSSProperties => ({
    ...getHomeMapBoxStyle(HOME_HERO_MAP_VIEWBOX, size),
    ...getHomeMapFigureTransform(parking, size),
  });

  /**
   * Слой клубов над трубой: устье трубы — в центре слоя.
   * @param chimney - устье трубы
   */
  const getChimneyStyle = (chimney: HomeMapPoint): CSSProperties =>
    getHomeMapBoxStyle(
      {
        x: chimney.x - HOME_HERO_SMOKE_PUFF_SIZE.width / 2,
        y: chimney.y - HOME_HERO_SMOKE_PUFF_SIZE.height / 2,
      },
      HOME_HERO_SMOKE_PUFF_SIZE,
    );

  /**
   * `viewBox` слоя фигуры: начало координат рисунка — в центре слоя.
   * @param size - размер фигуры
   */
  const getFigureViewBox = (size: HomeMapSize): string =>
    [-size.width / 2, -size.height / 2, size.width, size.height].join(' ');
</script>

<template>
  <!--
    Повозка с лошадью и дым из труб над картой деревни. Раньше они жили внутри
    `hero-map.svg`, но анимация внутри SVG-картинки заставляет браузер на каждом
    кадре заново растрировать всю карту со всеми её фильтрами: процессор и
    видеокарта грелись, кадры падали.

    Теперь каждая фигура — свой маленький слой, а движение — только сдвиг,
    поворот, масштаб и прозрачность слоя. Такие анимации браузер ведёт в
    композиторе: ни стили, ни раскладка, ни отрисовка на кадре не
    пересчитываются.

    Холст совпадает с картой: размер и положение ему задаёт шапка — ровно как
    у фоновой картинки. Фигуры стоят на сцене в единицах карты, а сцена
    растянута на холст, поэтому повозка едет точно по дороге на любой ширине.
  -->
  <div
    ref="canvas"
    :class="['home-hero-motion', { 'home-hero-motion_paused': isPaused }]"
    aria-hidden="true"
  >
    <!-- Дорога только для расчёта ключевых кадров, на экране её нет -->
    <svg
      :viewBox="canvasViewBox"
      class="home-hero-motion__route"
    >
      <path
        ref="route"
        :d="HOME_HERO_WAGON_ROUTE"
      />
    </svg>

    <div
      :style="{ scale: stageScale }"
      class="home-hero-motion__stage"
    >
      <div
        ref="wagon"
        :style="getFigureStyle(HOME_HERO_WAGON_SIZE, HOME_HERO_WAGON_PARKING)"
        class="home-hero-motion__figure"
      >
        <svg :viewBox="getFigureViewBox(HOME_HERO_WAGON_SIZE)">
          <path
            class="home-hero-motion__paper"
            d="M-34 -18h68v36h-68Z"
          />

          <path
            class="home-hero-motion__dark"
            d="M-12 -23h24v5h-24ZM-12 18h24v5h-24Z"
          />

          <path
            class="home-hero-motion__line"
            d="M34 -6L64 -2M34 6L64 2"
          />

          <path
            class="home-hero-motion__body"
            d="M-34 -18h68v36h-68Z"
          />

          <path
            class="home-hero-motion__hairline"
            d="M-30 -11H30M-30 -3.7H30M-30 3.6H30M-30 10.9H30"
          />

          <path
            class="home-hero-motion__wood"
            d="M-38 -18h4v36h-4Z"
          />

          <g transform="translate(-14 -2) rotate(8)">
            <path
              class="home-hero-motion__body"
              d="M-8 -8h16v16h-16Z"
            />

            <path
              class="home-hero-motion__hairline"
              d="M-5 -5h10v10h-10ZM-5 -5L5 5"
            />
          </g>
        </svg>
      </div>

      <div
        ref="horse"
        :style="getFigureStyle(HOME_HERO_HORSE_SIZE, HOME_HERO_HORSE_PARKING)"
        class="home-hero-motion__figure"
      >
        <svg :viewBox="getFigureViewBox(HOME_HERO_HORSE_SIZE)">
          <path
            class="home-hero-motion__mane"
            d="M-16 -2C-24 -5-26 4-33 2C-27 9-20 6-16 2Z"
          />

          <path
            class="home-hero-motion__coat"
            d="M-18 0C-19 -8-11 -11-3 -9L10 -7C17 -5 17 5 10 7L-3 9C-11 11-19 8-18 0Z"
          />

          <path
            class="home-hero-motion__coat"
            d="M8 -6C14 -9 19 -7 22 -5L30 -4Q35 0 30 4L22 5C18 8 12 8 8 6Z"
          />

          <path
            class="home-hero-motion__coat"
            d="M19 -5L18 -11L24 -6M19 5L18 11L24 6"
          />

          <path
            class="home-hero-motion__mane"
            d="M7 -2L18 -2L21 0L17 2L7 2Z"
          />

          <path
            class="home-hero-motion__hairline"
            d="M27 -4Q25 0 27 4M-4 -9Q-7 0-4 9M2 -8Q-1 0 2 8"
          />

          <circle
            class="home-hero-motion__dark"
            cx="24"
            cy="-3"
            r="1"
          />

          <circle
            class="home-hero-motion__dark"
            cx="24"
            cy="3"
            r="1"
          />
        </svg>
      </div>

      <!-- Без анимации дыма нет вовсе: застывший клуб над трубой смотрится
        пятном -->
      <template v-if="isAnimated">
        <div
          v-for="chimney in HOME_HERO_CHIMNEYS"
          :key="`${chimney.x}:${chimney.y}`"
          :style="getChimneyStyle(chimney)"
          class="home-hero-motion__chimney"
        >
          <!-- Анимируется обёртка, а не сам <svg>: сдвиг и масштаб
            SVG-элемента браузер композитору не отдаёт -->
          <span
            v-for="puff in PUFFS_PER_CHIMNEY"
            :key="puff"
            class="home-hero-motion__puff"
          >
            <svg :viewBox="getFigureViewBox(HOME_HERO_SMOKE_PUFF_SIZE)">
              <path
                d="M-8 3C-15 1-13-7-7-8C-9-15 3-18 7-11C15-13 20-3 13 2C9 8-2 8-8 3Z"
              />
            </svg>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  /* Оттенки повозки выводятся из бумаги и туши карты так же, как в самом
     `hero-map.svg`, поэтому сливаются с рисунком в обеих темах */
  $paper: var(--hero-map-paper);
  $ink: var(--hero-map-ink);

  .home-hero-motion {
    pointer-events: none;

    /* Фигуры не влияют на раскладку шапки и обрезаются по холсту — как
       рисунок по своему viewBox: повозка въезжает из-за края карты */
    contain: strict;

    /* Сцена в единицах карты: пиксель сцены — единица карты. Под ширину
       холста масштабируется сцена целиком (`scale` из скрипта), поэтому
       сдвиги фигур остаются в пикселях и анимации идут в композиторе */
    &__stage {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
    }

    &__route {
      position: absolute;
      width: 0;
      height: 0;
      visibility: hidden;
    }

    &__figure,
    &__chimney {
      position: absolute;
    }

    &__figure svg,
    &__puff svg {
      overflow: visible;
      display: block;

      width: 100%;
      height: 100%;

      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &__paper {
      fill: $paper;
    }

    &__dark {
      fill: color-mix(in oklab, $paper, $ink 72%);
    }

    &__line {
      fill: none;
      stroke: $ink;
      stroke-width: 2.4;
    }

    &__hairline {
      fill: none;
      stroke: $ink;
      stroke-width: 1.05;
    }

    &__body {
      fill: color-mix(in oklab, $paper, $ink 16%);
      stroke: $ink;
      stroke-width: 2.4;
    }

    &__wood {
      fill: color-mix(in oklab, $paper, $ink 34%);
      stroke: $ink;
      stroke-width: 1.05;
    }

    &__coat {
      fill: color-mix(in oklab, $paper, $ink 32%);
      stroke: $ink;
      stroke-width: 1.6;
    }

    &__mane {
      fill: $ink;
      stroke: $ink;
      stroke-width: 1;
    }

    /* Без анимации дыма нет вовсе: застывший клуб над трубой смотрится
       пятном */
    /* Клубы есть в разметке только при анимации (`isAnimated`) */
    &__puff {
      position: absolute;
      inset: 0;

      opacity: 0;

      fill: $paper;
      stroke: color-mix(in oklab, $paper, $ink 25%);
      stroke-width: 0.8;

      animation: home-hero-smoke-drift 8s linear infinite;

      &:nth-child(2) {
        animation-delay: -2.67s;
      }

      &:nth-child(3) {
        animation-delay: -5.33s;
      }
    }

    &_paused &__puff {
      animation-play-state: paused;
    }
  }

  /* Ветер общий для всех труб, клубы расширяются и исчезают без скачка */
  @keyframes home-hero-smoke-drift {
    0% {
      translate: 0 0;
      scale: 0.35;
      opacity: 0;
    }

    12% {
      translate: 4px -8px;
      scale: 0.65;
      opacity: 0.55;
    }

    40% {
      translate: 21px -22px;
      scale: 1.15;
      opacity: 0.42;
    }

    70% {
      translate: 49px -32px;
      scale: 1.8;
      opacity: 0.22;
    }

    100% {
      translate: 85px -43px;
      scale: 2.5;
      opacity: 0;
    }
  }
</style>
