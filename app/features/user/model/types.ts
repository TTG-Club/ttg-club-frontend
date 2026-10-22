import type { AUTH_VIEWS } from './constants';

/** Форма в окне входа. */
export type AuthView = (typeof AUTH_VIEWS)[number];
