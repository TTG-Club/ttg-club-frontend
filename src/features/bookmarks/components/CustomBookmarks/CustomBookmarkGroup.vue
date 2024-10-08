<script lang="ts">
  import draggableComponent from 'vuedraggable';

  import { useUIStore } from '@/shared/stores/UIStore';
  import type { WithChildren } from '@/shared/types/Utility';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import CustomBookmarkCategory from '@/features/bookmarks/components/CustomBookmarks/CustomBookmarkCategory.vue';
  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
  import type {
    IBookmarkCategory,
    IBookmarkGroup,
  } from '@/features/bookmarks/types/Bookmark.d';

  import type { PropType } from 'vue';

  export default defineComponent({
    components: {
      CustomBookmarkCategory,
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
      isFirst: {
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
      const isCategoryCreating = ref(false);
      const newCategoryName = ref('');
      const { openedGroups } = storeToRefs(customBookmarkStore);
      const { isMobile } = storeToRefs(uiStore);

      const isOpened = computed(() =>
        customBookmarkStore.isGroupOpened(props.group.uuid),
      );

      const enableCategoryCreating = () => {
        if (props.group.order > -1) {
          isCategoryCreating.value = true;
          newCategoryName.value = '';
        }
      };

      const disableCategoryCreating = () => {
        isCategoryCreating.value = false;
        newCategoryName.value = '';
      };

      const createCategory = async () => {
        await customBookmarkStore.queryAddBookmark({
          name: newCategoryName.value,
          order: props.group.children.length,
          parentUUID: props.group.uuid,
        });

        disableCategoryCreating();
      };

      const updateBookmark = async (change: {
        element: { uuid: any; name: any };
        newIndex: any;
      }) => {
        if (!change) {
          return;
        }

        const {
          element: { uuid, name },
          newIndex: order,
        } = change;

        await customBookmarkStore.queryUpdateBookmark({
          uuid,
          name,
          order,
          parentUUID: props.group.uuid,
        });
      };

      const onChangeHandler = async (e: { added: any; moved: any }) => {
        const { added, moved } = e;

        await updateBookmark(added || moved);
      };

      const openFirstGroup = () => {
        if (!props.isFirst) {
          return;
        }

        if (openedGroups.value.length > 0) {
          return;
        }

        customBookmarkStore.toggleGroup(props.group.uuid);
      };

      onBeforeMount(() => openFirstGroup());

      return {
        isOpened,
        isCategoryCreating,
        newCategoryName,
        enableCategoryCreating,
        disableCategoryCreating,
        createCategory,
        onChangeHandler,
        customBookmarkStore,
        isMobile,
      };
    },
  });
</script>

<template>
  <div
    v-if="group"
    :class="{ 'is-active': isOpened }"
    class="bookmarks__group"
  >
    <div
      class="bookmarks__group_head"
      @click.left.exact.prevent="customBookmarkStore.toggleGroup(group.uuid)"
    >
      <div class="bookmarks__group_icon">
        <svg-icon :icon="`arrow/${isOpened ? 'down' : 'right'}`" />
      </div>

      <div class="bookmarks__group_label">
        {{ group.name || 'Без категории' }}
      </div>

      <div
        v-if="isOpened && group.order > -1"
        v-tippy="{ content: 'Добавить категорию' }"
        :class="{ 'only-hover': !isMobile }"
        class="bookmarks__group_icon is-right"
        @click.left.exact.prevent.stop="enableCategoryCreating"
      >
        <svg-icon icon="plus" />
      </div>

      <div
        v-if="!isMobile || (isMobile && isEdit)"
        :class="{ 'only-hover': !isMobile }"
        class="bookmarks__group_icon is-right"
        @click.left.exact.prevent.stop="
          customBookmarkStore.queryDeleteBookmark(group)
        "
      >
        <svg-icon icon="close" />
      </div>
    </div>

    <n-collapse-transition :show="isOpened">
      <div class="bookmarks__group_body">
        <draggable
          :model-value="group.children"
          chosen-class="bookmarks__cat_chosen"
          drag-class="bookmarks__cat_drag"
          ghost-class="bookmarks__cat_ghost"
          group="category"
          handle=".js-drag-category"
          item-key="uuid"
          tag="div"
          @change="onChangeHandler"
        >
          <template #item="{ element: category }">
            <custom-bookmark-category
              :key="category.uuid + category.order"
              :category="category"
              :group="group"
              :is-edit="isEdit || false"
            />
          </template>
        </draggable>

        <div
          v-if="isCategoryCreating"
          class="bookmarks__input"
        >
          <n-input
            v-model:value="newCategoryName"
            autofocus
            placeholder="Название категории"
            @keyup.enter.exact.prevent.stop="createCategory"
          />

          <n-button
            quaternary
            @click.left.exact.prevent="createCategory"
          >
            <template #icon>
              <svg-icon icon="check" />
            </template>
          </n-button>

          <n-button
            quaternary
            @click.left.exact.prevent="disableCategoryCreating"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>
        </div>
      </div>
    </n-collapse-transition>
  </div>
</template>
