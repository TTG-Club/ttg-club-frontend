<script setup lang="ts">
  import type { HomeHeroMotionState } from './model';

  import { useHomeMapTravel } from './composables';
  import {
    getHomeMapChimneyStyle,
    getHomeMapFigureStyle,
    getHomeMapFigureViewBox,
    getHomeMapViewBox,
    HOME_HERO_CHIMNEYS,
    HOME_HERO_HORSE_LEAD,
    HOME_HERO_HORSE_PARKING,
    HOME_HERO_HORSE_SIZE,
    HOME_HERO_MAP_VIEWBOX,
    HOME_HERO_SMOKE_PUFF_SIZE,
    HOME_HERO_SMOKE_PUFFS_PER_CHIMNEY,
    HOME_HERO_WAGON_LAP,
    HOME_HERO_WAGON_PARKING,
    HOME_HERO_WAGON_ROUTE,
    HOME_HERO_WAGON_SIZE,
  } from './model';

  const { state } = defineProps<{
    /** Едет, замерла или анимации нет вовсе (см. `useHomeHeroMotion`) */
    state: HomeHeroMotionState;
  }>();

  const styles = useCssModule();

  const canvasRef = useTemplateRef<HTMLElement>('canvasRef');
  const routeRef = useTemplateRef<SVGPathElement>('routeRef');
  const wagonRef = useTemplateRef<HTMLElement>('wagonRef');
  const horseRef = useTemplateRef<HTMLElement>('horseRef');

  // Сцена в единицах карты растягивается на ширину холста
  const { width: canvasWidth } = useElementSize(canvasRef);

  const stageStyle = computed(() => ({
    scale: canvasWidth.value / HOME_HERO_MAP_VIEWBOX.width,
  }));

  const isAnimated = computed(() => state !== 'static');
  const isPaused = computed(() => state === 'paused');

  const canvasClass = computed(() => [
    styles.canvas,
    isPaused.value ? styles.canvasPaused : undefined,
  ]);

  useHomeMapTravel(wagonRef, routeRef, {
    size: HOME_HERO_WAGON_SIZE,
    duration: HOME_HERO_WAGON_LAP,
    enabled: isAnimated,
    paused: isPaused,
  });

  useHomeMapTravel(horseRef, routeRef, {
    size: HOME_HERO_HORSE_SIZE,
    lead: HOME_HERO_HORSE_LEAD,
    duration: HOME_HERO_WAGON_LAP,
    enabled: isAnimated,
    paused: isPaused,
  });

  // Геометрия сцены не меняется: считаем её один раз, а не на каждой отрисовке
  const canvasViewBox = getHomeMapViewBox(HOME_HERO_MAP_VIEWBOX);

  const wagonStyle = getHomeMapFigureStyle(
    HOME_HERO_WAGON_SIZE,
    HOME_HERO_WAGON_PARKING,
  );

  const wagonViewBox = getHomeMapFigureViewBox(HOME_HERO_WAGON_SIZE);

  const horseStyle = getHomeMapFigureStyle(
    HOME_HERO_HORSE_SIZE,
    HOME_HERO_HORSE_PARKING,
  );

  const horseViewBox = getHomeMapFigureViewBox(HOME_HERO_HORSE_SIZE);

  const puffViewBox = getHomeMapFigureViewBox(HOME_HERO_SMOKE_PUFF_SIZE);

  const chimneys = HOME_HERO_CHIMNEYS.map((chimney) => ({
    key: `${chimney.x}:${chimney.y}`,
    style: getHomeMapChimneyStyle(chimney, HOME_HERO_SMOKE_PUFF_SIZE),
  }));
</script>

