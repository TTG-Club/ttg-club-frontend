import {
    type Breakpoints,
    type ConfigurableWindow, useBreakpoints as vueUseBreakpoints, type UseBreakpointsReturn
} from '@vueuse/core';
import { BREAKPOINTS } from '@/common/const';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';

export const useAppBreakpoints = <T extends TBreakpoint>(
    breakpoints?: Breakpoints<T>,
    options?: ConfigurableWindow
): UseBreakpointsReturn<T> => vueUseBreakpoints(
        breakpoints ?? BREAKPOINTS,
        options
    );
