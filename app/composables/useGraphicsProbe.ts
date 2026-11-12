import { mean } from 'es-toolkit';

import {
  GRAPHICS_PROBE_SAMPLE_LIMIT,
  GRAPHICS_PROBE_SLOW_FRAME_MS,
  GRAPHICS_PROBE_SLOW_LIMIT,
  GRAPHICS_PROBE_STALLED_FRAME_MS,
  GRAPHICS_PROBE_TOAST,
} from '~/shared/consts';

/** Итог одного замера: рывками, плавно или замер не состоялся. */
type GraphicsProbeVerdict = 'slow' | 'smooth' | 'skipped';

export interface UseGraphicsProbeReturn {
  /** Начинает считать кадры: вызывается перед анимацией */
  start: () => void;
  /** Заканчивает замер и учитывает его: вызывается после анимации */
  finish: () => void;
  /** Бросает замер, если анимацию прервали */
  cancel: () => void;
}

/**
 * Оценивает плавность анимации по длительностям её кадров.
 *
 * @param frameDurations - Длительности кадров в миллисекундах
 * @returns Итог замера
 */
function rateFrames(
  frameDurations: ReadonlyArray<number>,
): GraphicsProbeVerdict {
  // Первый кадр — точка отсчёта, его длительность всегда нулевая
  const durations = frameDurations.slice(1);

  if (!durations.length) {
    return 'skipped';
  }

  if (
    durations.some((duration) => duration > GRAPHICS_PROBE_STALLED_FRAME_MS)
  ) {
    return 'skipped';
  }

  return mean(durations) > GRAPHICS_PROBE_SLOW_FRAME_MS ? 'slow' : 'smooth';
}

/**
 * Счёт замеров на всё посещение: панелей несколько, а счёт у них один. Здесь
 * только счётчики и подсчёт кадров — ничего от посетителя: такое состояние
 * на сервере общее для всех запросов.
 */
const useGraphicsProbeState = createGlobalState(() => {
  const frameDurations = ref<Array<number>>([]);
  const sampleCount = ref(0);
  const slowCount = ref(0);

  const { isActive, pause, resume } = useRafFn(
    ({ delta }) => {
      frameDurations.value.push(delta);
    },
    { immediate: false },
  );

  return { frameDurations, sampleCount, slowCount, isActive, pause, resume };
});

/**
 * Замер плавности анимаций: пока режим графики не выбран, считает кадры при
 * открытии всплывающих панелей. Если панели несколько раз открылись рывками,
 * сам включает «производительность» и сообщает об этом.
 *
 * @returns Начало, конец и отмена замера
 */
export function useGraphicsProbe(): UseGraphicsProbeReturn {
  const { isChosen, setMode } = useGraphicsMode();
  const toast = useToast();

  const { frameDurations, sampleCount, slowCount, isActive, pause, resume } =
    useGraphicsProbeState();

  /** Начинает считать кадры, если режим ещё не выбран и замеры не исчерпаны. */
  function start(): void {
    if (isChosen.value || sampleCount.value >= GRAPHICS_PROBE_SAMPLE_LIMIT) {
      return;
    }

    frameDurations.value = [];
    resume();
  }

  /** Останавливает счёт кадров без учёта замера. */
  function cancel(): void {
    pause();
  }

  /**
   * Заканчивает замер. После нужного числа открытий рывками включает
   * «производительность» и сообщает об этом.
   */
  function finish(): void {
    if (!isActive.value) {
      return;
    }

    pause();

    const verdict = rateFrames(frameDurations.value);

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

  return { start, finish, cancel };
}
