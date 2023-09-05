import type { LoDashStatic } from 'lodash-es';

export type ListIteratee = Parameters<LoDashStatic['sortBy']>[1];
