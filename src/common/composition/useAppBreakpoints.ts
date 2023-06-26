import {
  type Breakpoints, type ConfigurableWindow, useBreakpoints as vueUseBreakpoints
} from '@vueuse/core';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';
import { BREAKPOINTS } from '@/common/const/breakpoints';

export const useAppBreakpoints = <T extends TBreakpoint>(
  breakpoints?: Breakpoints<T>,
  options?: ConfigurableWindow
) => vueUseBreakpoints<T>(
  breakpoints ?? BREAKPOINTS,
  options
);
