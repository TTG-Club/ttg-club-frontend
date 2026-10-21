import type { MaybeRefOrGetter } from '@vueuse/core';
import type { InjectionKey } from 'vue';

export const DEFAULT_KEY_FIELD = 'id';

export const DEFAULT_ENTITY_KEY_FIELD = 'url';

export const DEFAULT_PAGINATION_ITEMS_SIZE = 160;

export const DEFAULT_QUERY_BOOKS_INJECT_KEY: InjectionKey<
  MaybeRefOrGetter<Array<string>>
> = Symbol('queryBooks');

export type DefaultKeyField = typeof DEFAULT_KEY_FIELD;

export const ALLOWED_SPECIAL_CHARACTERS = [
  "'",
  '-',
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  '(',
  ')',
  '*',
  ',',
  '.',
  '/',
  ':',
  ';',
  '?',
  '@',
  '[',
  ']',
  '^',
  '_',
  '`',
  '{',
  '|',
  '}',
  '~',
  '+',
  '<',
  '=',
  '>',
];
