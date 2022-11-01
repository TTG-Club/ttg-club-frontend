<template>
    <div
        class="bookmarks__cat"
    >
        <div
            class="bookmarks__cat_label"
        >
            <div
                v-if="!isMobile || (isMobile && isEdit)"
                class="bookmarks__cat_label_icon is-left js-drag-category"
                :class="{ 'only-hover': !isMobile }"
            >
                <svg-icon icon-name="sandwich"/>
            </div>

            <div class="bookmarks__cat_label_name">
                {{ category.name }}
            </div>

            <div
                v-if="!isMobile || (isMobile && isEdit)"
                class="bookmarks__cat_label_icon is-right"
                :class="{ 'only-hover': !isMobile }"
                @click.left.exact.prevent="removeBookmark(category.uuid)"
            >
                <svg-icon icon-name="close"/>
            </div>
        </div>

        <draggable
            tag="div"
            class="bookmarks__cat_body"
            :model-value="category.children"
            item-key="uuid"
            handle=".js-drag-bookmark"
            group="bookmarks"
            ghost-class="bookmarks__item_ghost"
            chosen-class="bookmarks__item_chosen"
            drag-class="bookmarks__item_drag"
            @change="onChangeHandler"
        >
            <template #item="{ element: bookmark }">
                <div
                    :key="bookmark.uuid + bookmark.order"
                    class="bookmarks__item"
                >
                    <div
                        v-if="!isMobile || (isMobile && isEdit)"
                        class="bookmarks__cat_label_icon is-left js-drag-bookmark"
                        :class="{ 'only-hover': !isMobile }"
                    >
                        <svg-icon icon-name="sandwich"/>
                    </div>

                    <a
                        :href="bookmark.url"
                        class="bookmarks__item_label"
                    >{{ bookmark.name }}</a>

                    <div
                        v-if="!isMobile || (isMobile && isEdit)"
                        class="bookmarks__item_icon is-right"
                        :class="{ 'only-hover': !isMobile }"
                        @click.left.exact.prevent="removeBookmark(bookmark.uuid)"
                    >
                        <svg-icon icon-name="close"/>
                    </div>
                </div>
            </template>
        </draggable>
    </div>
</template>

<script>
    import { computed, defineComponent } from "vue";
    import draggableComponent from "vuedraggable";
    import { useCustomBookmarkStore } from "@/store/UI/bookmarks/CustomBookmarksStore";
    import { useUIStore } from "@/store/UI/UIStore";
    import SvgIcon from "@/components/UI/icons/SvgIcon";

    export default defineComponent({
        components: {
            Draggable: draggableComponent,
            SvgIcon
        },
        props: {
            group: {
                type: Object,
                default: () => ({})
            },
            category: {
                type: Object,
                default: () => ({})
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

            async function updateBookmark(change) {
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
            }

            async function onChangeHandler(e) {
                const { added, moved } = e;

                await updateBookmark(added || moved);
            }

            return {
                removeBookmark: customBookmarkStore.queryDeleteBookmark,
                onChangeHandler,
                isMobile: computed(() => uiStore.isMobile)
            };
        }
    });
</script>
