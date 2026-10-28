/**
 * Вид списков классов и видов: «Модерн» — строки с фоном и раскрывающимися
 * архетипами, как в старом SPA, «Обложки» — квадратные карточки, как на
 * new.ttg.club.
 */
export const CHARACTER_LIST_VIEWS = ['modern', 'covers'] as const;

export type CharacterListView = (typeof CHARACTER_LIST_VIEWS)[number];

/** Cookie с выбранным видом: её читает сервер, чтобы список не прыгал. */
export const CHARACTER_LIST_VIEW_COOKIE = 'ttg_character_list_view';

/** Срок хранения выбранного вида. */
export const CHARACTER_LIST_VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** По умолчанию списки выглядят как в старом SPA. */
export const CHARACTER_LIST_VIEW_DEFAULT: CharacterListView = 'modern';

/** Пункт меню вида списков. */
export interface CharacterListViewOption {
  label: string;
  icon: string;
}

export const CHARACTER_LIST_VIEW_OPTIONS: Readonly<
  Record<CharacterListView, CharacterListViewOption>
> = {
  modern: { label: 'Модерн', icon: 'tabler:layout-list' },
  covers: { label: 'Обложки', icon: 'tabler:layout-grid' },
};
