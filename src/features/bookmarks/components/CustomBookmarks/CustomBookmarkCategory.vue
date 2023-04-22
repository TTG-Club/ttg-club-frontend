<template>
    <div
        class="bookmarks__cat"
    >
        <div
            class="bookmarks__cat_label"
        >
            <div
                v-if="isEdit"
                class="bookmarks__cat_label_icon is-left js-drag-category"
            >
                <svg-icon icon-name="sandwich" />
            </div>

            <div class="bookmarks__cat_label_name">
                {{ category.name }}
            </div>

            <div
                v-if="!isMobile || (isMobile && isEdit)"
                :class="{ 'only-hover': !isMobile }"
                class="bookmarks__cat_label_icon is-right"
                @click.left.exact.prevent="removeBookmark(category.uuid)"
            >
                <svg-icon
                    icon-name="close"
                    :stroke-enable="false"
                    fill-enable
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
                    <div
                        v-if="isEdit"
                        class="bookmarks__cat_label_icon is-left js-drag-bookmark"
                    >
                        <svg-icon icon-name="sandwich" />
                    </div>

                    <component
                        :is="isEdit ? 'span' : 'a'"
                        :href="bookmark.url"
                        class="bookmarks__item_label"
                    >
                        {{ bookmark.name }}
                    </component>

                    <div
                        v-if="!isMobile || (isMobile && isEdit)"
                        :class="{ 'only-hover': !isMobile }"
                        class="bookmarks__item_icon is-right"
                        @click.left.exact.prevent="removeBookmark(bookmark.uuid)"
                    >
                        <svg-icon
                            icon-name="close"
                            :stroke-enable="false"
                            fill-enable
                        />
                    </div>
                </div>
            </template>
        </draggable>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import { computed, defineComponent } from 'vue';
    import draggableComponent from 'vuedraggable';
    import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
    import { useUIStore } from '@/store/UI/UIStore';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import type {
        IBookmarkCategory,
        IBookmarkGroup,
        IBookmarkItem,
        TWithChildren
    } from '@/features/bookmarks/types/Bookmark.types';

    export default defineComponent({
        components: {
            Draggable: draggableComponent,
            SvgIcon
        },
        props: {
            group: {
                type: Object as PropType<TWithChildren<IBookmarkGroup, IBookmarkCategory>>,
                required: true
            },
            category: {
                type: Object as PropType<TWithChildren<IBookmarkCategory, IBookmarkItem>>,
                required: true
            },
            creating: {
                type: Boolean,
                default: false
            },
            isEdit: {
                type: Boolean,
                default: false
            }
        },
        setup(props) {
            const uiStore = useUIStore();
            const customBookmarkStore = useCustomBookmarkStore();

            const updateBookmark = async (change: { element: { uuid: any; name: any; url: any; }; newIndex: any; }) => {
                if (!change) {
                    return;
                }

                const {
                    element: {
                        uuid,
                        name,
                        url
                    },
                    newIndex: order
                } = change;

                await customBookmarkStore.queryUpdateBookmark({
                    uuid,
                    name,
                    order,
                    url,
                    parentUUID: props.category.uuid
                });
            };

            const onChangeHandler = async (e: { added: any; moved: any; }) => {
                const {
                    added,
                    moved
                } = e;

                await updateBookmark(added || moved);
            };

            return {
                removeBookmark: customBookmarkStore.queryDeleteBookmark,
                onChangeHandler,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>
