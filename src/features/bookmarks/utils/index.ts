import localforage from 'localforage';
import { cloneDeep, sortBy } from 'lodash-es';
import { NCheckbox, NFlex } from 'naive-ui';

import { useDiscreteApi } from '@/shared/composable/useDiscreteApi';
import { DB_NAME } from '@/shared/const/UI';
import type { WithChildren } from '@/shared/types/Utility';

import type {
  IBookmarkCategory,
  IBookmarkGroup,
  IBookmarkItem,
  TBookmark,
} from '@/features/bookmarks/types/Bookmark.d';

import type { Ref } from 'vue';

export const isBookmarkItem = (item: TBookmark): item is IBookmarkItem =>
  'url' in item && 'parentUUID' in item;

export const isBookmarkCategory = (
  item: TBookmark,
): item is IBookmarkCategory => !('url' in item) && 'parentUUID' in item;

export const isBookmarkGroup = (item: TBookmark): item is IBookmarkGroup =>
  !('url' in item) && !('parentUUID' in item);

const storage = localforage.createInstance({
  name: DB_NAME,
  storeName: 'bookmarks',
});

/**
 * Метод обходит все группы, добавляет в них поле children и кладет туда
 * категории (заклинания, классы, черты и т.д.). С каждой категорией происходит
 * то же самое - в нее кладутся все дочерние закладки.
 *
 * @param {Ref<Array<IBookmarkGroup>>} groups
 * @param {Ref<Array<IBookmarkCategory>>} categories
 * @param {Ref<Array<IBookmarkItem>>} bookmarks
 */
export const getGroupBookmarks = ({
  groups,
  categories,
  bookmarks,
}: {
  groups: Ref<IBookmarkGroup[]>;
  categories: Ref<IBookmarkCategory[]>;
  bookmarks: Ref<IBookmarkItem[]>;
}) =>
  sortBy(
    groups.value.map<WithChildren<IBookmarkGroup, IBookmarkCategory>>(
      (group) => ({
        ...group,
        children: sortBy(
          categories.value
            .filter((category) => category.parentUUID === group.uuid)
            .map<WithChildren<IBookmarkCategory, IBookmarkItem>>(
              (category) => ({
                ...category,
                children: sortBy(
                  bookmarks.value.filter(
                    (bookmark) => bookmark.parentUUID === category.uuid,
                  ),
                  [(o) => o.order],
                ),
              }),
            ),
          [(o) => o.order],
        ),
      }),
    ),
    [(o) => o.order],
  );

export const setBookmarks = ({
  items,
  groups,
  categories,
  bookmarks,
}: {
  items: TBookmark[];
  groups: Ref<IBookmarkGroup[]>;
  categories: Ref<IBookmarkCategory[]>;
  bookmarks: Ref<IBookmarkItem[]>;
}) => {
  const newGroups: IBookmarkGroup[] = [];
  const newCategories: IBookmarkCategory[] = [];
  const newBookmarks: IBookmarkItem[] = [];

  for (const item of items) {
    if (isBookmarkGroup(item)) {
      newGroups.push(item);

      continue;
    }

    if (isBookmarkCategory(item)) {
      newCategories.push(item);

      continue;
    }

    if (isBookmarkItem(item)) {
      newBookmarks.push(item);

      continue;
    }

    console.error(`Unknown bookmark type: ${JSON.stringify(item)}`);
  }

  // eslint-disable-next-line no-param-reassign
  groups.value = cloneDeep(newGroups);
  // eslint-disable-next-line no-param-reassign
  categories.value = cloneDeep(newCategories);
  // eslint-disable-next-line no-param-reassign
  bookmarks.value = cloneDeep(newBookmarks);
};

export const isBookmarkRemoveAvailable = async (bookmark: TBookmark) => {
  try {
    await storage.ready();

    if (await storage.getItem<boolean>('dont_ask_again')) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const { dialog } = useDiscreteApi();
      const dontAsk = ref(false);

      const { destroy } = dialog.error({
        title: 'Подтверждение удаления',
        showIcon: false,
        closable: false,
        positiveText: 'Удалить',
        positiveButtonProps: {
          size: 'medium',
        },
        onPositiveClick: async () => {
          destroy();
          resolve(true);

          await storage.setItem('dont_ask_again', true);
        },
        negativeText: 'Отменить',
        negativeButtonProps: {
          size: 'medium',
        },
        onNegativeClick: () => {
          destroy();
          resolve(false);
        },
        onClose: () => {
          destroy();
          resolve(false);
        },
        content: () =>
          h(
            NFlex,
            {
              vertical: true,
            },
            [
              h(
                'span',
                null,
                `Вы действительно хотите удалить «${bookmark.name}»?`,
              ),
              h(
                NCheckbox,
                {
                  'checked': dontAsk.value,
                  'onUpdate:checked': (value: boolean) => {
                    dontAsk.value = value;
                  },
                },
                'Больше не спрашивать',
              ),
            ],
          ),
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
};
