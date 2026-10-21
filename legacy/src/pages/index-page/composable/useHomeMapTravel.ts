import { getHomeMapFigureTransform } from '../model';

import type { HomeMapPlacement, HomeMapSize } from '../model';
import type { MaybeRefOrGetter } from '@vueuse/core';

/**
 * Шаг ключевых кадров вдоль дороги, единицы карты. Между кадрами фигура идёт
 * по прямой, а на таком шаге хорда от кривой дороги не отходит и на пиксель.
 */
const ROUTE_SAMPLE_STEP = 20;

type HomeMapTravelOptions = {
  /** Размер слоя фигуры, единицы карты */
  size: HomeMapSize;
  /** Насколько фигура опережает начало дороги, единицы карты */
  lead?: number;
  /** Один проезд по дороге, мс */
  duration: number;
  /** Разрешено ли движение вообще (устройство, «меньше движения») */
  enabled: MaybeRefOrGetter<boolean>;
  /** Движение на паузе — например, пока шапка за экраном */
  paused: MaybeRefOrGetter<boolean>;
};

/**
 * Положение на дороге: точка и поворот по касательной, как у `offset-rotate:
 * auto`. Касательная — по соседним точкам в единице карты по обе стороны.
 * @param route - дорога
 * @param length - её полная длина
 * @param distance - пройденный путь; за концом дороги фигура стоит в конце
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
 * Ведёт фигуру карты шапки по дороге кругами.
 *
 * Анимация собрана из ключевых кадров на `translate` и `rotate` — это
 * единственные свойства, которые браузер двигает в композиторе, не пересчитывая
 * стили и не перерисовывая страницу. Анимация `offset-path` по той же дороге
 * внутри SVG выглядела так же, но на каждом кадре гоняла основной поток.
 *
 * Пока движение не разрешено, фигура стоит там, где её поставил стиль
 * компонента; на паузе замирает в текущей точке.
 *
 * @param figure - слой фигуры в левом верхнем углу сцены карты
 * @param route - дорога в единицах карты
 * @param options - размер фигуры, темп и условия движения
 */
export function useHomeMapTravel(
  figure: Ref<HTMLElement | undefined>,
  route: Ref<SVGGeometryElement | undefined>,
  options: HomeMapTravelOptions,
): void {
  const travel = shallowRef<Animation>();

  /**
   * Ключевые кадры одного проезда: точки дороги с равным шагом, поэтому
   * при линейном темпе скорость постоянна.
   * @param path - дорога
   */
  function getKeyframes(path: SVGGeometryElement): Array<Keyframe> {
    const length = path.getTotalLength();
    const lead = options.lead ?? 0;
    const steps = Math.ceil(length / ROUTE_SAMPLE_STEP);

    return Array.from({ length: steps + 1 }, (_, index) => ({
      offset: index / steps,
      ...getHomeMapFigureTransform(
        getRoutePlacement(path, length, lead + (length * index) / steps),
        options.size,
      ),
    }));
  }

  /** Снимает анимацию: фигура возвращается на место из стиля компонента. */
  function stopTravel(): void {
    travel.value?.cancel();
    travel.value = undefined;
  }

  watch(
    [figure, route, () => toValue(options.enabled)],
    ([element, path, enabled]) => {
      stopTravel();

      if (!element || !path || !enabled) {
        return;
      }

      travel.value = element.animate(getKeyframes(path), {
        duration: options.duration,
        iterations: Infinity,
      });
    },
    { immediate: true },
  );

  watch(
    [travel, () => toValue(options.paused)],
    ([animation, paused]) => {
      if (paused) {
        animation?.pause();

        return;
      }

      animation?.play();
    },
    { immediate: true },
  );

  onBeforeUnmount(stopTravel);
}
