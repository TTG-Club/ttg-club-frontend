<template>
  <div class="bookmarks is-default">
    <div class="bookmarks__header">
      <div class="bookmarks__info">
        <span class="bookmarks__info--title">Закладки</span>

        <a
          v-tippy="{
            content: 'Больше возможностей.'
          }"
          class="bookmarks__info--info"
          href="/info/bookmarks"
          target="_blank"
        >
          <svg-icon icon="menu/question" />
        </a>
      </div>
    </div>

    <div class="bookmarks__wrapper">
      <div class="bookmarks__body">
        <div
          v-for="(group, groupKey) in bookmarksStore.getGroupBookmarks"
          :key="group.uuid + groupKey"
          class="bookmarks__group"
        >
          <div class="bookmarks__group_body">
            <div
              v-for="(category, catKey) in group.children"
              :key="category.uuid + catKey"
              class="bookmarks__cat"
            >
              <div class="bookmarks__cat_label">
                <div class="bookmarks__cat_label_name">
                  {{ category.name }}
                </div>
              </div>

              <div class="bookmarks__cat_body">
                <div
                  v-for="(bookmark, bookmarkKey) in category.children"
                  :key="bookmark.uuid + bookmarkKey"
                  class="bookmarks__item"
                >
                  <div class="bookmarks__item_body">
                    <a
                      :href="bookmark.url"
                      :target="isExternal(bookmark.url) ? '_blank' : '_self'"
                      class="bookmarks__item_label"
                      >{{ bookmark.name }}</a
                    >

                    <div
                      class="bookmarks__item_icon only-hover is-right"
                      @click.left.exact.prevent="handleBookmarkDelete(bookmark)"
                    >
                      <svg-icon icon="close" />
                    </div>
                  </div>
                </div>

                <div
                  v-if="!category.children?.length"
                  class="bookmarks__info"
                >
                  <div class="bookmarks__info--desc">Здесь пока пусто</div>
                </div>
              </div>
            </div>

            <div
              v-if="!group.children?.length"
              class="bookmarks__info"
            >
              <div class="bookmarks__info--desc">Здесь пока пусто</div>
            </div>
          </div>
        </div>

        <div
          v-if="!getGroupBookmarks?.length"
          class="bookmarks__info"
        >
          <div class="bookmarks__info--desc">Здесь пока пусто</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { useModal } from 'vue-final-modal';

  import BookmarkDeleteModal from '@/features/bookmarks/components/BookmarkDeleteModal.vue';
  import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';
  import type { IBookmarkItem } from '@/features/bookmarks/types/Bookmark';
  import { shouldDeleteWithoutConfirm } from '@/features/bookmarks/utils';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  const bookmarksStore = useDefaultBookmarkStore();
  const { getGroupBookmarks } = storeToRefs(bookmarksStore);
  const isExternal = (url: string) => url.startsWith('http');

  const { open, close, patchOptions } = useModal({
    defaultModelValue: false,
    component: BookmarkDeleteModal
  });

  const handleBookmarkDelete = (bookmark: IBookmarkItem) => {
    if (shouldDeleteWithoutConfirm()) {
      bookmarksStore.removeBookmark(bookmark.uuid);

      return;
    }

    patchOptions({
      attrs: {
        title: 'Удаление закладки',
        text: `Вы уверены, что хотите удалить закладку «${bookmark.name}»?`,
        onConfirm: () => {
          bookmarksStore.removeBookmark(bookmark.uuid);
          close();
        }
      }
    });
    open();
  };
</script>

<style lang="scss" scoped>
  .bookmarks {
    &__header {
      padding: 12px 16px;
    }

    &__info {
      display: flex;
      align-items: center;
      width: 100%;

      &--title {
        width: 100%;
      }

      &--info {
        width: 24px;
        height: 24px;
        display: block;
      }
    }
  }
</style>
