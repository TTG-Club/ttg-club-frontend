import sortBy from 'lodash/sortBy';
import type { Breakpoints } from '@vueuse/core';
import type { TBreakpoint } from '@/types/Shared/Breakpoints.types';
import cssBreakpoints from '@/assets/styles/_breakpoints.module.scss';

const breakpointEntries = Object.entries(cssBreakpoints) as Array<[TBreakpoint, string]>;

const breakpoints: Array<[TBreakpoint, number]> = breakpointEntries
    .map((([key, breakpoint]) => [key, Number(breakpoint)]));

const sortedBreakpoints = sortBy(breakpoints, ([, breakpoint]) => breakpoint);

export const BREAKPOINTS = sortedBreakpoints.reduce((result, [key, breakpoint]) => {
    // eslint-disable-next-line no-param-reassign
    result[key] = breakpoint;

    return result;
}, {} as Breakpoints<TBreakpoint>);
