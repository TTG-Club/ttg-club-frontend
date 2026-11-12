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
 * Замер плавности анимаций: пока режим графики не выбран, считает кадры при
 * открытии всплывающих панелей. Если панели несколько раз открылись рывками,
 * сам включает «производительность» и сообщает об этом. Состояние общее на
 * всё посещение: панелей несколько, а счёт у них один.
 */
export const useGraphicsProbe = createGlobalState(
  (): UseGraphicsProbeReturn => {
    const { isChosen, setMode } = useGraphicsMode();
    const toast = useToast();

    let frameDurations: Array<number> = [];
    let sampleCount = 0;
    let slowCount = 0;

    const { isActive, pause, resume } = useRafFn(
      ({ delta }) => {
        frameDurations.push(delta);
      },
      { immediate: false },
    );

    function start(): void {
      if (isChosen.value || sampleCount >= GRAPHICS_PROBE_SAMPLE_LIMIT) {
        return;
      }

      frameDurations = [];
      resume();
    }

    function cancel(): void {
      pause();
    }

    function finish(): void {
      if (!isActive.value) {
        return;
      }

      pause();

      const verdict = rateFrames(frameDurations);

      if (verdict === 'skipped') {
        return;
      }

      sampleCount += 1;

      if (verdict === 'slow') {
        slowCount += 1;
      }

      if (slowCount < GRAPHICS_PROBE_SLOW_LIMIT) {
        return;
      }

      setMode('performance');
      toast.add(GRAPHICS_PROBE_TOAST);
    }

    return { start, finish, cancel };
  },
);
