import {
  type Breakpoints,
  type ConfigurableWindow,
  useBreakpoints as vueUseBreakpoints,
} from '@vueuse/core';

import { BREAKPOINTS } from '@/shared/constants/breakpoints';
import type { TBreakpoint } from '@/shared/types/Breakpoints';

export const useAppBreakpoints = <T extends TBreakpoint>(
  breakpoints?: Breakpoints<T>,
  options?: ConfigurableWindow,
) => vueUseBreakpoints<T>(breakpoints ?? BREAKPOINTS, options);
