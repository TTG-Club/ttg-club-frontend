import type { LoDashStatic } from 'lodash';

export type ListIteratee = Parameters<LoDashStatic['sortBy']>[1];
