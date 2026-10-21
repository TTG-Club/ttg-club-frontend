import type { MaybeRefOrGetter } from 'vue';

import type { HomeMapPlacement, HomeMapSize } from '../model';

import {
  getHomeMapFigureTransform,
  HOME_HERO_ROUTE_SAMPLE_STEP,
} from '../model';

interface HomeMapTravelOptions {
  /** Размер слоя фигуры, единицы карты */
  size: HomeMapSize;
  /** Насколько фигура опережает начало дороги, единицы карты */
  lead?: number;
  /** Один проезд по дороге, мс */
  duration: number;
  /** Разрешено ли движение вообще (устройство, «меньше движения», выбор посетителя) */
  enabled: MaybeRefOrGetter<boolean>;
  /** Движение на паузе — выключено кнопкой или шапка за экраном */
  paused: MaybeRefOrGetter<boolean>;
}

/**
 * Положение на дороге: точка и поворот по касательной, как у `offset-rotate:
 * auto`. Касательная — по соседним точкам в единице карты по обе стороны.
 *
 * @param route - дорога
 * @param length - её полная длина
 * @param distance - пройденный путь; за концом дороги фигура стоит в конце
 * @returns точка и поворот фигуры
 */
function getRoutePlacement(
  route: SVGGeometryElement,
  length: number,
  distance: number,
): HomeMapPlacement {
  const along = Math.min(distance, length);
  const point = route.getPointAtLength(along);
  const behind = route.getPointAtLength(Math.max(along - 1, 0));
  const ahead = route.getPointAtLength(Math.min(along + 1, length));

  return {
    x: point.x,
    y: point.y,
    angle: (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI,
  };
}

/**
 * Ключевые кадры одного проезда: точки дороги с равным шагом, поэтому при
 * линейном темпе скорость постоянна.
 *
 * @param route - дорога
 * @param size - размер слоя фигуры
 * @param lead - насколько фигура опережает начало дороги
 * @returns кадры `translate` и `rotate`
 */
function getRouteKeyframes(
  route: SVGGeometryElement,
  size: HomeMapSize,
  lead: number,
): Array<Keyframe> {
  const length = route.getTotalLength();
  const steps = Math.ceil(length / HOME_HERO_ROUTE_SAMPLE_STEP);

  return Array.from({ length: steps + 1 }, (_step, index) => ({
    offset: index / steps,
    ...getHomeMapFigureTransform(
      getRoutePlacement(route, length, lead + (length * index) / steps),
      size,
    ),
  }));
}

/**
 * Ведёт фигуру карты шапки по дороге кругами.
 *
 * Анимация собрана из ключевых кадров на `translate` и `rotate` — это
 * свойства, которые браузер двигает в композиторе, не пересчитывая стили и не
 * перерисовывая страницу. Анимация `offset-path` по той же дороге внутри SVG
 * выглядела так же, но на каждом кадре заново растрировала всю карту.
 *
 * Пока движение не разрешено, фигура стоит там, где её поставил стиль
 * компонента; на паузе замирает в текущей точке.
 *
 * @param figure - слой фигуры в левом верхнем углу сцены карты
 * @param route - дорога в единицах карты
 * @param options - размер фигуры, темп и условия движения
 */
export function useHomeMapTravel(
  figure: MaybeRefOrGetter<HTMLElement | null>,
  route: MaybeRefOrGetter<SVGGeometryElement | null>,
  options: HomeMapTravelOptions,
): void {
  const travel = shallowRef<Animation>();

  /** Снимает анимацию: фигура возвращается на место из стиля компонента. */
  function stopTravel(): void {
    travel.value?.cancel();
    travel.value = undefined;
  }

  watch(
    [
      () => toValue(figure),
      () => toValue(route),
      () => toValue(options.enabled),
    ],
    ([figureElement, routeElement, isEnabled]) => {
      stopTravel();

      if (!figureElement || !routeElement || !isEnabled) {
        return;
      }

      travel.value = figureElement.animate(
        getRouteKeyframes(routeElement, options.size, options.lead ?? 0),
        { duration: options.duration, iterations: Infinity },
      );
    },
    { immediate: true },
  );

  watch(
    [travel, () => toValue(options.paused)],
    ([animation, isPaused]) => {
      if (isPaused) {
        animation?.pause();

        return;
      }

      animation?.play();
    },
    { immediate: true },
  );

  onBeforeUnmount(stopTravel);
}
