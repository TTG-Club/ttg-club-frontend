import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
import type { TBreakpoint } from '@/shared/types/Breakpoints';

import type { Ref } from 'vue';

export type TResponsiveValues<T> = Partial<Record<TBreakpoint, T>> & {
  base: T;
};

export interface UseResponsiveValuesParams<T> {
  values: Ref<TResponsiveValues<T>>;
}

export const useResponsiveValues = <T>({
  values,
}: UseResponsiveValuesParams<T>) => {
  const breakpoints = useAppBreakpoints();

  const current = computed(() => {
    const breakpointKeys = Object.keys(values.value).filter(
      (breakpoint) => breakpoint !== 'base',
    ) as TBreakpoint[];

    const currentValueBreakpoint =
      breakpointKeys.find(
        (breakpoint) => breakpoints.smaller(breakpoint).value,
      ) ?? 'base';

    return values.value[currentValueBreakpoint] as T;
  });

  return { current };
};
