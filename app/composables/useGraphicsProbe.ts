import { mean, median } from 'es-toolkit';

import {
  GRAPHICS_PROBE_BASELINE_FRAMES,
  GRAPHICS_PROBE_SAMPLE_LIMIT,
  GRAPHICS_PROBE_SLOW_FRAME_MS,
  GRAPHICS_PROBE_SLOW_LIMIT,
  GRAPHICS_PROBE_SLOW_RATIO,
  GRAPHICS_PROBE_STALLED_FRAME_MS,
  GRAPHICS_PROBE_TOAST,
} from '~/shared/consts';

/** Итог одного замера: рывками, плавно или замер не состоялся. */
type GraphicsProbeVerdict = 'slow' | 'smooth' | 'skipped';

/** Что сейчас считается: кадры анимации или кадры в покое после неё. */
type GraphicsProbePhase = 'animation' | 'baseline';

export interface UseGraphicsProbeReturn {
  /** Начинает считать кадры: вызывается перед анимацией */
  start: () => void;
  /** Заканчивает счёт кадров анимации: вызывается после неё */
  finish: () => void;
  /** Бросает замер, если анимацию прервали */
  cancel: () => void;
}

/**
 * Длительности кадров, пригодные для оценки.
 *
 * @param frameDurations - Длительности кадров в миллисекундах
 * @returns Кадры без точки отсчёта или `undefined`, если замер не состоялся
 */
function getUsableDurations(
  frameDurations: ReadonlyArray<number>,
): Array<number> | undefined {
  // Первый кадр не в счёт: у анимации это нулевая точка отсчёта, у покоя —
  // кадр, на котором под панелью включается размытие
  const durations = frameDurations.slice(1);

  const isStalled = durations.some(
    (duration) => duration > GRAPHICS_PROBE_STALLED_FRAME_MS,
  );

  return durations.length && !isStalled ? durations : undefined;
}

/**
 * Оценивает плавность анимации: её кадры сравниваются с обычными кадрами
 * этого же устройства в покое.
 *
 * @param animationFrames - Длительности кадров анимации в миллисекундах
 * @param baselineFrames - Длительности кадров в покое в миллисекундах
 * @returns Итог замера
 */
function rateFrames(
  animationFrames: ReadonlyArray<number>,
  baselineFrames: ReadonlyArray<number>,
): GraphicsProbeVerdict {
  const animation = getUsableDurations(animationFrames);
  const baseline = getUsableDurations(baselineFrames);

  if (!animation || !baseline) {
    return 'skipped';
  }

  const slowFrame = Math.max(
    GRAPHICS_PROBE_SLOW_FRAME_MS,
    median(baseline) * GRAPHICS_PROBE_SLOW_RATIO,
  );

  return mean(animation) > slowFrame ? 'slow' : 'smooth';
}

/**
 * Счёт замеров на всё посещение: панелей несколько, а счёт у них один. Здесь
 * только счётчики и подсчёт кадров — ничего от посетителя: такое состояние
 * на сервере общее для всех запросов.
 */
const useGraphicsProbeState = createGlobalState(() => {
  const phase = ref<GraphicsProbePhase>('animation');
  const animationFrames = ref<Array<number>>([]);
  const baselineFrames = ref<Array<number>>([]);
  const sampleCount = ref(0);
  const slowCount = ref(0);

  return { phase, animationFrames, baselineFrames, sampleCount, slowCount };
});

/**
 * Замер плавности анимаций: пока режим графики не выбран, считает кадры при
 * открытии всплывающих панелей, а сразу после — несколько кадров в покое.
 * Если панели несколько раз открылись заметно медленнее, чем устройство
 * рисует обычно, сам включает «производительность» и сообщает об этом.
 *
 * @returns Начало, конец и отмена замера
 */
export const useGraphicsProbe = createSharedComposable(
  (): UseGraphicsProbeReturn => {
    const { isChosen, setMode } = useGraphicsMode();
    const toast = useToast();

    const { phase, animationFrames, baselineFrames, sampleCount, slowCount } =
      useGraphicsProbeState();

    const { isActive, pause, resume } = useRafFn(
      ({ delta }) => {
        if (phase.value === 'animation') {
          animationFrames.value.push(delta);

          return;
        }

        baselineFrames.value.push(delta);

        // Точка отсчёта в счёт не идёт
        if (baselineFrames.value.length > GRAPHICS_PROBE_BASELINE_FRAMES) {
          settle();
        }
      },
      { immediate: false },
    );

    /**
     * Подводит итог замера. После нужного числа открытий рывками включает
     * «производительность» и сообщает об этом.
     */
    function settle(): void {
      pause();

      const verdict = rateFrames(animationFrames.value, baselineFrames.value);

      if (verdict === 'skipped') {
        return;
      }

      sampleCount.value += 1;

      if (verdict === 'slow') {
        slowCount.value += 1;
      }

      if (slowCount.value < GRAPHICS_PROBE_SLOW_LIMIT) {
        return;
      }

      setMode('performance');
      toast.add(GRAPHICS_PROBE_TOAST);
    }

    /** Начинает считать кадры, если режим ещё не выбран и замеры не исчерпаны. */
    function start(): void {
      if (isChosen.value || sampleCount.value >= GRAPHICS_PROBE_SAMPLE_LIMIT) {
        return;
      }

      phase.value = 'animation';
      animationFrames.value = [];
      baselineFrames.value = [];
      resume();
    }

    /** Останавливает счёт кадров без учёта замера. */
    function cancel(): void {
      pause();
    }

    /** Анимация кончилась: дальше считаются кадры в покое. */
    function finish(): void {
      if (!isActive.value || phase.value !== 'animation') {
        return;
      }

      phase.value = 'baseline';
    }

    return { start, finish, cancel };
  },
);
