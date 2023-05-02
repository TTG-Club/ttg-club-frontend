import {
    type Breakpoints,
    type ConfigurableWindow, useBreakpoints as vueUseBreakpoints, type UseBreakpointsReturn
} from '@vueuse/core';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';
import { BREAKPOINTS } from '@/common/const/breakpoints';

export const useAppBreakpoints = <T extends TBreakpoint>(
    breakpoints?: Breakpoints<T>,
    options?: ConfigurableWindow
): UseBreakpointsReturn<T> => vueUseBreakpoints(
        breakpoints ?? BREAKPOINTS,
        options
    );
