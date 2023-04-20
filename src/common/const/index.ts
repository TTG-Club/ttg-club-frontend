import type { Breakpoints } from '@vueuse/core';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';

export type DefaultKeyField = typeof DEFAULT_KEY_FIELD;

export const DEFAULT_KEY_FIELD = 'id';

export const BREAKPOINTS: Breakpoints<TBreakpoint> = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
    fullHD: 1920,
    retina: 2560,
    ultraHD: 3840
};
