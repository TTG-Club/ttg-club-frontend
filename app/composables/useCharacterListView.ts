import type { CharacterListView } from '~/shared/consts';

import {
  CHARACTER_LIST_VIEW_COOKIE,
  CHARACTER_LIST_VIEW_COOKIE_MAX_AGE_SECONDS,
  CHARACTER_LIST_VIEW_DEFAULT,
  CHARACTER_LIST_VIEWS,
} from '~/shared/consts';

const CHARACTER_LIST_VIEW_SET: ReadonlySet<string> = new Set(
  CHARACTER_LIST_VIEWS,
);

/**
 * Проверяет, что значение из cookie — известный вид списка.
 *
 * @param value - Значение cookie
 * @returns `true`, если это вид списка
 */
function isCharacterListView(value: unknown): value is CharacterListView {
  return typeof value === 'string' && CHARACTER_LIST_VIEW_SET.has(value);
}

/**
 * Вид списков классов и видов: «Модерн», как в старом SPA, или обложки.
 *
 * @returns Выбранный вид и его смена
 */
export function useCharacterListView() {
  const cookie = useCookie<string>(CHARACTER_LIST_VIEW_COOKIE, {
    maxAge: CHARACTER_LIST_VIEW_COOKIE_MAX_AGE_SECONDS,
    default: () => CHARACTER_LIST_VIEW_DEFAULT,
  });

  const view = computed<CharacterListView>(() =>
    isCharacterListView(cookie.value)
      ? cookie.value
      : CHARACTER_LIST_VIEW_DEFAULT,
  );

  const isModern = computed(() => view.value === 'modern');

  function change(next: CharacterListView) {
    cookie.value = next;
  }

  return { view, isModern, change };
}
