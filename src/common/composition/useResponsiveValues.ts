import { computed } from 'vue';
import { useAppBreakpoints } from '@/common/composition/useAppBreakpoints';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';

export type TResponsiveValues<T> = Partial<Record<TBreakpoint, T>> & {base: T};

export interface UseResponsiveValuesParams<T> {
    values: TResponsiveValues<T>;
}

export const useResponsiveValues = <T>({ values }: UseResponsiveValuesParams<T>) => {
    const breakpoints = useAppBreakpoints();

    const current = computed(() => {
        const breakpointKeys = Object.keys(values)
            .filter(breakpoint => breakpoint !== 'base') as TBreakpoint[];

        const currentValueBreakpoint = breakpointKeys
            .find(breakpoint => breakpoints.smaller(breakpoint).value) ?? 'base';

        return values[currentValueBreakpoint] as T;
    });

    return { current };
};
