import type { InjectionKey } from 'vue';
import type { MaybeComputedRef } from '@vueuse/core';

export type DefaultKeyField = typeof DEFAULT_KEY_FIELD;

export const DEFAULT_KEY_FIELD = 'id';

export const DEFAULT_ENTITY_KEY_FIELD = 'url';

export const DEFAULT_PAGINATION_ITEMS_LIMIT = 160;

export const DEFAULT_QUERY_BOOKS_INJECT_KEY: InjectionKey<MaybeComputedRef<Array<string>>> = Symbol('queryBooks');
