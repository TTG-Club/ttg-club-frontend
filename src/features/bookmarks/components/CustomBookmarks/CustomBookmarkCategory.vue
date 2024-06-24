<script lang="ts">
  import draggableComponent from 'vuedraggable';

  import { useUIStore } from '@/shared/stores/UIStore';
  import type { WithChildren } from '@/shared/types/Utility';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
  import type {
    IBookmarkCategory,
    IBookmarkGroup,
    IBookmarkItem,
  } from '@/features/bookmarks/types/Bookmark.d';

  import type { PropType } from 'vue';

  export default defineComponent({
    components: {
      // eslint-disable-next-line vue/match-component-import-name
      Draggable: draggableComponent,
      SvgIcon,
    },
    props: {
      group: {
        type: Object as PropType<
          WithChildren<IBookmarkGroup, IBookmarkCategory>
        >,
        required: true,
      },
      category: {
        type: Object as PropType<
          WithChildren<IBookmarkCategory, IBookmarkItem>
        >,
        required: true,
      },
      creating: {
        type: Boolean,
        default: false,
      },
      isEdit: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const uiStore = useUIStore();
      const customBookmarkStore = useCustomBookmarkStore();
      const { isMobile } = storeToRefs(uiStore);

      const updateBookmark = async (change: {
        element: IBookmarkItem;
        newIndex: any;
      }) => {
        if (!change) {
          return;
        }

        const { element, newIndex: order } = change;

        await customBookmarkStore.queryUpdateBookmark({
          ...element,
          order,
          parentUUID: props.category.uuid,
        });
      };

      const onChangeHandler = async (e: { added: any; moved: any }) => {
        const { added, moved } = e;

        await updateBookmark(added || moved);
      };

      return {
        customBookmarkStore,
        onChangeHandler,
        isMobile,
      };
    },
  });
</script>

<template>
  <div class="bookmarks__cat">
    <div class="bookmarks__cat_label">
      <div
        v-if="isEdit"
        class="bookmarks__cat_label_icon is-left js-drag-category"
      >
        <svg-icon
          icon="sandwich"
          size="16"
        />
      </div>

      <div class="bookmarks__cat_label_name">
        {{ category.name }}
      </div>

      <div
        v-if="!isMobile || (isMobile && isEdit)"
        :class="{ 'only-hover': !isMobile }"
        class="bookmarks__cat_label_icon is-right"
        @click.left.exact.prevent="
          customBookmarkStore.queryDeleteBookmark(category)
        "
      >
        <svg-icon
          icon="close"
          size="20"
        />
      </div>
    </div>

    <draggable
      :model-value="category.children"
      chosen-class="bookmarks__item_chosen"
      class="bookmarks__cat_body"
      drag-class="bookmarks__item_drag"
      ghost-class="bookmarks__item_ghost"
      group="bookmarks"
      handle=".js-drag-bookmark"
      item-key="uuid"
      tag="div"
      @change="onChangeHandler"
    >
      <template #item="{ element: bookmark }">
        <div
          :key="bookmark.uuid + bookmark.order"
          class="bookmarks__item"
        >
          <div class="bookmarks__item_body">
            <div
              v-if="isEdit"
              class="bookmarks__cat_label_icon is-left js-drag-bookmark"
            >
              <svg-icon
                icon="sandwich"
                size="20"
              />
            </div>

            <component
              :is="isEdit ? 'span' : 'a'"
              :href="bookmark.url"
              class="bookmarks__item_label"
            >
              {{
                bookmark.prefix
                  ? `[${bookmark.prefix}] ${bookmark.name}`
                  : bookmark.name
              }}
            </component>

            <div
              v-if="!isMobile || (isMobile && isEdit)"
              :class="{ 'only-hover': !isMobile }"
              class="bookmarks__item_icon is-right"
              @click.left.exact.prevent="
                customBookmarkStore.queryDeleteBookmark(bookmark)
              "
            >
              <svg-icon
                icon="close"
                size="20"
              />
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>
