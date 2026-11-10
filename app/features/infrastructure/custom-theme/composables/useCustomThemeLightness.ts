import type { Ref, WritableComputedRef } from 'vue';

/** Что запомнил ползунок о своём последнем шаге. */
interface LightnessStep {
  /** Цвет до первого шага ползунка — из него берутся тон и насыщенность */
  source: string;
  /** Цвет, который поставил ползунок */
  color: string;
  /** Положение ползунка, 0–100 */
  value: number;
  /** От чего ещё зависело положение — например, фон для акцента */
  context: string;
}

/** Как ползунок яркости читает и меняет цвет. */
interface CustomThemeLightnessOptions {
  /** Положение ползунка по цвету, 0–100 */
  read: (color: string) => number;
  /** Цвет с другой яркостью: исходный цвет и положение ползунка */
  change: (source: string, lightness: number) => string;
  /**
   * От чего ещё зависит положение ползунка: когда оно меняется, прошлый шаг
   * забывается
   */
  context?: () => string;
}

/**
 * Ползунок яркости цвета своей темы (фона или акцента): меняет только
 * светлоту, тон и насыщенность остаются.
 *
 * Пока цвет не поменяли в другом месте, ползунок опирается на свой прошлый
 * шаг. Цвет хранится с точностью до 8 бит на канал, и соседние деления могут
 * дать один цвет — пересчёт положения из цвета перебрасывал бы бегунок. А у
 * краёв диапазона насыщенный цвет урезается до экранного охвата — если брать
 * тон и насыщенность из урезанного цвета, они терялись бы навсегда.
 *
 * @param color - Цвет в формате `#rrggbb`
 * @param options - Как читать и менять яркость цвета
 * @returns Положение ползунка, 0–100, для `v-model`
 */
export function useCustomThemeLightness(
  color: Ref<string> | WritableComputedRef<string>,
  options: CustomThemeLightnessOptions,
): WritableComputedRef<number> {
  const { read, change, context = () => '' } = options;
  const lastStep = shallowRef<LightnessStep>();

  // Прошлый шаг годится, пока цвет и всё, от чего зависит ползунок, те же
  const currentStep = computed(() =>
    lastStep.value?.color === color.value
    && lastStep.value.context === context()
      ? lastStep.value
      : undefined,
  );

  return computed({
    get: () => currentStep.value?.value ?? read(color.value),
    set: (lightness: number) => {
      const source = currentStep.value?.source ?? color.value;
      const next = change(source, lightness);

      lastStep.value = {
        source,
        color: next,
        value: lightness,
        context: context(),
      };

      color.value = next;
    },
  });
}