<template>
  <!--
    Повозка с лошадью и дым из труб над картой деревни. Раньше они жили внутри
    `hero-map-*.svg`, но анимация внутри SVG-картинки заставляет браузер на
    каждом кадре заново растрировать всю карту со всеми её фильтрами: процессор
    и видеокарта грелись, кадры падали.

    Теперь каждая фигура — свой маленький слой, а движение — только сдвиг,
    поворот, масштаб и прозрачность слоя. Такие анимации браузер ведёт в
    композиторе: ни стили, ни раскладка, ни отрисовка на кадре не
    пересчитываются.

    Холст совпадает с картой: размер и положение ему задаёт шапка — ровно как
    у фоновой картинки. Фигуры стоят на сцене в единицах карты, а сцена
    растянута на холст, поэтому повозка едет точно по дороге на любой ширине.
  -->
  <div
    ref="canvasRef"
    aria-hidden="true"
    :class="canvasClass"
  >
    <!-- Дорога только для расчёта ключевых кадров, на экране её нет -->
    <svg
      :viewBox="canvasViewBox"
      :class="$style.route"
    >
      <path
        ref="routeRef"
        :d="HOME_HERO_WAGON_ROUTE"
      />
    </svg>

    <div
      :style="stageStyle"
      :class="$style.stage"
    >
      <div
        ref="wagonRef"
        :style="wagonStyle"
        :class="$style.figure"
      >
        <svg :viewBox="wagonViewBox">
          <path
            :class="$style.paper"
            d="M-34 -18h68v36h-68Z"
          />

          <path
            :class="$style.dark"
            d="M-12 -23h24v5h-24ZM-12 18h24v5h-24Z"
          />

          <path
            :class="$style.line"
            d="M34 -6L64 -2M34 6L64 2"
          />

          <path
            :class="$style.body"
            d="M-34 -18h68v36h-68Z"
          />

          <path
            :class="$style.hairline"
            d="M-30 -11H30M-30 -3.7H30M-30 3.6H30M-30 10.9H30"
          />

          <path
            :class="$style.wood"
            d="M-38 -18h4v36h-4Z"
          />

          <g transform="translate(-14 -2) rotate(8)">
            <path
              :class="$style.body"
              d="M-8 -8h16v16h-16Z"
            />

            <path
              :class="$style.hairline"
              d="M-5 -5h10v10h-10ZM-5 -5L5 5"
            />
          </g>
        </svg>
      </div>

      <div
        ref="horseRef"
        :style="horseStyle"
        :class="$style.figure"
      >
        <svg :viewBox="horseViewBox">
          <path
            :class="$style.mane"
            d="M-16 -2C-24 -5-26 4-33 2C-27 9-20 6-16 2Z"
          />

          <path
            :class="$style.coat"
            d="M-18 0C-19 -8-11 -11-3 -9L10 -7C17 -5 17 5 10 7L-3 9C-11 11-19 8-18 0Z"
          />

          <path
            :class="$style.coat"
            d="M8 -6C14 -9 19 -7 22 -5L30 -4Q35 0 30 4L22 5C18 8 12 8 8 6Z"
          />

          <path
            :class="$style.coat"
            d="M19 -5L18 -11L24 -6M19 5L18 11L24 6"
          />

          <path
            :class="$style.mane"
            d="M7 -2L18 -2L21 0L17 2L7 2Z"
          />

          <path
            :class="$style.hairline"
            d="M27 -4Q25 0 27 4M-4 -9Q-7 0-4 9M2 -8Q-1 0 2 8"
          />

          <circle
            :class="$style.dark"
            cx="24"
            cy="-3"
            r="1"
          />

          <circle
            :class="$style.dark"
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
          v-for="chimney in chimneys"
          :key="chimney.key"
          :style="chimney.style"
          :class="$style.chimney"
        >
          <!-- Анимируется обёртка, а не сам svg: сдвиг и масштаб
            SVG-элемента браузер композитору не отдаёт -->
          <span
            v-for="puff in HOME_HERO_SMOKE_PUFFS_PER_CHIMNEY"
            :key="puff"
            :class="$style.puff"
          >
            <svg :viewBox="puffViewBox">
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

<style module lang="scss">
  /* Оттенки повозки выводятся из бумаги и туши карты так же, как в самом
     `hero-map-*.svg`, поэтому сливаются с рисунком во всех темах */
  $paper: var(--hero-map-paper);
  $ink: var(--hero-map-ink);

  .canvas {
    pointer-events: none;

    /* Фигуры не влияют на раскладку шапки и обрезаются по холсту — как
       рисунок по своему viewBox: повозка въезжает из-за края карты */
    contain: strict;
  }

  /* Сцена в единицах карты: пиксель сцены — единица карты. Под ширину холста
     масштабируется сцена целиком (`scale` из скрипта), поэтому сдвиги фигур
     остаются в пикселях и анимации идут в композиторе */
  .stage {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }

  .route {
    position: absolute;
    width: 0;
    height: 0;
    visibility: hidden;
  }

  .figure,
  .chimney {
    position: absolute;
  }

  .figure svg,
  .puff svg {
    overflow: visible;
    display: block;

    width: 100%;
    height: 100%;

    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .paper {
    fill: $paper;
  }

  .dark {
    fill: color-mix(in oklab, $paper, $ink 72%);
  }

  .line {
    fill: none;
    stroke: $ink;
    stroke-width: 2.4;
  }

  .hairline {
    fill: none;
    stroke: $ink;
    stroke-width: 1.05;
  }

  .body {
    fill: color-mix(in oklab, $paper, $ink 16%);
    stroke: $ink;
    stroke-width: 2.4;
  }

  .wood {
    fill: color-mix(in oklab, $paper, $ink 34%);
    stroke: $ink;
    stroke-width: 1.05;
  }

  .coat {
    fill: color-mix(in oklab, $paper, $ink 32%);
    stroke: $ink;
    stroke-width: 1.6;
  }

  .mane {
    fill: $ink;
    stroke: $ink;
    stroke-width: 1;
  }

  /* Клубы есть в разметке только при анимации (`isAnimated`) */
  .puff {
    position: absolute;
    inset: 0;

    opacity: 0;

    fill: $paper;
    stroke: color-mix(in oklab, $paper, $ink 25%);
    stroke-width: 0.8;

    animation: smoke-drift 8s linear infinite;

    &:nth-child(2) {
      animation-delay: -2.67s;
    }

    &:nth-child(3) {
      animation-delay: -5.33s;
    }
  }

  .canvasPaused .puff {
    animation-play-state: paused;
  }

  /* Ветер общий для всех труб, клубы расширяются и исчезают без скачка */
  @keyframes smoke-drift {
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
